import type { CollectionConfig } from 'payload'

/**
 * Conversion-focused landing pages served at /lp/[slug] — stripped of the
 * main site navigation, built for paid traffic (Facebook/Instagram ads).
 * Multiple campaigns can point at one landing page.
 */
export const LandingPages: CollectionConfig = {
  slug: 'landing-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Marketing',
    description:
      'Ad landing pages served at /lp/<slug>. No site navigation, always noindex. Attach campaigns to measure them.',
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { status: { equals: 'published' } }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Internal name (shown in admin lists, not on the page)' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL: /lp/<slug>' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      admin: { description: 'Big hero headline — mirror the ad promise' },
    },
    {
      name: 'subheadline',
      type: 'textarea',
      admin: { description: '1-2 supporting sentences under the headline' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bullets',
      type: 'array',
      maxRows: 6,
      admin: { description: '3-5 benefit bullets shown beside the form' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'formHeading',
      type: 'text',
      defaultValue: 'Get Your Free Rental Analysis',
    },
    {
      name: 'formSubheading',
      type: 'textarea',
      defaultValue:
        'Find out what your property could earn. No obligation — we’ll email you a full rent analysis within one business day.',
    },
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      admin: { description: 'Optional social proof shown below the form' },
    },
  ],
}
