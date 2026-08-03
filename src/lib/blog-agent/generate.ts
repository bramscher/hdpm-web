/**
 * Blog post generation: turns a researched topic into a draft Post via
 * Claude, including SEO meta, a featured-image search query, and social
 * media copy. Shared by the admin "Create Post" button and the blog-agent
 * cron.
 */

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
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    direction: 'ltr' as const,
    format: '' as const,
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
      direction: 'ltr' as const,
      format: '' as const,
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

export function parseMarkdownToLexical(markdown: string) {
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
/*  Generation                                                         */
/* ------------------------------------------------------------------ */

export interface BlogTopicInput {
  title: string
  angle?: string
  audience?: 'owners' | 'tenants' | 'both'
  sourceUrl?: string
}

export interface SocialPosts {
  facebook: string
  instagram: string
  shortVideoHook: string
}

export interface GeneratedBlogPost {
  id: number
  title: string
  slug: string
  status: string
  adminUrl: string
  excerpt: string
  imageQuery: string
  imageAlt: string
  social: SocialPosts
}

interface BlogData {
  title: string
  slug: string
  excerpt: string
  author: string
  tags: string[]
  body: string
  image_query: string
  image_alt: string
  social_facebook: string
  social_instagram: string
  short_video_hook: string
}

export async function generateBlogPost(topic: BlogTopicInput): Promise<GeneratedBlogPost> {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY not configured')
  }

  const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY })

  const audienceContext =
    topic.audience === 'owners'
      ? 'property owners and landlords in Central Oregon'
      : topic.audience === 'tenants'
        ? 'current and prospective tenants/renters in Central Oregon'
        : 'both property owners and tenants in Central Oregon'

  const prompt = `Write a blog post for High Desert Property Management (HDPM), a property management company serving Central Oregon (Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras).

Topic: "${topic.title}"
${topic.angle ? `Angle: ${topic.angle}` : ''}
Target audience: ${audienceContext}
${topic.sourceUrl ? `Inspired by discussion at: ${topic.sourceUrl}` : ''}

Requirements:
1. Write an SEO-optimized blog post of 800-1200 words
2. Use a professional but approachable tone
3. Include Central Oregon-specific references and local context where natural
4. Structure with clear H2 and H3 headings
5. Include practical, actionable advice
6. Mention HDPM naturally where appropriate (not salesy)
7. End with a brief call-to-action
8. EDITORIAL RULE: never write grievance or conflict content — no tenant-complaint stories, landlord-misdeed angles, dispute drama, or "know your rights against your landlord" framing. Tenant-facing content must be constructive and service-oriented (how to care for your rental, seasonal tips, local living guides). If the topic is inherently a complaint or conflict, reframe it entirely as positive, practical guidance — or write about the closest constructive adjacent topic instead.

Also produce companion assets for the post:
- image_query: a 2-4 word Wikimedia Commons search phrase for a fitting featured photo. Prefer real Central Oregon places or landscapes (e.g. "Bend Oregon houses", "Deschutes River Bend", "Smith Rock Oregon") over abstract concepts — Wikimedia has real-place photography, not stock imagery.
- image_alt: a one-sentence alt text describing what such a photo would show.
- social_facebook: a 2-3 sentence Facebook post promoting the article, ending with a reason to click through. No hashtags.
- social_instagram: an Instagram caption (2-3 short lines) with 3-5 relevant hashtags on the final line.
- short_video_hook: a 15-second short-form video script hook (2-3 spoken sentences a team member could read to camera) teasing the article's main insight, ending with "full breakdown on our site."

Output format — return ONLY a JSON object with these fields (no markdown code fences):
{
  "title": "SEO-optimized blog post title (55-65 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta description (150-160 chars)",
  "author": "High Desert Property Management",
  "tags": ["tag1", "tag2", "tag3"],
  "body": "The full blog post content in markdown format with ## and ### headings",
  "image_query": "...",
  "image_alt": "...",
  "social_facebook": "...",
  "social_instagram": "...",
  "short_video_hook": "..."
}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  let blogData: BlogData
  try {
    const jsonStr = responseText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    blogData = JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse Claude response: ${responseText.slice(0, 300)}`)
  }

  const lexicalBody = parseMarkdownToLexical(blogData.body)

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

  // Find categories based on audience (optional)
  const categoryIds: number[] = []
  try {
    const categoryNames =
      topic.audience === 'owners'
        ? ['Property Management']
        : topic.audience === 'tenants'
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

  return {
    id: post.id,
    title: post.title,
    slug: post.slug ?? slug,
    status: post.status ?? 'draft',
    adminUrl: `/admin/collections/posts/${post.id}`,
    excerpt: blogData.excerpt,
    imageQuery: blogData.image_query || `${topic.title} Oregon`,
    imageAlt: blogData.image_alt || blogData.title,
    social: {
      facebook: blogData.social_facebook || '',
      instagram: blogData.social_instagram || '',
      shortVideoHook: blogData.short_video_hook || '',
    },
  }
}
