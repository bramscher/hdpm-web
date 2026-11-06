import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * SMS and email consent are explicit opt-in: new leads default to not opted in.
 * Changes only the column defaults. Existing leads keep their stored values.
 *
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      ALTER COLUMN "sms_opt_in" SET DEFAULT false,
      ALTER COLUMN "email_opt_in" SET DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      ALTER COLUMN "sms_opt_in" SET DEFAULT true,
      ALTER COLUMN "email_opt_in" SET DEFAULT true;
  `)
}
