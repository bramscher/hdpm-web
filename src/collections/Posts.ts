import type { CollectionConfig } from 'payload'
import { revalidateHooks } from '@/lib/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { status: { equals: 'published' } }),
  },
  // Bust /blog/[slug] and the blog index on change (the detail route is
  // already force-dynamic; this keeps the index and future caching correct).
  hooks: revalidateHooks('posts'),
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
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'author',
      type: 'text',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      // Origin of the researched topic (Reddit permalink or article URL). The
      // blog agent writes this so a later run can tell it already covered this
      // source and pick a different topic — the post's title alone can't serve
      // as the key because Claude rewrites it into an SEO headline that no
      // longer resembles the research title. Blank for manually written posts.
      name: 'sourceUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically by the blog agent; blank for hand-written posts.',
      },
    },
  ],
}
