import Image from 'next/image'
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background image - Mt. Bachelor */}
      <Image
        src="https://images.unsplash.com/photo-1687451223552-c7afa980bdad?w=1920&q=80"
        alt="Mt. Bachelor reflected in a Central Oregon lake"
        fill
        className="object-cover"
        sizes="100vw"
      />

      {/* Lighter overlay - let the mountain show through */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Warm accent glow */}
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center sm:px-8">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Ready to Get Started?
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
          Whether you&apos;re a property owner looking for peace of mind or a renter
          searching for your next Central Oregon home, we&apos;re here to help.
          Schedule a free, no-obligation consultation today.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/owners"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
            I&apos;m a Property Owner
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/listings"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 px-8 py-4 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            I&apos;m Looking for a Rental
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Contact info */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
          <a href="tel:5415480383" className="flex items-center gap-2 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            (541) 548-0383
          </a>
          <a href="mailto:info@highdesertpm.com" className="flex items-center gap-2 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            info@highdesertpm.com
          </a>
        </div>
      </div>
    </section>
  )
}
