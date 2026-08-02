# hdpm-web — Pre-Launch Fix Brief

Paste the **Master Prompt** into Claude Code at the repo root. Everything below it is the backlog it references — 32 self-contained issues, ordered, each with evidence and acceptance criteria.

Audited against `https://hdpm-web.vercel.app` and `https://www.highdesertpm.com` on **August 1, 2026**.

---

## MASTER PROMPT

> You are working in the `hdpm-web` repository — the Next.js / Payload rebuild of High Desert Property Management's website (highdesertpm.com, ~850-door residential property manager in Redmond / Bend, Central Oregon). The rebuild is currently deployed to `hdpm-web.vercel.app` and will replace the live WordPress-era site at `highdesertpm.com` in a DNS cutover next week.
>
> An external audit on August 1, 2026 found 11 launch blockers, 13 should-fix items, and 8 improvements. They are listed in `FIX-BRIEF.md` at the repo root, each with the evidence that produced it and acceptance criteria.
>
> **Work in this order: all P0 blockers first, then P1, then P2. Each issue is independently shippable — one branch and one PR per issue, named `fix/<issue-id>-<slug>`.**
>
> Ground rules:
>
> 1. **Verify before you change.** The audit was performed from outside the repo, through a fetch tool that strips `<script>` tags. Some findings are marked "verify first" — confirm the current state in the actual source before implementing. If a finding is already fixed, close it out and say so rather than making a redundant change.
> 2. **Do not guess at repo structure.** Read the code. Find the actual Payload collections, the actual route handlers, the actual config. Where this brief says "the site URL constant," locate it rather than assuming a filename.
> 3. **Preserve what works.** The AppFolio listings feed, the `/contact` form, the 404 status handling, and the market-area routing are all correct today. Don't refactor them as a side effect.
> 4. **Content changes need real content.** Several issues require porting copy from the live site. Fetch the live URL, port the substance, and rewrite anything that reads as 2012 SEO filler. Do not ship lorem or placeholder text.
> 5. **Every P0 gets a verification step in the PR description** — the exact command or URL that proves it's fixed.
>
> Start by reading `FIX-BRIEF.md` in full, then confirm the P0 list against the current code and tell me which are already resolved before you start work.

---

## Deployment context

**Target: DNS cutover to `highdesertpm.com` next week.** All P0 issues gate the cutover. P1 items ship in the 30 days after. The suggested week:

| Day | Work |
|---|---|
| Mon | P0 #1–#5 (indexing, canonicals, robots, sitemap) — the config cluster, all one person, one day |
| Tue | P0 #6–#8 (redirect map, stub deletion, footer legal pages) |
| Wed | P0 #9–#11 (owner portal, founding-year fix, analytics verification) + P0 #2 (the form) |
| Thu | Full staging verification pass against the checklist at the bottom of this brief |
| Fri | **Cutover.** Then monitor Search Console coverage and 404s daily for 30 days. |

Cut over on a Friday morning, not a Friday afternoon — you want business hours to catch a bad redirect.

---

# P0 — BLOCKERS (gate the DNS cutover)

## P0-1 · Canonicals and og:url point at the wrong hostname

**Problem.** Every page emits `<link rel="canonical">` and `og:url` pointing at `https://hdpm-web-bramplan.vercel.app`. Confirmed on `/`, `/owners`, and `/market-areas/bend` via raw HTML. If DNS is cut over without fixing this, every page on `highdesertpm.com` will tell Google to drop the production URL in favor of a Vercel preview host — a self-inflicted de-indexing of the entire site.

**Cause.** A hardcoded or environment-derived site URL constant. In a Payload + Next stack this is usually `NEXT_PUBLIC_SERVER_URL`, `PAYLOAD_PUBLIC_SERVER_URL`, or a `serverURL` in the Payload config — find the actual one.

**Fix.** Resolve the site URL from a single source of truth that returns `https://www.highdesertpm.com` in production. Ensure it also feeds `og:url`, the sitemap, and robots.txt (see P0-4, P0-5). Set it per-environment so preview deployments still self-reference correctly.

**Acceptance.** `curl -s https://<prod-url>/ | grep -i 'rel="canonical"'` returns the production domain on at least these five pages: `/`, `/owners`, `/market-areas/bend`, `/contact`, and one blog post. Same for `og:url`. No occurrence of the string `bramplan` anywhere in built output.

