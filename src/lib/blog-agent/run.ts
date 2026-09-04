/**
 * The full blog-agent pipeline: research topics (Reddit + Tavily), skip
 * anything too similar to an existing post, write a draft with Claude,
 * attach a license-safe featured image, and email the digest (draft link +
 * social copy) to Craig. Runs twice weekly via cron and on-demand from the
 * admin Automations page.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { researchTopics, EXCLUDED_CONTENT, type TopicSuggestion } from './research'
import { generateBlogPost, type GeneratedBlogPost } from './generate'
import { findAndAttachFeaturedImage, type AttachedImage } from './image'
import { sendLeadNotification } from '@/lib/notify'

// Blog-agent emails are Craig's alone — never the monitored info@ inbox.
const BLOG_AGENT_NOTIFY = 'craig@highdesertpm.com'

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'your',
  'you', 'my', 'is', 'are', 'be', 'do', 'does', 'how', 'what', 'when', 'why',
  'should', 'can', 'it', 'this', 'that', 'i', 'we', 'our', 'from', 'at', 'as',
])

function significantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )
}

/**
 * Stable identity for a researched source (Reddit permalink / article URL) so a
 * topic already written about is recognized on later runs. Strips protocol,
 * `www.`, trailing slashes, query, and hash so trivial URL variants collapse to
 * the same key. Returns '' for missing/unparseable input.
 */
function normalizeSourceUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/+$/, '').toLowerCase()
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase()
  }
}

/** True when the topic shares most of its meaningful words with an existing post title. */
function tooSimilar(topic: string, existing: Set<string>[]): boolean {
  const words = significantWords(topic)
  if (words.size === 0) return true
  for (const other of existing) {
    let overlap = 0
    for (const w of words) if (other.has(w)) overlap++
    if (overlap / words.size >= 0.6) return true
  }
  return false
}

export interface BlogAgentResult {
  ok: boolean
  post?: GeneratedBlogPost
  image?: AttachedImage | null
  topic?: TopicSuggestion
  skipped?: string
}

export async function runBlogAgent(): Promise<BlogAgentResult> {
  // 1. Research
  const research = await researchTopics('both')
  if (research.topics.length === 0) {
    await sendLeadNotification({
      to: BLOG_AGENT_NOTIFY,
      subject: 'Blog agent: no topics found this run',
      fields: [['Detail', 'Reddit and Tavily research returned no usable topics. Will retry on the next scheduled run.']],
    })
    return { ok: false, skipped: 'no topics found' }
  }

  // 2. Skip topics we've already covered (drafts included, so the Tuesday run
  //    and Friday run never write the same story twice).
  //
  //    Primary key is the source URL: Claude rewrites each topic into an SEO
  //    headline, so the saved post title no longer resembles the research
  //    title — comparing the two let the same source regenerate forever. The
  //    stored `sourceUrl` is the reliable signal; title-word overlap stays as a
  //    secondary net (catches near-identical topics from different URLs and
  //    hand-written posts that predate the sourceUrl field).
  const payload = await getPayload({ config })
  type ExistingDoc = { title?: string | null; sourceUrl?: string | null }
  let existingDocs: ExistingDoc[] = []
  try {
    const existing = await payload.find({
      collection: 'posts',
      limit: 300,
      depth: 0,
      select: { title: true, sourceUrl: true },
    })
    existingDocs = existing.docs
  } catch {
    // `sourceUrl` column may not exist yet (code deployed before the migration
    // ran). Fall back to titles only so the run still works — source dedup
    // resumes once the column is present.
    const existing = await payload.find({
      collection: 'posts',
      limit: 300,
      depth: 0,
      select: { title: true },
    })
    existingDocs = existing.docs
  }
  const existingTitleWords = existingDocs.map((d) => significantWords(String(d.title ?? '')))
  const usedSources = new Set(
    existingDocs.map((d) => normalizeSourceUrl(d.sourceUrl)).filter(Boolean),
  )

  // Editorial rule (Craig, 2026-08-03): never publish grievance/conflict or
  // personal-drama content. research.ts already filters at the source; this
  // is defense in depth with the same shared pattern.
  const otherState = /\[(?!OR\b)[A-Z]{2}\b/
  const candidates = research.topics
    .filter((t) => !EXCLUDED_CONTENT.test(t.title))
    .sort((a, b) => Number(otherState.test(a.title)) - Number(otherState.test(b.title)))

  const fresh = candidates.filter(
    (t) =>
      !usedSources.has(normalizeSourceUrl(t.sourceUrl)) &&
      !tooSimilar(t.title, existingTitleWords),
  )
  if (fresh.length === 0) {
    await sendLeadNotification({
      to: BLOG_AGENT_NOTIFY,
      subject: 'Blog agent: all researched topics already covered',
      fields: [
        ['Detail', `${research.topics.length} topics researched, but every one overlaps an existing post. No draft created.`],
      ],
    })
    return { ok: false, skipped: 'all topics already covered' }
  }

  // 3. Generate the draft from the top fresh topic
  const topic = fresh[0]
  const post = await generateBlogPost({
    title: topic.title,
    angle: topic.angle,
    audience: topic.audience,
    sourceUrl: topic.sourceUrl,
  })

  // 4. Featured image (best-effort)
  const image = await findAndAttachFeaturedImage(post.id, post.imageQuery, post.imageAlt)

  // 5. Digest email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hdpm-web.vercel.app'
  await sendLeadNotification({
    to: BLOG_AGENT_NOTIFY,
    subject: `Blog draft ready for review: ${post.title}`,
    fields: [
      ['Draft', `${siteUrl}${post.adminUrl}`],
      ['Excerpt', post.excerpt],
      ['Topic source', `${topic.source}${topic.sourceUrl ? ` — ${topic.sourceUrl}` : ''}`],
      ['Audience', topic.audience],
      [
        'Featured image',
        image
          ? `${image.title} (${image.license}, by ${image.attribution})`
          : 'None found — add one in the admin before publishing',
      ],
      ['Facebook post', post.social.facebook],
      ['Instagram caption', post.social.instagram],
      ['Short-video hook (15s)', post.social.shortVideoHook],
      ['Next step', 'Review the draft in the admin, then set status to Published.'],
    ],
  })

  return { ok: true, post, image, topic }
}
