import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Hiring Settings global: who receives job application emails, plus a
 * one-time "resend since" date. Seeds the recipient list so every application
 * goes to the hiring inbox, Craig and Lisa until changed in the admin.
 *
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_web"."hiring_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "application_recipients" varchar NOT NULL,
      "resend_since" timestamp(3) with time zone,
      "last_resend" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
    INSERT INTO "payload_web"."hiring_settings" ("application_recipients", "updated_at", "created_at")
    SELECT ${'work@highdesertpm.com\ncraig@highdesertpm.com\nlisa@highdesertpm.com'}, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "payload_web"."hiring_settings");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload_web"."hiring_settings";`)
}
