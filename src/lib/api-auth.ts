import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

type Role = 'admin' | 'editor' | 'viewer' | 'api'

export type ApiAuthResult =
  | { ok: true; user: { id: number | string; email?: string; role?: Role } }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Verify the request carries a valid Payload session cookie.
 * Optionally enforce a minimum role.
 */
export async function requireAuth(options?: { roles?: Role[] }): Promise<ApiAuthResult> {
  const headersList = await headers()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  if (options?.roles && options.roles.length > 0) {
    const role = (user as { role?: Role }).role
    if (!role || !options.roles.includes(role)) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
  }

  return { ok: true, user: user as { id: number | string; email?: string; role?: Role } }
}
