import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Blog-agent topic dedup.
 *
 * Adds a single nullable `source_url` text column to `posts` so the blog agent
 * can record which researched topic (Reddit permalink / article URL) a draft
 * came from. Later runs skip any source already used, instead of relying on the
 * post title — which Claude rewrites into an SEO headline that no longer matches
 * the research title, causing the same story to be regenerated every run.
 *
 * Purely additive and nullable, so it is safe to run against the live database.
 * Run the migration BEFORE (or right as) the code that reads the column deploys:
 * old code ignores the extra column, new code needs it to exist.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."posts" ADD COLUMN IF NOT EXISTS "source_url" varchar;
    CREATE INDEX IF NOT EXISTS "posts_source_url_idx" ON "payload_web"."posts" USING btree ("source_url");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_web"."posts_source_url_idx";
    ALTER TABLE "payload_web"."posts" DROP COLUMN IF EXISTS "source_url";
  `)
}
