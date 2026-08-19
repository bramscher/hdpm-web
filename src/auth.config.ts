import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import type { EnrichedAuthConfig } from 'payload-authjs'

/** Only company Microsoft 365 accounts may sign in. */
const ALLOWED_DOMAIN = '@highdesertpm.com'

/**
 * Auth.js (next-auth v5) config for Microsoft 365 (Entra ID) SSO into the Payload
 * admin — mirrors hdpm-chat. Reuses the SAME Entra app registration (same
 * AZURE_AD_CLIENT_ID / AZURE_AD_TENANT_ID); only hdpm-web's redirect URI differs.
 *
 * Authorization/roles stay in Payload's `Users.role` (payload-authjs surfaces the
 * Payload user via its custom auth strategy), so — unlike hdpm-chat — there is no
 * jwt/session role stamping here. hdpm-web also does not request Graph scopes.
 */
export const authConfig: EnrichedAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      // Keep the provider id "azure-ad" so the OAuth callback path stays
      // /api/auth/callback/azure-ad — the redirect URI registered in Azure.
      id: 'azure-ad',
      clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: { params: { scope: 'openid profile email' } },
    }),
  ],
  callbacks: {
    // Restrict sign-in to @highdesertpm.com Microsoft 365 accounts.
    async signIn({ user }) {
      const email = user.email?.toLowerCase()
      if (!email?.endsWith(ALLOWED_DOMAIN)) {
        console.warn(`[auth] sign-in blocked for non-company email: ${email ?? '(none)'}`)
        return false
      }
      return true
    },
  },
  events: {
    // New SSO users default to least-privilege 'viewer'. createUser fires only on
    // first creation, so pre-created/existing admins keep their role when they
    // sign in (Auth.js links the account by email instead of recreating).
    createUser: async ({ payload, user }) => {
      if (!payload || !user?.id) return
      try {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: { role: 'viewer' },
          overrideAccess: true,
        })
      } catch (err) {
        console.error('[auth] failed to set default role for new SSO user:', err)
      }
    },
  },
  // 8-hour session, matching the Payload admin token expiration.
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
}
