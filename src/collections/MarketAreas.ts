import type { CollectionConfig } from 'payload'

export const MarketAreas: CollectionConfig = {
  slug: 'market-areas',
  admin: {
    useAsTitle: 'city',
    defaultColumns: ['city', 'slug', 'population', 'medianRent', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { status: { equals: 'published' } }),
  },
  fields: [
    {
      name: 'city',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'state',
      type: 'text',
      defaultValue: 'OR',
      admin: { position: 'sidebar' },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: { description: 'Short tagline shown under the city name' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroImageUrl',
      type: 'text',
      admin: { description: 'External image URL (used if no heroImage uploaded)' },
    },
    {
      name: 'imageAlt',
      type: 'text',
    },
    {
      name: 'population',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'medianRent',
      type: 'number',
      admin: { position: 'sidebar', description: 'Monthly median rent ($)' },
    },
    {
      name: 'description',
      type: 'array',
      fields: [
        {
          name: 'paragraph',
          type: 'textarea',
          required: true,
        },
      ],
      admin: { description: 'Body paragraphs for the market area detail page' },
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
      admin: { description: 'Bullet point highlights' },
    },
    {
      name: 'seoTitle',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
  ],
}
