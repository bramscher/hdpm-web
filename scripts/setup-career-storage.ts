import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key)
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.',
  )
const storage = createClient(url, key, {
  auth: { persistSession: false },
}).storage
const options = {
  public: false,
  fileSizeLimit: 100 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ],
}
const { data: bucket, error: lookupError } =
  await storage.getBucket('job-applications')
if (lookupError && !/not found/i.test(lookupError.message)) throw lookupError
const { error } = bucket
  ? await storage.updateBucket('job-applications', options)
  : await storage.createBucket('job-applications', options)
if (error) throw error
console.log('Private job-applications bucket is ready.')