---

## P0-2 · The Free Rental Analysis form captures no contact information

**Problem.** This is the highest-value defect in the build. `/owners#get-started` is the destination of the "Free Rental Analysis" CTA that appears in the **global nav on every page**. The section contains exactly one input:

> Heading: "Get Your Free Rental Analysis"
> Body: "Find out how much your Central Oregon property could earn with professional management. Our free, no-obligation analysis includes a market rent estimate, property assessment, and customized management plan."
> Field: **"Property Address \*"** · Helper: "We'll auto-fill the property details for you." · Button: **"Look Up"**
> Then: "Prefer to talk? Call (541) 548-0383"

No name, no email, no phone anywhere in the section. *Verified twice against the live deployment.* The site it replaces captures **Full Name, Email Address, Phone Number, Property Address** on `/free-property-management-consultation` and on every market-area page. **As shipped, the rebuild converts owner traffic into zero leads — worse than the login wall it fixes.**

**Fix.** Add Name (required), Email (required), Phone (required), and Property Address (required) to the rental-analysis form. Keep the address-lookup enrichment if it works — it's a nice touch — but it must not be the only field. Label the submit button `Get My Free Rental Analysis`, not "Look Up." Wire submissions to a monitored destination (email + CRM) and add a thank-you state that sets expectations ("we'll come back to you within one business day with a rent estimate, a fee breakdown, and a days-on-market projection").

**Also add:** honeypot or similar spam protection, and a UTM/referrer capture hidden field so lead source is attributable at intake.

**Acceptance.** A live test submission from the deployed site arrives at the monitored inbox with all four fields plus source data. Form validates required fields client- and server-side. `/owners` renders the four inputs.

---

## P0-3 · Both Vercel hostnames are fully indexable duplicates

**Problem.** `robots.txt` on both hosts is `User-Agent: * / Allow: /` with only `/admin/` and `/api/` disallowed. And `https://hdpm-web-bramplan.vercel.app/` resolves and serves the identical site — *verified directly*, title `Home | High Desert Property Management`, H1 "Central Oregon Property Management You Can Trust." So three near-duplicate properties currently exist: the live site plus two Vercel hosts. Cannibalization risk is live right now, before cutover.

**Fix.** Add `X-Robots-Tag: noindex, nofollow` at the platform level for any host that is not the production domain — a middleware or `next.config` header rule keyed on the request host is cleaner than a static robots.txt, because it survives new preview URLs. At cutover, 301 both Vercel hostnames to `https://www.highdesertpm.com`.

**Acceptance.** `curl -sI https://hdpm-web.vercel.app/ | grep -i x-robots-tag` and the same for `hdpm-web-bramplan.vercel.app` both return `noindex`. The production domain returns no such header.

---

## P0-4 · /sitemap.xml is unparseable

**Problem.** `/sitemap.xml` returns binary/compressed data that does not parse as XML, on both hosts. Confirmed on two separate attempts. Submitting it to Search Console will fail. The live site's sitemap parses fine, so this is a regression. Root cause is most likely a gzip `Content-Encoding` mismatch on the Payload/Next sitemap route — the body is compressed but the header doesn't declare it, or it's double-compressed.

**Fix.** Correct the encoding on the sitemap route. Confirm the sitemap includes every published page, uses production URLs (depends on P0-1), and carries `lastmod`. Add the 20 blog posts and all 7 market-area pages. Exclude any stub or noindex page.

**Acceptance.** `curl -s https://<prod-url>/sitemap.xml | head -20` returns readable XML. It validates in Search Console. URL count matches the published page count.

---

## P0-5 · robots.txt is malformed and references the wrong host

**Problem.** Verbatim, identical on both hosts:

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Host: https://hdpm-web-bramplan.vercel.app

Sitemap: https://hdpm-web-bramplan.vercel.app
/sitemap.xml
```

The `Sitemap:` directive contains a **literal line break**, splitting the URL — most parsers will read it as `https://hdpm-web-bramplan.vercel.app`, which is not a sitemap. And both `Host:` and `Sitemap:` name the preview hostname.

**Fix.** Generate robots.txt from the site URL constant (P0-1). Single-line `Sitemap:`. Drop the `Host:` directive entirely — it's a Yandex-only directive that Google ignores and it's currently doing active harm. Keep the `/admin/` and `/api/` disallows.

