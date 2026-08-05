import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const LEAD_NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'info@highdesertpm.com'
// Sender must be on a domain verified in Resend.
const LEAD_FROM_EMAIL =
  process.env.LEAD_FROM_EMAIL || 'HDPM Website <leads@highdesertpm.com>'

export interface LeadNotification {
  subject: string
  /** label/value pairs rendered as rows; empty values are skipped */
  fields: Array<[string, string | number | null | undefined]>
  /** rendered prominently at the top of the email, e.g. a failed-handoff warning */
  warning?: string
  /** comma-separated recipient override; defaults to LEAD_NOTIFY_EMAIL */
  to?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Email the monitored inbox about a new website lead. Never throws — a
 * notification failure must not fail the lead submission (the lead is
 * already saved in the CRM) — but it logs loudly so misconfiguration is
 * visible in the deployment logs.
 */
export async function sendLeadNotification(
  notification: LeadNotification,
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error(
      '[notify] RESEND_API_KEY is not set — lead notification NOT sent:',
      notification.subject,
    )
    return false
  }

  const rows = notification.fields
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#1a1a1a;">${escapeHtml(String(value))}</td></tr>`,
    )
    .join('')

  const warningHtml = notification.warning
    ? `<p style="padding:12px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;color:#92400E;font-weight:600;">⚠️ ${escapeHtml(notification.warning)}</p>`
    : ''

  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:560px;">` +
    `<h2 style="color:#1a1a1a;">${escapeHtml(notification.subject)}</h2>` +
    warningHtml +
    `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>` +
    `<p style="margin-top:16px;font-size:12px;color:#6B7280;">Sent by the highdesertpm.com website. Full lead detail is in the site admin CRM.</p>` +
    `</div>`

  try {
    const resend = new Resend(RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: LEAD_FROM_EMAIL,
      to: (notification.to || LEAD_NOTIFY_EMAIL).split(',').map((address) => address.trim()),
      subject: notification.subject,
      html,
    })
    if (error) {
      console.error('[notify] Resend error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[notify] failed to send lead notification:', err)
    return false
  }
}
