import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { getPayload } from 'payload'
import config from '@payload-config'

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || ''

/* ------------------------------------------------------------------ */
/*  Lexical helpers                                                    */
/* ------------------------------------------------------------------ */

function heading(text: string, tag: 'h2' | 'h3' = 'h2') {
  return {
    type: 'heading',
    tag,
    children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function richText(blocks: ReturnType<typeof heading | typeof paragraph>[]) {
  return {
    root: {
      type: 'root',
      children: blocks,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/* ------------------------------------------------------------------ */
/*  Parse Claude's response into Lexical blocks                        */
/* ------------------------------------------------------------------ */

function parseMarkdownToLexical(markdown: string) {
  const lines = markdown.split('\n')
  const blocks: ReturnType<typeof heading | typeof paragraph>[] = []
  let currentParagraph = ''

  function flushParagraph() {
    if (currentParagraph.trim()) {
      blocks.push(paragraph(currentParagraph.trim()))
      currentParagraph = ''
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('## ')) {
      flushParagraph()
      blocks.push(heading(trimmed.replace(/^## /, ''), 'h2'))
    } else if (trimmed.startsWith('### ')) {
      flushParagraph()
      blocks.push(heading(trimmed.replace(/^### /, ''), 'h3'))
    } else if (trimmed === '') {
      flushParagraph()
    } else {
      // Strip markdown formatting (bold, italic, links) for plain text
      const cleaned = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^[-*] /, '• ')
      if (currentParagraph) {
        currentParagraph += ' ' + cleaned
      } else {
        currentParagraph = cleaned
      }
    }
  }
  flushParagraph()

  return richText(blocks)
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

interface GenerateRequest {
  title: string
  angle?: string
  audience?: 'owners' | 'tenants' | 'both'
  sourceUrl?: string
}

/**
 * POST /api/automations/generate-blog
 *
 * Uses Claude to generate a full blog post based on a topic suggestion,
 * then saves it as a draft in the Posts collection.
 */
export async function POST(request: Request) {
  const headersList = await headers()
  const cookie = headersList.get('cookie') || ''
  if (!cookie.includes('payload-token')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { error: 'CLAUDE_API_KEY not configured in .env.local' },
      { status: 500 },
    )
  }

  let body: GenerateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY })

    const audienceContext = body.audience === 'owners'
      ? 'property owners and landlords in Central Oregon'
      : body.audience === 'tenants'
        ? 'current and prospective tenants/renters in Central Oregon'
        : 'both property owners and tenants in Central Oregon'

    const prompt = `Write a blog post for High Desert Property Management (HDPM), a property management company serving Central Oregon (Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras).

Topic: "${body.title}"
${body.angle ? `Angle: ${body.angle}` : ''}
Target audience: ${audienceContext}
${body.sourceUrl ? `Inspired by discussion at: ${body.sourceUrl}` : ''}

Requirements:
1. Write an SEO-optimized blog post of 800-1200 words
2. Use a professional but approachable tone
3. Include Central Oregon-specific references and local context where natural
4. Structure with clear H2 and H3 headings
5. Include practical, actionable advice
6. Mention HDPM naturally where appropriate (not salesy)
7. End with a brief call-to-action

Output format — return ONLY a JSON object with these fields (no markdown code fences):
{
  "title": "SEO-optimized blog post title (55-65 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta description (150-160 chars)",
  "author": "High Desert Property Management",
  "tags": ["tag1", "tag2", "tag3"],
  "body": "The full blog post content in markdown format with ## and ### headings"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Parse JSON response
    let blogData: {
      title: string
      slug: string
      excerpt: string
      author: string
      tags: string[]
      body: string
    }

    try {
      // Handle potential markdown code fences
      const jsonStr = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      blogData = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Claude response', raw: responseText },
        { status: 500 },
      )
    }

    // Convert markdown body to Lexical rich text
    const lexicalBody = parseMarkdownToLexical(blogData.body)

    // Ensure unique slug
    const payload = await getPayload({ config })
    let slug = slugify(blogData.slug || blogData.title)
    const existingSlug = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existingSlug.docs.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Find or create categories based on audience
    let categoryIds: number[] = []
    try {
      const categoryNames = body.audience === 'owners'
        ? ['Property Management']
        : body.audience === 'tenants'
          ? ['Tenant Resources']
          : ['Property Management', 'Central Oregon Living']

      for (const name of categoryNames) {
        const { docs } = await payload.find({
          collection: 'categories',
          where: { name: { equals: name } },
          limit: 1,
        })
        if (docs.length > 0) categoryIds.push(docs[0].id)
      }
    } catch {
      // Categories are optional
    }

    // Save as draft
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: blogData.title,
        slug,
        status: 'draft',
        author: blogData.author || 'High Desert Property Management',
        body: lexicalBody,
        publishedAt: new Date().toISOString(),
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        tags: blogData.tags?.map((tag) => ({ tag })) ?? [],
        meta: {
          title: blogData.title,
          description: blogData.excerpt,
        },
      },
    })

    return NextResponse.json({
      message: 'Blog post created as draft',
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        adminUrl: `/admin/collections/posts/${post.id}`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Generation failed', details: String(err) },
      { status: 500 },
    )
  }
}
