import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/api-auth'
import { careerStorage } from '@/lib/career-storage'
import {
  attachmentLoginPath,
  attachmentPreviewPath,
} from '@/lib/career-attachment-links'
import { findCareerAttachment } from '@/lib/career-attachments'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Application attachment | High Desert',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function ApplicationAttachmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ kind?: string }>
}) {
  const { id } = await params
  const { kind } = await searchParams
  const path = attachmentPreviewPath(id, kind ?? null)
  if (!path) notFound()
  const auth = await requireAuth({ roles: ['admin'] })
  if (!auth.ok) {
    if (auth.status === 401) redirect(attachmentLoginPath(path))
    return (
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="font-heading text-3xl">Administrator access required</h1>
        <p className="mt-4">
          You’re signed in, but this account does not have permission to view
          job applications. Ask your site administrator to grant access, or sign
          out in the admin and use an administrator account.
        </p>
        <a href="/admin" className="mt-6 inline-block underline">
          Open site admin
        </a>
      </section>
    )
  }
  const attachment = await findCareerAttachment(id, kind!)
  if (!attachment) notFound()
  const { application, file } = attachment
  // Omit the download option so PDFs and videos are served inline. A fresh
  // signed URL is created on every authenticated page request.
  const { data, error } = await careerStorage().createSignedUrl(
    file.path,
    15 * 60,
  )
  const download = `/api/careers/files/${id}?kind=${kind}&download=1`
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <a
        href={`/admin/collections/job-applications/${application.id}`}
        className="text-sm underline"
      >
        ← Back to application
      </a>
      <div className="my-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-mid">
            Private hiring attachment · {application.jobTitle}
          </p>
          <h1 className="mt-2 font-heading text-3xl">
            {application.fullName} —{' '}
            {kind === 'video' ? 'Video introduction' : 'Résumé'}
          </h1>
          <p className="mt-2 break-all text-sm text-neutral-mid">{file.name}</p>
        </div>
        <a
          href={download}
          className="rounded-lg bg-primary px-5 py-3 font-semibold text-white"
        >
          Download file
        </a>
      </div>
      {error || !data ? (
        <p role="alert" className="rounded-xl bg-neutral-light p-6">
          The preview is temporarily unavailable. Refresh this page to try
          again.
        </p>
      ) : file.mime === 'application/pdf' ? (
        <>
          <iframe
            src={data.signedUrl}
            title={`Résumé for ${application.fullName}`}
            referrerPolicy="no-referrer"
            className="h-[75vh] min-h-[400px] w-full rounded-xl border border-neutral-200"
          />
          <p className="mt-4 text-sm text-neutral-mid">
            If your browser doesn’t display the PDF, use Download file above.
          </p>
        </>
      ) : kind === 'video' ? (
        <>
          <video
            controls
            playsInline
            preload="metadata"
            className="max-h-[75vh] w-full rounded-xl bg-black"
            src={data.signedUrl}
          >
            Your browser does not support this video. Use Download file above.
          </video>
          <p className="mt-4 text-sm text-neutral-mid">
            If this video’s format isn’t supported by your browser, download it
            to watch on your device.
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-neutral-light p-8">
          <h2 className="font-heading text-xl">Word document attached</h2>
          <p className="mt-3">
            This résumé is a Word document. Download it to open in Word or your
            preferred document viewer.
          </p>
        </div>
      )}
      <p className="mt-5 text-xs text-neutral-mid">
        Previews expire after 15 minutes. Refresh this page to renew access.
      </p>
    </section>
  )
}
