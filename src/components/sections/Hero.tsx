'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { SERVING_SINCE } from '@/lib/constants'

const heroImages = [
  {
    // Three Sisters mountain range from Central Oregon — iconic view
    src: 'https://images.unsplash.com/photo-1718927445954-b050d18bc135?w=1920&q=80',
    alt: 'Three Sisters mountain range viewed from Central Oregon',
  },
  {
    // Couple on paddleboards together on the water
    src: 'https://images.unsplash.com/photo-1633998125621-a28f4447252a?w=1920&q=80',
    alt: 'Couple paddleboarding together on a lake in Central Oregon',
  },
  {
    // Deschutes River flowing through lush green landscape
    src: 'https://images.unsplash.com/photo-1565846894054-51426d448b96?w=1920&q=80',
    alt: 'Deschutes River flowing through green landscape near Bend',
  },
  {
    // Road into Bend with Cascade mountain backdrop
    src: 'https://images.unsplash.com/photo-1687451225150-e25d21b013cc?w=1920&q=80',
    alt: 'Road leading into Bend with snow-capped Cascade mountains',
  },
  {
    // Misty morning river — moody Central Oregon vibes
    src: 'https://images.unsplash.com/photo-1676999163461-7d90a767c4fc?w=1920&q=80',
    alt: 'Misty morning on a river in Central Oregon',
  },
  {
    // Two people kayaking on a clear lake
    src: 'https://images.unsplash.com/photo-1769197047973-265783a7f1f4?w=1920&q=80',
    alt: 'Two people kayaking together on a clear lake',
  },
  {
    // Three Sisters at sunset — golden hour glow
    src: 'https://images.unsplash.com/photo-1646528487362-962045c5eeb9?w=1920&q=80',
    alt: 'Three Sisters mountains at sunset in Central Oregon',
  },
]

const INTERVAL_MS = 20_000

interface HeroContent {
  heroBadge?: string | null
  heroHeading?: string | null
  heroSubheading?: string | null
  heroCTA1Label?: string | null
  heroCTA1Link?: string | null
  heroCTA2Label?: string | null
  heroCTA2Link?: string | null
}

export default function Hero({ content }: { content?: HeroContent | null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const advance = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length)
      setIsTransitioning(false)
    }, 1000) // 1s crossfade
  }, [])

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [advance])

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Rotating background images with crossfade */}
      {heroImages.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          priority={i === 0}
          className={`object-cover transition-opacity duration-[2000ms] ease-in-out ${
            i === currentIndex && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="100vw"
        />
      ))}

      {/* Ken Burns slow zoom effect on active image */}
      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
      `}</style>

      {/* Overlay - just enough for text readability, lets the image shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-light animate-pulse" />
            {content?.heroBadge ?? SERVING_SINCE}
          </div>

          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {content?.heroHeading ?? (
              <>
                Professional Property{' '}
                <span className="relative">
                  Management
                  <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent opacity-80" />
                </span>{' '}
                in Central Oregon
              </>
            )}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {content?.heroSubheading ??
              'Trusted by property owners across Bend, Redmond, Sisters, and beyond. We protect your investment and find exceptional tenants \u2014 so you can enjoy the Central Oregon lifestyle.'}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={content?.heroCTA1Link ?? '/owners'}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
            >
              {content?.heroCTA1Label ?? 'For Property Owners'}
              <svg aria-hidden="true"
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
              href={content?.heroCTA2Link ?? '/listings'}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-8 py-4 text-base font-semibold text-white border border-white/20 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              {content?.heroCTA2Label ?? 'Find a Rental Home'}
              <svg aria-hidden="true"
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

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              Hundreds of Properties Managed
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              4.9 Stars &middot; 100+ Owner Reviews
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              15+ Years Experience
            </div>
          </div>

          {/* Image dots indicator */}
          <div className="mt-8 flex gap-2">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentIndex(i)
                    setIsTransitioning(false)
                  }, 500)
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentIndex
                    ? 'w-8 bg-accent'
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Show image ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
