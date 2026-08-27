import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { microsoftSsoPlugin } from './lib/microsoft-sso'
import { supabaseStorage } from './lib/supabase-storage-adapter'
import { SITE_URL } from './lib/site-url'
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
import { LeadActivities } from './collections/LeadActivities'
import { LeadTasks } from './collections/LeadTasks'
import { PropertiesInterest } from './collections/PropertiesInterest'
import { LeadConversations } from './collections/LeadConversations'
import { AutomationRules } from './collections/AutomationRules'
import { SeoSuggestions } from './collections/SeoSuggestions'
import { LandingPages } from './collections/LandingPages'
import { Campaigns } from './collections/Campaigns'
import { CampaignVisits } from './collections/CampaignVisits'
import { ListingGeocodes } from './collections/ListingGeocodes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeLogin: [
        './admin/components/MicrosoftLoginButton',
      ],
      beforeNavLinks: [
        './admin/components/NavGroupIcons',
      ],
      afterNavLinks: [
        './admin/components/AdminNav',
      ],
      views: {
        imageBrowser: {
          Component: './admin/components/ImageBrowserView',
          path: '/image-browser',
        },
        crmDashboard: {
          Component: './admin/components/crm/CrmDashboardView',
          path: '/crm',
        },
        crmInbox: {
          Component: './admin/components/crm/InboxView',
          path: '/crm/inbox',
        },
        crmReporting: {
          Component: './admin/components/crm/ReportingView',
          path: '/crm/reporting',
        },
        automations: {
          Component: './admin/components/AutomationsView',
          path: '/automations',
        },
        campaigns: {
          Component: './admin/components/CampaignsView',
          path: '/campaigns',
        },
      },
    },
  },
  collections: [
    // Content
    Pages,
    Posts,
    Media,
    MarketAreas,
    Testimonials,
    TeamMembers,
    Categories,
    // CRM
    Leads,
    LeadActivities,
    LeadTasks,
    LeadConversations,
    PropertiesInterest,
    AutomationRules,
    SeoSuggestions,
    // Marketing
    LandingPages,
    Campaigns,
    CampaignVisits,
    ListingGeocodes,
    // Admin
    Users,
  ],
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: { doc: Record<string, unknown> }) =>
        doc.title as string,
      generateDescription: ({ doc }: { doc: Record<string, unknown> }) =>
        (doc.seoDescription as string) || '',
      generateURL: ({ doc }: { doc: Record<string, unknown> }) =>
        `${SITE_URL}/${(doc.slug as string) || ''}`,
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
    // Microsoft 365 (Entra ID) SSO for the admin via native OIDC. Runs the code
    // flow, then find-or-creates a normal Payload user (matched by email) and
    // mints the standard Payload session cookie — so requireAuth/payload.auth
    // and the admin keep working unchanged, and the integer users.id is
    // preserved. Local email+password login stays enabled as a break-glass path
    // (the plugin adds its strategy alongside, it doesn't disable the local one).
    microsoftSsoPlugin(),
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 5,
    },
    schemaName: 'payload_web',
  }),
  sharp,
})
