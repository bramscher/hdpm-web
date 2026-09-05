/**
 * IndexNow — instantly notify participating search engines (Bing, Yandex,
 * Seznam, and others; NOT Google) that URLs were added or changed so they get
 * recrawled quickly. Ownership is proven by hosting the key as a text file at
 * `${SITE_URL}/${INDEXNOW_KEY}.txt` (see public/1892f4259ce44b5ab32dc3d1b295c6f0.txt).
 *
 * The key is intentionally public (it's served as a file), so it's fine in code.
 */
import { SITE_URL } from './site-url'

const INDEXNOW_KEY = '1892f4259ce44b5ab32dc3d1b295c6f0'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export async function submitToIndexNow(
  urls: string[],
): Promise<{ ok: boolean; status: number; submitted: number }> {
  const urlList = [...new Set(urls)].filter(Boolean)
  if (!urlList.length) return { ok: true, status: 0, submitted: 0 }

  let host: string
  try {
    host = new URL(SITE_URL).host
  } catch {
    host = 'www.highdesertpm.com'
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      // IndexNow accepts up to 10,000 URLs per request.
      urlList: urlList.slice(0, 10000),
    }),
  })
  // 200 = accepted, 202 = accepted (key validation pending). Both are success.
  return { ok: res.ok, status: res.status, submitted: urlList.length }
}
