import type { CollectionConfig } from 'payload'

export const PropertiesInterest: CollectionConfig = {
  slug: 'properties-interest',
  admin: {
    useAsTitle: 'propertyName',
    defaultColumns: ['lead', 'propertyName', 'address', 'rent', 'status'],
    group: 'CRM',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin' || role === 'editor'
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin' || role === 'editor'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin' || role === 'editor'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin' || role === 'editor'
    },
  },
  fields: [
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      required: true,
      index: true,
    },
    {
      name: 'propertyExternalId',
      type: 'text',
      admin: {
        description: 'AppFolio listing ID',
      },
    },
    {
      name: 'propertyName',
      type: 'text',
    },
    {
      name: 'unitIdentifier',
      type: 'text',
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'rent',
      type: 'number',
      min: 0,
    },
    {
      name: 'availabilityDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'Link to the listing',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'interested',
      options: [
        { label: 'Interested', value: 'interested' },
        { label: 'Touring', value: 'touring' },
        { label: 'Applied', value: 'applied' },
        { label: 'Leased', value: 'leased' },
        { label: 'Lost', value: 'lost' },
      ],
    },
  ],
}
