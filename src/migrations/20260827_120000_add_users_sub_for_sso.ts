import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Microsoft 365 (Entra ID) SSO via `payload-oauth2`.
 *
 * The plugin adds a single indexed `sub` text column to the existing `users`
 * table to store the OAuth provider's subject id. This is the ONLY schema change
 * SSO requires — the integer `users.id` and every foreign key that references it
 * are untouched (unlike the payload-authjs adapter, which would have changed the
 * user id type and added an `accounts` table). Purely additive and nullable, so
 * it is safe to run against the live database.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."users" ADD COLUMN IF NOT EXISTS "sub" varchar;
    CREATE INDEX IF NOT EXISTS "users_sub_idx" ON "payload_web"."users" USING btree ("sub");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_web"."users_sub_idx";
    ALTER TABLE "payload_web"."users" DROP COLUMN IF EXISTS "sub";
  `)
}
