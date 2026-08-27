import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  // 8-hour admin session (Payload default is 2h). Matches hdpm-chat's Auth.js
  // maxAge so admins aren't silently logged out mid-session — an expired token
  // leaves the admin SPA rendered but makes every /api action return Unauthorized.
  auth: {
    tokenExpiration: 28800, // 8 hours, in seconds
  },
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      // New users provisioned via Microsoft SSO default to least-privilege
      // 'viewer' (an admin elevates them afterward). Only the OAuth callback
      // sets `sub` on create, so this never touches manually-created users or
      // existing accounts (SSO logins for existing users are an update, not a
      // create, and never re-run this branch).
      ({ operation, data }) => {
        if (operation === 'create' && data?.sub) {
          data.role = 'viewer'
        }
        return data
      },
    ],
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
