import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."market_areas" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'draft';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."market_areas" DROP COLUMN IF EXISTS "status";
  `)
}
