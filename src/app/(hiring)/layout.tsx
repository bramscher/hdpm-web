import type { ReactNode } from 'react'
import '../globals.css'

// Hiring documents must not load public-site analytics or advertising pixels.
export default function HiringLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white font-body text-neutral-dark antialiased">
        <header className="bg-primary px-6 py-5 text-white">
          <a href="/admin" className="font-heading font-semibold">
            High Desert · Hiring
          </a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
