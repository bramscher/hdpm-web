import { OAuth2Plugin } from 'payload-oauth2'
import { SITE_URL } from './site-url'

/**
 * Microsoft 365 (Entra ID) SSO for the Payload admin — the native, schema-safe
 * approach.
 *
 * Unlike `payload-authjs` (which installs an Auth.js DB adapter and would flip
 * `users.id` to a string + add an `accounts` table), `payload-oauth2` runs the
 * OIDC code flow, then find-or-creates a normal Payload user in the EXISTING
 * `users` collection (matched by email) and mints the standard Payload session
 * cookie. So `payload.auth()` / `requireAuth` / the admin keep working unchanged,
 * the integer `users.id` is preserved, and the only schema delta is one added
 * `sub` text column.
 *
 * Reuses hdpm-chat's Entra app registration (same tenant + client id); hdpm-web
 * has its own client secret. Values are `.trim()`-ed to guard against Vercel's
 * trailing-`\n` gotcha (see `src/lib/site-url.ts`).
 */

/** Only company Microsoft 365 accounts may sign in. */
const ALLOWED_DOMAIN = '@highdesertpm.com'

const tenantId = (process.env.AZURE_AD_TENANT_ID ?? '').trim()
const clientId = (process.env.AZURE_AD_CLIENT_ID ?? '').trim()
const clientSecret = (process.env.AZURE_AD_CLIENT_SECRET ?? '').trim()

/**
 * The plugin is registered unconditionally (enabled: true) so the DB schema
 * (the `sub` column) and the login button are identical across prod, preview,
 * and local — important because preview points at the prod DB. If the Entra
 * env vars are missing at runtime the OAuth calls simply fail and the user is
 * sent back to the login screen; nothing else breaks.
 */
export const microsoftSsoConfigured = Boolean(tenantId && clientId && clientSecret)

/** Auth.js-independent OIDC config for the Microsoft identity platform (v2.0). */
export const microsoftSsoPlugin = () =>
  OAuth2Plugin({
    enabled: true,
    strategyName: 'microsoft-entra',
    // Match the Payload user by email so pre-existing admins (e.g. the
    // break-glass account) keep their id and role on first SSO login.
    useEmailAsIdentity: true,
    serverURL: SITE_URL,
    clientId,
    clientSecret,
    tokenEndpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    providerAuthorizationUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    scopes: ['openid', 'profile', 'email'],
    // Confidential client, but PKCE adds defense-in-depth against code
    // interception. The plugin stores the verifier in a SameSite=Lax cookie,
    // which survives the top-level redirect back from Microsoft.
    pkceEnabled: true,
    // Resolve the user from Microsoft's OIDC userinfo endpoint and enforce the
    // company-domain gate. IMPORTANT: return identity fields ONLY — never
    // `role`. On an existing user the plugin PATCHes the user with this object
    // on every login, so returning a role would reset admins to viewer. New
    // users get their role from the Users `beforeChange` hook instead.
    getUserInfo: async (accessToken: string) => {
      const res = await fetch('https://graph.microsoft.com/oidc/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        throw new Error(`[sso] userinfo request failed: ${res.status} ${res.statusText}`)
      }
      const profile = (await res.json()) as {
        sub?: string
        email?: string
        given_name?: string
        family_name?: string
      }
      const email = profile.email?.toLowerCase()
      if (!email || !email.endsWith(ALLOWED_DOMAIN)) {
        throw new Error(`[sso] sign-in blocked for non-company account: ${email ?? '(no email)'}`)
      }
      return {
        email,
        sub: profile.sub,
        firstName: profile.given_name,
        lastName: profile.family_name,
      }
    },
    successRedirect: () => '/admin',
    failureRedirect: (_req, error) => {
      console.error('[sso] Microsoft sign-in failed:', error)
      return '/admin/login?error=sso'
    },
  })
