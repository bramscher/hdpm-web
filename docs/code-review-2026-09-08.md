# Code review — September 8, 2026

This first pass focused on authentication, collection permissions, public lead
intake, CRM hooks, image imports, listing delivery, reporting, and development
checks. Findings come from source review and local regression tests, not live
exploitation or a production database audit.

| Dimension | Assessment at review start | Evidence |
| --- | --- | --- |
| Security | High priority | User role escalation, viewer write access, unrestricted image tracking destination |
| Correctness | High priority | Task completion can deadlock; lead follow-ups run in detached callbacks; Unsplash imports use the wrong URL |
| Performance | Needs improvement | Serial geocode queries; reports truncate results instead of aggregating |
| Maintainability | Mixed | Clear domain structure, but no regression test command and no working lint configuration |

## Fixed in this working tree

1. **P1 — Account takeover and privilege escalation.**
   [Users.ts](../src/collections/Users.ts) previously supplied only read access,
   leaving create/update/delete/unlock at Payload's authenticated-user default.
   A viewer could update their role or another account's password. Account
   administration and role writes now require an admin; other account edits
   are filtered to the current user's ID. SSO provisioning still creates
   viewers and preserves existing roles. First local registration becomes admin.
   See [Payload collection access](https://payloadcms.com/docs/access-control/collections).

2. **P1 — Viewer writes and unrestricted raw lead creation.**
   Content, marketing, and SEO collections likewise lacked write-role checks.
   Shared [access rules](../src/lib/access.ts) now require admin/editor/API roles
   for those writes, preserving existing programmatic publishing. Viewer
   deletion of campaign measurements and geocode cache entries is also denied.
   Anonymous raw `/api/leads` creation is closed: that endpoint previously
   accepted internal fields such as assignment and status. Website forms use
   dedicated server-side intake and continue to work through the
   [trusted Local API](https://payloadcms.com/docs/local-api/access-control).

3. **P1 — Image tracking could disclose the Unsplash key.**
   [Image import](../src/app/api/image-import/route.ts) appended the key to an
   unchecked caller-supplied `downloadLocation`. Tracking now accepts only
   HTTPS `api.unsplash.com/photos/:id/download`, uses an authorization header,
   rejects redirects, and has a timeout. Image downloads also reject redirects
   so they cannot bypass the existing host allowlist. The
   [image browser](../src/admin/components/ImageBrowser.tsx) now imports the
   image URL rather than Unsplash's separate event endpoint, which previously
   failed the host check. See [Unsplash download tracking](https://unsplash.com/documentation#track-a-photo-download).

4. **P1 — CRM writes could hang or lose follow-up work.**
   [Task completion](../src/collections/hooks/lead-tasks/afterChange.ts) updated
   its own row from `afterChange` without the parent request. That separate
   transaction can wait on the uncommitted outer write. `completedAt` is now
   set in `beforeChange`; task activity writes receive the original request.
   [Lead hooks](../src/collections/hooks/leads/afterChange.ts) now await their
   activity and follow-up writes in the same transaction instead of using
   `setImmediate`. Dependent failures reject the save so Payload can roll back.
   This follows [Payload's transaction propagation](https://payloadcms.com/docs/database/transactions).

## Remaining work, in priority order

1. **P1 — Public rental-analysis requests overwrite existing contact records — fixed September 9.**
   [Rental-analysis intake](../src/lib/crm/rental-analysis-intake.ts) now records
   email/phone matches as unverified inbound activities and notifies staff to
   review them. It never updates existing lead fields or forwards a matched
   lead to the chatbot, preventing an indirect analysis overwrite by its
   callback. New leads still use the normal handoff. Public success responses
   no longer expose CRM IDs or handoff errors. Nine handler regression tests
   cover both match types, repeat submissions, new contacts, failure paths,
   invalid input, and honeypots. Live database integration remains untested.

2. **P2 — Intake request types are assertions, not runtime validation.**
   Rental-analysis shape/type validation was added September 9: JSON `null`,
   numeric phones, unsupported field values, and invalid contacts now receive
   400 responses before database access. The remaining
   [lead intake:40](../src/app/api/crm/leads/route.ts#L40)
   promises phone-only submissions, but the collection requires email; it also
   writes an empty required last name for single-name contacts. Add shared
   request schemas, field limits, consistent 400 responses, and settle whether
   phone-only leads should be supported. Apply abuse controls at public intake
   boundaries; no application-level rate limiting was found in the reviewed code.

3. **P2 — Reporting silently undercounts and omits overdue tasks.**
   [ReportingView:75](../src/admin/components/crm/ReportingView.tsx#L75) uses only
   500 leads and 200 tasks, and excludes `overdue` tasks. The separate
   [reports API:24](../src/app/api/crm/reports/route.ts#L24) caps leads at 1,000 and
   tasks at 500. Consolidate the dashboard onto server-side counts/aggregations
   with a defined reporting period. Add tests above the current limits and
   include overdue tasks in workload totals.

4. **P2 — Configurable automation rules have no execution path.**
   [evaluateRules](../src/lib/crm/automation-engine.ts#L104) is defined but has no
   caller under `src`. The cron route performs hardcoded actions instead.
   Connect supported triggers to rule evaluation, with idempotency and loop
   protection before enabling status-changing rules.

5. **P2 — Linting is not configured.**
   `npm run lint` invokes `next lint` and stops at a configuration prompt.
   Next is 15.4.11 while the installed ESLint config is from Next 16 and ESLint
   is 10. Choose compatible versions, add a checked-in configuration, and
   establish a baseline before enabling lint in CI. The new `typecheck` and
   `test` scripts are usable independently.

6. **P3 — Map responses perform a query per listing, serially.**
   [listings/map:37](../src/app/api/listings/map/route.ts#L37) queries geocodes in
   a loop, including warm-cache requests. Fetch cached addresses in one query
   and geocode misses with bounded concurrency. Consider populating coordinates
   during listing sync to keep third-party calls out of public requests.

## Strengths

The collection/domain layout makes ownership reasonably clear. Many custom
admin routes already enforce role gates, published content has public read
filters, and listing synchronization protects good cached data from degraded
feeds. Notification HTML is escaped, and the environment files containing
runtime configuration are not tracked in Git. These are useful foundations.

## Validation and rollout limits

- `npm test`: 14 passing database-free regression tests covering permissions,
  first-user/SSO role behavior, nested transaction propagation, failure
  propagation, completion timestamps, and tracking destinations.
- `npm run typecheck`: passes, including the new tests.
- `git diff --check`: passes.
- `npm run lint`: existing setup prompt; no successful lint run claimed.
- No production build, database integration test, live SSO login, email send,
  deployment, or migration was performed. Local configuration can target the
  shared production database. Transaction tests verify call behavior using
  fakes; they do not exercise PostgreSQL locking or rollback directly.
- No database schema change is required. Before deployment, exercise staff
  login, first-user setup on an empty test database, public intake, and task
  completion against an isolated database. Direct anonymous clients of
  `/api/leads` must use the dedicated intake route. Lead saves now fail if
  dependent CRM activity/task writes fail, rather than silently losing them.
- Image providers that redirect will now be rejected; normal direct CDN URLs
  remain supported. Confirm both image providers in a staging import test.

The patch intentionally leaves the broader intake contract, reporting,
automation execution, and dependency/lint migration for separate changes.
