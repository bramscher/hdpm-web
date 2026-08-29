# HDPM-Web

Public-facing website, CMS, and lead/CRM system for **High Desert Property Management**, built with Next.js 15 and Payload CMS 3. Part of the HDPM platform alongside [hdpm-chatbot](https://github.com/bramscher/hdpm-chatbot) (internal tools) and hdpm-dashboard (planned).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Payload CMS Collections](#payload-cms-collections)
- [CRM System](#crm-system)
- [Admin Views](#admin-views)
- [Frontend Routes](#frontend-routes)
- [API Routes](#api-routes)
- [AppFolio Integration](#appfolio-integration)
- [Media Storage (Supabase)](#media-storage-supabase)
- [Owner Rental Analysis Flow](#owner-rental-analysis-flow)
- [Blog Automation (Claude)](#blog-automation-claude)
- [SEO Automation (Claude + Google Search Console)](#seo-automation-claude--google-search-console)
- [Google Reviews Sync](#google-reviews-sync)
- [Cron Jobs](#cron-jobs)
- [Supabase (Shared Database)](#supabase-shared-database)
- [Authentication](#authentication)
- [How HDPM Projects Fit Together](#how-hdpm-projects-fit-together)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment (Vercel)](#deployment-vercel)
- [Scripts](#scripts)
- [Design System](#design-system)

---

## Architecture Overview

```
                         ┌──────────────────────────────────┐
                         │         Supabase Postgres         │
                         │  ┌────────────┐ ┌──────────────┐ │
                         │  │   public    │ │  payload_web │ │
                         │  │  schema     │ │   schema     │ │
                         │  │ (chatbot +  │ │  (CMS + CRM  │ │
                         │  │  shared)    │ │   tables)    │ │
                         │  └─────┬──────┘ └──────┬───────┘ │
                         └────────┼───────────────┼─────────┘
                                  │               │
                   ┌──────────────┘               └──────────────┐
                   │                                             │
          ┌────────┴─────────┐                        ┌──────────┴────────┐
          │   hdpm-chatbot   │                        │     hdpm-web      │
          │  (Internal Tools)│                        │  (Public + CRM)   │
          │                  │                        │                   │
          │ - Knowledge Chat │                        │ - Listings        │
          │ - Rent Comps     │                        │ - Blog / Pages    │
          │ - Work Orders    │                        │ - Market Areas    │
          │ - Invoicing      │                        │ - Lead intake     │
          │ - Inspections    │                        │ - CRM pipeline    │
          │                  │                        │ - Payload Admin   │
          └────────┬─────────┘                        └──────────┬────────┘
                   │                                             │
                   └──────────────┐               ┌──────────────┘
                                  │               │
                         ┌────────┴───────────────┴─────────┐
                         │          Shared Services          │
                         │                                   │
                         │  - Microsoft 365 (Entra) SSO      │
                         │  - AppFolio v0 Database API       │
                         │  - Supabase Storage (media)       │
                         │  - Anthropic Claude (blog + SEO)  │
                         │  - Google Places (reviews)        │
                         │  - Google Search Console (SEO)    │
                         │  - Vercel Hosting + Cron          │
                         └───────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | Next.js 15.4.11 (App Router, React 19)          |
| CMS            | Payload CMS 3.80 (embedded in Next.js)          |
| Database       | PostgreSQL via Supabase (schema: `payload_web`) |
| Rich Text      | Lexical Editor (@payloadcms/richtext-lexical)   |
| Styling        | Tailwind CSS 4.2 + @tailwindcss/typography      |
| Fonts          | Plus Jakarta Sans (headings), Inter (body)      |
| Image CDN      | Next.js Image + AppFolio CDN + Supabase Storage |
| Media Storage  | Custom Supabase Storage adapter (@payloadcms/plugin-cloud-storage) |
| Admin SSO      | Microsoft 365 (Entra ID) via `payload-oauth2` (native OIDC) |
| SEO            | @payloadcms/plugin-seo + JSON-LD + a GSC-driven self-improving SEO agent |
| AI             | @anthropic-ai/sdk (Claude) — blog agent + SEO agent |
| Reviews        | Google Places API (New)                         |
| Deployment     | Vercel (auto-deploy from `main`)                |
| Cron           | Vercel Cron (listings 15m · CRM hourly · SEO + blog agents weekly) |
| External APIs  | AppFolio v0 Database API + public page scraping · Google Search Console |
| Cache Layer    | Supabase `web_listings` table                   |

---

## Project Structure

```
hdpm-web/
├── src/
│   ├── app/
│   │   ├── (frontend)/           # Public-facing pages
│   │   │   ├── page.tsx          # Home page
│   │   │   ├── [slug]/           # CMS-managed dynamic pages
│   │   │   ├── listings/         # Rental listings
│   │   │   ├── blog/             # Blog posts
│   │   │   ├── market-areas/     # Market area pages
│   │   │   ├── about/            # About page
│   │   │   ├── contact/          # Contact form
│   │   │   ├── owners/           # Property owners info
│   │   │   └── tenants/          # Tenant info + FAQ
│   │   ├── (payload)/            # Payload CMS admin UI
│   │   │   └── admin/            # /admin route
│   │   └── api/
│   │       ├── [...slug]/        # Payload REST API (auto-generated)
│   │       ├── graphql/          # Payload GraphQL endpoint
│   │       ├── listings/         # Custom listings API
│   │       ├── crm/              # CRM endpoints (leads, reports, cron)
│   │       ├── automations/      # In-process triggers (blog/seo/listings/reviews)
│   │       ├── campaigns/        # Landing-page visit tracking + stats
│   │       ├── image-search/     # Wikimedia/Unsplash search
│   │       ├── image-import/     # Import external images to Media
│   │       ├── sync-reviews/     # Google Places review sync
│   │       └── cron/             # Vercel Cron: sync-listings, seo-agent, blog-agent
│   ├── admin/                    # Custom Payload admin views/components
│   │   └── components/
│   │       ├── crm/              # CRM dashboard, inbox, reporting
│   │       ├── AutomationsView   # Manual triggers (blog/SEO/listings/CRM)
│   │       ├── CampaignsView     # Paid-ads campaign dashboard
│   │       ├── ImageBrowserView  # Media library browser
│   │       ├── SeoNeedsReviewBanner  # "Needs review" banner on seo-suggestions
│   │       ├── MicrosoftLoginButton  # SSO button on /admin/login
│   │       └── AdminNav, NavGroupIcons
│   ├── collections/              # Payload CMS collection configs
│   │   ├── Users.ts              # + Microsoft 365 SSO (sub column)
│   │   ├── Media.ts
│   │   ├── Posts.ts, Pages.ts, Categories.ts
│   │   ├── MarketAreas.ts, Testimonials.ts, TeamMembers.ts
│   │   ├── Leads.ts, LeadActivities.ts, LeadTasks.ts, LeadConversations.ts
│   │   ├── PropertiesInterest.ts, AutomationRules.ts
│   │   ├── SeoSuggestions.ts     # SEO agent output (human-in-the-loop)
│   │   ├── Campaigns.ts, CampaignVisits.ts, LandingPages.ts  # paid-ads system
│   │   ├── ListingGeocodes.ts    # cached lat/lng for the listings map
│   │   └── hooks/                # Lead hooks (assignment, activity log, etc.)
│   ├── lib/
│   │   ├── appfolio.ts           # AppFolio API client + scraper
│   │   ├── supabase.ts           # Supabase admin client
│   │   ├── supabase-storage-adapter.ts  # Custom Payload storage adapter
│   │   ├── api-auth.ts           # Role-based API auth helper
│   │   ├── listing-utils.ts      # Listing normalization helpers
│   │   ├── page-content.ts       # CMS page rendering helpers
│   │   ├── schema.ts             # JSON-LD / SEO helpers
│   │   ├── seo.ts                # SEO metadata utilities (createMetadata)
│   │   ├── site-url.ts           # single source of truth for the public origin
│   │   ├── revalidate.ts         # ISR revalidate hooks (SEO apply → live)
│   │   ├── microsoft-sso.ts      # Microsoft 365 SSO (payload-oauth2) config
│   │   ├── seo-agent/            # GSC-driven weekly SEO agent
│   │   ├── blog-agent/           # twice-weekly blog agent (research/gen/image)
│   │   └── crm/                  # CRM business logic
│   │       ├── pipeline.ts
│   │       ├── assignment.ts
│   │       ├── dedup.ts
│   │       ├── normalization.ts
│   │       ├── automation-engine.ts
│   │       ├── appfolio-handoff.ts
│   │       ├── tasks.ts
│   │       ├── i18n.ts
│   │       └── types.ts
│   ├── migrations/               # Payload Postgres migrations
│   ├── payload.config.ts         # Payload CMS configuration
│   └── payload-types.ts          # Auto-generated TypeScript types
├── scripts/                      # tsx-run maintenance/seed scripts
├── public/                       # Static assets
├── vercel.json                   # Vercel cron configuration
├── next.config.ts                # Next.js config
└── package.json
```

---

## Payload CMS Collections

### Content

**Pages** — Dynamic block-based layout system (Hero, Content, CTA). Supports arbitrary CMS page creation, rendered via `/[slug]`.

**Posts (Blog)** — Title, slug, status (draft/published), author, featured image, category, tags, Lexical rich text body. SEO via tabbed plugin UI.

**Media** — Image uploads via custom Supabase Storage adapter. Auto-generated sizes: `thumbnail` (400×300), `card` (768×512), `hero` (1920×1080). Includes attribution/license fields for Unsplash/Wikimedia imports.

**Categories** — Name + slug taxonomy for blog posts.

**Market Areas** — One entry per service area (Bend, Redmond, Sisters, Prineville, La Pine, Madras). Hero text/image, rich text description, status flag, SEO fields.

**Testimonials** — Author, company, text, rating (1–5), approved flag. Synced from Google Places reviews.

**Team Members** — Name, title, bio, photo, display order.

### CRM

**Leads** — Auto-created from contact form + external intake endpoint. Public-create access. Fields: name, email, phone, source, lead type, preferred language, budget, move-in date, property interest, status, assigned agent.

**LeadActivities** — Activity log entries (note, call, email, status change, automation event).

**LeadTasks** — Follow-up tasks with due dates. Auto-transitioned to `overdue` by the CRM cron.

**LeadConversations** — Inbound/outbound message threads (email, SMS).

**PropertiesInterest** — Lead ↔ property junction with interest level.

**AutomationRules** — Trigger/condition/action rules executed by the automation engine.

### SEO & Marketing

**SeoSuggestions** — Metadata/content suggestions produced by the weekly SEO agent. Human-in-the-loop: the agent writes `pending` rows; an admin sets status to `applied` and a `beforeChange` hook writes the value onto the target page in the same transaction. Kept as an audit log so the agent can measure each applied suggestion's outcome ~4 weeks later. A "Needs review" banner on the list surfaces the pending subset. (Content suggestions are advisory — applying them does not auto-edit the page.)

**Campaigns** — One row per paid-ad campaign (slug = `utm_campaign`); the `/admin/campaigns` dashboard shows copy-ready Ads Manager URLs and stats.

**CampaignVisits** — Per-session visit beacon for landing pages; dedupes per session and ignores unknown campaigns.

**LandingPages** — Standalone `/lp/<slug>` ad landing pages (no nav, `noindex`), decoupled from the main site Pages.

### Listings support

**ListingGeocodes** — Cached lat/lng per AppFolio listing, backing the listings map view.

### Admin

**Users** — Auth-enabled. Roles: `admin`, `editor`, `viewer`, `api`. Microsoft 365 SSO auto-provisions new users as `viewer` (see [Authentication](#authentication)); a `sub` column stores the OIDC subject id.

---

## CRM System

The CRM is fully embedded in the Payload admin. Six collections plus dedicated admin views cover the lead lifecycle from intake to AppFolio handoff.

| Component | File |
| --------- | ---- |
| Pipeline + status transitions | `src/lib/crm/pipeline.ts` |
| Round-robin / load-balanced assignment | `src/lib/crm/assignment.ts` |
| Email/phone normalization | `src/lib/crm/normalization.ts` |
| Duplicate detection | `src/lib/crm/dedup.ts` |
| Rule-based automation engine | `src/lib/crm/automation-engine.ts` |
| AppFolio handoff (push qualified leads) | `src/lib/crm/appfolio-handoff.ts` |
| Task generation | `src/lib/crm/tasks.ts` |

Public intake at `POST /api/crm/leads` normalizes input, dedupes, and either creates a lead or appends activity to an existing one. The contact form on `/contact` runs the same path in its server action (`actions.ts`): it normalizes email/phone, calls `findDuplicateLead`, and either logs an inbound `lead-activities` note against the existing lead (updating `lastInboundAt`) or creates a new lead.

---

## Admin Views

Custom React views are mounted at these admin URLs (defined in `payload.config.ts`):

| Path                  | View                              |
| --------------------- | --------------------------------- |
| `/admin/crm`          | CRM dashboard (lead pipeline)     |
| `/admin/crm/inbox`    | Conversations inbox               |
| `/admin/crm/reporting`| Aggregated CRM reports            |
| `/admin/automations`  | Manual triggers: blog agent, apply SEO suggestions, sync listings/reviews, CRM cycle |
| `/admin/campaigns`    | Paid-ad campaign dashboard (Ads Manager URLs + stats) |
| `/admin/image-browser`| Media library browser             |

The Payload admin login (`/admin/login`) also carries a **"Sign in with Microsoft 365"** button (SSO), with email + password kept as a break-glass path.

---

## Frontend Routes

| Route                    | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `/`                      | Home — hero, services, featured listings, CTAs |
| `/[slug]`                | CMS-managed dynamic page (Pages collection)    |
| `/listings`              | All available rentals with filters + map       |
| `/listings/[id]`         | Listing detail with photo gallery + video tour |
| `/blog`                  | Blog post listing                              |
| `/blog/[slug]`           | Individual blog post                           |
| `/market-areas`          | All service areas                              |
| `/market-areas/[slug]`   | Market area detail (Bend, Redmond, etc.)       |
| `/tools`                 | Investor calculator hub                        |
| `/tools/roi-calculator`  | Rental ROI calculator                          |
| `/tools/cap-rate-calculator` | Cap-rate calculator                        |
| `/tools/rent-vs-sell`    | Rent-vs-sell calculator                        |
| `/owners`                | Property owner services + rental-analysis intake |
| `/owner-portal`          | Owner portal login (AppFolio)                  |
| `/residents` · `/tenants`| Tenant/resident resources + FAQ                |
| `/ai-agents`             | AI capabilities marketing page                 |
| `/about`                 | About the company                              |
| `/contact`               | Contact form (creates Leads)                   |
| `/privacy`               | Privacy policy (CMS-seeded)                    |
| `/lp/[slug]`             | Paid-ad landing pages (no nav, `noindex`)      |
| `/admin`                 | Payload CMS admin panel (Microsoft 365 SSO)    |

---

## API Routes

### Listings

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/listings`               | Cached listings from Supabase, `?city=` filter |
| GET    | `/api/listings/[id]`          | Single listing by AppFolio ID with detail photos |
| GET    | `/api/listings/map`           | Geocoded listing points for the listings map |
| GET    | `/api/cron/sync-listings`     | Vercel Cron: AppFolio → Supabase sync (Bearer `CRON_SECRET`) |

### CRM

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST   | `/api/crm/leads`              | Public lead intake (dedupe + normalize) |
| POST   | `/api/crm/rental-analysis`    | Public owner rental-analysis intake — creates owner Lead + forwards to hdpm-chatbot |
| POST   | `/api/crm/rental-analysis/status` | Service-to-service callback from hdpm-chatbot (Bearer `HDPM_SERVICE_TOKEN`) |
| GET    | `/api/crm/reports`            | Aggregated CRM metrics (auth: admin/editor/viewer) |
| GET    | `/api/crm/cron`               | Periodic: marks overdue tasks, runs automation rules (Bearer `CRON_SECRET`) |

### Owner Intake

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/owner-intake/address-lookup` | Public address autocomplete (Google Geocoding + RentCast) — same shape as the sister app's `/api/comps/address-lookup` |

### Automations

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/automations/blog-research` | Reddit-based topic suggestions for blog posts |
| POST   | `/api/automations/generate-blog` | Claude-generated blog post draft → Posts collection |
| POST   | `/api/automations/blog-agent`    | Runs the full blog pipeline in-process (research → draft → image → digest email) |
| POST   | `/api/automations/apply-seo-suggestions` | Applies all pending `seo-suggestions` (metadata writes to pages; content left advisory) |
| POST   | `/api/automations/sync-listings` | On-demand listings sync trigger |

### SEO agent (cron)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/cron/seo-agent`         | Weekly self-improving SEO agent — measures past experiments via GSC, picks opportunities, generates metadata suggestions with Claude, stores as pending `seo-suggestions`, emails a digest (Bearer `CRON_SECRET`) |
| GET    | `/api/cron/blog-agent`        | Twice-weekly blog agent — research → Claude draft → featured image → digest email with social copy (Bearer `CRON_SECRET`) |

### Campaigns / Landing pages

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST   | `/api/campaigns/track`        | Session-deduped visit beacon for `/lp/*` landing pages |
| GET    | `/api/campaigns/stats`        | Aggregated campaign visit stats for the admin dashboard |

### Admin SSO (Microsoft 365)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/users/oauth/authorize`  | Starts the Entra OIDC flow (302 → Microsoft) — `payload-oauth2` |
| GET    | `/api/users/oauth/callback`   | OIDC callback: verifies the `@highdesertpm.com` gate, find-or-creates the Payload user, mints the session |

### Media

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/image-search`           | Search Wikimedia + Unsplash (no key required for Wikimedia) |
| POST   | `/api/image-import`           | Import external image URL into Media (allow-listed hosts) |

### Reviews

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/sync-reviews`           | Pulls 5-star Google reviews → Testimonials |

### Payload

| Method | Path | Description |
| ------ | ---- | ----------- |
| ALL    | `/api/[...slug]`              | Auto-generated Payload REST API |
| POST   | `/api/graphql`                | Payload GraphQL endpoint |

---

## AppFolio Integration

The AppFolio integration is the backbone of the listings system. It combines two data sources:

### v0 Database API
- **Endpoints**: `/properties` and `/units` (paginated, 1000/page)
- **Auth**: Basic auth (client_id:client_secret) + `X-AppFolio-Developer-ID` header
- **Retry logic**: Handles 533 (data unavailable) and 429 (rate limit) with 3s backoff
- **Fallback**: When the v0 API is unavailable, falls back to public page scraping for listings data

### Public Page Scraping
- **Listings page**: `highdesertpm.appfolio.com/listings` — extracts CDN image URLs, detail page IDs, and addresses
- **Detail pages**: `highdesertpm.appfolio.com/listings/detail/{uuid}` — extracts full photo galleries

### Data Flow
```
AppFolio v0 API (properties + units)
         +
Public listings page (photos + detail IDs)
         ↓
    Match & merge by address
         ↓
    Filter by availability
         ↓
    Upsert to Supabase web_listings
         ↓
    /api/listings serves from cache
```

### Availability Logic
A unit is considered available if:
- Rent amount > 0
- Status is NOT: occupied, leased, current, notice, eviction
- Status carries an explicit availability signal (`available`, `vacant`, `rent ready`) OR it has a valid `AvailableOn` date (`now` or a parseable date)

Blank statuses are no longer treated as available on their own — an explicit signal or a valid `AvailableOn` date is required.

### CRM Handoff
Qualified leads are pushed to AppFolio via `src/lib/crm/appfolio-handoff.ts` so the operations team works them inside AppFolio after initial qualification.

---

## Media Storage (Supabase)

Media uploads go to **Supabase Storage** (bucket: `media`) via a custom adapter at `src/lib/supabase-storage-adapter.ts`, wired through `@payloadcms/plugin-cloud-storage`. This replaced the prior `@payloadcms/storage-s3` plugin to work reliably on Vercel.

- Bucket: `media`
- Public URL rewrite: `/api/media/file/*` resolves to the Supabase Storage public URL
- Storage plugin is conditional on `SUPABASE_SERVICE_ROLE_KEY` so local dev works without credentials
- The Media collection has attribution/license fields populated by `/api/image-import` for Unsplash/Wikimedia imports

---

## Owner Rental Analysis Flow

The `/owners` page features a 3-step rental analysis intake form. The flow ties hdpm-web (intake) to hdpm-chatbot (analysis engine):

```
Owner fills form on /owners
        ↓
/api/owner-intake/address-lookup  (Google Geocoding + RentCast)
        ↓ subject property auto-filled, owner confirms
POST /api/crm/rental-analysis
        ├──→ creates owner Lead (leadType=owner) with subjectProperty + rentAnalysisStatus="requested"
        └──→ forwards to hdpm-chatbot: POST /api/intake/rental-analysis-request (Bearer HDPM_SERVICE_TOKEN)
                  ↓
        hdpm-chatbot inserts a draft rent_analyses row (status="requested")
                  ↓
        Operator opens it in the Comps dashboard, runs the analysis, reviews
                  ↓
        Operator delivers (PDF + email)
                  ↓
POST /api/crm/rental-analysis/status  (chatbot → web, Bearer HDPM_SERVICE_TOKEN)
        ↓
Lead's rentAnalysisStatus and rentAnalysisShortUrl update in the CRM
```

Address-lookup data shape is intentionally identical to `hdpm-chatbot/lib/address-lookup.ts` so the `SubjectProperty` passed across services maps 1:1 to the analysis engine input.

---

## Blog Automation (Claude)

The blog agent (`src/lib/blog-agent/`) runs **twice weekly** (Tue & Fri, 15:00 UTC crons) and is **draft-first — it never auto-publishes**. Each run:

1. **Researches** trending topics (Reddit OAuth across r/Bend, r/CentralOregon, r/RealEstate + Tavily web search).
2. **Drafts** a full post with Claude (`@anthropic-ai/sdk`), converts to Lexical, creates a `draft` in the Posts collection.
3. **Attaches** a license-safe featured image (Wikimedia).
4. **Emails** `info@` a digest with the draft link plus Facebook/Instagram captions and a short-video hook (for social repurposing).

Editorial rule enforced in the agent: **no tenant-grievance/conflict content** — tenant-facing posts must stay constructive/service-oriented.

The same pipeline is runnable on demand from `/admin/automations` (**Run Blog Agent**) and via `POST /api/automations/blog-agent`. Legacy endpoints `blog-research` / `generate-blog` remain for the older two-step flow. Seed scripts produced the initial post corpus.

---

## SEO Automation (Claude + Google Search Console)

A self-improving SEO agent (`src/lib/seo-agent/`, `GET /api/cron/seo-agent`) runs **weekly** (Mon 14:00 UTC):

1. **Measures** past experiments — for suggestions applied ~4 weeks ago, pulls before/after 28-day metrics from **Google Search Console** and records an outcome (improved / no change / worse).
2. **Picks opportunities** from GSC query/page performance.
3. **Generates** SEO title/description (and advisory content) suggestions with Claude, stored as **pending** `seo-suggestions`.
4. **Emails** a digest.

**Human-in-the-loop apply:** an admin sets a suggestion's status to *Applied* (individually, or **Apply All Pending** on `/admin/automations`). A `beforeChange` hook writes the value onto the target page **in the same transaction**; the target collection's revalidate hook (`src/lib/revalidate.ts`, wired on `pages`/`posts`/`market-areas`) then busts the affected path so the change is live immediately. A **"Needs review"** banner on the `seo-suggestions` list shows the pending count and one-click filters to it.

Requires `GSC_CLIENT_EMAIL` / `GSC_PRIVATE_KEY` / `GSC_SITE_URL` (a GCP service account added as a user on the Search Console property). If unset, the agent cleanly no-ops.

On-page SEO (per-page metadata + canonicals via `src/lib/seo.ts`, dynamic `sitemap.ts` / `robots.ts`, and JSON-LD from `src/lib/schema.ts`) is independent of the agent and always on.

---

## Google Reviews Sync

`GET /api/sync-reviews` (or `scripts/sync-google-reviews.ts`) pulls reviews from the **Google Places API (New)** for `GOOGLE_PLACE_ID`, filters to 5-star, and upserts them into the Testimonials collection. The Testimonials block on the public site renders these dynamically.

---

## Cron Jobs

Configured in `vercel.json`:

| Schedule            | Endpoint                   | Description                                         |
| ------------------- | -------------------------- | --------------------------------------------------- |
| Every 15 min        | `/api/cron/sync-listings`  | Sync AppFolio listings to Supabase                  |
| Hourly (`:00`)      | `/api/crm/cron`            | Mark overdue tasks, run CRM automation rules        |
| Mon 14:00 UTC       | `/api/cron/seo-agent`      | Weekly SEO agent (GSC measure → suggest)            |
| Tue & Fri 15:00 UTC | `/api/cron/blog-agent`     | Twice-weekly blog agent (research → draft → digest) |

All cron endpoints require `Authorization: Bearer $CRON_SECRET` and have a 5-minute Vercel max duration.

---

## Supabase (Shared Database)

Both hdpm-web and hdpm-chatbot share a single Supabase PostgreSQL instance but use **separate schemas** to avoid conflicts:

| Schema         | Used By       | Contains                                          |
| -------------- | ------------- | ------------------------------------------------- |
| `public`       | hdpm-chatbot  | conversations, messages, knowledge_chunks, work_orders, invoices, rent_analyses |
| `payload_web`  | hdpm-web      | All Payload CMS + CRM tables (users, posts, pages, media, leads, lead_*, automation_rules, etc.) |
| `public`       | hdpm-web      | `web_listings` (AppFolio listing cache)            |

The `payload_web` schema is set in `payload.config.ts`:
```ts
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL || '',
    max: 5,
  },
  schemaName: 'payload_web',
})
```

`DATABASE_URL` typically points to the Supabase **transaction pooler** in production for Vercel serverless compatibility.

---

## Authentication

### Public Website
The public-facing site requires **no authentication**. All pages, listings, and contact forms are publicly accessible.

### Payload Admin (`/admin`)
Protected by Payload's built-in auth system (Users collection). Roles:
- **Admin** — full access
- **Editor** — content management + CRM
- **Viewer** — read-only
- **API** — programmatic access

CRM and automation API routes use `requireAuth({ roles: [...] })` from `src/lib/api-auth.ts` for role-gated access.

### Microsoft 365 (Entra ID) SSO — live
Admins sign in with their `@highdesertpm.com` Microsoft 365 account via **`payload-oauth2`** (native OIDC), configured in `src/lib/microsoft-sso.ts` and registered in `payload.config.ts`:
- Reuses hdpm-chat's single-tenant Entra app registration (same `AZURE_AD_CLIENT_ID` / `AZURE_AD_TENANT_ID`; hdpm-web has its own client secret).
- The plugin runs the OIDC code flow (PKCE), enforces the `@highdesertpm.com` domain gate, then **find-or-creates a normal Payload user by email** and mints the standard Payload session — so `payload.auth()` / `requireAuth` / the admin keep working unchanged and the integer `users.id` is preserved. The only schema delta is one added `sub` column (migration `20260827_120000_add_users_sub_for_sso`).
- First-time SSO users are auto-provisioned as **`viewer`** (identity ≠ authorization; an admin promotes). Existing users keep their id + role.
- **Break-glass:** email + password login stays enabled (`disableLocalStrategy` is not set), so a broken OIDC config can't lock everyone out.
- Endpoints: `/api/users/oauth/authorize` and `/api/users/oauth/callback`. The Azure redirect URI is `https://www.highdesertpm.com/api/users/oauth/callback`.
- SSO is **prod-only** for v1 (previews point at the prod DB but the redirect URI is not registered for `*.vercel.app`).

> ⚠️ The Entra **client secret** expires — rotate `AZURE_AD_CLIENT_SECRET` in Azure + Vercel before it lapses.

---

## How HDPM Projects Fit Together

The HDPM platform consists of three applications that share infrastructure but run independently:

### hdpm-web (this repo)
**Purpose**: Public-facing website + CRM for prospects, tenants, and property owners.
- Displays available rental listings (synced from AppFolio)
- Hosts blog content, market area pages, team info, CMS-managed pages
- Collects leads via contact forms and external intake
- Runs the lead pipeline: dedupe → assignment → automation → AppFolio handoff
- Managed through Payload CMS admin panel with custom CRM, inbox, reporting, and automation views

### hdpm-chatbot
**Purpose**: Internal tools for the HDPM operations team.
- **Knowledge Assistant**: RAG-powered chatbot for Oregon landlord-tenant law (ORS Chapter 90), using pgvector hybrid search and Claude Sonnet 4
- **Rent Comparison Toolkit**: Market analysis integrating AppFolio, Zillow, Rentometer, and HUD Fair Market Rent data
- **Maintenance & Invoicing**: Work order management and invoice generation for HDMS (High Desert Maintenance Services)
- **Auth**: Azure AD SSO restricted to `@highdesertpm.com`

### hdpm-dashboard (planned)
**Purpose**: Executive reporting and analytics dashboard.

### What They Share
| Resource              | hdpm-web                  | hdpm-chatbot                  |
| --------------------- | ------------------------- | ----------------------------- |
| Supabase Postgres     | `payload_web` schema + `web_listings` | `public` schema tables |
| Supabase Storage      | `media` bucket            | —                             |
| Azure AD Tenant       | Active (M365 SSO via `payload-oauth2`) | Active (NextAuth SSO) |
| AppFolio API          | Listings sync + lead handoff | Work orders, vendors, properties |
| Vercel Hosting        | Yes                       | Yes                           |

### Data Flow Between Projects
```
AppFolio (source of truth)
    │
    ├──→ hdpm-web:    Syncs available listings every 15 min → web_listings table
    │                 Serves to public website visitors
    │                 Pushes qualified leads back to AppFolio (CRM handoff)
    │
    ├──→ hdpm-chatbot: Syncs work orders, vendors, properties
    │                  Used for maintenance management + rent analysis
    │
    └──→ hdpm-dashboard (planned): Analytics + reporting
```

The projects do **not** directly call each other's APIs. They communicate indirectly through the shared Supabase database and AppFolio as the source of truth.

---

## Environment Variables

### Core

| Variable | Description | Shared With |
| -------- | ----------- | ----------- |
| `DATABASE_URL` | Supabase Postgres connection string (transaction pooler recommended for Vercel) | hdpm-chatbot |
| `PAYLOAD_SECRET` | Payload CMS encryption secret (min 32 chars) | — |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://highdesertpm.com`) | — |
| `NEXTAUTH_URL` | Same as site URL (reserved for future SSO) | hdpm-chatbot |
| `NEXTAUTH_SECRET` | JWT signing secret | hdpm-chatbot |
| `REVALIDATION_SECRET` | ISR revalidation token | — |
| `CRON_SECRET` | Protects `/api/cron/*` and `/api/crm/cron` | — |

### Supabase

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access, server-side only — also gates the storage plugin) |

### AppFolio

| Variable | Description |
| -------- | ----------- |
| `APPFOLIO_API_BASE_URL` | AppFolio partner API base URL |
| `APPFOLIO_CLIENT_ID` | AppFolio API client ID |
| `APPFOLIO_CLIENT_SECRET` | AppFolio API client secret |
| `APPFOLIO_DEVELOPER_ID` | AppFolio developer ID |

### AI + Reviews

| Variable | Description |
| -------- | ----------- |
| `CLAUDE_API_KEY` (a.k.a. `ANTHROPIC_API_KEY`) | Anthropic API key for the blog + SEO agents |
| `TAVILY_API_KEY` | Web search for blog-agent research |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Reddit OAuth for blog-agent topic research |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) — used for review sync **and** the owner rental-analysis address lookup |
| `GOOGLE_PLACE_ID` | Place ID for HDPM Google Business listing |
| `RENTCAST_API_KEY` | Optional — RentCast property record enrichment for the owner rental-analysis form |

### SEO agent (Google Search Console)

| Variable | Description |
| -------- | ----------- |
| `GSC_CLIENT_EMAIL` | GCP service-account email (added as a user on the Search Console property) |
| `GSC_PRIVATE_KEY` | Service-account private key (JWT signing) |
| `GSC_SITE_URL` | Search Console property, e.g. `https://www.highdesertpm.com/` |

### Service-to-service (hdpm-chatbot)

| Variable | Description |
| -------- | ----------- |
| `HDPM_CHATBOT_BASE_URL` | Base URL of hdpm-chatbot (e.g. `https://chatbot.highdesertpm.com`) |
| `HDPM_SERVICE_TOKEN` | Shared bearer token; must match the value set on hdpm-chatbot |

### Email / Misc

| Variable | Description |
| -------- | ----------- |
| `RESEND_API_KEY` | Resend transactional email (lead notifications) |

### Microsoft 365 SSO (Entra ID) — active

Reuses hdpm-chat's single-tenant app registration; hdpm-web has its own client secret. Values are `.trim()`-ed on read (Vercel trailing-`\n` guard).

| Variable | Description |
| -------- | ----------- |
| `AZURE_AD_CLIENT_ID` | Azure app registration client ID (shared with hdpm-chat) |
| `AZURE_AD_CLIENT_SECRET` | hdpm-web's own client secret (**rotate before expiry**) |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID |

---

## Local Development

### Prerequisites
- Node.js 20+
- Access to the shared Supabase project
- AppFolio API credentials

### Setup

```bash
# Clone the repo
git clone https://github.com/bramscher/hdpm-web.git
cd hdpm-web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env   # or get .env from team

# Generate Payload types
npm run generate:types

# Start dev server
npm run dev
```

The app runs at `http://localhost:3000` with:
- Public site at `/`
- Payload admin at `/admin`
- CRM dashboard at `/admin/crm`
- API at `/api/*`

### Creating the First Admin User
On first run, navigate to `/admin` and Payload will prompt you to create an initial admin user.

### Database Migrations
Payload migrations live in `src/migrations/`. Run via:

```bash
npm run payload migrate
```

---

## Deployment (Vercel)

### Setup
1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.production` (with production values)
3. Deploy — Vercel auto-detects Next.js (also enforced via `vercel.json`)

### Key Configuration
- **Framework**: Next.js (set explicitly in `vercel.json`)
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Node.js Version**: 20.x
- **Cron Jobs**: Defined in `vercel.json` — requires Vercel Pro plan for sub-day intervals

### Required Vercel Environment Variables
All variables listed in [Environment Variables](#environment-variables) must be set in Vercel project settings. Critical ones that will cause build failures if missing:
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for media uploads in production)

### Auto-Deploy
Pushes to `main` trigger automatic production deployments. PRs create preview deployments.

---

## Scripts

### Package scripts (`npm run …`)

| Script              | Command                  | Description                        |
| ------------------- | ------------------------ | ---------------------------------- |
| `dev`               | `next dev`               | Start dev server on port 3000      |
| `build`             | `next build`             | Production build                   |
| `start`             | `next start`             | Start production server            |
| `lint`              | `next lint`              | Run ESLint                         |
| `payload`           | `payload` (via cross-env) | Payload CLI (migrations, etc.)   |
| `generate:types`    | `payload generate:types` | Regenerate TypeScript types from Payload schema |
| `seed:blog`         | `tsx scripts/seed-blog.ts` | Seed initial blog posts          |
| `seed:blog-ai`      | `tsx scripts/seed-blog-ai.ts` | Seed AI/tech-themed blog posts |

### `scripts/` directory (run with `npx tsx scripts/<file>.ts`)

| Script | Purpose |
| ------ | ------- |
| `seed-team.ts`, `update-team.ts`, `import-team-photos.ts` | Seed/update team members + headshots |
| `seed-market-areas.ts` | Seed Central Oregon market areas |
| `seed-pages.ts` | Seed CMS pages |
| `seed-blog.ts`, `seed-blog-ai.ts`, `humanize-blogs.ts`, `redate-blogs.ts` | Blog content seeding + post-processing |
| `fix-blog-images.ts`, `fix-single-image.ts`, `upload-missing-media.ts`, `regenerate-thumbnails.ts` | Media maintenance |
| `migrate-media-to-supabase.ts` | One-time migration from S3 to Supabase Storage |
| `migrate-seo-plugin.ts`, `migrate-testimonials.ts`, `migrate-web-listings.mjs` | Data migrations |
| `sync-google-reviews.ts` | Manual Google reviews pull |

---

## Design System

| Token          | Value       | Usage             |
| -------------- | ----------- | ----------------- |
| Primary        | `#1a1a1a`   | Text, dark backgrounds |
| Accent         | `#2ECC52`   | Buttons, links, CTAs |
| Neutral Light  | `#F5F5F5`   | Backgrounds       |
| Neutral Mid    | `#6B7280`   | Secondary text    |
| Heading Font   | Plus Jakarta Sans | Headings     |
| Body Font      | Inter       | Body text         |
