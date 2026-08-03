import type { CollectionConfig } from 'payload'

/**
 * A paid ad campaign (Facebook, Instagram, Google, …) pointing at a landing
 * page. The campaign slug doubles as the utm_campaign value, which is how
 * visits and leads are attributed back to it. The Campaigns dashboard
 * (/admin/campaigns) generates the copy-ready ad URL.
 */
export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'platform', 'status', 'landingPage', 'updatedAt'],
    group: 'Marketing',
    description:
      'One entry per ad campaign. Copy the ad URL from the Campaigns dashboard into Ads Manager — visits and leads are measured by utm_campaign.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "August owner leads — Bend"' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Used as utm_campaign in the ad URL — lowercase, hyphens, no spaces (e.g. "aug-owner-leads-bend")',
      },
      validate: (val: unknown) =>
        typeof val === 'string' && /^[a-z0-9-]+$/.test(val)
          ? true
          : 'Lowercase letters, numbers, and hyphens only',
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      defaultValue: 'facebook',
      options: [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Google', value: 'google' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'landingPage',
      type: 'relationship',
      relationTo: 'landing-pages',
      required: true,
    },
    {
      name: 'utmMedium',
      type: 'text',
      defaultValue: 'paid_social',
      admin: { description: 'utm_medium in the ad URL (paid_social, cpc, …)' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Budget, audience, creative notes — anything worth remembering' },
    },
  ],
}
