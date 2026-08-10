import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { createMetadata } from '@/lib/seo'
import BlogPostCard from '@/components/blog/BlogPostCard'
import type { Category } from '@/payload-types'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category : undefined
  // Differentiate filtered views ("Blog — Oregon Rental Law") while keeping
  // the canonical on /blog so category URLs don't compete in search.
  const categoryLabel = category
    ? category
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : null
  return createMetadata({
    title: categoryLabel ? `Blog — ${categoryLabel}` : 'Blog',
    description:
      'Insights for Central Oregon property owners and tenants. Tips on property management, rental market trends, and living in Bend, Redmond, Sisters, and beyond.',
    path: '/blog',
  })
}

const POSTS_PER_PAGE = 9

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const categorySlug =
    typeof params.category === 'string' ? params.category : undefined
  const pageNum = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const currentPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum

  const payload = await getPayload({ config })

  // Fetch categories for the filter pills
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 50,
    sort: 'name',
  })

  // Build where clause
  const where: Where = {
    status: { equals: 'published' },
  }

  // If filtering by category, find the category ID first
  if (categorySlug) {
    const matchingCat = categories.find((c) => c.slug === categorySlug)
    if (matchingCat) {
      where.categories = { contains: matchingCat.id }
    }
  }

  const posts = await payload.find({
    collection: 'posts',
    where,
    sort: '-publishedAt',
    limit: POSTS_PER_PAGE,
    page: currentPage,
    depth: 2,
  })

  const totalPages = posts.totalPages

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Hero */}
      <section className="bg-primary px-4 pb-12 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-heading text-display-sm sm:text-display text-white">
            HDPM Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-body-lg text-white/80">
            Insights for Central Oregon property owners and tenants
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category filter pills */}
        <div className="-mt-5 mb-8">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 shadow-sm border border-neutral-200">
            <Link
              href="/blog"
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !categorySlug
                  ? 'bg-accent text-white'
                  : 'bg-neutral-100 text-neutral-mid hover:bg-primary/10 hover:text-primary'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  categorySlug === cat.slug
                    ? 'bg-accent text-white'
                    : 'bg-neutral-100 text-neutral-mid hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="mb-6 font-body text-sm text-neutral-mid">
          <span className="font-semibold text-neutral-dark">
            {posts.totalDocs}
          </span>{' '}
          {posts.totalDocs === 1 ? 'article' : 'articles'}
          {categorySlug && (
            <>
              {' '}
              in{' '}
              <span className="font-semibold text-neutral-dark">
                {categories.find((c) => c.slug === categorySlug)?.name ??
                  categorySlug}
              </span>
            </>
          )}
        </p>

        {/* Blog post grid */}
        {posts.docs.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.docs.map((post, i) => (
              <BlogPostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white py-20 text-center">
            <svg aria-hidden="true"
              className="mx-auto h-12 w-12 text-neutral-mid/40"
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
            <p className="mt-4 font-heading text-heading text-neutral-dark">
              No articles found
            </p>
            <p className="mt-1 font-body text-sm text-neutral-mid">
              Check back soon for new content.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Blog pagination"
            className="mt-12 flex items-center justify-center gap-4"
          >
            {posts.hasPrevPage ? (
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(currentPage - 1),
                }).toString()}`}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 font-body text-sm font-medium text-neutral-dark shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
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
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-5 py-2.5 font-body text-sm font-medium text-neutral-mid/50">
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
                Previous
              </span>
            )}

            <span className="font-body text-sm text-neutral-mid">
              Page {currentPage} of {totalPages}
            </span>

            {posts.hasNextPage ? (
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(currentPage + 1),
                }).toString()}`}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-2.5 font-body text-sm font-medium text-neutral-dark shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              >
                Next
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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-5 py-2.5 font-body text-sm font-medium text-neutral-mid/50">
                Next
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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            )}
          </nav>
        )}

        {/* Bottom spacer */}
        <div className="pb-16" />
      </div>
    </div>
  )
}
