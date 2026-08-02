# SEO Agent

A self-improving SEO loop that integrates with Google Search Console. Runs
weekly (`vercel.json` cron, Mondays 14:00 UTC / 6am Pacific) at
`/api/cron/seo-agent`.

## What it does

1. **Measure** — for every suggestion applied ≥28 days ago, it pulls
   post-change Search Console metrics and records the outcome
   (`improved` / `no_change` / `worse`).
2. **Find** — ranks pages by opportunity: high impressions with weak CTR, and
   queries in striking distance (positions 4–20).
3. **Suggest** — asks Claude (`claude-opus-4-8`, structured output) for better
   SEO titles/descriptions per page, feeding it the page's live query data
   **and its past experiment outcomes** — this is the self-improving part: an
   approach that made a page worse is not repeated.
4. **Review** — suggestions land as `pending` in Payload admin →
   **SEO → Seo Suggestions**, and a digest email goes to the lead inbox.
   Flip a suggestion to **Approved** and it is applied to the page
   automatically (nothing is ever applied without a human approving it).
   `content` suggestions are advisory prose only — never auto-applied.

Content guardrails are baked into the agent's prompt: no fees/pricing, no
exact door counts, hours 9–4, "since 2011".

## Setup (one time)

1. **Verify Search Console** for `https://www.highdesertpm.com` (or the
   `highdesertpm.com` domain property).
2. **Google Cloud console** → create/select a project → enable the
   **Google Search Console API** → create a **service account** → create a
   JSON key for it.
3. **Search Console → Settings → Users and permissions** → add the service
   account's email (`...@...iam.gserviceaccount.com`) with **Full** access.
4. **Vercel env vars** (Production):
   - `GSC_CLIENT_EMAIL` — the service account email
   - `GSC_PRIVATE_KEY` — the `private_key` from the JSON key (keep the `\n`s)
   - `GSC_SITE_URL` — `sc-domain:highdesertpm.com` for a domain property, or
     `https://www.highdesertpm.com/` for a URL-prefix property
5. `ANTHROPIC_API_KEY` or the existing `CLAUDE_API_KEY` must be set.

Until the GSC vars are set, the cron runs and exits with
`{ skipped: "gsc_not_configured" }` — safe to deploy ahead of setup.

## Manual run

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/seo-agent
```

## Files

- `src/lib/seo-agent/gsc.ts` — Search Console client (service-account JWT)
- `src/lib/seo-agent/analyze.ts` — opportunity ranking + Claude suggestions
- `src/app/api/cron/seo-agent/route.ts` — the weekly loop
- `src/collections/SeoSuggestions.ts` — review queue + approve→apply hook
