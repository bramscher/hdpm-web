import type { CollectionConfig } from 'payload'
import { leadsBeforeChange } from './hooks/leads/beforeChange'
import { leadsAfterChange } from './hooks/leads/afterChange'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'email',
    group: 'CRM',
    defaultColumns: [
      'firstName',
      'lastName',
      'status',
      'source',
      'leadType',
      'assignedTo',
      'nextFollowUpAt',
      'createdAt',
    ],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true, // open for forms
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
    beforeChange: [leadsBeforeChange],
    afterChange: [leadsAfterChange],
  },
  fields: [
    // --- Sidebar fields for quick access ---
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Attempted Contact', value: 'attempted_contact' },
        { label: 'Engaged', value: 'engaged' },
        { label: 'Tour Scheduled', value: 'tour_scheduled' },
        { label: 'Toured', value: 'toured' },
        { label: 'Applied', value: 'applied' },
        { label: 'Approved', value: 'approved' },
        { label: 'Leased', value: 'leased' },
        { label: 'Lost', value: 'lost' },
        { label: 'Archived', value: 'archived' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'nextFollowUpAt',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    // --- Tabs ---
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'firstName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'lastName',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              index: true,
            },
            {
              name: 'phone',
              type: 'text',
              index: true,
            },
            {
              name: 'preferredLanguage',
              type: 'select',
              defaultValue: 'en',
              options: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'doNotContact',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'smsOptIn',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'emailOptIn',
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Lead Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'source',
                  type: 'select',
                  options: [
                    { label: 'Zillow', value: 'zillow' },
                    { label: 'Apartments.com', value: 'apartments_com' },
                    { label: 'Website', value: 'website' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'Walk-in', value: 'walk_in' },
                    { label: 'Referral', value: 'referral' },
                    { label: 'Other', value: 'other' },
                  ],
                  index: true,
                },
                {
                  name: 'sourceDetail',
                  type: 'text',
                },
              ],
            },
            {
              name: 'leadType',
              type: 'select',
              options: [
                { label: 'Tenant', value: 'tenant' },
                { label: 'Owner', value: 'owner' },
                { label: 'Vendor', value: 'vendor' },
                { label: 'Other', value: 'other' },
              ],
              index: true,
            },
            {
              name: 'stageReason',
              type: 'text',
              admin: {
                condition: (_data, siblingData) => {
                  return siblingData?.status === 'lost' || siblingData?.status === 'archived'
                },
              },
            },
            {
              name: 'notesSummary',
              type: 'textarea',
            },
            {
              name: 'message',
              type: 'textarea',
              admin: {
                description: 'Initial inquiry message (from contact form)',
              },
            },
            {
              name: 'attribution',
              type: 'group',
              admin: {
                description: 'Marketing attribution captured at website intake',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'utmSource', type: 'text' },
                    { name: 'utmMedium', type: 'text' },
                    { name: 'utmCampaign', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'utmTerm', type: 'text' },
                    { name: 'utmContent', type: 'text' },
                  ],
                },
                { name: 'referrer', type: 'text' },
                { name: 'landingPage', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Property & Budget',
          fields: [
            {
              name: 'desiredMoveInDate',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'monthlyBudgetMin',
                  type: 'number',
                  min: 0,
                },
                {
                  name: 'monthlyBudgetMax',
                  type: 'number',
                  min: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Rental Analysis',
          admin: {
            description: 'For owner leads requesting a free rental analysis. Subject property + analysis status synced with hdpm-chatbot.',
          },
          fields: [
            {
              name: 'subjectProperty',
              type: 'group',
              fields: [
                { name: 'address', type: 'text' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'town',
                      type: 'select',
                      options: [
                        { label: 'Bend', value: 'Bend' },
                        { label: 'Redmond', value: 'Redmond' },
                        { label: 'Sisters', value: 'Sisters' },
                        { label: 'Prineville', value: 'Prineville' },
                        { label: 'Culver', value: 'Culver' },
                        { label: 'Other', value: 'Other' },
                      ],
                    },
                    { name: 'zipCode', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'bedrooms', type: 'number', min: 0 },
                    { name: 'bathrooms', type: 'number', min: 0 },
                    { name: 'sqft', type: 'number', min: 0 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'propertyType',
                      type: 'select',
                      options: [
                        { label: 'Single Family', value: 'SFR' },
                        { label: 'Apartment', value: 'Apartment' },
                        { label: 'Townhouse', value: 'Townhouse' },
                        { label: 'Duplex', value: 'Duplex' },
                        { label: 'Condo', value: 'Condo' },
                        { label: 'Manufactured', value: 'Manufactured' },
                        { label: 'Other', value: 'Other' },
                      ],
                    },
                    { name: 'currentRent', type: 'number', min: 0 },
                  ],
                },
                {
                  name: 'amenities',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Garage', value: 'garage' },
                    { label: 'Pool', value: 'pool' },
                    { label: 'A/C', value: 'ac' },
                    { label: 'Washer/Dryer', value: 'washer_dryer' },
                    { label: 'Dishwasher', value: 'dishwasher' },
                    { label: 'Fenced Yard', value: 'fenced_yard' },
                    { label: 'Pet Friendly', value: 'pet_friendly' },
                    { label: 'Fireplace', value: 'fireplace' },
                    { label: 'Updated Kitchen', value: 'updated_kitchen' },
                    { label: 'New Flooring', value: 'new_flooring' },
                  ],
                },
                {
                  name: 'lookupSources',
                  type: 'text',
                  hasMany: true,
                  admin: {
                    readOnly: true,
                    description: 'Data sources used to populate the subject property (Google Geocoding, RentCast, etc.)',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'rentAnalysisStatus',
                  type: 'select',
                  options: [
                    { label: 'Not requested', value: 'none' },
                    { label: 'Requested', value: 'requested' },
                    { label: 'In review', value: 'in_review' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Declined', value: 'declined' },
                  ],
                  defaultValue: 'none',
                  index: true,
                },
                {
                  name: 'rentAnalysisId',
                  type: 'text',
                  admin: {
                    description: 'UUID from hdpm-chatbot rent_analyses table',
                    readOnly: true,
                  },
                },
              ],
            },
            {
              name: 'rentAnalysisShortUrl',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Shareable PDF link populated by hdpm-chatbot when the analysis is delivered',
              },
            },
          ],
        },
        {
          label: 'Tracking',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'lastContactedAt',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'lastInboundAt',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'lastOutboundAt',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'appfolioGuestCardId',
                  type: 'text',
                  admin: {
                    description: 'AppFolio guest card ID for sync',
                  },
                },
                {
                  name: 'rentzapApplicationId',
                  type: 'text',
                  admin: {
                    description: 'Rentzap application ID',
                  },
                },
              ],
            },
            {
              name: 'isDuplicateOfLeadId',
              type: 'number',
              admin: {
                description: 'ID of the original lead if this is a duplicate',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
