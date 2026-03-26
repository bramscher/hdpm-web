import type { CollectionConfig } from 'payload'

export const MarketAreas: CollectionConfig = {
  slug: 'market-areas',
  admin: {
    useAsTitle: 'city',
  },
  access: {
    read: () => true,
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
    },
    {
      name: 'state',
      type: 'text',
      defaultValue: 'OR',
    },
    {
      name: 'heroText',
      type: 'text',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'marketDescription',
      type: 'richText',
    },
    {
      name: 'seoTitle',
      type: 'text',
    },
    {
      name: 'seoDescription',
      type: 'textarea',
    },
  ],
}
