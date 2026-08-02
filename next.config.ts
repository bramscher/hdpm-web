import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sywffgwizbxisalwmxib.supabase.co'

const nextConfig: NextConfig = {
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: '/api/media/file/:path*',
        destination: `${SUPABASE_URL}/storage/v1/object/public/media/:path*`,
      },
    ]
  },
  // 301 map for every URL in the live WordPress-era sitemap (see
  // docs/hdpm-web-fix-brief.md P0-6). Verified by scripts/verify-cutover.sh.
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/availability', destination: '/listings', permanent: true },
      {
        source: '/bend-property-management',
        destination: '/market-areas/bend',
        permanent: true,
      },
      {
        source: '/sisters-property-management',
        destination: '/market-areas/sisters',
        permanent: true,
      },
      {
        source: '/prineville-property-management',
        destination: '/market-areas/prineville',
        permanent: true,
      },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/cookie-policy', destination: '/privacy', permanent: true },
      { source: '/services', destination: '/owners', permanent: true },
      { source: '/residents', destination: '/tenants', permanent: true },
      {
        source: '/free-property-management-consultation',
        destination: '/owners#get-started',
        permanent: true,
      },
      // Live Redmond blog posts, ported to /blog at their original slugs
      {
        source: '/how-to-rent-redmond',
        destination: '/blog/how-to-rent-redmond',
        permanent: true,
      },
      {
        source: '/real-estate-investing-redmond',
        destination: '/blog/real-estate-investing-redmond',
        permanent: true,
      },
      {
        source: '/buying-investment-property-redmond',
        destination: '/blog/buying-investment-property-redmond',
        permanent: true,
      },
      { source: '/sitemap', destination: '/', permanent: true },
      // The CMS "home" doc would otherwise render at /home as a thin
      // duplicate of the homepage
      { source: '/home', destination: '/', permanent: true },
      // Old AppFolio-hosted listing detail URLs — expired listings land on
      // the listings page with a "no longer available" notice
      {
        source: '/listings/detail/:uuid*',
        destination: '/listings?notice=unavailable',
        permanent: true,
      },
      // Old community page on the AppFolio site (60 GSC-known 404s audit)
      { source: '/mckenzie-meadows-village', destination: '/listings', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.appfolio.com',
      },
      {
        protocol: 'https',
        hostname: 'images.cdn.appfolio.com',
      },
      {
        protocol: 'https',
        hostname: '**.appfoliousercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default withPayload(nextConfig)
