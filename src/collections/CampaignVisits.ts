import type { CollectionConfig } from 'payload'

/**
 * One row per landing-page visit that arrived with a known utm_campaign.
 * Written by POST /api/campaigns/track (server-side, local API); read by the
 * Campaigns dashboard for visit counts and conversion rates.
 */
export const CampaignVisits: CollectionConfig = {
  slug: 'campaign-visits',
  admin: {
    group: 'Marketing',
    hidden: true, // raw event rows — surfaced via the Campaigns dashboard instead
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false, // API writes use the local API with overrideAccess
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      required: true,
      index: true,
    },
    {
      name: 'landingPath',
      type: 'text',
    },
    {
      name: 'referrer',
      type: 'text',
    },
  ],
  timestamps: true,
}
