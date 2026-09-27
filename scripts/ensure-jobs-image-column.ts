import { config as loadEnv } from 'dotenv'
import pg from 'pg'
import { applyJobsImageColumn } from '../src/lib/ensure-jobs-image-column'

loadEnv()

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://***')
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('DATABASE_URL is not set; skipping jobs image migration. Server init will retry.')
    return
  }

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    const status = await applyJobsImageColumn((statement) => client.query(statement))
    console.info(
      status === 'ready'
        ? 'jobs.image_id is already present.'
        : 'Applied jobs.image_id migration.',
    )
  } catch (error) {
    console.error(
      `jobs.image_id migration did not finish (${safeError(error)}). /careers will keep static photos until it succeeds.`,
    )
  } finally {
    await client.end().catch(() => undefined)
  }
}

await main()
