import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'rating', 'source', 'approved', 'publishedAt'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { approved: { equals: true } }),
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      required: true,
      defaultValue: 5,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'google',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'googleReviewId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Unique ID to prevent duplicate imports',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
