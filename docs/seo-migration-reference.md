# HDPM SEO Migration Reference

> Snapshot of highdesertpm.com (old AppFolio/DudaOne site) taken 2026-04-05.
> Use this to ensure the new Next.js site preserves all existing SEO equity and improves on gaps.

---

## 1. Existing Site Structure (URL Map)

| Old URL | New URL | Status | Notes |
|---------|---------|--------|-------|
| `/` | `/` | Exists | Rebuild with same keyword targets |
| `/services` | `/services` | Exists | Needs dedicated page (currently no /services route) |
| `/bend-property-management` | `/market-areas/bend` | Exists | Add 301 redirect from old path |
| `/sisters-property-management` | `/market-areas/sisters` | Exists | Add 301 redirect from old path |
| `https://www.highdesertpm.com` (Redmond) | `/market-areas/redmond` | Exists | Old site used root domain as Redmond page |
| `/owners` | `/owners` | Exists | Old site was portal-only; new site has full content — improvement |
| `/availability` | `/listings` | Exists | Add 301 redirect from `/availability` |
| `/residents` | `/tenants` | Exists | Add 301 redirect from `/residents` |
| `/about-us` | `/about` | Exists | Add 301 redirect from `/about-us` |
| `/blog` | `/blog` | Exists | ✓ |
| `/contact` | `/contact` | Exists | ✓ |
| `/free-property-management-consultation` | `/owners#get-started` or new page | **MISSING** | High-value lead gen page — needs equivalent |
| `/privacy-policy` | `/privacy` | Exists | Add 301 redirect from `/privacy-policy` |
| `/cookie-policy` | — | **MISSING** | Consider adding or merging into privacy |
| `/accessibility` | — | **MISSING** | Footer links to it but page doesn't exist |
| `/sitemap` | `/sitemap.xml` | Exists (auto) | Next.js generates XML automatically now |
| `/real-estate-investing-redmond` | `/blog/[slug]` | Check | Migrate old blog slugs or redirect |
| `/buying-investment-property-redmond` | `/blog/[slug]` | Check | Migrate old blog slugs or redirect |

### Required 301 Redirects (add to `next.config.ts`)

```
/bend-property-management      → /market-areas/bend
/sisters-property-management   → /market-areas/sisters
/availability                  → /listings
/residents                     → /tenants
/about-us                      → /about
/privacy-policy                → /privacy
/free-property-management-consultation → /contact (or dedicated page)
```

---

## 2. Page Titles (Old vs New)

| Page | Old Title | New Title | Action |
|------|-----------|-----------|--------|
| Home | "High Desert Property Management - Central Oregon" | "Central Oregon Property Management \| High Desert Property Management" | ✓ Equivalent |
| Services | "Services \| High Desert Property Management" | — | **CREATE PAGE** with this title pattern |
| Bend | "Property Management Bend, OR - #1 Rental Company" | "Bend Property Management \| High Desert Property Management" | Consider matching "#1 Rental Company" claim or improving |
| Sisters | "Property Management Sisters, OR - #1 Rental Company" | "Sisters Property Management \| High Desert Property Management" | Same as above |
| Owners | "Owner Portal - Access Account Online \| High Desert PM" | "Property Management for Owners \| High Desert Property Management" | New title is better (more service-oriented) |
| Residents | "Residents – Pay Rent Online \| Hight Desert PM" | "Tenant Resources \| High Desert Property Management" | Note old title had typo "Hight" |
| About | "Trust Professionals at High Desert Property Management" | "About Us \| High Desert Property Management" | ✓ |
| Contact | "High Desert Property Management - Central Oregon" | "Contact Us \| High Desert Property Management" | New is better (unique title) |
| Blog | "Blog" | "Blog \| High Desert Property Management" | New is better (branded) |
| Consultation | "Free Property Management Consultation" | — | **NEEDS EQUIVALENT** |

---

## 3. Target Keywords by Page

### Homepage
**Primary:** property management Central Oregon, Central Oregon property management
**Secondary:** Bend property management, Redmond property management, rental management Oregon
**Long-tail:** professional property management Bend Redmond Sisters, rental property management Central Oregon
**Service terms on old homepage:** property marketing, tenant screening, lease administration, rent collection, financial reporting, property inspections, maintenance & repairs, eviction support

### Services Page (NEEDS CREATION)
**Primary:** property management services Central Oregon, Redmond property management services
**Service keywords (from old site):**
- Property marketing / rental listing
- Tenant screening / background checks
- Lease administration
- Rent collection / online rent payment
- Financial reporting / monthly owner statements / year-end tax statements
- Property inspections / routine inspections
- Maintenance coordination / emergency maintenance / 24/7 maintenance
- Eviction support / eviction process
- No markup on vendor invoices (unique selling point)
- Licensed & insured vendors

