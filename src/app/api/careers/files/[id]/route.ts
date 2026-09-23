import { requireAuth } from '@/lib/api-auth'
import { careerStorage } from '@/lib/career-storage'
import {
  attachmentLoginPath,
  attachmentPreviewPath,
} from '@/lib/career-attachment-links'
import { findCareerAttachment } from '@/lib/career-attachments'

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind')
  const preview = attachmentPreviewPath(id, kind)
  if (!preview)
    return Response.json(
      { error: 'File not found.' },
      { status: 404, headers: privateHeaders },
    )
  const auth = await requireAuth({ roles: ['admin'] })
  if (!auth.ok && auth.status === 401) {
    return new Response(null, {
      status: 302,
      headers: { ...privateHeaders, Location: attachmentLoginPath(preview) },
    })
  }
  // Existing email links now lead to a browser preview. Non-admin accounts
  // see the access explanation on that page without entering a login loop.
  if (!auth.ok || url.searchParams.get('download') !== '1') {
    return new Response(null, {
      status: 302,
      headers: { ...privateHeaders, Location: preview },
    })
  }
  const attachment = await findCareerAttachment(id, kind!)
  if (!attachment)
    return Response.json(
      { error: 'File not found.' },
      { status: 404, headers: privateHeaders },
    )
  const { data, error } = await careerStorage().createSignedUrl(
    attachment.file.path,
    60,
    { download: attachment.file.name },
  )
  if (error || !data)
    return Response.json(
      { error: 'Download unavailable. Please try again.' },
      { status: 503, headers: privateHeaders },
    )
  return new Response(null, {
    status: 302,
    headers: { ...privateHeaders, Location: data.signedUrl },
  })
}
