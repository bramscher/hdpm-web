/**
 * Migrate from manual seoTitle/seoDescription fields to @payloadcms/plugin-seo.
 * Adds meta_title, meta_description, meta_image columns, copies existing data,
 * and drops the old seo_title/seo_description columns.
 *
 * Usage:
 *   npx tsx scripts/migrate-seo-plugin.ts
 */

import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  console.log('🔧 Migrating SEO fields...\n')

  // Posts table
  console.log('Posts collection:')

  // Add new columns if they don't exist
  await client.query(`
    ALTER TABLE payload_web.posts
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR,
    ADD COLUMN IF NOT EXISTS meta_image INTEGER
  `)
  console.log('  ✓ Added meta_title, meta_description, meta_image columns')

  // Copy data from old fields
  const { rowCount } = await client.query(`
    UPDATE payload_web.posts
    SET
      meta_title = COALESCE(meta_title, seo_title),
      meta_description = COALESCE(meta_description, seo_description)
    WHERE seo_title IS NOT NULL OR seo_description IS NOT NULL
  `)
  console.log(`  ✓ Migrated SEO data for ${rowCount} posts`)

  // Drop old columns
  await client.query(`
    ALTER TABLE payload_web.posts
    DROP COLUMN IF EXISTS seo_title,
    DROP COLUMN IF EXISTS seo_description
  `)
  console.log('  ✓ Dropped old seo_title, seo_description columns')

  // Pages table
  console.log('\nPages collection:')
  await client.query(`
    ALTER TABLE payload_web.pages
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR,
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR,
    ADD COLUMN IF NOT EXISTS meta_image INTEGER
  `)
  console.log('  ✓ Added meta_title, meta_description, meta_image columns')

  await client.end()
  console.log('\n✅ SEO migration complete!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
