import { NextRequest, NextResponse } from 'next/server'
import { getCachedListings, getCachedListingsByCity } from '@/lib/appfolio'

export const dynamic = 'force-dynamic'
export const revalidate = 900 // 15 minutes ISR

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    let listings
    if (city) {
      listings = await getCachedListingsByCity(city)
    } else {
      listings = await getCachedListings()
    }

    return NextResponse.json(
      { listings, count: listings.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      },
    )
  } catch (err) {
    console.error('[API /listings] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 },
    )
  }
}
