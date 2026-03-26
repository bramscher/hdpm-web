import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
    ],
  },
}

export default withPayload(nextConfig)
