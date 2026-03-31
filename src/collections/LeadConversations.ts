import type { CollectionConfig } from 'payload'
import { leadConversationsAfterChange } from './hooks/lead-conversations/afterChange'

export const LeadConversations: CollectionConfig = {
  slug: 'lead-conversations',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['lead', 'channel', 'subject', 'direction', 'language', 'createdAt'],
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
  hooks: {
    afterChange: [leadConversationsAfterChange],
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
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
        { label: 'Phone', value: 'phone' },
        { label: 'Web', value: 'web' },
        { label: 'Social', value: 'social' },
        { label: 'Internal', value: 'internal' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'direction',
      type: 'select',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
      ],
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
      ],
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Null for inbound messages from the lead',
      },
    },
    {
      name: 'latestMessageAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