**Acceptance.** `curl -s https://<prod-url>/robots.txt` shows a one-line `Sitemap:` pointing at the production domain, and contains no occurrence of `bramplan`.

---

## P0-6 · 24 of 36 live URLs have no redirect destination

**Problem.** The live sitemap has 36 URLs. Nine map cleanly, three conflict with existing stubs, and 24 currently 404 on the rebuild — including three blog posts totaling ~5,000 words, the live site's converting form page, and all 17 listing detail pages.

**Fix.** Implement the full map below as permanent 301s (`next.config.js` redirects or middleware — whichever the repo already uses; don't introduce a second mechanism).

### Clean

| From | To |
|---|---|
| `/about-us` | `/about` |
| `/availability` | `/listings` |
| `/bend-property-management` | `/market-areas/bend` |
| `/sisters-property-management` | `/market-areas/sisters` |
| `/prineville-property-management` | `/market-areas/prineville` |
| `/privacy-policy` | `/privacy` |

`/`, `/contact`, and `/blog` keep their paths — no redirect needed.

### Blocked by stubs — delete the stub first (see P0-7)

| From | To |
|---|---|
| `/residents` | `/tenants` |
| `/services` | `/owners` |

### Content that must be ported or routed

| From | To |
|---|---|
| `/free-property-management-consultation` | `/owners#get-started` — **only valid after P0-2 ships**; until then this redirect sends converting traffic to a dead form |
| `/how-to-rent-redmond` | port the post at this slug; fallback `/market-areas/redmond` |
| `/real-estate-investing-redmond` | port the post at this slug; fallback `/market-areas/redmond` |
| `/buying-investment-property-redmond` | port the post at this slug; fallback `/market-areas/redmond` |
| `/accessibility` | create the page (see P0-8) |
| `/cookie-policy` | create, or `/privacy` once it has real content |
| `/sitemap` | `/` |

### Listings — one wildcard rule

`/listings/detail/:uuid*` → `/listings`

The 17 live UUIDs, if you'd rather map them individually or want to verify the wildcard catches them all:

```
37e083e0-4b40-45fd-b65c-a81c784b7efc
f1b6b9b1-9de8-44d5-bd64-a3dbedd7b26d
3390f0b9-90b0-47d8-957d-de21d877c0f8
c6b27c98-abd4-44e3-863e-924af55ee24f
4adc97a9-3621-4dc6-9e4c-869921c59722
96988426-4645-4863-b0b2-e66e97c27bf8
ff968274-f357-488e-8a1e-6c4e605bf8e7
d495a8b9-fec7-4004-b1d6-69479765c63b
695fc81c-ae73-494f-a9bb-6d23a2c35edc
b2f15708-8fac-4b0d-b31a-46a76484c8d3
8f4c5f66-cc79-41ac-bdb5-a5e7826da12d
03e3bbd2-2234-47c1-a1d7-35feee61450e
988eafe5-2d46-4805-a53c-876a58aacff6
52df7795-d953-4618-b0d6-e396f992ac0f
c433fc88-2fd1-4e66-9bae-f8bb3181c6d1
8e294f67-8d12-4ad2-b028-565982e69e1d
e7ff2344-1713-44cf-8d5e-71957c46a348
```

### ⚠️ One decision needed before this ships

**The live homepage doubles as the Redmond landing page** — the live nav's "Redmond" link points at `https://www.highdesertpm.com` (the root), and the live homepage H1 is "Redmond Property Management Services." All Redmond keyword equity currently sits on `/`.

Two options, and this changes the map:

- **(a)** New homepage targets Bend + Central Oregon; `/market-areas/redmond` becomes the Redmond page and absorbs the equity through internal linking. Cleaner long-term positioning — Bend is the bigger market — but Redmond rankings will dip during the transition.
- **(b)** Keep the homepage Redmond-weighted to preserve the equity, and fight for Bend on `/market-areas/bend` instead.

Recommend (a): Bend has meaningfully more search volume and the homepage holds the site's external link equity, so pointing it at the biggest market is the right long-run trade. But it's a business call, not a code one — get Craig's answer before implementing.

**Acceptance.** A script that requests all 36 live URLs against the staging deployment and asserts each returns 301 with the expected `Location`, or 200 where the path is preserved. Zero 404s. Commit the script.

---

## P0-7 · Delete the /services and /residents stubs

**Problem.** Both exist as indexable near-empty pages that render only an H1 plus the global footer tagline:

- `/services` — title `Our Services | High Desert Property Management`, H1 "Our Services", **~180 words**, no meta description
- `/residents` — title `Residents | High Desert Property Management`, H1 "Residents", **~45 words**, no meta description

They will index as thin duplicates, and they block the P0-6 redirects for `/services` → `/owners` and `/residents` → `/tenants`.

**Also check `/privacy`** — it exists but has ~85 words and no actual policy body (see P0-8).

**Fix.** Delete both routes and any Payload documents backing them. Then the redirects apply.

**Alternative for `/services` only:** the live `/services` page has ~1,200 words of real service copy. If you'd rather keep a services page than redirect it, port that content properly and make it a real page — but decide, don't leave the stub.

**Acceptance.** `/services` and `/residents` return 301 to their targets, not 200.

---

## P0-8 · Footer legal links 404 on every page

**Problem.** The global footer — on every page of the site — links to "Terms of Service" → `/terms` (**404**) and "Accessibility" → `/accessibility` (**404**). `/privacy` resolves but contains ~85 words and no policy body. The live site has populated `/privacy-policy`, `/cookie-policy`, and `/accessibility`.

The accessibility page in particular is ADA/WCAG exposure for a housing-adjacent business, and a missing fair-housing notice is worse.

**Fix.** Create `/terms` and `/accessibility` with real content — port from the live site where it exists, and have counsel review the accessibility statement. Populate `/privacy` with the actual policy from the live `/privacy-policy`. Add an **Equal Housing Opportunity** notice to the footer — the live footer links to HUD Fair Housing and the rebuild does not.

**Acceptance.** All three pages return 200 with substantive content. No 404 reachable from any footer link. Footer displays the fair-housing notice.

---

## P0-9 · No owner portal — ~850 existing owners lose their login

**Problem.** On the live site, `/owners` **is** the Owner Portal (title `Owner Portal - Access Account Online | High Desert PM`, three "Log In" buttons). On the rebuild, `/owners` is a marketing page, `/owner-portal` **404s**, and no owner login link exists anywhere — not in the nav, not in the footer.

At cutover, every owner who has bookmarked that URL or navigates to "Owners" lands on a marketing page with no way in. That's a support-call event across 850 doors on day one.

**Fix.** Build `/owner-portal` routing to the AppFolio owner login (`https://highdesertpm.appfolio.com/connect/users/sign_in` — verify the correct owner-side entry point; the tenant portal already uses this pattern on `/tenants`). Add a persistent **"Owner Login"** link to the global nav, visually distinct from the "Free Rental Analysis" CTA. Add it to the footer too.

**Do not 301 `/owners` → `/owner-portal`** — the marketing page needs that slug for owner-intent search. Instead, put a clear "Already a client? Owner Login →" link near the top of `/owners`.

**Acceptance.** `/owner-portal` returns 200 and links to the AppFolio owner sign-in. "Owner Login" appears in the global nav on every page. `/owners` carries a visible link for existing clients.

---

## P0-10 · "Since 2011" vs "since 2003" contradiction shipping site-wide

**Problem.** The **global footer on every page** reads "Professional property management across Central Oregon. Maximizing your investment while keeping tenants happy **since 2003**." Meanwhile `/about` and the homepage meta description both say **"since 2011."**

The live `/about-us` supports 2011: Craig started in business with Free Property Management in 2011 and purchased HDPM in 2015.

**Fix.** Confirm the correct framing with Craig — "since 2011" and "serving Central Oregon since 2011" are both defensible; 2003 appears to be wrong. Then make it a single constant used everywhere rather than three hardcoded strings.

**Acceptance.** `grep -r "2003"` returns nothing in user-facing copy. The year renders from one source.

---

## P0-11 · Verify analytics, call tracking, and conversion events

**Problem.** None could be confirmed from outside — the audit tool strips `<script>` tags. **This is a "verify first" item, not a confirmed defect.** But a site with no working lead form (P0-2) and no analytics would be invisible twice over, and it's cheap to check.

**Fix.** Confirm in source: GA4 or GTM installed and firing · a conversion event on rental-analysis form submit and on `/contact` submit · call tracking on the phone number, ideally with dynamic number insertion that still leaves the canonical NAP in server-rendered HTML · Search Console verification for the production domain, added before cutover so coverage data starts immediately.

**Acceptance.** A test form submission registers a conversion event. Real-time analytics shows traffic. Search Console property is verified for `https://www.highdesertpm.com`.

---

# P1 — SHOULD-FIX (first 30 days after cutover)

## P1-12 · Rebuild /market-areas/bend to full depth

The rebuild's Bend page is **~650 words with no form.** The live `/bend-property-management` is **~2,400 words across 13 H2s with a Name/Email/Phone/Address form.** Bend is the largest market in the service area and this is the most valuable page in the portfolio — the rebuild guts it and ranking loss is the likely result.

Port the live page's structure: Key Takeaways · Let Us Manage Your Bend Rental Property · Our Bend Property Management Services · Strategic Marketing & Tenant Placement · Comprehensive Tenant Screening · Rent Collection & Financial Reporting · Property Maintenance & Inspections · Lease Management & Legal Compliance · Vacancy Reduction & Retention Strategies · About Bend, OR · Areas We Serve · a lead form.

Rewrite rather than copy-paste — the live copy is serviceable but generic. Add what only HDPM can say: actual Bend rent data, named neighborhoods (NorthWest Crossing, Old Bend, Awbrey Butte, Orchard District), Bend's specific short-term-rental rules, named local staff, and at least two real Bend owner testimonials.

**Target: 2,000+ words, embedded form, distinct photography.**

## P1-13 · Same treatment for Sisters and Prineville

Live versions are ~1,200–1,400 words *with* forms; rebuild versions are ~900–1,000 with none. Same pattern, same fix, lower priority than Bend.

## P1-14 · Add a lead form to all 7 market-area pages

None has one today. Every market page currently relies on a nav link to a form that (pre-P0-2) captures nothing. Same four fields as P0-2, with the city pre-filled in a hidden field so lead source is attributable by market.

## P1-15 · Port the three live blog posts

~5,000 words total — the newest and most commercially targeted content on the live site, all Redmond-focused, and Redmond is the office location. None appear among the rebuild's 20 posts.

| Live URL | Title | ~Words | Date |
|---|---|---|---|
| `/how-to-rent-redmond` | Ultimate Landlord Guide to Renting Out Your House in Redmond, OR | 1,450 | Apr 17, 2026 |
| `/real-estate-investing-redmond` | Redmond Real Estate Investing (Ultimate Guide) | 1,800 | Mar 30, 2026 |
| `/buying-investment-property-redmond` | Investment Property in Redmond, OR | 1,800 | Feb 26, 2026 |

Port at the original slugs to preserve any accumulated authority. If the CMS forces a `/blog/<slug>` structure, port them there and 301 the originals.

## P1-16 · Build /pricing with actual numbers

`/pricing` 404s. `/owners` has an H2 "Competitive, Transparent Pricing" that names four fee *structures* with no figures — "Full-Service Management: Percentage of monthly rent collected," "Tenant Placement: One-time fee per placement," "Lease Renewal: Flat fee per renewal," "Maintenance Coordination: Included with full-service" — then defers to "Contact us for a personalized quote."

A section headed "Transparent Pricing" that states no price is a credibility liability. It also forfeits the "property management fees bend oregon" query set entirely, which is one of the highest-volume owner-intent clusters in the market.

For context on the competitive stakes: Arise publishes a full tiered table (7% for 1–4 units, 6% for 5–12), A Superior publishes 9% + 25% of one month's leasing, Legacy publishes 8% + 50% of first month, Obsidian publishes 9% with no fee while vacant. **HDPM publishes nothing.**

Needs a business decision from Craig on what to publish before it can be built.

## P1-17 · Add JSON-LD structured data

**Verify current state first** — only one page could be sampled from outside and it showed no `application/ld+json` blocks, but that is not comprehensive.

If absent, add: `RealEstateAgent` or `LocalBusiness` on the homepage with NAP (1515 SW Reindeer Ave, Redmond, OR 97756 · (541) 548-0383), `openingHours`, `geo`, and an `areaServed` array listing all seven cities · `Service` + `areaServed` on each market-area page · `BlogPosting` on all 20 posts · `FAQPage` on the `/tenants` FAQ section · `AggregateRating` only once review volume is displayed (see P1-20).

Validate with Google's Rich Results Test.

## P1-18 · Add a CTA block to the blog post template

Zero forms across all 20 posts. The best any post does is inline prose: *"If you're considering professional management, give us a call for a free rental analysis."* Add a persistent lead block to the post template — sidebar or end-of-post — with the same fields as P0-2.

## P1-19 · Make the listing count dynamic

Homepage CTA reads "Browse All 20 Available Rentals"; `/listings` renders **17**. Hardcoded or stale. Derive it from the feed.

## P1-20 · Show review volume, and port testimonials

The rebuild displays "4.9 Owner Star Rating" with **no review count.** A rating without volume is weak proof — and HDPM's competitors carry 160–307 reviews (Deschutes 307, Lava Ridge 254, A Superior 165, Plus 164, Mountain View 160). HDPM has 115 on Birdeye and 22 on Yelp.

Render 4–6 reviews as **server-side HTML** with reviewer names — the live site's testimonials are JS-injected and invisible to crawlers, which is a big part of why there's no social proof in search results. Port the live `/services` testimonials section.

## P1-21 · Reconcile office hours

Rebuild `/contact` says "Monday–Friday, 9:00 AM–5:00 PM." Live says "Monday-Friday, 9 am-4 pm." One is wrong, and it needs to match the Google Business Profile.

## P1-22 · Verify the 404 page

404s return correct HTTP status codes (good — confirmed). But the rendered body couldn't be retrieved. Confirm it's branded, carries the global nav, and links to `/listings` and `/owners` rather than being a bare Next.js default.

## P1-23 · Confirm the /about team list

The rebuild lists Craig Bramscher (President), Jennifer Bertran, Mathew Free, Penny Free, Cheryl Waterman, Bianca Nyseth, **and Brody Bramscher**. The live site lists the same six *without* Brody and *with* role titles (Maintenance Coordinator, Property Manager, Office Support, Property Manager/Owner, Property Manager/Owner, President).

Confirm Brody is intended, and restore the role titles — they're trust signals for owners evaluating the company, and they're free.

## P1-24 · Post-cutover Search Console discipline

Submit the fixed sitemap. Keep the old property verified. Monitor coverage and 404s **daily for 30 days**. Watch specifically for: the redirect map behaving, canonicals resolving to production, and the Bend page's ranking trajectory (P1-12 exists because it's likely to dip).

