import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload_web"."enum_jobs_status" AS ENUM ('draft', 'open', 'closed');
    CREATE TABLE "payload_web"."jobs" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" "payload_web"."enum_jobs_status" DEFAULT 'draft' NOT NULL,
      "order" numeric DEFAULT 0,
      "summary" varchar NOT NULL,
      "description" jsonb,
      "location" varchar,
      "schedule" varchar,
      "compensation" varchar,
      "contact_email" varchar DEFAULT 'info@highdesertpm.com',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE TABLE "payload_web"."jobs_posting_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "payload_web"."jobs"("id") ON DELETE cascade,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "url" varchar NOT NULL
    );
    CREATE UNIQUE INDEX "jobs_slug_idx" ON "payload_web"."jobs" USING btree ("slug");
    CREATE INDEX "jobs_updated_at_idx" ON "payload_web"."jobs" USING btree ("updated_at");
    CREATE INDEX "jobs_created_at_idx" ON "payload_web"."jobs" USING btree ("created_at");
    CREATE INDEX "jobs_posting_links_order_idx" ON "payload_web"."jobs_posting_links" USING btree ("_order");
    CREATE INDEX "jobs_posting_links_parent_id_idx" ON "payload_web"."jobs_posting_links" USING btree ("_parent_id");
    ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "jobs_id" integer REFERENCES "payload_web"."jobs"("id") ON DELETE cascade;
    CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("jobs_id");

    INSERT INTO "payload_web"."jobs" ("title", "slug", "status", "order", "summary") VALUES
      ('Office Assistant', 'office-assistant', 'open', 1, 'Help keep our office organized and support day-to-day communication with residents, owners, and the High Desert team.'),
      ('Assistant Maintenance Coordinator', 'assistant-maintenance-coordinator', 'open', 2, 'Support maintenance scheduling, work order follow-up, and communication between residents, technicians, and vendors.'),
      ('Maintenance Technician', 'maintenance-technician', 'open', 3, 'Help care for rental homes through property maintenance, repairs, and preparation between residents.'),
      ('Landscape Technician', 'landscape-technician', 'open', 4, 'Help maintain welcoming outdoor spaces through landscape care and routine grounds maintenance.'),
      ('Cleaning Technician', 'cleaning-technician', 'open', 5, 'Help prepare clean, welcoming homes through turnover cleaning and property care.');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "jobs_id";
    DROP TABLE "payload_web"."jobs_posting_links";
    DROP TABLE "payload_web"."jobs";
    DROP TYPE "payload_web"."enum_jobs_status";
  `)
}
