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
- [Blog Automation (Claude)](#blog-automation-claude)
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
                         │  - Azure AD (Entra ID) SSO        │
                         │  - AppFolio v0 Database API       │
                         │  - Supabase Storage (media)       │
                         │  - Anthropic Claude (blog AI)     │
                         │  - Google Places (reviews)        │
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
| SEO            | @payloadcms/plugin-seo (tabbed UI) + JSON-LD    |
| AI             | @anthropic-ai/sdk (blog research + generation)  |
| Reviews        | Google Places API (New)                         |
| Deployment     | Vercel (auto-deploy from `main`)                |
| Cron           | Vercel Cron (every 15 minutes)                  |
| External APIs  | AppFolio v0 Database API + public page scraping |
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
│   │       ├── automations/      # Blog research + generation + listings sync
│   │       ├── image-search/     # Wikimedia/Unsplash search
│   │       ├── image-import/     # Import external images to Media
│   │       ├── sync-reviews/     # Google Places review sync
│   │       └── cron/
│   │           └── sync-listings/# Cron: AppFolio -> Supabase sync
│   ├── admin/                    # Custom Payload admin views/components
│   │   └── components/
│   │       ├── crm/              # CRM dashboard, inbox, reporting
│   │       ├── AutomationsView   # Blog research + generation UI
│   │       ├── ImageBrowserView  # Media library browser
│   │       └── AdminNav, NavGroupIcons
│   ├── collections/              # Payload CMS collection configs
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Posts.ts
│   │   ├── Pages.ts
│   │   ├── Categories.ts
│   │   ├── MarketAreas.ts
│   │   ├── Testimonials.ts
│   │   ├── TeamMembers.ts
│   │   ├── Leads.ts
│   │   ├── LeadActivities.ts
│   │   ├── LeadTasks.ts
│   │   ├── LeadConversations.ts
│   │   ├── PropertiesInterest.ts
│   │   ├── AutomationRules.ts
│   │   └── hooks/                # Lead hooks (assignment, activity log, etc.)
│   ├── lib/
│   │   ├── appfolio.ts           # AppFolio API client + scraper
│   │   ├── supabase.ts           # Supabase admin client
│   │   ├── supabase-storage-adapter.ts  # Custom Payload storage adapter
│   │   ├── api-auth.ts           # Role-based API auth helper
│   │   ├── listing-utils.ts      # Listing normalization helpers
│   │   ├── page-content.ts       # CMS page rendering helpers
│   │   ├── schema.ts             # JSON-LD / SEO helpers
│   │   ├── seo.ts                # SEO metadata utilities
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

### Admin

**Users** — Auth-enabled. Roles: `admin`, `editor`, `viewer`, `api`.

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

Public intake at `POST /api/crm/leads` normalizes input, dedupes, and either creates a lead or appends activity to an existing one. The contact form on `/contact` uses the same flow via Payload's auto-create on the Leads collection.

---

## Admin Views

Custom React views are mounted at these admin URLs (defined in `payload.config.ts`):

| Path                  | View                              |
| --------------------- | --------------------------------- |
| `/admin/crm`          | CRM dashboard (lead pipeline)     |
| `/admin/crm/inbox`    | Conversations inbox               |
| `/admin/crm/reporting`| Aggregated CRM reports            |
| `/admin/automations`  | Blog research + generation UI     |
| `/admin/image-browser`| Media library browser             |

---

## Frontend Routes

| Route                    | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `/`                      | Home — hero, services, featured listings, CTAs |
| `/[slug]`                | CMS-managed dynamic page (Pages collection)    |
| `/listings`              | All available rentals with filters             |
| `/listings/[id]`         | Listing detail with photo gallery              |
| `/blog`                  | Blog post listing                              |
| `/blog/[slug]`           | Individual blog post                           |
| `/market-areas`          | All service areas                              |
| `/market-areas/[slug]`   | Market area detail (Bend, Redmond, etc.)       |
| `/about`                 | About the company                              |
| `/contact`               | Contact form (creates Leads)                   |
| `/owners`                | Property owner services                        |
| `/tenants`               | Tenant resources + FAQ                         |
| `/admin`                 | Payload CMS admin panel                        |

---

## API Routes

### Listings

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/listings`               | Cached listings from Supabase, `?city=` filter |
| GET    | `/api/listings/[id]`          | Single listing by AppFolio ID with detail photos |
| GET    | `/api/cron/sync-listings`     | Vercel Cron: AppFolio → Supabase sync (Bearer `CRON_SECRET`) |

### CRM

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST   | `/api/crm/leads`              | Public lead intake (dedupe + normalize) |
| GET    | `/api/crm/reports`            | Aggregated CRM metrics (auth: admin/editor/viewer) |
| GET    | `/api/crm/cron`               | Periodic: marks overdue tasks, runs automation rules (Bearer `CRON_SECRET`) |

### Automations

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/api/automations/blog-research` | Reddit-based topic suggestions for blog posts |
| POST   | `/api/automations/generate-blog` | Claude-generated blog post draft → Posts collection |
| GET    | `/api/automations/sync-listings` | On-demand listings sync trigger |

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
- Status is vacant OR has an `AvailableOn` date OR `RentReady=true`

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

## Blog Automation (Claude)

Two endpoints power the **Automations** admin view:

1. `GET /api/automations/blog-research` — pulls trending posts from r/Bend, r/CentralOregon, r/RealEstate and surfaces topic ideas with audience targeting.
2. `POST /api/automations/generate-blog` — uses `@anthropic-ai/sdk` (Claude) to draft a full post, converts to Lexical, and creates a draft in the Posts collection ready for review.

Seed scripts in `scripts/seed-blog.ts` and `scripts/seed-blog-ai.ts` produced the initial 20-post corpus.

---

## Google Reviews Sync

`GET /api/sync-reviews` (or `scripts/sync-google-reviews.ts`) pulls reviews from the **Google Places API (New)** for `GOOGLE_PLACE_ID`, filters to 5-star, and upserts them into the Testimonials collection. The Testimonials block on the public site renders these dynamically.

---

## Cron Jobs

Configured in `vercel.json`:

| Schedule        | Endpoint                   | Description                                         |
| --------------- | -------------------------- | --------------------------------------------------- |
| Every 15 min    | `/api/cron/sync-listings`  | Sync AppFolio listings to Supabase                  |
| Hourly (`:00`)  | `/api/crm/cron`            | Mark overdue tasks, run CRM automation rules        |

Both cron endpoints require `Authorization: Bearer $CRON_SECRET` and have a 5-minute Vercel max duration.

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

### Azure AD (Shared with hdpm-chatbot)
Both projects share the same Azure AD (Entra ID) tenant for internal team authentication:
- **Tenant**: High Desert Property Management
- **Allowed domain**: `@highdesertpm.com`
- Used by hdpm-chatbot for team login; available to hdpm-web if internal SSO is added later

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
| Azure AD Tenant       | Available (Payload auth used now) | Active (NextAuth SSO)  |
| AppFolio API          | Listings sync + lead handoff | Work orders, vendors, properties |
| Vercel Hosting        | Yes                       | Yes                           |
| NextAuth Secret       | Shared (for future SSO)   | Active                        |

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
| `CLAUDE_API_KEY` (a.k.a. `ANTHROPIC_API_KEY`) | Anthropic API key for blog generation |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) key for review sync |
| `GOOGLE_PLACE_ID` | Place ID for HDPM Google Business listing |

### Email / Misc

| Variable | Description |
| -------- | ----------- |
| `RESEND_API_KEY` | Resend transactional email (lead notifications) |

### Azure AD (reserved for future SSO)

| Variable | Description |
| -------- | ----------- |
| `AZURE_AD_CLIENT_ID` | Azure app registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure app registration secret |
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
