# Blog research and image repair — September 23, 2026

The September 22 post “Would You Pay for This? Smart Upgrades for Rentals”
used a September 11 Reddit discussion about à-la-carte property-management
services. The discussion was recent, but the writer received only its ambiguous
title, URL, and a generic angle. It never received the actual discussion or its
date, and turned the topic into unrelated evergreen renovation advice.

There were also gaps in freshness enforcement: Reddit hot listings had no
explicit timestamp cutoff, and Tavily requests had no date restriction.

## Updated pipeline

- Reject sources without a parseable date within the rolling past 30 days,
  a usable HTTP(S) URL, and at least 120 characters of source text.
- Apply that gate during research, before generation, and before saving.
- Request dated Tavily results and raw source text. Its publication/update
  estimate is labeled as such, not treated as proof of a recent event.
- Reject market/overview headlines explicitly covering only past years, even
  when the page timestamp is recent. Editorial review must separately establish
  that the underlying reporting period supports current claims (including month
  and quarter). Old data cannot be refreshed by changing a headline year;
  historical comparisons must be labeled and backed by current evidence.
- Pass source text and date through both admin generation and scheduled runs.
- Require articles to address the actual recent discussion/development and
  attribute it. Forum questions are anecdotes, not verified market facts.
- Run a separate editorial model review before saving; reject drift,
  unsupported local/company claims, incomplete output, and unverifiable review.
- Include an original-source link and date in drafts, show evidence in the
  research UI, and report review rejections in scheduled-run digests.
- When evidence is insufficient, skip the candidate instead of substituting
  an evergreen topic. Human review remains necessary; model review is not a
  guarantee of accuracy. No schema migration is needed.

## Image repair

The in-post image search used a nested HTML form inside Payload's document
form. Search now uses a button and handles Enter without submitting the post.
Unsplash imports now download the image CDN URL and use the separate API URL
only for download tracking. Provider errors are displayed, and non-image
responses are rejected during import. Image search requires admin/editor login.

Post 52's featured image was replaced with media 112, a bright kitchen photo
by Naomi Hébert from Unsplash (photo MP0bgaS_d1c). The old media was retained.
The published article text has not been rewritten; the pipeline changes apply
to subsequent generation, and cannot retroactively make that article current.

## Verification

- Unit tests include 30-day boundaries, missing evidence, old hot posts,
  source-body preservation, provider errors and image/download URL separation.
- TypeScript and production build pass.
- Live read-only research returned 20 candidates with recent dates and source text.
- Browser fixture mounts the real image studio inside a parent form and checks
  click/Enter searches, import payload, and visible provider errors.

Follow-up audit: draft 51, “Central Oregon Rental Market Trends: A 2025
Owner's Guide,” was created September 18, 2026. Its stored source is
https://velocitypropertymanagement.com/blog (a blog landing-page URL),
not a dated article permalink. It remains a draft. Its exact title is now a
regression case for the stale-overview check. It needs fresh research and
a rewrite, not a change from 2025 to 2026 in the headline.
