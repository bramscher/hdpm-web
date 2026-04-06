import type { CollectionConfig, Field } from 'payload'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const showWhen = (layout: string) => ({
  admin: {
    condition: (_: unknown, siblingData: Record<string, unknown>) =>
      siblingData?.layout === layout,
  },
})

const textField = (name: string, label: string, opts?: Partial<Field>): Field => ({
  name,
  label,
  type: 'text',
  ...opts,
})

const textareaField = (name: string, label: string, opts?: Partial<Field>): Field => ({
  name,
  label,
  type: 'textarea',
  ...opts,
} as Field)

/* ------------------------------------------------------------------ */
/*  Layout-specific field groups                                       */
/* ------------------------------------------------------------------ */

const homeFields: Field = {
  name: 'homeContent',
  label: 'Home Page Content',
  type: 'group',
  ...showWhen('home'),
  fields: [
    textField('heroBadge', 'Hero Badge Text'),
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    textField('heroCTA1Label', 'Primary CTA Label'),
    textField('heroCTA1Link', 'Primary CTA Link'),
    textField('heroCTA2Label', 'Secondary CTA Label'),
    textField('heroCTA2Link', 'Secondary CTA Link'),
  ],
}

const aboutFields: Field = {
  name: 'aboutContent',
  label: 'About Page Content',
  type: 'group',
  ...showWhen('about'),
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    textField('storyLabel', 'Story Section Label'),
    textField('storyHeading', 'Story Section Heading'),
    {
      name: 'storyParagraphs',
      label: 'Story Paragraphs',
      type: 'array',
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'values',
      label: 'Core Values',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}

const ownersFields: Field = {
  name: 'ownersContent',
  label: 'Owners Page Content',
  type: 'group',
  ...showWhen('owners'),
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    { name: 'heroImage', label: 'Hero Background Image', type: 'upload', relationTo: 'media' },
    textField('heroCTA1Label', 'Primary CTA Label'),
    textField('heroCTA1Link', 'Primary CTA Link'),
    {
      name: 'whyItems',
      label: 'Why HDPM Items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'services',
      label: 'Services',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'features',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'imageUrl', type: 'text', admin: { description: 'External image URL fallback' } },
        { name: 'imageAlt', type: 'text' },
      ],
    },
    {
      name: 'pricingItems',
      label: 'Pricing Items',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'note', type: 'text', required: true },
      ],
    },
    textField('ctaHeading', 'CTA Heading'),
    textareaField('ctaBody', 'CTA Body'),
  ],
}

const tenantsFields: Field = {
  name: 'tenantsContent',
  label: 'Tenants Page Content',
  type: 'group',
  ...showWhen('tenants'),
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    { name: 'heroImage', label: 'Hero Background Image', type: 'upload', relationTo: 'media' },
    {
      name: 'portalCards',
      label: 'Tenant Portal Cards',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'applicationSteps',
      label: 'Application Steps',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'faqs',
      label: 'FAQ Items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    textField('ctaHeading', 'CTA Heading'),
    textareaField('ctaBody', 'CTA Body'),
  ],
}

const contactFields: Field = {
  name: 'contactContent',
  label: 'Contact Page Content',
  type: 'group',
  ...showWhen('contact'),
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    textField('officeAddress', 'Office Address'),
    textField('officePhone', 'Office Phone'),
    textField('officeEmail', 'Office Email'),
    textField('officeHours', 'Office Hours'),
  ],
}

const listingsFields: Field = {
  name: 'listingsContent',
  label: 'Listings Page Content',
  type: 'group',
  ...showWhen('listings'),
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
  ],
}

const richTextPageFields: Field = {
  name: 'richContent',
  label: 'Page Content',
  type: 'group',
  admin: {
    condition: (_: unknown, siblingData: Record<string, unknown>) =>
      ['services', 'residents', 'privacy'].includes(siblingData?.layout as string),
  },
  fields: [
    textField('heroHeading', 'Hero Heading'),
    textareaField('heroSubheading', 'Hero Subheading'),
    { name: 'body', label: 'Body', type: 'richText' },
  ],
}

/* ------------------------------------------------------------------ */
/*  Collection                                                         */
/* ------------------------------------------------------------------ */

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'layout', 'status', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default (Block-based)', value: 'default' },
        { label: 'Home', value: 'home' },
        { label: 'About', value: 'about' },
        { label: 'Owners', value: 'owners' },
        { label: 'Tenants', value: 'tenants' },
        { label: 'Contact', value: 'contact' },
        { label: 'Listings', value: 'listings' },
        { label: 'Services', value: 'services' },
        { label: 'Residents', value: 'residents' },
        { label: 'Privacy', value: 'privacy' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    // Layout-specific content groups
    homeFields,
    aboutFields,
    ownersFields,
    tenantsFields,
    contactFields,
    listingsFields,
    richTextPageFields,
    // Default block-based sections (for generic CMS pages)
    {
      name: 'sections',
      type: 'blocks',
      ...showWhen('default'),
      blocks: [
        {
          slug: 'hero',
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'subheading', type: 'text' },
            { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
            { name: 'ctaText', type: 'text' },
            { name: 'ctaLink', type: 'text' },
          ],
        },
        {
          slug: 'content',
          fields: [
            { name: 'body', type: 'richText' },
          ],
        },
        {
          slug: 'cta',
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'buttonText', type: 'text' },
            { name: 'buttonLink', type: 'text' },
          ],
        },
      ],
    },
  ],
}
