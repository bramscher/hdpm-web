# HDPM Owner Growth Capabilities

## Goal

Build the new HDPM site into the strongest owner-acquisition property management site in Central Oregon: higher-converting than the current site, easier to operate than a static brochure site, and structured for SEO plus AEO so search engines and AI answer engines can confidently understand, cite, and recommend HDPM.

Primary conversion:
- A property owner requests a free rental analysis or consultation.

Secondary conversions:
- A property owner calls HDPM.
- A property owner submits the general contact form.
- A property owner reads a market/service page and enters the CRM for follow-up.
- A local search or AI answer surface cites HDPM as a relevant source for Central Oregon property management questions.

## Current Foundation

The project already has a strong technical base:

- Next.js 15 public site with fast static and dynamic routes.
- Payload CMS for pages, blog posts, market areas, media, testimonials, and CRM collections.
- `/owners` page with a 3-step owner rental analysis form.
- Address lookup via `/api/owner-intake/address-lookup`.
- Owner lead creation via `/api/crm/rental-analysis`.
- Service-to-service handoff to `hdpm-chatbot`.
- Callback endpoint at `/api/crm/rental-analysis/status`.
- CRM lead records with owner-specific rental analysis fields.
- AppFolio listing sync and public listing pages.
- Blog automation using Reddit research plus Claude-generated drafts.
- Google reviews sync into testimonials.
- Dynamic sitemap, robots.txt, canonical metadata, Open Graph metadata, LocalBusiness schema, Breadcrumb schema, Article schema, and RealEstateListing schema.
- Market area pages for local SEO.
- Build verification passed with 53 generated routes and 18 cached listings.

## Competitive Signals

The local SERP is already dominated by owner-intent messaging. HDPM must win by combining stronger trust, sharper local content, and a useful owner tool.

- HDPM already appears with a Bend property management page that talks about rental analysis, tenant screening, maintenance, and local expertise.
- LivWell leads with "Get a Free Rent Estimate" and "Curious what your home rents for? Find out in seconds."
- Mt. Bachelor emphasizes market analysis, low vacancy, tenant screening, financial reporting, and a large owner FAQ.
- Deschutes Property Management leans on tenure, local expertise, and inventory size.
- WetDog uses direct owner pain points: protect the investment, find the right tenants, tenant placement, dispute resolution, and investment analysis.

Sources:
- Google Search Central SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google Breadcrumb structured data documentation: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google FAQ/HowTo structured data announcement: https://developers.google.com/search/blog/2019/05/new-in-structured-data-faq-and-how-to
- Bing search and answer result documentation: https://support.microsoft.com/en-us/bing/how-bing-delivers-search-results
- LivWell competitor signal: https://livwelloregon.com/
- Mt. Bachelor competitor signal: https://www.bendpropertymanagement.net/property-management-services
- Deschutes competitor signal: https://www.rentingoregon.com/
- WetDog competitor signal: https://www.wetdogpnw.com/

## Owner Capture Capabilities

### 1. Owner Conversion Hub

Make `/owners` the main conversion page for property owners.

Capabilities:
- Free rental analysis CTA above the fold.
- Sticky desktop/mobile CTA: "Get My Rental Analysis".
- Short trust bar near CTA: years in market, property count, Google rating, local office.
- Clear owner promise: maximize rent, reduce vacancy, protect property, stay compliant.
- Segmented pathways:
  - I own one rental home.
  - I have a portfolio.
  - I am moving out and want to rent my home.
  - I am comparing property managers.
  - I need tenant placement only.
- Mini pricing expectation section with "request quote" instead of fixed rates if pricing varies.
- Owner-specific testimonials separated from tenant reviews.
- Inline phone CTA for high-intent visitors.

### 2. Rental Analysis Tool

Turn the current form into the site's lead magnet.

Capabilities:
- Address lookup with manual fallback.
- Property detail enrichment from address lookup and RentCast-style data.
- "What happens next" timeline after submit.
- Email confirmation to owner and internal notification to team.
- CRM activity record for every submission.
- Lead score based on property type, location, estimated rent, owner message, and urgency.
- Saved analysis status visible in Payload CRM.
- Delivered analysis link stored on the lead.
- Optional "book a consultation" step after submission.
- Optional downloadable PDF preview or sample analysis.

### 3. Trust and Proof System

Owners are risk-averse. The site should make HDPM feel proven before they contact anyone.

Capabilities:
- Dedicated owner testimonials module.
- Google reviews with review source and date.
- Case-study cards:
  - Reduced vacancy.
  - Improved rent positioning.
  - Cleaned up maintenance backlog.
  - Turned owner move-out into managed rental.
