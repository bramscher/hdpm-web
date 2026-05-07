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
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default withPayload(nextConfig)
