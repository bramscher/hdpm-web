# Work at High Desert

`/careers` is linked from About and the Company footer. Open jobs appear as compact rows with expandable details. Every Apply button selects that job in the shared application form. External posting links remain editable for reference but no longer redirect applicants away from the application.

Manage listings in **Payload → Content → Jobs**. Only Open jobs appear publicly. Preserve existing role summaries and add approved responsibilities, location, schedule, and compensation in the CMS. No pay or benefit promises are invented by the page. Slugs retain shareable `/careers#maintenance-technician` anchors.

## Deployment

1. Set `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY`. Use the canonical production `NEXT_PUBLIC_SITE_URL`. `CAREERS_FROM_EMAIL` optionally overrides the verified `LEAD_FROM_EMAIL` sender. Notifications always go to **work@highdesertpm.com**.
2. Run `npm run payload -- migrate` to create private application records and database-backed rate limits (after the existing Jobs migration).
3. Run `npx tsx scripts/setup-career-storage.ts` against the intended environment. It creates/updates the **private** `job-applications` bucket, allowed MIME types, and 100 MB maximum. Never make this bucket public or add anonymous storage policies. The browser only receives a signed URL for one random upload path; server credentials are never sent to it.
4. Deploy, then submit a test application with a résumé and a video. Verify the saved record, inbox delivery, administrator-only downloads, and rejection of anonymous collection reads. Check mobile video selection with an actual phone. Database, storage, and email integration require configured services and are not verified by unit tests.

## Applications and privacy

**Payload → Hiring → Job Applications** is restricted to administrators (`role: admin`). It stores contact details, the selected job and title at submission, experience, technology answer, availability, consent, attachment references, and email status. Public collection creation/read is disabled; the bounded intake endpoint validates input and rechecks that the job is open. The form uses a honeypot, same-origin checks, and shared database hourly request limits. The deployment proxy must supply trustworthy client-IP headers; on Vercel the Vercel-specific header is preferred. These controls are not a CAPTCHA or malware scanner; review uploads with normal safe file handling.

Résumés (PDF/DOC/DOCX, 10 MB) and video introductions (MP4/MOV/WebM, 100 MB) are optional. Videos upload directly to Supabase to avoid the hosting function request-body limit. Receipts bind uploaded files to the application and expire after two hours; final submission verifies object size and MIME type in storage. Files use unguessable paths. Notification emails include the form and authenticated attachment links, rather than large public attachments. Existing email links open a private preview page, redirecting signed-out users to admin login and returning them after password or Microsoft sign-in. PDFs display inline and videos use browser playback controls; Word documents and unsupported video formats offer a download. Preview URLs expire after 15 minutes and renew on page refresh. Explicit downloads use a 60-second signed URL. Preview pages require administrator access and do not load public-site analytics or advertising pixels. Application data is not added to the sales CRM or conversion analytics.

The form confirms **saved**, not delivered. If Resend fails, the application remains saved with `failed` notification status. Filter for Failed/Pending in admin, set Notification Status to Pending, and save to retry. Resend receives an application-specific idempotency key. A stable submission ID prevents ordinary network retries from creating duplicate applications. Do not rotate `PAYLOAD_SECRET` during active applications, as it signs upload receipts.

Uploads abandoned before submission and files belonging to deleted records remain private in storage. Administrators should apply their hiring retention policy to both records and storage; deleting a record does not delete the underlying files. Unreferenced upload folders older than a day can be removed after checking saved application references. Rate-limit entries expire and are purged as new requests arrive. Migration rollback deletes application records: back up hiring data before any rollback.

## Checks

`npx tsx --test tests/career-validation.test.ts tests/career-notification.test.ts tests/job-links.test.ts` covers form validation, supported formats and limits, tamper-resistant upload receipts, expiry, origin checks, administrator access, and notification success/failure. Run `npx tsc --noEmit` and `npm run build` before release.

## Job Description Creator

Open any Job (or create a new one), then choose **Open creator**. Existing job fields can seed the notes. Paste the source description, request follow-up questions, answer what is known, and generate the draft. Blank answers are allowed; the assistant flags unresolved details separately for review. You can edit every generated field before choosing **Save as new draft job**.

Saving creates a separate Draft job and links to its editor. It does not change the original listing, publish anything, or copy external posting links. Review the new draft's contact email and details before setting it to Open. Review notes are shown in the preview only; they are not published or saved as job copy. Notes and answers remain in browser component state during the workflow and are lost on navigation/reload.

The assistant is available to authenticated admins and editors via `/api/job-description`. It uses `CLAUDE_API_KEY` (or `ANTHROPIC_API_KEY`), with optional `JOB_DESCRIPTION_MODEL` (default matches the blog generator: `claude-opus-4-8`). Notes, answers, and published About-page copy are sent to the configured AI provider. Company context includes the confirmed founding year from `src/lib/constants.ts` and published About copy. Prompts require omission of unconfirmed employment terms and forbid invented compensation, benefits, requirements, or application links. Generated copy still needs human review.

This is a virtual UI field using the existing Jobs schema; no database migration is needed.


## Role images

The seven role illustrations live in `public/images/careers/` as optimized WebP files. They depict fictional professionals actively working in Central Oregon-inspired settings; they are not photos of HDPM employees or actual managed properties. Office roles show Mac workstations. Original generation prompts are in `docs/assets/career-image-prompts.json` (built-in image generation).

`src/lib/career-role-images.ts` matches the role slug or normalized title, including draft-creator UUID slug suffixes. Unrecognized roles retain the numbered list treatment. Images use responsive Next Image thumbnails with lazy loading; no database migration or CMS image upload is needed.

## Publish or unpublish a job

In **Content → Jobs**, open a listing, change **Availability** in the sidebar,
and click **Save**. **Open / Published** shows the job on the careers page and
application dropdown. **Closed / Unpublished** hides it and stops new
applications; **Draft / Unpublished** also stays hidden. To reopen a saved
listing, change it back to **Open / Published** and save. Existing applications
and listing details are retained. The Jobs list includes the Availability column.

This uses the existing status field and needs no migration. It only controls
the HDPM site; external job-board postings must be managed separately.

The **Availability** column in the Jobs list also has an on/off switch. Changes
save immediately: On publishes a draft or closed job; Off closes an open job.
Only users with content-editing permissions can use the switch. Failed saves
leave the displayed status unchanged and show an error. The list refreshes its
current filters after a successful change.
