import { NextRequest, NextResponse } from 'next/server'
import { getListingById } from '@/lib/appfolio'

export const revalidate = 900 // 15 minutes ISR

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const listing = await getListingById(id)

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { listing },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      },
    )
  } catch (err) {
    console.error('[API /listings/:id] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 },
    )
  }
}
