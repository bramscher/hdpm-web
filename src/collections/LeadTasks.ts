import type { CollectionConfig } from 'payload'
import { leadTasksAfterChange } from './hooks/lead-tasks/afterChange'

export const LeadTasks: CollectionConfig = {
  slug: 'lead-tasks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'lead', 'status', 'taskType', 'dueAt', 'assignedTo', 'priority'],
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
    afterChange: [leadTasksAfterChange],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'taskType',
      type: 'select',
      required: true,
      options: [
        { label: 'Follow-up Call', value: 'follow_up_call' },
        { label: 'Follow-up SMS', value: 'follow_up_sms' },
        { label: 'Follow-up Email', value: 'follow_up_email' },
        { label: 'Manual Review', value: 'manual_review' },
        { label: 'Spanish Follow-up', value: 'spanish_follow_up' },
        { label: 'AppFolio Push', value: 'appfolio_push' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Complete', value: 'complete' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Overdue', value: 'overdue' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dueAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