- "How we screen tenants" explainer.
- "How we handle maintenance" explainer.
- "How owner statements work" explainer.
- "What Oregon compliance issues we manage" explainer.
- Team credibility section with local roles.
- Service area proof, including office location, local photos, and local vendor network.

### 4. Owner CRM and Follow-Up

The site should not just capture leads. It should help HDPM close them.

Capabilities:
- Owner lead type and source detail in CRM.
- Round-robin or role-based assignment for owner leads.
- Automated follow-up tasks:
  - Call within 1 business day.
  - Prepare rental analysis.
  - Send consultation invite.
  - Follow up 3 days after delivery.
- Conversation log for email/SMS/calls.
- Owner pipeline stages:
  - New owner inquiry.
  - Analysis requested.
  - Analysis in review.
  - Analysis delivered.
  - Consultation scheduled.
  - Proposal sent.
  - Management agreement sent.
  - Won.
  - Lost.
- Lead source reporting by page, campaign, and market area.
- AEO/SEO attribution fields for landing page, referrer, UTM, and query if available.

### 5. Market Area Owner Pages

Market area pages currently exist. They should become owner-intent landing pages, not only general local pages.

Capabilities:
- `/bend-property-management`
- `/redmond-property-management`
- `/sisters-property-management`
- `/prineville-property-management`
- `/madras-property-management`
- `/culver-property-management`
- `/metolius-property-management`
- `/la-pine-property-management` if serviceable
- Each page should include:
  - Local rental market snapshot.
  - Owner-specific services.
  - Local tenant demand notes.
  - Local maintenance/vendor considerations.
  - Example rent ranges or "request exact analysis".
  - Featured available listings in that city.
  - FAQs for owners in that city.
  - CTA to rental analysis with city prefilled.

### 6. Service Pages

Create dedicated SEO/AEO pages for each high-intent service.

Capabilities:
- Full-service property management.
- Tenant placement.
- Rental property marketing.
- Tenant screening.
- Rent collection.
- Maintenance coordination.
- Property inspections.
- Owner financial reporting.
- Lease renewals.
- Oregon rental compliance.
- Eviction coordination and lease enforcement, framed carefully.
- Multi-property portfolio management.

Each service page should answer:
- What is included?
- Who is it for?
- How does HDPM do it?
- What owner risk does it reduce?
- How does it affect rent, vacancy, or peace of mind?
- What should the owner do next?

### 7. Comparison and Decision Pages

These pages win people who are close to choosing a vendor.

Capabilities:
- "How to choose a property management company in Bend".
- "Property manager vs self-managing in Oregon".
- "Tenant placement vs full-service property management".
- "Questions to ask a Central Oregon property manager".
- "What does property management cost in Bend?"
- "Best property management company in Bend: evaluation checklist".
- "Switching property managers in Central Oregon".

Use balanced, non-attack language. The goal is to become the trusted evaluator, not to sound like a comparison ad.

### 8. Owner FAQ and AEO Answer Library

AEO needs concise, extractable answers. Build an owner FAQ library that can be reused across pages.

Capabilities:
- CMS-managed FAQ collection or reusable FAQ block.
- FAQPage schema where appropriate.
- Short answer first, then explanation.
- Internal links to service and market pages.
- Questions grouped by funnel stage:
  - Cost.
  - Tenant screening.
  - Maintenance.
  - Rent estimates.
  - Legal compliance.
  - Owner statements.
  - Leasing timelines.
  - Switching managers.
  - Out-of-state owners.

Example questions:
- How much does property management cost in Bend, Oregon?
- What rent can I charge for my Bend rental home?
- Is it worth hiring a property manager in Central Oregon?
- How does HDPM screen tenants?
- How fast can HDPM list my rental?
- Can HDPM manage a home if I live out of state?
- What owner reports do I receive each month?
- Who handles maintenance calls after hours?
- How does HDPM reduce vacancy?
- What Oregon rental laws should landlords know?

### 9. Content Engine for SEO and AEO

Upgrade the existing blog automation into a topic-cluster engine.

Capabilities:
- Editorial calendar by owner-intent cluster.
- CMS field for target keyword, search intent, funnel stage, and related service page.
- Blog briefs before generation.
- Human review checklist for accuracy, local specificity, and brand tone.
- Internal-link suggestions when publishing.
- Auto-generated FAQ block for each post.
- Article schema plus optional FAQ/HowTo schema when appropriate.
- Quarterly content refresh workflow.
- Content pruning for stale or thin posts.

Core clusters:
- Bend property management.
- Central Oregon rental market.
- Owner rental analysis.
- Tenant screening.
- Maintenance and inspections.
- Oregon landlord compliance.
- Vacancy reduction.
- Out-of-state owner management.
- Rental investment performance.
- AppFolio/owner portal/reporting education.

### 10. Technical SEO and AEO Infrastructure

