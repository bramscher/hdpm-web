import { NextRequest, NextResponse } from 'next/server'
import { searchWikimedia, searchUnsplash } from '@/lib/image-search'

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
