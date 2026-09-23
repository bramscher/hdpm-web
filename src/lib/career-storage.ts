import { createHmac, timingSafeEqual, createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import type { UploadKind } from './career-validation'

export const APPLICATION_BUCKET = 'job-applications'
export function careerStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Application storage is not configured.')
  return createClient(url, key, {
    auth: { persistSession: false },
  }).storage.from(APPLICATION_BUCKET)
}
export type Attachment = {
  kind: UploadKind
  name: string
  path: string
  size: number
  mime: string
  submissionId: string
  expires: number
}
function signature(data: string) {
  if (!process.env.PAYLOAD_SECRET) throw new Error('Missing signing secret.')
  return createHmac('sha256', process.env.PAYLOAD_SECRET)
    .update(data)
    .digest('hex')
}
export function signAttachment(data: Attachment) {
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${encoded}.${signature(encoded)}`
}
export function readAttachment(
  token: string,
  submissionId: string,
): Attachment {
  const [encoded, sig = ''] = token.split('.')
  const expected = signature(encoded)
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    throw new Error('Invalid upload. Please select the file again.')
  const data = JSON.parse(
    Buffer.from(encoded, 'base64url').toString(),
  ) as Attachment
  if (data.submissionId !== submissionId || data.expires < Date.now())
    throw new Error('Upload expired. Please select the file again.')
  return data
}
// Database-backed limits work across serverless instances. Only hashed IPs are stored.
export async function limitCareerRequests(
  payload: Payload,
  request: Request,
  action: string,
  limit: number,
) {
  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local'
  const key = createHash('sha256')
    .update(
      `${process.env.PAYLOAD_SECRET}:${ip}:${action}:${Math.floor(Date.now() / 3600000)}`,
    )
    .digest('hex')
  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO "payload_web"."career_rate_limits" ("key", "count", "expires_at") VALUES (${key}, 1, now() + interval '2 hours')
    ON CONFLICT ("key") DO UPDATE SET "count" = "career_rate_limits"."count" + 1 RETURNING "count"
  `)
  await payload.db.drizzle.execute(
    sql`DELETE FROM "payload_web"."career_rate_limits" WHERE "expires_at" < now()`,
  )
  return Number(result.rows[0]?.count) <= limit
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin
}
