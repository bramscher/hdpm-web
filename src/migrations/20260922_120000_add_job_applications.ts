import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload_web"."enum_job_applications_notification_status" AS ENUM ('pending', 'sent', 'failed');
    CREATE TABLE "payload_web"."job_applications" (
      "id" serial PRIMARY KEY NOT NULL,
      "submission_id" varchar NOT NULL,
      "job_id" integer NOT NULL REFERENCES "payload_web"."jobs"("id") ON DELETE restrict,
      "job_title" varchar NOT NULL,
      "full_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar NOT NULL,
      "availability" varchar NOT NULL,
      "experience" varchar NOT NULL,
      "technology" varchar NOT NULL,
      "consent" boolean NOT NULL,
      "attachments" jsonb,
      "resume_download" varchar,
      "video_download" varchar,
      "notification_status" "payload_web"."enum_job_applications_notification_status" DEFAULT 'pending' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "job_applications_submission_id_idx" ON "payload_web"."job_applications" ("submission_id");
    CREATE INDEX "job_applications_job_idx" ON "payload_web"."job_applications" ("job_id");
    CREATE INDEX "job_applications_updated_at_idx" ON "payload_web"."job_applications" ("updated_at");
    CREATE INDEX "job_applications_created_at_idx" ON "payload_web"."job_applications" ("created_at");
    ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "job_applications_id" integer REFERENCES "payload_web"."job_applications"("id") ON DELETE cascade;
    CREATE INDEX "payload_locked_documents_rels_job_applications_id_idx" ON "payload_web"."payload_locked_documents_rels" ("job_applications_id");
    CREATE TABLE "payload_web"."career_rate_limits" ("key" varchar PRIMARY KEY, "count" integer NOT NULL, "expires_at" timestamp with time zone NOT NULL);
    CREATE INDEX "career_rate_limits_expiry_idx" ON "payload_web"."career_rate_limits" ("expires_at");
  `)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "payload_web"."career_rate_limits";
    ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "job_applications_id";
    DROP TABLE "payload_web"."job_applications";
    DROP TYPE "payload_web"."enum_job_applications_notification_status";
  `)
}
