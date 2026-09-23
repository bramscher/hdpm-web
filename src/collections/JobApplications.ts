import type { CollectionConfig } from 'payload'
import { Resend } from 'resend'
import { SITE_URL } from '../lib/site-url'

export const JobApplications: CollectionConfig = {
  slug: 'job-applications',
  admin: {
    useAsTitle: 'fullName',
    group: 'Hiring',
    defaultColumns: [
      'fullName',
      'jobTitle',
      'email',
      'notificationStatus',
      'createdAt',
    ],
    description:
      'Private applications. To retry an email, set Notification Status to Pending and save. Attachment download links are included in the saved application and notification.',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin',
    create: () => false,
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.skipCareerEmail || doc.notificationStatus !== 'pending')
          return doc
        let sent = false
        try {
          if (!process.env.RESEND_API_KEY)
            throw new Error('RESEND_API_KEY is missing')
          const fields = [
            'fullName',
            'jobTitle',
            'email',
            'phone',
            'availability',
            'experience',
            'technology',
            'resumeDownload',
            'videoDownload',
          ]
          const text = fields
            .filter((key) => doc[key])
            .map((key) => `${key}:\n${doc[key]}`)
            .join('\n\n')
          const result = await new Resend(
            process.env.RESEND_API_KEY,
          ).emails.send(
            {
              from:
                process.env.CAREERS_FROM_EMAIL ||
                process.env.LEAD_FROM_EMAIL ||
                'HDPM Website <leads@highdesertpm.com>',
              to: 'work@highdesertpm.com',
              replyTo: doc.email,
              subject: `New application: ${doc.jobTitle} — ${doc.fullName}`,
              text: `${text}\n\nReview application (admin sign-in required):\n${SITE_URL}/admin/collections/job-applications/${doc.id}`,
            },
            { idempotencyKey: `job-application-${doc.id}` },
          )
          if (result.error) throw new Error(result.error.message)
          sent = true
        } catch (error) {
          console.error(
            '[careers] Application saved; email failed',
            doc.id,
            error instanceof Error ? error.message : 'Unknown error',
          )
        }
        await req.payload.update({
          collection: 'job-applications',
          id: doc.id,
          data: { notificationStatus: sent ? 'sent' : 'failed' },
          req,
          context: { ...context, skipCareerEmail: true },
        })
        return { ...doc, notificationStatus: sent ? 'sent' : 'failed' }
      },
    ],
  },
  fields: [
    {
      name: 'submissionId',
      type: 'text',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'job',
      type: 'relationship',
      relationTo: 'jobs',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    { name: 'fullName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'availability', type: 'textarea', required: true },
    { name: 'experience', type: 'textarea', required: true },
    { name: 'technology', type: 'textarea', required: true },
    { name: 'consent', type: 'checkbox', required: true },
    { name: 'attachments', type: 'json', admin: { readOnly: true } },
    {
      name: 'resumeDownload',
      type: 'text',
      admin: {
        readOnly: true,
        description:
          'Open this URL while signed into an admin account to download the résumé.',
      },
    },
    {
      name: 'videoDownload',
      type: 'text',
      admin: {
        readOnly: true,
        description:
          'Open this URL while signed into an admin account to download the video.',
      },
    },
    {
      name: 'notificationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'sent', 'failed'],
      admin: { position: 'sidebar' },
    },
  ],
}
