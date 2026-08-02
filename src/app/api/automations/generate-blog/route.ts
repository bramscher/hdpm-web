import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { generateBlogPost } from '@/lib/blog-agent/generate'
import { findAndAttachFeaturedImage } from '@/lib/blog-agent/image'

export const maxDuration = 300

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
 * saves it as a draft in the Posts collection, and attaches a license-safe
 * featured image from Wikimedia Commons (best-effort).
 */
export async function POST(request: Request) {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
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
    const post = await generateBlogPost({
      title: body.title,
      angle: body.angle,
      audience: body.audience,
      sourceUrl: body.sourceUrl,
    })

    const image = await findAndAttachFeaturedImage(post.id, post.imageQuery, post.imageAlt)

    return NextResponse.json({
      message: image
        ? 'Blog post created as draft with featured image'
        : 'Blog post created as draft (no suitable featured image found)',
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        adminUrl: post.adminUrl,
      },
      social: post.social,
      image,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Generation failed', details: String(err) },
      { status: 500 },
    )
  }
}
