/**
 * Add new columns to testimonials table for Google reviews sync.
 *
 * Usage:
 *   npx tsx scripts/migrate-testimonials.ts
 */

import 'dotenv/config'
import pg from 'pg'

async function migrate() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  console.log('🔧 Migrating testimonials table...\n')

  await client.query(`
    ALTER TABLE payload_web.testimonials
    ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS google_review_id VARCHAR UNIQUE,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ
  `)
  console.log('  ✓ Added source, google_review_id, published_at columns')

  // Drop the old company column if it exists
  await client.query(`
    ALTER TABLE payload_web.testimonials
    DROP COLUMN IF EXISTS company
  `)
  console.log('  ✓ Dropped unused company column')

  await client.end()
  console.log('\n✅ Migration complete!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
