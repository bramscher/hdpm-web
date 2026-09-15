import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAuth } from '@/lib/api-auth'

/**
 * Search the existing Media library (already-imported photos, including any
 * curated Central Oregon / local images). Powers the "Media library" tab of the
 * in-draft Featured Image Studio so an editor can reuse an owned image without
 * re-downloading from an external source. Matches the query against alt text,
 * caption and filename; empty query returns the most recent uploads.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const q = (new URL(req.url).searchParams.get('q') || '').trim()

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'media',
      where: q
        ? {
            or: [
              { alt: { like: q } },
              { caption: { like: q } },
              { filename: { like: q } },
            ],
          }
        : {},
      limit: 48,
      depth: 0,
      sort: '-createdAt',
    })

    const results = (docs as unknown as Array<Record<string, unknown>>).map((doc) => {
      const sizes = doc.sizes as
        | { thumbnail?: { url?: string }; card?: { url?: string } }
        | undefined
      return {
        id: doc.id as number,
        url: doc.url as string,
        thumbnailUrl:
          sizes?.thumbnail?.url || sizes?.card?.url || (doc.url as string),
        alt: (doc.alt as string) || '',
        attribution: (doc.attribution as string) || '',
        width: (doc.width as number) || 0,
        height: (doc.height as number) || 0,
        filename: (doc.filename as string) || '',
      }
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Media search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 },
    )
  }
}
