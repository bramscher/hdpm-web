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