---

# P2 — IMPROVEMENTS

## P2-25 · Add La Pine, Sunriver, Terrebonne, Tumalo market-area pages

All four 404, and they're absent from the live site too — so this is a growth gap, not a regression. But they're real Central Oregon rental submarkets with near-zero competition. **Sunriver caveat:** target "Sunriver long term rental management," not the generic term — generic Sunriver volume is vacation-rental intent and that SERP belongs to STR operators.

Also worth adding eventually: Powell Butte, Crooked River Ranch. Nobody in the market has pages for either.

**Do not ship thin templated versions.** Thin geo pages get algorithmically flattened as doorway pages and drag the whole domain. Each needs local rent data, named neighborhoods, that jurisdiction's specific rules, real local testimonials, and distinct photography.

## P2-26 · Build /refer

404s today. No referral capture anywhere on the site. For an 850-door book, owner and realtor referrals are the cheapest acquisition channel available and none of it is captured online.

Needs two paths: **owner referral** and **realtor/agent referral** — the agent form must capture license number and brokerage, because under ORS 696.290 the referral fee must be paid to the principal broker rather than the agent personally.

**Legal gate:** the owner-referral incentive structure needs an Oregon real estate attorney's sign-off before it launches. Build the page and the capture; hold the incentive copy.

## P2-27 · Host listing detail pages on the rebuild

