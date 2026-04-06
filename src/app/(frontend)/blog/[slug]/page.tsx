import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { breadcrumbSchema } from '@/lib/schema'
import BlogPostCard from '@/components/blog/BlogPostCard'
import type { Post, Category, Media } from '@/payload-types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://highdesertpm.com'

// ---------- Static params ----------
export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 1000,
    select: { slug: true },
  })
  return posts.docs.map((post) => ({ slug: post.slug }))
}

// ---------- Metadata ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })

  const post = docs[0]
  if (!post) return { title: 'Post Not Found' }

  const title = post.meta?.title || post.title
  const description =
    post.meta?.description ||
    `Read "${post.title}" on the High Desert Property Management blog. Insights for Central Oregon property owners and tenants.`
  const featuredImage =
    typeof post.featuredImage === 'object'
      ? (post.featuredImage as Media)
      : null

  return {
    title: `${title} | High Desert Property Management`,
    description,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.author ? [post.author] : undefined,
      images: featuredImage?.url
        ? [{ url: featuredImage.url, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------- Helpers ----------
function estimateReadingTime(body: Post['body']): number {
  if (!body?.root?.children) return 1

  let wordCount = 0
  function countWords(node: Record<string, unknown>) {
    if (node.text && typeof node.text === 'string') {
      wordCount += node.text.split(/\s+/).filter(Boolean).length
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        countWords(child as Record<string, unknown>)
      }
    }
  }

  for (const child of body.root.children) {
    countWords(child as Record<string, unknown>)
  }

  return Math.max(1, Math.ceil(wordCount / 250))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------- Page ----------
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })

  const post = docs[0]
  if (!post) notFound()

  const featuredImage =
    typeof post.featuredImage === 'object'
      ? (post.featuredImage as Media)
      : null
  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object',
  )
  const tags = post.tags?.filter((t) => t.tag) ?? []
  const readingTime = estimateReadingTime(post.body)

  // Fetch related posts from same categories
  let relatedPosts: Post[] = []
  if (categories.length > 0) {
    const { docs: related } = await payload.find({
      collection: 'posts',
      where: {
        status: { equals: 'published' },
        id: { not_equals: post.id },
        categories: { contains: categories[0].id },
      },
      sort: '-publishedAt',
      limit: 3,
      depth: 2,
    })
    relatedPosts = related
  }

  // If not enough related posts from category, fill with recent posts
  if (relatedPosts.length < 3) {
    const existingIds = [post.id, ...relatedPosts.map((p) => p.id)]
    const { docs: recent } = await payload.find({
      collection: 'posts',
      where: {
        status: { equals: 'published' },
        id: { not_in: existingIds },
      },
      sort: '-publishedAt',
      limit: 3 - relatedPosts.length,
      depth: 2,
    })
    relatedPosts = [...relatedPosts, ...recent]
  }

  // JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'High Desert Property Management',
      url: SITE_URL,
    },
    image: featuredImage?.url || undefined,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  }

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ])

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className="min-h-screen bg-neutral-light">
        {/* Breadcrumb bar */}
        <div className="bg-primary px-4 py-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl">
            <ol className="flex items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronIcon />
              </li>
              <li>
                <Link
                  href="/blog"
                  className="transition-colors hover:text-white"
                >
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronIcon />
              </li>
              <li className="truncate text-white">{post.title}</li>
            </ol>
          </nav>
        </div>

        {/* Article */}
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Category badges */}
          {categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-heading text-3xl font-bold text-neutral-dark sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {post.title}
          </h1>

          {/* Meta line */}
          <div className="mt-4 flex flex-wrap items-center gap-3 font-body text-sm text-neutral-mid">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true"
                  className="h-4 w-4 text-primary/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                {post.author}
              </span>
            )}
            {post.publishedAt && (
              <>
                <span aria-hidden="true" className="text-gray-300">
                  |
                </span>
                <time
                  dateTime={post.publishedAt}
                  className="flex items-center gap-1.5"
                >
                  <svg aria-hidden="true"
                    className="h-4 w-4 text-primary/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
            <span aria-hidden="true" className="text-gray-300">
              |
            </span>
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true"
                className="h-4 w-4 text-primary/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {readingTime} min read
            </span>
          </div>

          {/* Featured image */}
          {featuredImage?.url && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          {/* Rich text body */}
          {post.body && (
            <div className="blog-article prose prose-lg mt-10 max-w-none font-body prose-headings:font-heading prose-headings:text-neutral-dark prose-p:text-neutral-mid prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-dark prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:not-italic prose-blockquote:text-neutral-dark/80 prose-li:text-neutral-mid prose-hr:border-gray-200">
              <RichText data={post.body} />
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-10 border-t border-gray-200 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <svg aria-hidden="true"
                  className="h-4 w-4 text-neutral-mid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6h.008v.008H6V6z"
                  />
                </svg>
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-block rounded-full bg-primary/5 px-3 py-1 font-body text-xs font-medium text-primary"
                  >
                    {t.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back to blog */}
          <div className="mt-10 border-t border-gray-200 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-primary transition-colors hover:text-primary-dark"
            >
              <svg aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-heading text-2xl font-bold text-neutral-dark">
                Related Articles
              </h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related, i) => (
                  <BlogPostCard key={related.id} post={related} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

// ---------- Sub-components ----------
function ChevronIcon() {
  return (
    <svg aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
