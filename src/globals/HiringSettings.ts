import type { GlobalConfig } from 'payload'
import {
  DEFAULT_APPLICATION_RECIPIENTS,
  validateRecipients,
} from '../lib/career-notification'

const isAdmin = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

// Resend's default rate limit is 2 requests per second.
const pause = () => new Promise((resolve) => setTimeout(resolve, 600))

export const HiringSettings: GlobalConfig = {
  slug: 'hiring-settings',
  label: 'Hiring Settings',
  admin: { group: 'Hiring' },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    afterChange: [
      // One-time resend: re-queue every application received on or after the
      // chosen date. Setting each back to Pending runs the normal application
      // email (with attachments) to the current recipients.
      async ({ doc, req, context }) => {
        if (context.skipApplicationResend || !doc.resendSince) return doc
        const { docs } = await req.payload.find({
          collection: 'job-applications',
          where: { createdAt: { greater_than_equal: doc.resendSince } },
          sort: 'createdAt',
          limit: 200,
          depth: 0,
          pagination: false,
          req,
        })
        let sent = 0
        for (const application of docs) {
          // No shared `req`: Payload merges each save's context into
          // req.context, so the email hook's skipCareerEmail flag would leak
          // into the next application and silently skip its email.
          const updated = await req.payload.update({
            collection: 'job-applications',
            id: application.id,
            data: { notificationStatus: 'pending' },
            depth: 0,
          })
          if (updated.notificationStatus === 'sent') sent++
          await pause()
        }
        const since = new Date(doc.resendSince).toLocaleDateString('en-US', {
          timeZone: 'America/Los_Angeles',
        })
        const lastResend = `${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}: ${sent} of ${docs.length} applications since ${since} sent.${docs.length - sent ? ' Unsent ones show Failed or Pending in Job Applications; open one and use Email again.' : ''}`
        return req.payload.updateGlobal({
          slug: 'hiring-settings',
          data: { resendSince: null, lastResend },
          req,
          context: { skipApplicationResend: true },
        })
      },
    ],
  },
  fields: [
    {
      name: 'applicationRecipients',
      label: 'Application email recipients',
      type: 'textarea',
      required: true,
      defaultValue: DEFAULT_APPLICATION_RECIPIENTS.join('\n'),
      validate: validateRecipients,
      admin: {
        description:
          'One email address per line. Every new job application is emailed here with the résumé and video attached.',
      },
    },
    {
      name: 'resendSince',
      label: 'Resend applications received since',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description:
          'Optional. Pick a date and save to email every application received on or after it to the recipients above. Clears itself once sent.',
      },
    },
    {
      name: 'lastResend',
      label: 'Last resend',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
}
