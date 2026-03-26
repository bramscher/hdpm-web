import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'source', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'propertyInterest',
      type: 'select',
      options: [
        { label: 'Property Owner', value: 'owner' },
        { label: 'Prospective Tenant', value: 'tenant' },
        { label: 'General Inquiry', value: 'general' },
      ],
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
