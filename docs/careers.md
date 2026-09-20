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
