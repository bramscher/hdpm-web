const applicationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function attachmentPreviewPath(id: string, kind: string | null) {
  if (!applicationIdPattern.test(id) || (kind !== 'resume' && kind !== 'video'))
    return null
  return `/careers/application-files/${id}?kind=${kind}`
}

// OAuth state is untrusted. Only this exact local attachment destination may
// override the normal admin landing page; authorization is checked there again.
export function safeAttachmentReturn(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/careers/application-files/')
  )
    return null
  const match =
    /^\/careers\/application-files\/([^/?#]+)\?kind=(resume|video)$/.exec(value)
  return match ? attachmentPreviewPath(match[1], match[2]) : null
}

export function attachmentLoginPath(returnTo: string) {
  const safe = safeAttachmentReturn(returnTo)
  return safe
    ? `/admin/login?redirect=${encodeURIComponent(safe)}`
    : '/admin/login'
}
