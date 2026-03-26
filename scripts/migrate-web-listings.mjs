import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString:
    'postgresql://postgres.sywffgwizbxisalwmxib:KcHhCPLw9lZLTWzz@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
})

async function run() {
  await client.connect()

  await client.query(`
    CREATE TABLE IF NOT EXISTS web_listings (
      id TEXT PRIMARY KEY,
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'OR',
      zip TEXT NOT NULL DEFAULT '',
      rent NUMERIC NOT NULL DEFAULT 0,
      beds INTEGER NOT NULL DEFAULT 0,
      baths NUMERIC NOT NULL DEFAULT 0,
      sqft INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      marketing_title TEXT NOT NULL DEFAULT '',
      available_date TEXT NOT NULL DEFAULT '',
      pet_friendly BOOLEAN NOT NULL DEFAULT false,
      cats_allowed BOOLEAN NOT NULL DEFAULT false,
      dog_policy TEXT NOT NULL DEFAULT 'Contact for details',
      photos JSONB NOT NULL DEFAULT '[]'::jsonb,
      amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
      application_url TEXT NOT NULL DEFAULT '',
      property_type TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      deposit NUMERIC NOT NULL DEFAULT 0,
      lease_terms TEXT,
      property_id TEXT,
      appfolio_detail_id TEXT,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_web_listings_city ON web_listings (city);
    CREATE INDEX IF NOT EXISTS idx_web_listings_rent ON web_listings (rent);
    CREATE INDEX IF NOT EXISTS idx_web_listings_beds ON web_listings (beds);
    CREATE INDEX IF NOT EXISTS idx_web_listings_synced_at ON web_listings (synced_at);

    -- Add columns if table already exists (idempotent)
    ALTER TABLE web_listings ADD COLUMN IF NOT EXISTS property_id TEXT;
    ALTER TABLE web_listings ADD COLUMN IF NOT EXISTS appfolio_detail_id TEXT;
  `)

  console.log('Migration complete: web_listings table created/updated')
  await client.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
