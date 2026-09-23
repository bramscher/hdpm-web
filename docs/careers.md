# Work at High Desert

The public jobs page is `/careers`, linked from the About menu (desktop and mobile) and the Company footer. Manage listings in **Payload → Content → Jobs** (`/admin/collections/jobs`).

Apply the committed database migration before deploying code that queries Jobs:

```sh
npm run payload -- migrate
```

The migration creates the collection and five open listings: Office Assistant, Assistant Maintenance Coordinator, Maintenance Technician, Landscape Technician, and Cleaning Technician. These have short starter summaries and the existing public contact email. Review the copy in Payload and add approved role details, location, schedule, and pay as needed.

For each job, add one or more **Posting Links**, using a label such as Indeed or Craigslist and the actual posting URL. No placeholder board links are displayed. An optional contact email provides an “Ask About This Role” link.

New jobs default to Draft. Set Status to Open to display them; Draft and Closed are hidden from both the public page and anonymous API reads. Lower Order values display first. Slugs provide shareable anchors such as `/careers#maintenance-technician`. Saved changes appear on the next page request. Closing all jobs shows an empty state; database errors are not represented as “no openings.”

The migration rollback deletes the jobs and their posting links. Back up any edited listings before rolling it back.

## Job Description Creator

Open any Job (or create a new one), then choose **Open creator**. Existing job fields can seed the notes. Paste the source description, request follow-up questions, answer what is known, and generate the draft. Blank answers are allowed; the assistant flags unresolved details separately for review. You can edit every generated field before choosing **Save as new draft job**.

Saving creates a separate Draft job and links to its editor. It does not change the original listing, publish anything, or copy external posting links. Review the new draft's contact email and details before setting it to Open. Review notes are shown in the preview only; they are not published or saved as job copy. Notes and answers remain in browser component state during the workflow and are lost on navigation/reload.

The assistant is available to authenticated admins and editors via `/api/job-description`. It uses `CLAUDE_API_KEY` (or `ANTHROPIC_API_KEY`), with optional `JOB_DESCRIPTION_MODEL` (default matches the blog generator: `claude-opus-4-8`). Notes, answers, and published About-page copy are sent to the configured AI provider. Company context includes the confirmed founding year from `src/lib/constants.ts` and published About copy. Prompts require omission of unconfirmed employment terms and forbid invented compensation, benefits, requirements, or application links. Generated copy still needs human review.

This is a virtual UI field using the existing Jobs schema; no database migration is needed.
