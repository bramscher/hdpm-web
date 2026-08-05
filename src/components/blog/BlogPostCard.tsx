import Link from 'next/link'
import Image from 'next/image'
import type { Post, Category, Media } from '@/payload-types'
import Card from '@/components/ui/Card'

const placeholderGradients = [
  'from-primary/80 to-primary-dark/90',
  'from-amber-700/80 to-orange-900/90',
  'from-emerald-700/80 to-emerald-900/90',
  'from-slate-600/80 to-slate-800/90',
  'from-rose-700/80 to-rose-900/90',
  'from-indigo-600/80 to-indigo-900/90',
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getExcerpt(body: Post['body'], maxLength = 150): string {
  if (!body?.root?.children) return ''

  const textParts: string[] = []

  function extractText(node: Record<string, unknown>) {
    if (node.text && typeof node.text === 'string') {
      textParts.push(node.text)
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        extractText(child as Record<string, unknown>)
      }
    }
  }

  for (const child of body.root.children) {
    extractText(child as Record<string, unknown>)
    if (textParts.join(' ').length >= maxLength) break
  }

  const text = textParts.join(' ')
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

export default function BlogPostCard({
  post,
  index = 0,
}: {
  post: Post
  index?: number
}) {
  const featuredImage = typeof post.featuredImage === 'object' ? (post.featuredImage as Media) : null
  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object',
  )
  const gradientClass = placeholderGradients[index % placeholderGradients.length]
  const excerpt = getExcerpt(post.body)

  return (
    <Card
      as="article"
      interactive
      className="group relative flex flex-col overflow-hidden"
    >
      {/* Image / Placeholder */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        {featuredImage?.url ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.alt || post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <svg aria-hidden="true"
              className="h-16 w-16 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z"
              />
            </svg>
          </div>
        )}

        {/* Category badge overlay */}
        {categories.length > 0 && (
          <div className="absolute left-3 top-3">
            <span className="inline-block rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {categories[0].name}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors hover:text-accent"
        >
          <h3 className="font-heading text-heading text-neutral-dark line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {excerpt && (
          <p className="mt-2 font-body text-sm leading-relaxed text-neutral-mid line-clamp-3">
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-4">
          {/* Meta: date + author */}
          <div className="flex items-center gap-3 border-t border-neutral-100 pt-4 text-xs text-neutral-mid">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            )}
            {post.author && (
              <>
                <span aria-hidden="true" className="text-neutral-300">
                  |
                </span>
                <span>{post.author}</span>
              </>
            )}
          </div>

          {/* Read More */}
          <Link
            href={`/blog/${post.slug}`}
            className="mt-3 inline-flex items-center gap-1 font-body text-sm font-semibold text-accent transition-colors hover:text-primary"
          >
            Read More
            <svg aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </Card>
  )
}
