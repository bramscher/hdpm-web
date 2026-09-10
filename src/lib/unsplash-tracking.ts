/** Only send credentials to Unsplash's documented download event endpoint. */
export async function trackUnsplashDownload(
  downloadLocation: unknown,
  accessKey: string,
): Promise<void> {
  if (!accessKey || typeof downloadLocation !== 'string') return

  let url: URL
  try {
    url = new URL(downloadLocation)
  } catch {
    return
  }

  if (
    url.origin !== 'https://api.unsplash.com' ||
    url.username || url.password ||
    !/^\/photos\/[A-Za-z0-9_-]+\/download$/.test(url.pathname)
  ) return

  try {
    await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Tracking failure must not undo an otherwise successful media import.
  }
}
