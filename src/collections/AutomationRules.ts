import type { CollectionConfig } from 'payload'

export const AutomationRules: CollectionConfig = {
  slug: 'automation-rules',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'triggerType', 'actionType', 'isActive', 'priority'],
    group: 'CRM',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin'
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as unknown as { role?: string }).role
      return role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'triggerType',
      type: 'select',
      required: true,
      options: [
        { label: 'Lead Created', value: 'lead_created' },
        { label: 'Status Changed', value: 'status_changed' },
        { label: 'No Activity Timeout', value: 'no_activity_timeout' },
        { label: 'Task Overdue', value: 'task_overdue' },
        { label: 'Follow-Up Due', value: 'follow_up_due' },
      ],
    },
    {
      name: 'conditions',
      type: 'json',
      admin: {
        description: 'JSON object with condition key-value pairs to match against the lead',
      },
    },
    {
      name: 'actionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Create Task', value: 'create_task' },
        { label: 'Change Status', value: 'change_status' },
        { label: 'Send Notification', value: 'send_notification' },
        { label: 'Assign Lead', value: 'assign_lead' },
      ],
    },
    {
      name: 'actionConfig',
      type: 'json',
      admin: {
        description: 'JSON object with action parameters (varies by action type)',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Execution order (lower = first)',
      },
    },
  ],
}