Every listing currently hands off to AppFolio (`highdesertpm.appfolio.com/listings/detail/<id>`). The live site hosts 17 of its own indexable `/listings/detail/<uuid>` pages. That's 17 URLs of long-tail rental content disappearing. Rendering detail pages from the feed recovers them.

## P2-28 · Replace the Unsplash stock photography

Hero and section imagery is stock: `images.unsplash.com/photo-1718927445954-b050d18bc135` (Three Sisters), `photo-1633998125621-a28f4447252a` (paddleboarding), `photo-1565846894054-51426d448b96` (Deschutes River).

For an operator whose entire differentiator is local expertise, generic stock undercuts the pitch — and routing a third-party origin through `/_next/image` adds an external dependency at request time. Shoot actual managed properties, the Redmond office, and the team.

## P2-29 · Rebalance the blog

8 of the 20 posts are AI/automation themed. That's a lot of runway spent on a topic prospective owners aren't searching for. The owner-intent and local-search clusters are thin by comparison — Oregon landlord law, Bend and Redmond rent trends, rent-vs-sell, fees, STR-to-long-term conversion.

## P2-30 · Rebuild an HTML sitemap at /sitemap

Live has one; rebuild 404s. Minor, but it's a live URL in the redirect map.

## P2-31 · Fair-housing notice

