/**
 * Temporary CMS publishing smoke test.
 *
 * Creates one published Pages record for each layout option, verifies the
 * public route renders, then deletes the records and verifies cleanup.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SITE_URL = process.env.CMS_SMOKE_SITE_URL || 'http://localhost:3000'
const RUN_ID = `cms-smoke-${Date.now().toString(36)}`

const layouts = [
  'default',
  'home',
  'about',
  'owners',
  'services',
  'tenants',
  'contact',
  'listings',
  'residents',
  'privacy',
] as const

type CreatedPage = {
  id: number
  layout: (typeof layouts)[number]
  slug: string
}

function routeUrl(slug: string) {
  return `${SITE_URL}/${slug}`
}

async function expectRouteStatus(slug: string, expectedStatus: number) {
  const res = await fetch(routeUrl(slug), {
    headers: { 'User-Agent': 'HDPM-CMS-Smoke-Test/1.0' },
  })

  if (res.status !== expectedStatus) {
    const body = await res.text()
    throw new Error(
      `Expected /${slug} to return ${expectedStatus}, got ${res.status}. Body: ${body.slice(0, 200)}`,
    )
  }
}

async function main() {
  const payload = await getPayload({ config })
  const created: CreatedPage[] = []

  try {
    for (const layout of layouts) {
      const slug = `${RUN_ID}-${layout}`
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: `CMS Smoke ${layout}`,
          slug,
          layout,
          status: 'published',
          sections:
            layout === 'default'
              ? [
                  {
                    blockType: 'hero',
                    heading: `CMS Smoke ${layout}`,
                    subheading: 'Temporary test page',
                  },
                ]
              : undefined,
          richContent:
            layout === 'services' || layout === 'residents' || layout === 'privacy'
              ? {
                  heroHeading: `CMS Smoke ${layout}`,
                  heroSubheading: 'Temporary test page',
                }
              : undefined,
        },
      })

      created.push({ id: page.id, layout, slug })
    }

    for (const page of created) {
      await expectRouteStatus(page.slug, 200)
      console.log(`OK route /${page.slug}`)
    }
  } finally {
    for (const page of created.reverse()) {
      await payload.delete({
        collection: 'pages',
        id: page.id,
      })
      console.log(`Deleted /${page.slug}`)
    }
  }

  for (const layout of layouts) {
    const slug = `${RUN_ID}-${layout}`
    const { totalDocs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (totalDocs !== 0) {
      throw new Error(`Cleanup failed: ${slug} still exists`)
    }

    await expectRouteStatus(slug, 404)
    console.log(`OK cleanup /${slug}`)
  }

  console.log(`CMS smoke test passed (${layouts.length} layouts)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