The current foundation is good. These additions make it more complete.

Capabilities:
- Service schema for property management services.
- FAQPage schema for official FAQ content.
- HowTo schema for step-by-step guides, where genuinely instructional.
- Review and AggregateRating only where compliant and supportable.
- Enhanced LocalBusiness schema with sameAs links, geo, areaServed, priceRange, and services.
- Breadcrumb schema on all public pages.
- Article schema on all posts.
- Canonical URLs for all CMS, market, listing, and blog pages.
- Dynamic OG images for market pages and blog posts.
- XML sitemap split by content type when the site grows.
- Sitemap includes only live, indexable routes. Current sitemap includes routes such as `/services`, `/residents`, `/privacy` that should exist or be removed.
- Search Console and Bing Webmaster verification.
- Robots.txt allows crawlable public resources and blocks only admin/API surfaces.
- Page speed budgets for hero images, third-party scripts, and listing images.
- Image alt text required in CMS for hero and service images.

### 11. Local SEO Entity System

Search and AI systems need consistent business facts.

Capabilities:
- Consistent NAP: name, address, phone.
- Google Business Profile optimization.
- Bing Places profile.
- Apple Business Connect profile.
- Yelp and major citation cleanup.
- SameAs links in schema.
- Location/service-area pages internally linked from header/footer.
- Review generation link after positive service moments.
- Review response workflow.
- Local photos instead of generic stock where possible.
- Local backlinks from chambers, real estate partners, relocation resources, and community pages.

### 12. Analytics and Conversion Measurement

To outperform the old site, define the scoreboard.

Capabilities:
- GA4 events:
  - owner_analysis_start
  - address_lookup_success
  - owner_analysis_submit
  - call_click
  - email_click
  - consultation_click
  - listing_apply_click
  - blog_to_owner_cta_click
- Server-side lead source capture in CRM.
- UTM persistence through form submission.
- Landing page and first-touch path stored on Lead.
- Search Console query review by page.
- Bing Webmaster tracking for Bing and AI-driven surfaces.
- Monthly owner-lead dashboard:
  - Sessions by landing page.
  - Conversion rate.
  - Qualified owner leads.
  - Won management agreements.
  - Estimated doors added.
  - Content pages contributing to leads.

## Priority Roadmap

### Phase 1: Conversion Foundation

- Make `/owners` the primary owner acquisition page.
- Add sticky CTA and owner journey segmentation.
- Add Resend or equivalent notifications for owner form submissions.
- Add post-submit consultation scheduling CTA.
- Store UTM, landing page, referrer, and source path on CRM leads.
- Add owner-specific FAQ section to `/owners`.
- Fix sitemap entries for routes that do not exist or create those pages.

### Phase 2: Local SEO Landing Pages

- Convert market pages into owner-intent landing pages.
- Add service pages for the core property management services.
- Add city-specific CTAs and form prefill.
- Add Service and FAQ schema.
- Add internal link modules from blog, home, footer, and market pages.

### Phase 3: AEO Content System

- Create a reusable FAQ/answer block.
- Add content brief fields to Posts.
- Add topic cluster fields and internal-link recommendations.
- Publish owner-focused question pages and comparison pages.
- Add HowTo schema to genuine step-by-step guides.
- Refresh old blog content every quarter.

### Phase 4: Trust, Proof, and Closing

- Add owner-only testimonials and case studies.
- Add sample rental analysis preview.
- Add "how HDPM works" process page.
- Add proposal and management agreement stages in CRM.
- Build owner lead reporting dashboard.
- Build review generation workflow.

## Success Metrics

Primary:
- Owner rental analysis submissions.
- Qualified owner leads.
- Management agreements won.
- Doors added.

SEO/AEO:
- Organic sessions to owner and market pages.
- Ranking visibility for "property management Bend", "Bend property manager", "rental analysis Bend", and city variants.
- Search Console impressions and clicks for owner-intent queries.
- Pages cited or surfaced in AI answer experiences where trackable.
- Blog-assisted owner conversions.

Conversion:
- `/owners` visit to form-start rate.
- Form-start to form-submit rate.
- Address lookup success rate.
- Phone-click rate.
- Consultation booking rate.
- Lead response time.

## Build-vs-Content Split

Build first:
- Conversion tracking.
- CRM attribution fields.
- Owner form notifications.
- FAQ/schema components.
- Service/market page templates.
- Sitemap cleanup.

Content next:
- Owner page copy refinement.
- City-specific owner pages.
- Service pages.
- FAQ answer library.
- Comparison/decision pages.
- Case studies.

Operate continuously:
- Monthly content publishing.
- Quarterly refreshes.
- Review generation.
- Search Console/Bing monitoring.
- CRM conversion review.
