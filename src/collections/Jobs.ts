import type { CollectionConfig } from 'payload'
import { canManageContent } from '../lib/access'
import { revalidateHooks } from '@/lib/revalidate'
import { isJobPostingURL } from '@/lib/job-links'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'status', 'location', 'order'],
    description: 'Use the Availability toggle in this list to publish or unpublish a job instantly. Only Open / Published jobs appear on the careers page and application form.',
  },
  defaultSort: 'order',
  access: {
    read: ({ req: { user } }) => user ? true : { status: { equals: 'open' } },
    create: canManageContent,
    update: canManageContent,
    delete: canManageContent,
  },
  hooks: revalidateHooks('jobs'),
  fields: [
    {
      name: 'jobDescriptionCreator',
      type: 'ui',
      admin: { components: { Field: '/admin/components/JobDescriptionCreator#default' } },
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug', type: 'text', required: true, unique: true,
      admin: { description: 'Unique link anchor, e.g. maintenance-technician.' },
      validate: (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || 'Use lowercase letters, numbers, and single hyphens.',
    },
    {
      name: 'status', label: 'Availability', type: 'select', required: true, defaultValue: 'draft',
      options: [
        { label: 'Draft / Unpublished', value: 'draft' },
        { label: 'Open / Published', value: 'open' },
        { label: 'Closed / Unpublished', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
        components: { Cell: '/admin/components/JobAvailabilityCell#default' },
        description: 'Choose Open to publish and accept applications, or Closed to hide the role. Click Save to apply. You can reopen it anytime; existing applications are kept.',
      },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'description', type: 'richText', admin: { description: 'Responsibilities, qualifications, and other role details.' } },
    { name: 'location', type: 'text' },
    { name: 'schedule', type: 'text', admin: { description: 'Optional: full-time, part-time, or working hours.' } },
    { name: 'compensation', type: 'text', admin: { description: 'Optional: approved pay range.' } },
    { name: 'contactEmail', type: 'email', defaultValue: 'info@highdesertpm.com' },
    {
      name: 'postingLinks', type: 'array',
      admin: { description: 'Add the actual listing URL on Indeed, Craigslist, or any other job board.' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'For example: Indeed or Craigslist.' } },
        { name: 'url', type: 'text', required: true, validate: (value: unknown) => isJobPostingURL(value) || 'Enter a complete http:// or https:// posting URL.' },
      ],
    },
  ],
}