Covered in P0-8, repeated here because it's easy to lose: the live footer links to HUD Fair Housing and the rebuild has no equivalent.

## P2-32 · Run Lighthouse / Core Web Vitals

Untested from outside. Flags worth checking: the external Unsplash origin proxied through image optimization, and the 17-listing grid rendering client-side with filters. Run before cutover even if fixes land after.

---

# Pre-cutover verification checklist

Run every one of these against staging before touching DNS.

```bash
BASE=https://hdpm-web.vercel.app   # then re-run against production after cutover

# P0-1 — canonicals point at production, nowhere near bramplan
for p in / /owners /market-areas/bend /contact /blog; do
  echo "== $p"; curl -s "$BASE$p" | grep -Eio '<link[^>]+rel="canonical"[^>]*>|og:url[^>]*>'
done
curl -s "$BASE/" | grep -c bramplan   # must be 0

# P0-3 — non-production hosts are noindex
curl -sI https://hdpm-web.vercel.app/ | grep -i x-robots-tag
curl -sI https://hdpm-web-bramplan.vercel.app/ | grep -i x-robots-tag

# P0-4 — sitemap parses
curl -s "$BASE/sitemap.xml" | head -20

# P0-5 — robots is clean and single-line
curl -s "$BASE/robots.txt"

# P0-6 — every live URL resolves (expect 301 or 200, never 404)
for p in / /contact /blog /about-us /availability /bend-property-management \
         /sisters-property-management /prineville-property-management /privacy-policy \
         /owners /residents /services /free-property-management-consultation \
         /how-to-rent-redmond /real-estate-investing-redmond /buying-investment-property-redmond \
         /accessibility /cookie-policy /sitemap \
         /listings/detail/37e083e0-4b40-45fd-b65c-a81c784b7efc; do
  printf '%-45s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' "$BASE$p")"
done

# P0-8 — legal pages exist
for p in /terms /accessibility /privacy; do
  printf '%-20s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")"
done

# P0-9 — owner portal exists
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/owner-portal"

# P0-10 — no stale founding year
curl -s "$BASE/" | grep -c 2003   # must be 0
```

