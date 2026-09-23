import { NextRequest, NextResponse } from 'next/server'
import { searchWikimedia, searchUnsplash } from '@/lib/image-search'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').trim()
  const source = searchParams.get('source') || 'wikimedia'
  const page = Number(searchParams.get('page') || '1')
  const hasUnsplash = Boolean(process.env.UNSPLASH_ACCESS_KEY)
  if (!query || query.length > 200 || !['unsplash', 'wikimedia'].includes(source) || !Number.isSafeInteger(page) || page < 1 || page > 100) {
    return NextResponse.json({ results: [], hasUnsplash, error: 'Enter a search phrase up to 200 characters and choose a valid source.' }, { status: 400 })
  }
  try {
    const results = source === 'unsplash' ? await searchUnsplash(query, page) : await searchWikimedia(query, page)
    return NextResponse.json({ results, hasUnsplash })
  } catch (error) {
    return NextResponse.json({ results: [], hasUnsplash, error: error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'Image search timed out. Try again or choose another source.' }, { status: 502 })
  }
}
