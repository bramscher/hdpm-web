import { getPayload, ValidationError } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'

export const runtime = 'nodejs'
// Saving a "resend since" date emails each matching application in turn.
export const maxDuration = 300

/** PATCH { applicationRecipients?, resendSince? } — runs the same validation and resend hook as the website admin. */
export async function PATCH(request: Request) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const data: Record<string, unknown> = {}
  if (typeof body.applicationRecipients === 'string')
    data.applicationRecipients = body.applicationRecipients
  if (typeof body.resendSince === 'string') {
    const since = new Date(body.resendSince)
    if (Number.isNaN(since.getTime()))
      return Response.json({ error: 'Pick a valid date.' }, { status: 400 })
    data.resendSince = since.toISOString()
  }
  if (!Object.keys(data).length)
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  try {
    const payload = await getPayload({ config })
    const settings = await payload.updateGlobal({
      slug: 'hiring-settings',
      data,
      depth: 0,
    })
    console.info('[os-hiring] settings updated by', auth.caller.actor, Object.keys(data))
    return Response.json({
      settings: {
        applicationRecipients: settings.applicationRecipients,
        resendSince: settings.resendSince ?? null,
        lastResend: settings.lastResend ?? null,
      },
    })
  } catch (error) {
    if (error instanceof ValidationError)
      return Response.json(
        { error: error.data.errors.map((e) => e.message).join(' ') },
        { status: 400 },
      )
    console.error('[os-hiring] settings update failed', error instanceof Error ? error.message : error)
    return Response.json({ error: 'Could not save settings' }, { status: 503 })
  }
}
