import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Hosts allowed to be indexed. Any other host (Vercel previews, the
// hdpm-web.vercel.app / hdpm-web-bramplan.vercel.app deployments, etc.)
// gets X-Robots-Tag: noindex so search engines never index a duplicate.
const INDEXABLE_HOSTS = new Set([
  'www.highdesertpm.com',
  'highdesertpm.com',
  'localhost:3000',
])

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const host = request.headers.get('host')?.toLowerCase() ?? ''

  if (!INDEXABLE_HOSTS.has(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/|admin/|api/).*)'],
}
