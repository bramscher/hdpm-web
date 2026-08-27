# Scope: Microsoft 365 (Entra ID) SSO for the hdpm-web admin

**Status:** decided — ready to build · **Author:** Claude Code · **Date:** 2026-08-19

Goal: let staff sign into the hdpm-web **Payload admin** (`/admin`) with their
`@highdesertpm.com` Microsoft 365 account instead of a Payload email+password —
mirroring how **hdpm-chat** authenticates.

---

## 0. Decisions (locked 2026-08-19) & build plan

**Decisions:** reuse hdpm-chat's Entra app (add a redirect URI + hdpm-web's own
client secret) · plugin-first · default new-user role **viewer** · **prod-only**
for v1 · keep password login enabled with **Craig as break-glass** admin.

**Chosen plugin: `payload-authjs`** (CrawlerCode), Payload `^3.16` / Next `^15` /
next-auth `^5`. It wraps Auth.js v5 (reuse hdpm-chat's MicrosoftEntraID provider
+ `signIn` domain gate + `jwt`/`session` callbacks) and registers a Payload
**custom auth strategy** so `req.user` / `payload.auth()` / `requireAuth` and the
admin keep working unchanged. Rejected: `payload-auth-plugin` (authsmith docs
domain lapsed → maintenance risk); `payload-oauth2` (native but hand-rolled MS
endpoints + provisioning, more code for no gain over reusing chat's config).

**Files to add/modify**
- `src/auth.config.ts` — port hdpm-chat's authConfig: `MicrosoftEntraID` provider
  (`id: "azure-ad"`, issuer pinned to `AZURE_AD_TENANT_ID`, scopes `openid profile
  email`), `callbacks.signIn` rejecting non-`@highdesertpm.com`, jwt/session.
- `src/auth.ts` — `getAuthjsInstance(payload)` → export `handlers, signIn, signOut, auth`.
- `src/app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- `src/payload.config.ts` — add `authjsPlugin({ authjsConfig })` to `plugins`.
- `src/collections/Users.ts` — default new SSO users to `role: 'viewer'` via the
  Auth.js `events.signIn` (adapter.updateUser) and/or a Users `beforeChange` hook;
  keep `auth` (local password) enabled for break-glass, add `disableLocalStrategy`
  only later once every admin has signed in via SSO.
- Admin login button — add a "Sign in with Microsoft" component to the admin login
  (`admin.components.beforeLogin` / custom login view) pointing at the Auth.js
  sign-in; verify whether the plugin injects this or we add it.

**Azure (needs M365 admin — Craig/whoever holds it):** on hdpm-chat's existing
single-tenant app registration, add redirect URI
`https://www.highdesertpm.com/api/auth/callback/azure-ad`, issue a **new client
secret** for hdpm-web, confirm `openid profile email` are consented.

**Vercel env (prod):** `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`,
`AZURE_AD_TENANT_ID`, `AUTH_SECRET`, `NEXTAUTH_URL=https://www.highdesertpm.com`.
`.trim()` every value on read (Vercel trailing-`\n` gotcha). `PAYLOAD_SECRET`
unchanged.

**Open items to resolve during build:** exact admin-login-button injection,
break-glass coexistence of local + authjs strategies, and the users role-default
hook. Build happens on a branch; **cannot be verified end-to-end until the Azure
redirect URI + Vercel envs exist**, so it ships behind those.

---

## 1. Why this isn't a copy of hdpm-chat

hdpm-chat uses **Auth.js v5 (`next-auth`)** with the Microsoft Entra ID provider.
hdpm-web is **Payload CMS v3**, which has its *own* auth system: the `/admin`
panel, the `payload-token` cookie, `payload.auth()`, and the `role` field on the
`Users` collection. Auth.js cannot sit in front of the Payload admin — the admin
requires a native Payload session.

So we **re-create the same Entra OIDC flow against Payload's auth**, swapping only
the credential (password → Microsoft) while keeping Payload's session model. This
is deliberately the least-invasive design: the admin panel and all ~11 existing
`requireAuth` / `payload.auth()` consumers keep working **unchanged**, because the
session is still a normal Payload session.

Consumers that must keep working as-is (session model unchanged):
`src/lib/api-auth.ts` and its callers — `api/automations/*`, `api/image-import`,
`api/crm/reports`, `api/campaigns/stats`, `api/sync-reviews`, plus the admin UI.

## 2. What we reuse from hdpm-chat

- **The same single-tenant Entra app registration** (tenant = `AZURE_AD_TENANT_ID`).
  We add one redirect URI for hdpm-web; no new app, no new admin consent.
- **The `@highdesertpm.com` domain gate** (hard-coded allowlist check, same as
  hdpm-chat's `signIn` callback).
- **JWT (stateless) session** concept — Payload already issues a JWT cookie.

Scopes shrink to `openid profile email` (hdpm-web does **not** need
`Calendars.ReadWrite` / Graph — that's chat-only).

## 3. Target flow

```
Admin clicks "Sign in with Microsoft" on /admin/login
      │
      ├─► GET /api/oauth/microsoft/authorize   → 302 to login.microsoftonline.com
      │                                           (state + PKCE, single tenant)
      │
Microsoft authenticates the user, redirects back:
      │
      └─► GET /api/oauth/microsoft/callback?code=…&state=…
              1. exchange code → ID token (verify signature, nonce, tenant)
              2. reject if email does not end in @highdesertpm.com
              3. find-or-create the Payload `users` doc by email
              4. mint the Payload session (payload-token cookie)
              5. 302 → /admin
```

After step 4 the user has a **normal Payload session**, so everything downstream
(`payload.auth()`, `requireAuth`, admin) just works.

## 4. Implementation options

### Option A — community Payload v3 OAuth plugin (recommended starting point)
Plugins exist that implement exactly "OIDC → find/create Payload user → set the
Payload cookie" (e.g. the `payload-oauth2`-style plugins). Pros: least code, they
already handle cookie minting via Payload internals. Cons: maturity varies; must
be **verified and version-pinned** before we commit — if it's stale against
Payload 3.80 we fall back to Option B.

### Option B — hand-rolled custom auth strategy
Payload v3 supports `auth.strategies` on a collection plus `auth.disableLocalStrategy`.
We implement:
- Two route handlers (`authorize`, `callback`) doing the OIDC code+PKCE flow
  (use a small, audited OIDC lib; no need for full Auth.js).
- On callback, `payload.login()` / Payload's cookie helper to set `payload-token`.
- Optionally a custom strategy for API-token clients (the existing `api` role).

Either way the **surface area is the same**: 2 route handlers, a login-screen
button, a users auto-provision step, and config. Recommendation: spike Option A
for half a day; if the plugin isn't clean against 3.80, ship Option B.

## 5. Azure app registration changes (one-time, needs Craig / M365 admin)

Reuse hdpm-chat's single-tenant app registration and add:
- **Redirect URI:** `https://www.highdesertpm.com/api/oauth/microsoft/callback`
  (final path TBD; must match what we register).
- Confirm delegated scopes `openid profile email` are consented (already are for chat).
- Preview deploys: reuse the prod redirect URI via a proxy (hdpm-chat uses
  `AUTH_REDIRECT_PROXY_URL`) rather than registering every `*.vercel.app`.

## 6. Environment variables (new, in Vercel)

Mirror hdpm-chat's names so they're familiar (values are the **same tenant**, but
hdpm-web should get its **own client secret** rather than sharing chat's):
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`
- `OAUTH_ALLOWED_DOMAIN` = `highdesertpm.com` (or hard-code)
- (reuse existing) `PAYLOAD_SECRET` signs the Payload cookie — unchanged.

⚠️ Guard against the known Vercel trailing-`\n` gotcha (see `src/lib/site-url.ts`
and the preview-env notes): `.trim()` every secret on read.

## 7. Code changes

**Add**
- `src/app/api/oauth/microsoft/authorize/route.ts` — start OIDC flow
- `src/app/api/oauth/microsoft/callback/route.ts` — verify, provision, set cookie
- `src/lib/oauth-microsoft.ts` — tenant/issuer, PKCE, token verify, domain gate
- A custom admin login component (button) via `admin.components` in
  `src/payload.config.ts`

**Modify**
- `src/collections/Users.ts` — keep `role`; on auto-provision default new users to
  `viewer` (elevate manually). Consider `auth.disableLocalStrategy` **only after**
  a break-glass path exists (§9).
- `src/payload.config.ts` — register the login component; optionally wire a custom
  auth strategy (Option B).

**Unchanged:** `src/lib/api-auth.ts` and every route that calls it.

## 8. Authorization / roles

Keep Payload's existing `Users.role` (`admin | editor | viewer | api`) as the
source of truth — all `requireAuth({ roles: [...] })` checks stay as-is. M365 only
proves *identity*; it does not grant a role. First SSO login auto-provisions a
`viewer`; an admin promotes. (Later we could sync role from a shared staff table
like hdpm-chat's `staff.access_role`, but that's out of scope for v1.)

## 9. Risks & edge cases

- **Lockout / break-glass:** do **not** fully disable password login until we have
  a fallback — keep one break-glass admin with a password, or a bootstrap
  `ADMIN_EMAILS`-style env, so a broken OIDC config can't lock everyone out.
- **Email match:** Payload user's `email` must equal the M365 UPN/email. Audit
  existing users before cutover; pre-create or auto-provision.
- **Preview deploys:** need the redirect-proxy pattern or SSO won't work on
  `*.vercel.app` previews (previews point at the prod DB — see preview-env notes).
- **Session length:** unrelated to today's 2h→8h fix, but keep Payload's
  `tokenExpiration` as the admin session length after SSO too.
- **CSRF/state/nonce/PKCE:** must be implemented correctly in the hand-rolled path;
  a big reason to prefer a vetted plugin/lib.
- **`api` role service accounts** (Konmashi) must keep working via their existing
  mechanism, not SSO.

## 10. Rollout plan

1. Azure: add redirect URI + issue hdpm-web client secret (Craig / M365 admin).
2. Build behind SSO login **alongside** existing password login (no disruption).
3. Test on a preview with the redirect proxy, then prod, using real
   `@highdesertpm.com` accounts.
4. Once every active admin has signed in via SSO successfully, disable password
   login (except the break-glass account).

## 11. Effort estimate

- Azure changes: ~30 min (Craig + admin consent, mostly waiting).
- Spike Option A plugin: ~0.5 day.
- Build (either option) + admin login button + auto-provision + domain gate: ~1 day.
- Testing (preview proxy, prod, edge cases, break-glass): ~0.5 day.
- **Total: ~2 days**, gated on the Azure app-registration change.

## 12. Open questions for Craig

1. **Reuse hdpm-chat's Entra app** (add a redirect URI) or a **dedicated hdpm-web
   app registration**? (Recommend: reuse tenant, dedicated client secret.)
2. Who is the **break-glass admin** that keeps a password? (Recommend: you.)
3. First-login **default role** — `viewer` (safe, manual elevation) or `editor`?
4. Do we need SSO to work on **Vercel preview deploys** (needs the redirect proxy),
   or is prod-only fine for v1?
5. Any accounts that are **not** `@highdesertpm.com` that still need admin access?
