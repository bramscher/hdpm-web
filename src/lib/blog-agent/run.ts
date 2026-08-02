/**
 * The full blog-agent pipeline: research topics (Reddit + Tavily), skip
 * anything too similar to an existing post, write a draft with Claude,
 * attach a license-safe featured image, and email the digest (draft link +
 * social copy) to the monitored inbox. Runs twice weekly via cron and
 * on-demand from the admin Automations page.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { researchTopics, type TopicSuggestion } from './research'
import { generateBlogPost, type GeneratedBlogPost } from './generate'
import { findAndAttachFeaturedImage, type AttachedImage } from './image'
import { sendLeadNotification } from '@/lib/notify'

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
      subject: 'Blog agent: no topics found this run',
      fields: [['Detail', 'Reddit and Tavily research returned no usable topics. Will retry on the next scheduled run.']],
    })
    return { ok: false, skipped: 'no topics found' }
  }

  // 2. Skip topics too close to existing posts (drafts included, so the
  //    Tuesday run and Friday run never write the same story twice)
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'posts',
    limit: 300,
    depth: 0,
    select: { title: true },
  })
  const existingTitleWords = existing.docs.map((d) => significantWords(String(d.title ?? '')))

  // Deprioritize topics tagged with another state (e.g. "[TX]", "[UT, USA]") —
  // they adapt fine but Oregon-relevant topics make stronger posts.
  const otherState = /\[(?!OR\b)[A-Z]{2}\b/
  const candidates = [...research.topics].sort(
    (a, b) => Number(otherState.test(a.title)) - Number(otherState.test(b.title)),
  )

  const fresh = candidates.filter((t) => !tooSimilar(t.title, existingTitleWords))
  if (fresh.length === 0) {
    await sendLeadNotification({
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
