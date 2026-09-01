import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SITE = process.env.SITE_URL || 'https://www.highdesertpm.com'

async function run() {
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('web_listings')
    .select('id, address, city, status, video_url')
    .not('video_url', 'is', null)
    .neq('video_url', '')
  if (error) throw error

  const rows = data ?? []
  process.stdout.write(`VIDEO_LISTINGS=${rows.length}\n`)
  for (const r of rows) {
    process.stdout.write(
      `${SITE}/listings/${r.id}\t${r.address ?? ''}, ${r.city ?? ''}\t[${r.status ?? '?'}]\t${r.video_url}\n`,
    )
  }
}

run().catch((e) => {
  process.stderr.write(String(e) + '\n')
  process.exit(1)
})
