# HDPM-Web

Public-facing website and content management system for **High Desert Property Management**, built with Next.js 15 and Payload CMS 3. Part of the HDPM platform alongside [hdpm-chatbot](https://github.com/bramscher/hdpm-chatbot) (internal tools) and hdpm-dashboard (planned).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Payload CMS Collections](#payload-cms-collections)
- [Frontend Routes](#frontend-routes)
- [API Routes](#api-routes)
- [AppFolio Integration](#appfolio-integration)
- [Cron Jobs](#cron-jobs)
- [Supabase (Shared Database)](#supabase-shared-database)
- [Authentication](#authentication)
- [How HDPM Projects Fit Together](#how-hdpm-projects-fit-together)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment (Vercel)](#deployment-vercel)
- [Scripts](#scripts)

---

## Architecture Overview

```
                         ┌──────────────────────────────────┐
                         │         Supabase Postgres         │
                         │  ┌────────────┐ ┌──────────────┐ │
                         │  │   public    │ │  payload_web │ │
                         │  │  schema     │ │   schema     │ │
                         │  │ (chatbot +  │ │  (CMS tables │ │
                         │  │  shared)    │ │  + listings) │ │
                         │  └─────┬──────┘ └──────┬───────┘ │
                         └────────┼───────────────┼─────────┘
                                  │               │
                   ┌──────────────┘               └──────────────┐
                   │                                             │
          ┌────────┴─────────┐                        ┌──────────┴────────┐
          │   hdpm-chatbot   │                        │     hdpm-web      │
          │  (Internal Tools)│                        │  (Public Website) │
          │                  │                        │                   │
          │ - Knowledge Chat │                        │ - Listings        │
          │ - Rent Comps     │                        │ - Blog / Pages    │
          │ - Work Orders    │                        │ - Market Areas    │
          │ - Invoicing      │                        │ - Contact / Leads │
          │ - Inspections    │                        │ - Payload Admin   │
          └────────┬─────────┘                        └──────────┬────────┘
                   │                                             │
                   └──────────────┐               ┌──────────────┘
                                  │               │
                         ┌────────┴───────────────┴─────────┐
                         │          Shared Services          │
                         │                                   │
                         │  - Azure AD (Entra ID) SSO        │
                         │  - AppFolio v0 Database API       │
                         │  - Vercel Hosting                 │
                         └───────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | Next.js 15.4.11 (App Router)                    |
| CMS            | Payload CMS 3.80 (embedded in Next.js)          |
| Database       | PostgreSQL via Supabase (schema: `payload_web`) |
| Rich Text      | Lexical Editor (@payloadcms/richtext-lexical)   |
| Styling        | Tailwind CSS 4.2                                |
| Fonts          | Plus Jakarta Sans (headings), Inter (body)       |
| Image CDN      | Next.js Image + AppFolio CDN                    |
| SEO            | @payloadcms/plugin-seo + JSON-LD structured data|
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
│   │       │   ├── route.ts      # GET /api/listings
│   │       │   └── [id]/route.ts # GET /api/listings/:id
│   │       └── cron/
│   │           └── sync-listings/# Cron: AppFolio -> Supabase sync
│   ├── collections/              # Payload CMS collection configs
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Posts.ts
│   │   ├── Pages.ts
│   │   ├── Categories.ts
│   │   ├── MarketAreas.ts
│   │   ├── Testimonials.ts
│   │   ├── TeamMembers.ts
│   │   └── Leads.ts
│   ├── blocks/                   # Payload block definitions
│   │   ├── hero.ts
│   │   ├── content.ts
│   │   └── cta.ts
│   ├── lib/
│   │   ├── appfolio.ts           # AppFolio API client + scraper
│   │   ├── supabase.ts           # Supabase admin client
│   │   ├── market-areas.ts       # Hardcoded market area data
│   │   └── metadata.ts           # SEO/meta tag utilities
│   ├── payload.config.ts         # Payload CMS configuration
│   └── payload-types.ts          # Auto-generated TypeScript types
├── public/                       # Static assets
├── vercel.json                   # Vercel cron configuration
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind theme
├── tsconfig.json
└── package.json
```

---

## Payload CMS Collections

### Users
- **Auth enabled** — provides login to `/admin`
- Roles: `admin`, `editor`, `viewer`, `api`

### Media
- Image uploads with auto-generated sizes:
  - `thumbnail`: 400x300
  - `card`: 768x512
  - `hero`: 1920x1080

### Posts (Blog)
- Title, slug, status (draft/published), author, featured image
- Category relationships, tags array
- Lexical rich text body
- SEO fields via plugin

### Pages
- Dynamic block-based layout system
- Block types: **Hero**, **Content** (rich text), **CTA**
- Supports arbitrary page creation from the admin panel

### Categories
- Simple name + slug taxonomy for blog posts

### Market Areas
- One entry per service area (Bend, Redmond, Sisters, Prineville, La Pine, Madras)
- Hero text/image, rich text description, SEO fields

### Testimonials
- Author, company, text, rating (1-5), approved flag

### Team Members
- Name, title, bio, photo, display order

### Leads
- Auto-created from contact form submissions
- **Public access**: allows unauthenticated create
- Fields: name, email, phone, message, property interest, source

---

## Frontend Routes

| Route                    | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `/`                      | Home — hero, services, featured listings, CTAs |
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

### `GET /api/listings`
Returns all cached listings from Supabase. Supports `?city=` filter.
- Cache: 15-minute ISR + 30-minute stale-while-revalidate
- Falls back to live AppFolio API if cache is empty

### `GET /api/listings/[id]`
Returns a single listing by AppFolio ID with detail page photos.

### `GET /api/cron/sync-listings`
Protected by `Authorization: Bearer $CRON_SECRET`. Called by Vercel Cron every 15 minutes.
1. Fetches properties + units from AppFolio v0 API
2. Scrapes public listing page for CDN photo URLs and detail page IDs
3. Fetches detail page photos per listing
4. Upserts to Supabase `web_listings` table
5. Removes delisted properties

### `GET/POST /api/[...slug]`
Auto-generated Payload REST API for all collections.

### `POST /api/graphql`
Payload GraphQL endpoint.

---

## AppFolio Integration

The AppFolio integration is the backbone of the listings system. It combines two data sources:

### v0 Database API
- **Endpoints**: `/properties` and `/units` (paginated, 1000/page)
- **Auth**: Basic auth (client_id:client_secret) + `X-AppFolio-Developer-ID` header
- **Retry logic**: Handles 533 (data unavailable) and 429 (rate limit) with 3s backoff

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

---

## Cron Jobs

Configured in `vercel.json`:

| Schedule        | Endpoint                   | Description                          |
| --------------- | -------------------------- | ------------------------------------ |
| Every 15 min    | `/api/cron/sync-listings`  | Sync AppFolio listings to Supabase   |

The cron job is protected by `CRON_SECRET` and has a 5-minute max duration on Vercel.

---

## Supabase (Shared Database)

Both hdpm-web and hdpm-chatbot share a single Supabase PostgreSQL instance but use **separate schemas** to avoid conflicts:

| Schema         | Used By       | Contains                                          |
| -------------- | ------------- | ------------------------------------------------- |
| `public`       | hdpm-chatbot  | conversations, messages, knowledge_chunks, work_orders, invoices, rent_analyses |
| `payload_web`  | hdpm-web      | All Payload CMS tables (users, posts, pages, media, etc.) |
| `public`       | hdpm-web      | `web_listings` (AppFolio listing cache)            |

The `payload_web` schema is set in `payload.config.ts`:
```ts
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL || '' },
  schemaName: 'payload_web',
})
```

---

## Authentication

### Public Website
The public-facing site requires **no authentication**. All pages and listings are publicly accessible.

### Payload Admin (`/admin`)
Protected by Payload's built-in auth system (Users collection). Roles:
- **Admin** — full access
- **Editor** — content management
- **Viewer** — read-only
- **API** — programmatic access

### Azure AD (Shared with hdpm-chatbot)
Both projects share the same Azure AD (Entra ID) tenant for internal team authentication:
- **Tenant**: High Desert Property Management
- **Allowed domain**: `@highdesertpm.com`
- Used by hdpm-chatbot for team login; available to hdpm-web if internal auth is added later

---

## How HDPM Projects Fit Together

The HDPM platform consists of three applications that share infrastructure but run independently:

### hdpm-web (this repo)
**Purpose**: Public-facing website for prospects, tenants, and property owners.
- Displays available rental listings (synced from AppFolio)
- Hosts blog content, market area pages, team info
- Collects leads via contact forms
- Managed through Payload CMS admin panel

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
| Azure AD Tenant       | Available (Payload auth used now) | Active (NextAuth SSO)  |
| AppFolio API          | Listings sync (properties + units) | Work orders, vendors, properties |
| Vercel Hosting        | Yes                       | Yes                           |
| NextAuth Secret       | Shared (for future SSO)   | Active                        |

### Data Flow Between Projects
```
AppFolio (source of truth)
    │
    ├──→ hdpm-web:    Syncs available listings every 15 min → web_listings table
    │                 Serves to public website visitors
    │
    ├──→ hdpm-chatbot: Syncs work orders, vendors, properties
    │                  Used for maintenance management + rent analysis
    │
    └──→ hdpm-dashboard (planned): Analytics + reporting
```

The projects do **not** directly call each other's APIs. They communicate indirectly through the shared Supabase database and AppFolio as the source of truth.

---

## Environment Variables

### Required for Production

| Variable | Description | Shared With |
| -------- | ----------- | ----------- |
| `DATABASE_URL` | Supabase Postgres connection string (session mode, port 5432) | hdpm-chatbot |
| `PAYLOAD_SECRET` | Payload CMS encryption secret (min 32 chars) | — |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://highdesertpm.com`) | — |
| `NEXTAUTH_URL` | Same as site URL | hdpm-chatbot |
| `NEXTAUTH_SECRET` | JWT signing secret | hdpm-chatbot |
| `REVALIDATION_SECRET` | ISR revalidation token | — |
| `CRON_SECRET` | Protects `/api/cron/*` endpoints | — |

### Supabase

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access, server-side only) |

### Azure AD

| Variable | Description |
| -------- | ----------- |
| `AZURE_AD_CLIENT_ID` | Azure app registration client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure app registration secret |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID |

### AppFolio

| Variable | Description |
| -------- | ----------- |
| `APPFOLIO_API_BASE_URL` | AppFolio partner API base URL |
| `APPFOLIO_CLIENT_ID` | AppFolio API client ID |
| `APPFOLIO_CLIENT_SECRET` | AppFolio API client secret |
| `APPFOLIO_DEVELOPER_ID` | AppFolio developer ID |

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
- API at `/api/*`

### Creating the First Admin User
On first run, navigate to `/admin` and Payload will prompt you to create an initial admin user.

---

## Deployment (Vercel)

### Setup
1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.production` (with production values)
3. Deploy — Vercel auto-detects Next.js

### Key Configuration
- **Framework**: Next.js (auto-detected)
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Node.js Version**: 20.x
- **Cron Jobs**: Defined in `vercel.json`, requires Vercel Pro plan for < 1 day intervals

### Required Vercel Environment Variables
All variables listed in [Environment Variables](#environment-variables) must be set in Vercel project settings. Critical ones that will cause build failures if missing:
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SITE_URL`

### Auto-Deploy
Pushes to `main` trigger automatic production deployments. PRs create preview deployments.

---

## Scripts

| Script              | Command                  | Description                        |
| ------------------- | ------------------------ | ---------------------------------- |
| `npm run dev`       | `next dev`               | Start dev server on port 3000      |
| `npm run build`     | `next build`             | Production build                   |
| `npm run start`     | `next start`             | Start production server            |
| `npm run lint`      | `next lint`              | Run ESLint                         |
| `npm run payload`   | `payload`                | Run Payload CLI (migrations, etc.) |
| `npm run generate:types` | `payload generate:types` | Regenerate TypeScript types from Payload schema |

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
