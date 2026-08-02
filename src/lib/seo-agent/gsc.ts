/**
 * Minimal Google Search Console (Search Analytics) client using a service
 * account. No googleapis dependency — signs the OAuth JWT with node:crypto.
 *
 * Setup:
 *  1. Google Cloud console → create a service account, enable the
 *     "Google Search Console API".
 *  2. Search Console → Settings → Users and permissions → add the service
 *     account email with Full access.
 *  3. Env vars:
 *     GSC_CLIENT_EMAIL=svc-account@project.iam.gserviceaccount.com
 *     GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..." (literal \n allowed)
 *     GSC_SITE_URL=sc-domain:highdesertpm.com   (or https://www.highdesertpm.com/)
 */

import crypto from 'crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export interface GscRow {
  /** keys follow the requested dimensions order, e.g. [page, query] */
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export function gscConfigured(): boolean {
  return Boolean(
    process.env.GSC_CLIENT_EMAIL &&
      process.env.GSC_PRIVATE_KEY &&
      process.env.GSC_SITE_URL,
  )
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL!
  const privateKey = (process.env.GSC_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = base64url(signer.sign(privateKey))
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    throw new Error(`GSC token exchange failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export interface SearchAnalyticsQuery {
  startDate: string // YYYY-MM-DD
  endDate: string
  dimensions: Array<'page' | 'query' | 'date' | 'device' | 'country'>
  rowLimit?: number
  /** optional page filter, exact URL */
  page?: string
}

export async function querySearchAnalytics(
  params: SearchAnalyticsQuery,
): Promise<GscRow[]> {
  const siteUrl = process.env.GSC_SITE_URL!
  const token = await getAccessToken()

  const body: Record<string, unknown> = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions,
    rowLimit: params.rowLimit ?? 1000,
    dataState: 'final',
  }
  if (params.page) {
    body.dimensionFilterGroups = [
      {
        filters: [{ dimension: 'page', operator: 'equals', expression: params.page }],
      },
    ]
  }

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) {
    throw new Error(`GSC query failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { rows?: GscRow[] }
  return data.rows ?? []
}

/** Convenience: date string N days ago (GSC data lags ~2 days) */
export function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400_000)
  return d.toISOString().slice(0, 10)
}
