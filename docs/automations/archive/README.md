# Archived automations

These tools are retained for reference and maintenance, but have no run buttons
in the routine Automations view. The collapsed archive in that view explains
their original purpose. Existing authenticated API implementations are retained;
archiving the UI does not disable those endpoints.

| Tool | Original purpose | Implementation |
| --- | --- | --- |
| Refresh Blog Images (Unsplash) | Bulk replacement or backfill of featured images | `src/app/api/automations/backfill-images/route.ts` |
| Apply Curated Blog Images | One-time recovery of 22 original posts' photos | `src/app/api/automations/apply-curated-images/route.ts` |

For ongoing photo edits, use **Find a featured image** inside the individual post.

The CRM Automation Cycle card was removed because its Run Now callback was
empty. No CRM scheduled tasks or backend functionality were changed.

Active tools: Google Reviews sync, Blog Topic Research, Blog Agent, Apply All SEO
Suggestions, and AppFolio listing sync. SEO suggestions remain active because
new pending suggestions can be generated over time.
