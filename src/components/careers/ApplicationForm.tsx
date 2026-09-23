'use client'

import { useRef, useState, type FormEvent } from 'react'
import { validateUpload, type UploadKind } from '@/lib/career-validation'

type JobOption = { id: number; title: string }
const control =
  'mt-2 block w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-dark outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25'

function uploadFile(
  url: string,
  file: File,
  mime: string,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', mime)
    xhr.timeout = 10 * 60 * 1000
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error('Upload failed. Check your connection and try again.'),
          )
    xhr.onerror = xhr.ontimeout = () =>
      reject(
        new Error('Upload interrupted. Check your connection and try again.'),
      )
    xhr.send(file)
  })
}

export default function ApplicationForm({
  jobs,
  selectedJob,
  onJobChange,
}: {
  jobs: JobOption[]
  selectedJob: string
  onJobChange: (id: string) => void
}) {
  const submissionId = useRef('')
  const [files, setFiles] = useState<Partial<Record<UploadKind, File>>>({})
  const receipts = useRef<
    Partial<Record<UploadKind, { file: File; token: string }>>
  >({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (!submissionId.current) submissionId.current = crypto.randomUUID()
    setBusy(true)
    setError('')
    try {
      const attachments: string[] = []
      for (const kind of ['resume', 'video'] as const) {
        const file = files[kind]
        if (!file) continue
        if (receipts.current[kind]?.file === file) {
          attachments.push(receipts.current[kind]!.token)
          continue
        }
        validateUpload(kind, file.name, file.size)
        setStatus(`Preparing ${kind === 'resume' ? 'résumé' : 'video'} upload…`)
        const response = await fetch('/api/careers/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind,
            name: file.name,
            size: file.size,
            submissionId: submissionId.current,
            jobId: selectedJob,
            website: data.get('website'),
          }),
        })
        const upload = await response.json()
        if (!response.ok)
          throw new Error(upload.error || 'Unable to prepare upload.')
        await uploadFile(upload.url, file, upload.mime, (percent) =>
          setStatus(
            `Uploading ${kind === 'resume' ? 'résumé' : 'video'}: ${percent}%`,
          ),
        )
        receipts.current[kind] = { file, token: upload.receipt }
        attachments.push(upload.receipt)
      }
      setStatus('Saving your application…')
      const response = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          jobId: selectedJob,
          consent: data.get('consent') === 'on',
          submissionId: submissionId.current,
          attachments,
        }),
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || 'Unable to save your application.')
      setComplete(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  if (complete)
    return (
      <div
        role="status"
        className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 sm:p-12"
      >
        <span className="text-3xl text-emerald-700" aria-hidden="true">
          ✓
        </span>
        <h3 className="mt-4 font-heading text-3xl text-primary">
          You’re on our radar.
        </h3>
        <p className="mt-4 leading-relaxed text-neutral-dark">
          Your application has been saved for the High Desert team to review.
          Thank you for sharing a little about yourself. If your experience
          looks like a fit, we’ll get in touch using the contact details you
          provided.
        </p>
        <p className="mt-4 text-sm text-neutral-mid">
          Questions?{' '}
          <a className="underline" href="mailto:work@highdesertpm.com">
            work@highdesertpm.com
          </a>
        </p>
      </div>
    )

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold text-[#246b38]">
          YOUR NEXT CHAPTER
        </p>
        <h3 className="mt-2 font-heading text-3xl text-primary">
          Let’s get to know you.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
          Required fields are marked *. Résumé and video are optional; your
          written answers are a great place to start.
        </p>
      </div>
      <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
        <label className="block text-sm font-semibold">
          Position you’re applying for *
          <select
            id="application-job"
            name="jobId"
            className={control}
            value={selectedJob}
            onChange={(e) => onJobChange(e.target.value)}
            required
          >
            <option value="">Choose an open role</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Full name *
          <input
            name="fullName"
            autoComplete="name"
            maxLength={150}
            required
            className={control}
          />
        </label>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Email *
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              className={control}
            />
          </label>
          <label className="block text-sm font-semibold">
            Phone *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={50}
              required
              className={control}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          What would you bring to this role? *
          <span className="mt-1 block font-normal leading-relaxed text-neutral-mid">
            Tell us about relevant work, hands-on experience, or a time you
            helped solve a problem.
          </span>
          <textarea
            name="experience"
            maxLength={5000}
            rows={4}
            required
            className={control}
          />
        </label>
        <label className="block text-sm font-semibold">
          How do you use technology to get things done? *
          <span className="mt-1 block font-normal leading-relaxed text-neutral-mid">
            Share an example of an app or digital tool you use, and how you
            approach learning something new. Work orders, calendars, email,
            spreadsheets, and phone apps all count.
          </span>
          <textarea
            name="technology"
            maxLength={3000}
            rows={4}
            required
            className={control}
          />
        </label>
        <label className="block text-sm font-semibold">
          When could you start, and what is your availability? *
          <textarea
            name="availability"
            maxLength={1000}
            rows={2}
            required
            className={control}
          />
        </label>
        <div className="border-t border-neutral-200 pt-6">
          <h4 className="font-heading text-xl">
            A little more about you{' '}
            <span className="text-sm font-normal text-neutral-mid">
              (optional)
            </span>
          </h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(['resume', 'video'] as const).map((kind) => (
              <label
                key={kind}
                className="block min-w-0 rounded-2xl border border-dashed border-neutral-300 bg-neutral-light/50 p-4 text-sm font-semibold"
              >
                {kind === 'resume'
                  ? 'Attach your résumé'
                  : 'Upload a video introduction'}
                <span className="mt-1 block text-xs font-normal text-neutral-mid">
                  {kind === 'resume'
                    ? 'PDF, DOC, DOCX · Up to 10 MB'
                    : 'MP4, MOV, WebM · Up to 100 MB'}
                </span>
                <input
                  type="file"
                  accept={
                    kind === 'resume' ? '.pdf,.doc,.docx' : '.mp4,.mov,.webm'
                  }
                  className="mt-4 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    delete receipts.current[kind]
                    setFiles((previous) => ({ ...previous, [kind]: undefined }))
                    if (file) {
                      try {
                        validateUpload(kind, file.name, file.size)
                        setFiles((previous) => ({ ...previous, [kind]: file }))
                        setError('')
                      } catch (error) {
                        setError((error as Error).message)
                        event.target.value = ''
                      }
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </div>
        <details className="rounded-2xl bg-[#f4f1e9] p-5">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            First video introduction? Here’s a quick guide.
          </summary>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-neutral-dark">
            <li>
              Use your phone’s camera or your computer’s camera app. Find a
              quiet spot with light facing you.
            </li>
            <li>
              Aim for 30–60 seconds. Tell us your name, the role you’re
              interested in, and one example of how you solve problems or use
              technology.
            </li>
            <li>
              Save the recording to Photos or Files, then choose “Upload a video
              introduction” above. On a phone, you can select it from your photo
              library.
            </li>
            <li>
              Keep it under 100 MB. If it’s too large, trim the clip or record
              at 720p or 1080p instead of 4K. Keep this page open until your
              application is confirmed.
            </li>
          </ol>
          <p className="mt-4 text-sm font-medium">
            No editing, special equipment, or perfect take needed. Prefer
            writing? You can skip the video.
          </p>
        </details>
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-neutral-mid">
          <input
            name="consent"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-[#234d42]"
          />
          <span>
            I confirm that the information I’ve shared is accurate and agree
            that High Desert Property Management may store and review my
            application and attachments and contact me about this role. *
          </span>
        </label>
        <p className="text-xs leading-relaxed text-neutral-mid">
          Attachments are private and available to authorized hiring
          administrators. Please don’t include Social Security numbers, banking
          details, or other sensitive identification.
        </p>
        <button
          className="w-full rounded-xl bg-primary px-6 py-4 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-wait"
          type="submit"
        >
          {busy ? 'Sending your application…' : 'Send my application →'}
        </button>
      </fieldset>
      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-sm text-neutral-mid"
      >
        {status}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </form>
  )
}
