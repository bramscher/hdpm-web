import { timingSafeEqual } from 'node:crypto'

const COMPANY_DOMAIN = '@highdesertpm.com'

export type OsCaller = { actor: string }

/**
 * Auth for admin endpoints called server-to-server by HDPM OS
 * (os.highdesertpm.com). Uses its own secret, HDPM_OS_ADMIN_TOKEN, so the
 * broader HDPM_SERVICE_TOKEN never grants access to applicant data. OS checks
 * the staff member is an admin before calling and names them in
 * `x-hdpm-actor`, which is logged with every change.
 */
export function requireOsAdmin(
  request: Request,
): { ok: true; caller: OsCaller } | { ok: false; response: Response } {
  const token = process.env.HDPM_OS_ADMIN_TOKEN || ''
  const given = (request.headers.get('authorization') || '').replace(
    /^Bearer\s+/i,
    '',
  )
  const valid =
    token.length >= 32 &&
    given.length === token.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(token))
  const actor = (request.headers.get('x-hdpm-actor') || '').trim().toLowerCase()
  if (!valid || !actor.endsWith(COMPANY_DOMAIN))
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  return { ok: true, caller: { actor } }
}
