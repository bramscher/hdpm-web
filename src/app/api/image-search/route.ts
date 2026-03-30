import { NextRequest, NextResponse } from 'next/server'

export interface SearchResult {
  id: string
  url: string
  thumbnailUrl: string
  title: string
  attribution: string
  license: string
  width: number
  height: number
  source: 'unsplash' | 'wikimedia'
  downloadUrl: string
}

// Wikimedia Commons search — no API key required
async function searchWikimedia(query: string, page: number): Promise<SearchResult[]> {
  const offset = (page - 1) * 20
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6', // File namespace
    gsrsearch: `${query} filetype:jpg OR filetype:png`,
    gsrlimit: '20',
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  })

  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { headers: { 'User-Agent': 'HDPM-Web/1.0 (info@highdesertpm.com)' } },
  )

  if (!res.ok) return []
  const data = await res.json()
  if (!data.query?.pages) return []

  return (Object.values(data.query.pages) as unknown[])
    .map((page: unknown) => {
      const p = page as {
        pageid: number
        title: string
        imageinfo?: Array<{
          url: string
          thumburl: string
          width: number
          height: number
          mime: string
          extmetadata?: {
            Artist?: { value: string }
            LicenseShortName?: { value: string }
            ObjectName?: { value: string }
          }
        }>
      }
      const info = p.imageinfo?.[0]
      if (!info || !info.mime?.startsWith('image/')) return null

      const artist = info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown'
      const license = info.extmetadata?.LicenseShortName?.value || 'Unknown'
      const title = info.extmetadata?.ObjectName?.value || p.title.replace('File:', '')

      return {
        id: `wiki-${p.pageid}`,
        url: info.url,
        thumbnailUrl: info.thumburl || info.url,
        title,
        attribution: artist,
        license,
        width: info.width,
        height: info.height,
        source: 'wikimedia' as const,
        downloadUrl: info.url,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null) as SearchResult[]
}

// Unsplash search — requires UNSPLASH_ACCESS_KEY
async function searchUnsplash(query: string, page: number): Promise<SearchResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: '20',
    orientation: 'landscape',
  })

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${key}` },
  })

  if (!res.ok) return []
  const data = await res.json()

  return (data.results || []).map(
    (photo: {
      id: string
      urls: { regular: string; small: string; full: string }
      description: string | null
      alt_description: string | null
      width: number
      height: number
      user: { name: string; links: { html: string } }
      links: { download_location: string }
    }) => ({
      id: `unsplash-${photo.id}`,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      title: photo.description || photo.alt_description || 'Untitled',
      attribution: `${photo.user.name} on Unsplash`,
      license: 'Unsplash License',
      width: photo.width,
      height: photo.height,
      source: 'unsplash' as const,
      downloadUrl: photo.links.download_location,
    }),
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const source = searchParams.get('source') || 'wikimedia'
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!query) {
    return NextResponse.json({ results: [], error: 'Query parameter "q" is required' }, { status: 400 })
  }

  const results =
    source === 'unsplash' ? await searchUnsplash(query, page) : await searchWikimedia(query, page)

  return NextResponse.json({
    results,
    hasUnsplash: !!process.env.UNSPLASH_ACCESS_KEY,
  })
}
