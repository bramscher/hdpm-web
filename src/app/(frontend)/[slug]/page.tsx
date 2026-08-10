import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { breadcrumbSchema } from '@/lib/schema'
import type { Page, Media } from '@/payload-types'
import { SITE_URL } from '@/lib/site-url'
import Button from '@/components/ui/Button'

// Slugs that are handled by dedicated routes — skip them here
const RESERVED_SLUGS = [
  'home', // redirected to / in next.config — never render as a page
  'about',
  'blog',
  'contact',
  'listings',
  'market-areas',
  'owner-portal',
  'owners',
  'tenants',
]

// ---------- Static params ----------
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'pages',
      where: { status: { equals: 'published' } },
      limit: 1000,
      select: { slug: true },
    })
    return docs
      .filter((page) => !RESERVED_SLUGS.includes(page.slug))
      .map((page) => ({ slug: page.slug }))
  } catch {
    return []
  }
}

// ---------- Metadata ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.includes(slug)) return {}

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })

  const page = docs[0]
  if (!page) return { title: 'Page Not Found' }

  const title = page.meta?.title || page.title
  // Fallback so CMS pages without a curated meta description (privacy,
  // terms, …) still ship a sensible one instead of an empty tag.
  const description =
    page.meta?.description ||
    `${page.title} — High Desert Property Management, serving Central Oregon property owners and tenants since 2011.`
  const metaImage =
    typeof page.meta?.image === 'object' ? (page.meta.image as Media) : null

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${slug}`,
      siteName: 'High Desert Property Management',
      images: metaImage?.url
        ? [{ url: metaImage.url, width: 1200, height: 630 }]
        : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------- Page ----------
export default async function CMSPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (RESERVED_SLUGS.includes(slug)) notFound()

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })

  const page = docs[0]
  if (!page) notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: page.title, url: `/${page.slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* Render each section block */}
      {page.sections?.map((section) => {
        switch (section.blockType) {
          case 'hero':
            return <HeroBlock key={section.id} block={section} />
          case 'content':
            return <ContentBlock key={section.id} block={section} />
          case 'cta':
            return <CTABlock key={section.id} block={section} />
          default:
            return null
        }
      })}

      {/* Rich-text layouts (services/residents/privacy) store content in
          the richContent group rather than sections */}
      {(!page.sections || page.sections.length === 0) && hasRichContent(page) && (
        <RichContentPage page={page} />
      )}

      {/* Fallback if no sections and no rich content */}
      {(!page.sections || page.sections.length === 0) && !hasRichContent(page) && (
        <section className="bg-primary px-4 pb-16 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-heading text-display-sm sm:text-display text-white">
              {page.title}
            </h1>
          </div>
        </section>
      )}
    </>
  )
}

// ---------- Rich-text layout (services/residents/privacy) ----------

function hasRichContent(page: Page): boolean {
  return Boolean(page.richContent?.heroHeading || page.richContent?.body)
}

function RichContentPage({ page }: { page: Page }) {
  const rc = page.richContent
  return (
    <>
      <section className="bg-primary px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-display-sm sm:text-display text-white">
            {rc?.heroHeading || page.title}
          </h1>
          {rc?.heroSubheading && (
            <p className="mt-4 max-w-2xl text-body-lg text-white/80">
              {rc.heroSubheading}
            </p>
          )}
        </div>
      </section>
      {rc?.body && (
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-neutral-dark prose-p:text-neutral-mid prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-dark prose-li:text-neutral-mid prose-hr:border-neutral-200">
              <RichText data={rc.body} />
            </div>
          </div>
        </section>
      )}
    </>
  )
}

// ---------- Block components ----------

type HeroSection = Extract<NonNullable<Page['sections']>[number], { blockType: 'hero' }>
type ContentSection = Extract<NonNullable<Page['sections']>[number], { blockType: 'content' }>
type CTASection = Extract<NonNullable<Page['sections']>[number], { blockType: 'cta' }>

function HeroBlock({ block }: { block: HeroSection }) {
  const bgImage =
    typeof block.backgroundImage === 'object'
      ? (block.backgroundImage as Media)
      : null

  return (
    <section className="relative bg-primary px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      {bgImage?.url && (
        <>
          <Image
            src={bgImage.url}
            alt={bgImage.alt || ''}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-primary/70" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl">
        <h1 className="font-heading text-display-sm sm:text-display text-white">
          {block.heading}
        </h1>
        {block.subheading && (
          <p className="mt-4 max-w-2xl text-body-lg text-white/80">
            {block.subheading}
          </p>
        )}
        {block.ctaText && block.ctaLink && (
          <div className="mt-8">
            <Button href={block.ctaLink} variant="primary" size="lg" elevated>
              {block.ctaText}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function ContentBlock({ block }: { block: ContentSection }) {
  if (!block.body) return null

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-neutral-dark prose-p:text-neutral-mid prose-p:leading-relaxed prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-dark prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:not-italic prose-blockquote:text-neutral-dark/80 prose-li:text-neutral-mid prose-hr:border-neutral-200">
          <RichText data={block.body} />
        </div>
      </div>
    </section>
  )
}

function CTABlock({ block }: { block: CTASection }) {
  return (
    <section className="bg-primary py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-title text-white">
          {block.heading}
        </h2>
        {block.description && (
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-white/80">
            {block.description}
          </p>
        )}
        {block.buttonText && block.buttonLink && (
          <div className="mt-10">
            <Button href={block.buttonLink} variant="primary" size="lg" elevated>
              {block.buttonText}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