**Manual checks that can't be scripted:**

- [ ] Submit the rental-analysis form on staging. Confirm all four fields arrive at the monitored inbox with source data attached.
- [ ] Submit the `/contact` form. Same.
- [ ] Confirm a conversion event fires in GA4 for both.
- [ ] Click every footer link. Zero 404s.
- [ ] Click "Owner Login" from the nav. Lands at the AppFolio owner sign-in.
- [ ] Load the site on a phone. Nav, forms, and the listings grid all work.
- [ ] Confirm Search Console is verified for `https://www.highdesertpm.com` **before** cutover.
- [ ] Screenshot current rankings for "property management bend oregon," "property management redmond oregon," and "property management sisters oregon" so you have a baseline to measure the cutover against.

**Cutover day:** Friday morning. Watch Search Console coverage and server 404 logs daily for 30 days. Expect a two-to-four-week ranking wobble — that's normal for a full-site migration and is not a reason to roll back, provided the redirect map is clean and canonicals resolve.

---

# One decision needed before P0-6 ships

**Does the new homepage target Bend + Central Oregon, or stay Redmond-weighted?**

The live homepage *is* the Redmond page — the nav "Redmond" link points at the root and the H1 is "Redmond Property Management Services." All Redmond equity sits on `/`. The new homepage H1 is "Central Oregon Property Management You Can Trust," which is a different target.

Recommend pointing the homepage at Bend + Central Oregon and letting `/market-areas/redmond` carry Redmond, supported by internal links. Bend has meaningfully more search volume and the homepage holds the site's external link equity, so aiming it at the biggest market is the right long-run trade — accepting a temporary Redmond dip.

But it's a business call. Answer it before implementing the redirect map, because it changes what `/` does.
