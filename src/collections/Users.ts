import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
        { label: 'API (Konmashi)', value: 'api' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
        },
        {
          name: 'lastName',
          type: 'text',
        },
      ],
    },
    {
      name: 'isAssignable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'If checked, this user can be assigned leads via round-robin',
      },
    },
    {
      name: 'speaksSpanish',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Used for routing Spanish-speaking leads',
      },
    },
    {
      name: 'maxLeads',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Maximum number of open leads this user can be assigned',
      },
    },
  ],
}
