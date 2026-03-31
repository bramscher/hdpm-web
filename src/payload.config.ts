import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { supabaseStorage } from './lib/supabase-storage-adapter'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { Categories } from './collections/Categories'
import { MarketAreas } from './collections/MarketAreas'
import { Testimonials } from './collections/Testimonials'
import { TeamMembers } from './collections/TeamMembers'
import { Leads } from './collections/Leads'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['./admin/components/ImageBrowserNavLink'],
      views: {
        imageBrowser: {
          Component: './admin/components/ImageBrowserView',
          path: '/image-browser',
        },
      },
    },
  },
  collections: [
    Users,
    Media,
    Posts,
    Pages,
    Categories,
    MarketAreas,
    Testimonials,
    TeamMembers,
    Leads,
  ],
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: { doc: Record<string, unknown> }) =>
        `${doc.title as string} | High Desert Property Management`,
      generateDescription: ({ doc }: { doc: Record<string, unknown> }) =>
        (doc.seoDescription as string) || '',
      generateURL: ({ doc }: { doc: Record<string, unknown> }) =>
        `https://highdesertpm.com/${(doc.slug as string) || ''}`,
      tabbedUI: true,
    }),
    ...(process.env.SUPABASE_SERVICE_ROLE_KEY
      ? [
          supabaseStorage({
            collections: { media: true },
            bucket: 'media',
          }),
        ]
      : []),
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    schemaName: 'payload_web',
  }),
  sharp,
})
