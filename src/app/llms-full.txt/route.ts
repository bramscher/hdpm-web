import { SITE_URL } from '@/lib/site-url'
import { getPublishedPosts, lexicalToPlainText, postMeta } from '@/lib/llms'

// Regenerate hourly so newly published blog posts show up without a redeploy.
export const revalidate = 3600

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * GET /llms-full.txt — the full text of every published blog article, inlined
 * for deep ingestion by LLM crawlers (companion to /llms.txt). Follows the
 * llmstxt.org "full" convention.
 */
export async function GET() {
  const posts = await getPublishedPosts()

  const header = `# High Desert Property Management — Full Content

> Professional residential property management across Central Oregon — Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. Locally owned and operated since 2011, based in Redmond, Oregon. Phone: (541) 548-0383. Email: info@highdesertpm.com.

This file contains the full text of every published article on ${SITE_URL}/blog. See ${SITE_URL}/llms.txt for a concise site index.

---
`

  const articles = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`
      const date = formatDate(post.publishedAt)
      const desc = postMeta(post).description
      const bodyText = lexicalToPlainText(post.body)

      const metaLines = [
        `URL: ${url}`,
        post.author ? `Author: ${post.author}` : null,
        date ? `Published: ${date}` : null,
        desc ? `Summary: ${desc}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      return `# ${post.title}\n\n${metaLines}\n\n${bodyText}`.trim()
    })
    .join('\n\n---\n\n')

  const body = posts.length
    ? `${header}\n${articles}\n`
    : `${header}\n_No published articles are available yet. See ${SITE_URL}/blog._\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
