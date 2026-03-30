import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_web"."media" ADD COLUMN IF NOT EXISTS "attribution" varchar;
  ALTER TABLE "payload_web"."media" ADD COLUMN IF NOT EXISTS "license" varchar;
  ALTER TABLE "payload_web"."media" ADD COLUMN IF NOT EXISTS "source_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_web"."media" DROP COLUMN "attribution";
  ALTER TABLE "payload_web"."media" DROP COLUMN "license";
  ALTER TABLE "payload_web"."media" DROP COLUMN "source_url";`)
}
