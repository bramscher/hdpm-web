import { NextRequest, NextResponse } from 'next/server'
import { lookupAddress } from '@/lib/address-lookup'

export const dynamic = 'force-dynamic'

/**
 * GET /api/owner-intake/address-lookup?address=...
 *
 * Public address lookup used by the owner rental-analysis form.
 * Same output shape as hdpm-chatbot's /api/comps/address-lookup.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim()
  if (!address || address.length < 5) {
    return NextResponse.json(
      { error: 'Enter a full address (e.g. 123 Main St, Bend, OR)' },
      { status: 400 },
    )
  }

  try {
    const result = await lookupAddress(address)
    if (!result) {
      return NextResponse.json(
        { error: "Couldn't find that address. Double-check the spelling and try again." },
        { status: 404 },
      )
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[owner-intake/address-lookup]', err)
    return NextResponse.json(
      { error: 'Address lookup failed' },
      { status: 500 },
    )
  }
}
