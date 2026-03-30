import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'attribution',
      type: 'text',
      admin: { description: 'Photographer or source credit' },
    },
    {
      name: 'license',
      type: 'text',
      admin: { description: 'License type (e.g. Unsplash, CC-BY-SA, Public Domain)' },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: { description: 'Original URL where the image was sourced from' },
    },
  ],
}
