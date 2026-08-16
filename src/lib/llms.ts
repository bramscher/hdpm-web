import { getPayload } from 'payload'
import config from '@payload-config'
import type { Post } from '@/payload-types'

/**
 * Fetch published blog posts, newest first, for the llms.txt routes.
 * Returns an empty array if Payload/DB is unavailable (e.g. at build time),
 * mirroring the graceful-degradation pattern used in sitemap.ts.
 */
export async function getPublishedPosts(limit = 1000): Promise<Post[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit,
      depth: 0,
    })
    return docs
  } catch {
    return []
  }
}

/**
 * Serialize a Lexical richText body into readable plain text / lightweight
 * Markdown, so LLM crawlers can ingest the full article at /llms-full.txt.
 * Handles the block types the blog authoring/seed flow produces: headings,
 * paragraphs, lists, quotes, and inline text/links.
 */
export function lexicalToPlainText(body: Post['body']): string {
  const root = body?.root
  if (!root?.children || !Array.isArray(root.children)) return ''

  const lines: string[] = []

  const inline = (node: Record<string, unknown>): string => {
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) {
      return node.children.map((c) => inline(c as Record<string, unknown>)).join('')
    }
    return ''
  }

  const block = (node: Record<string, unknown>) => {
    const type = node.type as string | undefined
    switch (type) {
      case 'heading': {
        const tag = (node.tag as string) || 'h2'
        const level = Math.min(6, Math.max(1, parseInt(tag.replace('h', ''), 10) || 2))
        lines.push(`${'#'.repeat(level)} ${inline(node).trim()}`, '')
        break
      }
      case 'quote':
        lines.push(`> ${inline(node).trim()}`, '')
        break
      case 'list': {
        const ordered = node.listType === 'number'
        const items = Array.isArray(node.children) ? node.children : []
        items.forEach((item, i) => {
          const marker = ordered ? `${i + 1}.` : '-'
          lines.push(`${marker} ${inline(item as Record<string, unknown>).trim()}`)
        })
        lines.push('')
        break
      }
      case 'paragraph':
      default: {
        const text = inline(node).trim()
        if (text) lines.push(text, '')
      }
    }
  }

  for (const child of root.children) {
    block(child as Record<string, unknown>)
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Post meta fields added at runtime by @payloadcms/plugin-seo. */
export function postMeta(post: Post): { title?: string; description?: string } {
  const meta = (post as { meta?: { title?: string; description?: string } }).meta
  return { title: meta?.title, description: meta?.description }
}