### Market Area Pages
**Bend:** Bend property management, Bend OR rental company, Bend rental property management, Deschutes River, Cascade Mountains, Downtown Bend, Old Mill District
**Sisters:** Sisters property management, Sisters OR rental company, Sisters rental property, Cascade Mountains, limited housing inventory
**Redmond:** Redmond property management, Redmond real estate, investment property Redmond, Redmond OR rentals
**Prineville:** (no old page — new content is net-new SEO opportunity)
**La Pine:** (no old page — new content is net-new SEO opportunity)
**Madras:** (no old page — new content is net-new SEO opportunity)

### Owners Page
**Keywords:** owner portal, property owner services, financial statements, online payments, property management for owners, investment property management, rental analysis, free consultation
**Features to highlight:** eCheck/debit card payments, monthly summaries, year-end tax statements, built-in messaging, mobile-friendly portal

### Tenants/Residents Page
**Keywords:** pay rent online, tenant portal, maintenance request, renters insurance, online portal app, submit maintenance request, resident portal
**Features:** online rent payment, automatic payments, maintenance requests, communication tools, renters insurance, mobile app (iOS/Android)

### About Page
**Keywords:** Central Oregon property management company, professional property management, ethical service, long-term partnerships
**History claims:** Founded 1999; the "High Desert Property Management" brand was acquired in 2015. (Founding year corrected to 1999 on 2026-08-19 per Craig, superseding the old site's "since 2011.")
**Team members listed on old site:** Cheryl Waterman (Maintenance Coordinator), Jennifer Bertran (Property Manager), Bianca Nyseth (Office Support), Mathew Free (Property Manager), Penny Free (Property Manager), Craig Bramscher (President)

### Contact Page
**Keywords:** contact property management, Central Oregon property manager, Redmond OR property management office
**Form fields (old):** Name, Phone, Email, Message
**Form fields (new):** Already has name, email, phone, message, property interest — improvement

### Blog
**Existing posts (old site, by Craig Bramscher):**
1. "Reasons to Invest in Redmond Real Estate" (2026-03-30) — slug: `/real-estate-investing-redmond`
2. "Top Tips When Buying Investment Property in Redmond" (2026-02-26) — slug: `/buying-investment-property-redmond`
**Blog keywords:** Redmond real estate, investment property, rental real estate, real estate investing

### Free Consultation Page
**Keywords:** free property management consultation, free rental analysis, complimentary consultation, rental property consultation
**Form fields:** Full Name, Email, Phone, Property Address
**This is a high-conversion landing page — needs an equivalent on the new site**

---

## 4. Structured Data Comparison

### Old Site
```json
{ "@type": "WebSite", "name": "High Desert Property Management", "url": "https://www.highdesertpm.com/" }
```
- No LocalBusiness schema
- No breadcrumbs
- No FAQ schema
- No RealEstateListing schema

### New Site (already implemented — improvements)
- ✅ LocalBusiness schema with address, geo, areaServed, openingHours
- ✅ BreadcrumbList schema on all subpages
- ✅ RealEstateListing schema on individual listings
- **ADD:** FAQ schema on tenants page (has FAQ accordion)
- **ADD:** Service schema on services page (when created)
- **ADD:** WebSite + SearchAction schema on homepage

---

## 5. Content Gaps in New Site

### Missing Pages
1. **`/services`** — Old site has a dedicated services page. New site has services on /owners but no standalone /services route. This is a key SEO page.
2. **`/free-property-management-consultation`** — Dedicated lead gen landing page with its own form. High conversion value. Consider creating or ensuring /contact captures this traffic.
3. **`/accessibility`** — Footer links to it. Page doesn't exist.
4. **`/cookie-policy`** — Old site has it. Low priority but good for compliance.

### Missing Content on Existing Pages
5. **Testimonials widget** — Old site uses Endorsio review carousel. New site has hardcoded testimonials. Consider integrating Google Reviews or a review widget.
6. **Portal links (AppFolio)** — Old site prominently links to tenant/owner portals (Log In / Sign Up). New site's /tenants and /owners pages should include these.
7. **Maintenance request link** — Old site links to `https://app.propertymeld.com/tenant/high-desert-property-management`. Ensure this is on the new /tenants page.
8. **Mobile app download links** — Old residents page links to iOS/Android AppFolio portal apps.
9. **"No markup on vendor invoices"** — Unique selling point on old services page. Should be on new site.
10. **Community memberships** — Old footer shows: Redmond Economic Development Inc., Redmond Oregon Rotary, Central Oregon Rental Owners Association, Equal Housing Opportunity. Consider adding to new footer or about page.

### Missing City Pages
The old site only has Bend and Sisters city pages. The new site already has pages for all 6 cities (Bend, Redmond, Sisters, Prineville, La Pine, Madras) — this is a significant SEO improvement. Old site listed Culver as a served area but the new site does not include Culver.

---

## 6. Contact & NAP Consistency

**NAP (Name, Address, Phone) — must be identical everywhere:**

| Field | Value |
|-------|-------|
| Name | High Desert Property Management |
| Address | 1515 SW Reindeer Ave, Redmond, OR 97756 |
| Phone | (541) 548-0383 |
| Email | info@highdesertpm.com |
| Hours | Monday–Friday 9:00 AM – 5:00 PM |

**Note:** Old site says hours are 9:00 AM – 4:00 PM. New site says 9:00 AM – 5:00 PM. Verify which is correct and make consistent across: header, footer, contact page, JSON-LD schema, and Google Business Profile.

**Old site also mentions:** "AI Agents available 24/7 365 for your Leasing and Maintenance Questions" — consider adding this to the new site if still applicable.

---

## 7. External Links & Integrations

| Integration | Old Site | New Site | Action |
|-------------|----------|----------|--------|
| AppFolio listings widget | ✅ Dynamic widget | ✅ API integration | ✓ Better (SSR, SEO-friendly) |
| AppFolio tenant portal | ✅ Login/signup links | ❌ Missing | Add portal links to /tenants |
| AppFolio owner portal | ✅ Login/signup links | ❌ Missing | Add portal links to /owners |
| PropertyMeld maintenance | ✅ Link on every page | ❌ Missing | Add to /tenants and footer |
| Endorsio reviews | ✅ Widget | ❌ Missing | Consider Google Reviews integration |
| Facebook | ✅ `facebook.com/homesforrentoregon` | ❌ Missing | Add to footer/schema sameAs |
| Equal Housing logo | ✅ Footer | ❌ Missing | Add to footer |
| COROA membership | ✅ Footer | ❌ Missing | Consider adding |

---

## 8. Old Site SEO Weaknesses (Opportunities)

These are things the old site does poorly that the new site can capitalize on:

1. **No meta descriptions** on any page — new site has them on every page ✅
2. **Multiple H1 tags** on homepage (2 H1s) — new site has exactly 1 per page ✅
3. **No canonical URLs** — new site has them ✅
4. **No OpenGraph / Twitter cards** — new site has them ✅
5. **Only WebSite schema** (no LocalBusiness, no breadcrumbs) — new site has rich schema ✅
6. **Only 2 blog posts** — new site has seeded content + CMS for ongoing publishing ✅
7. **No Prineville/Madras/La Pine city pages** — new site has all 6 cities ✅
8. **AppFolio widget listings (client-rendered, not SEO-indexable)** — new site has SSR listings ✅
9. **No sitemap.xml** (only HTML sitemap) — new site generates XML sitemap ✅
10. **No robots.txt** — new site has one ✅
11. **Office hours discrepancy** (9–4 vs footer text) — new site is consistent
12. **Typo in page title** ("Hight Desert PM") — new site is clean

---

## 9. Priority Action Items

### Critical (SEO equity at risk)
- [ ] Add 301 redirects in `next.config.ts` for all old URL paths
- [ ] Create `/services` page with dedicated service keyword targeting
- [ ] Create or redirect `/free-property-management-consultation`
- [ ] Verify office hours (4 PM vs 5 PM) and make consistent everywhere
- [ ] Decide on Culver — include as served area or not?

### High (Missing content/features)
- [ ] Add AppFolio portal login/signup links to /owners and /tenants
- [ ] Add PropertyMeld maintenance link to /tenants page
- [ ] Add Facebook social link to footer and schema `sameAs`
- [ ] Add Equal Housing Opportunity badge to footer
- [ ] Add mobile app download links to /tenants
- [ ] Create `/accessibility` page (footer links to it)

### Medium (SEO improvements over old site)
- [ ] Add FAQ schema to /tenants page
- [ ] Add "no markup on vendor invoices" selling point to services/owners
- [ ] Add community membership logos (REDI, Rotary, COROA) to about or footer
- [ ] Ensure old blog post slugs redirect (`/real-estate-investing-redmond`, `/buying-investment-property-redmond`)
- [ ] Add WebSite + SearchAction schema to homepage
- [ ] Add "24/7 AI agents" messaging if still applicable

### Low
- [ ] Create `/cookie-policy` page or merge into privacy
- [ ] Match old contact form simplicity (old had 4 fields, new has more — fine, but test conversion)
