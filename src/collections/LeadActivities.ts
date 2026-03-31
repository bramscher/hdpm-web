import type { CollectionConfig } from 'payload'

export const LeadActivities: CollectionConfig = {
  slug: 'lead-activities',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['lead', 'type', 'body', 'performedBy', 'createdAt'],
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
    delete: () => false,
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Note', value: 'note' },
        { label: 'Email Sent', value: 'email_sent' },
        { label: 'Email Received', value: 'email_received' },
        { label: 'SMS Sent', value: 'sms_sent' },
        { label: 'SMS Received', value: 'sms_received' },
        { label: 'Call Logged', value: 'call_logged' },
        { label: 'Voicemail', value: 'voicemail' },
        { label: 'Task Created', value: 'task_created' },
        { label: 'Task Completed', value: 'task_completed' },
        { label: 'Status Changed', value: 'status_changed' },
        { label: 'Property Matched', value: 'property_matched' },
        { label: 'Guest Card Created', value: 'guest_card_created' },
      ],
    },
    {
      name: 'direction',
      type: 'select',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
        { label: 'Internal', value: 'internal' },
      ],
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'performedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
