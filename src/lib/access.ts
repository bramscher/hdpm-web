import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access & FieldAccess = ({ req: { user } }) =>
  user?.role === 'admin'

/** Preserve programmatic publishing while keeping viewers read-only. */
export const canManageContent: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor' || user?.role === 'api'

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}
