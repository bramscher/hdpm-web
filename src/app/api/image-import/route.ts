import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, alt, caption, attribution, license, sourceUrl, filename } = body as {
      url: string
      alt: string
      caption?: string
      attribution?: string
      license?: string
      sourceUrl?: string
      filename?: string
    }

    if (!url || !alt) {
      return NextResponse.json({ error: 'url and alt are required' }, { status: 400 })
    }

    // Download the image
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HDPM-Web/1.0 (info@highdesertpm.com)' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to download image: HTTP ${res.status}` },
        { status: 502 },
      )
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    // Derive a clean filename
    const ext = contentType.includes('png') ? '.png' : '.jpg'
    const cleanName =
      filename ||
      alt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) + ext

    // Create media document via Payload Local API
    const payload = await getPayload({ config })
    const doc = await (payload.create as Function)({
      collection: 'media',
      data: {
        alt,
        caption: caption || undefined,
        attribution: attribution || undefined,
        license: license || undefined,
        sourceUrl: sourceUrl || undefined,
      },
      file: {
        data: buffer,
        name: cleanName,
        mimetype: contentType,
        size: buffer.length,
      },
    })

    // If Unsplash, trigger download tracking per API guidelines
    if (sourceUrl?.includes('unsplash.com') && process.env.UNSPLASH_ACCESS_KEY) {
      const downloadLocation = body.downloadLocation
      if (downloadLocation) {
        fetch(`${downloadLocation}?client_id=${process.env.UNSPLASH_ACCESS_KEY}`).catch(() => {})
      }
    }

    return NextResponse.json({
      success: true,
      id: doc.id,
      filename: doc.filename,
      url: doc.url,
    })
  } catch (err) {
    console.error('Image import error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 },
    )
  }
}
