'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useEffect, useCallback } from 'react'
import { SERVING_SINCE, YEARS_IN_BUSINESS } from '@/lib/constants'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const heroImages = [
  {
    // Three Sisters mountain range from Central Oregon — iconic view
    src: 'https://images.unsplash.com/photo-1718927445954-b050d18bc135?w=1920&q=80',
    alt: 'Three Sisters mountain range viewed from Central Oregon',
    blurDataURL:
      'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAQAgCdASoQAAwAAsBMJbACdAEO4c5+BkwAAP706qJ/7u/7TDdBhKdeSHmFqnaixuJ9CUAQh2TVUl174UQRnQpekg34GAAA',
  },
  {
    // Couple on paddleboards together on the water
    src: 'https://images.unsplash.com/photo-1633998125621-a28f4447252a?w=1920&q=80',
    alt: 'Couple paddleboarding together on a lake in Central Oregon',
    blurDataURL:
      'data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAAAwBACdASoQABYAPtFUo0uoJKMhsAgBABoJYwCdMoAC9ely4yRD/GJl5QAA9qfchxHuaMqAC9C2QdM2CVpMlejFE93Q2NVwfjYyPEGqi7veWBmRD+1TKpiktt/bi5L5+VgPrDmgVFaN5cDAAAA=',
  },
  {
    // Deschutes River flowing through lush green landscape
    src: 'https://images.unsplash.com/photo-1565846894054-51426d448b96?w=1920&q=80',
    alt: 'Deschutes River flowing through green landscape near Bend',
    blurDataURL:
      'data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAADQAQCdASoQAAwAAsBMJbACdADBaYuxAAD9ErSpdSNct5P4zNP8h8Z/MccUfsBPMEAAAA==',
  },
  {
    // Road into Bend with Cascade mountain backdrop
    src: 'https://images.unsplash.com/photo-1687451225150-e25d21b013cc?w=1920&q=80',
    alt: 'Road leading into Bend with snow-capped Cascade mountains',
    blurDataURL:
      'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADwAQCdASoQAAsAAsBMJZACdADwf0IfmgAA4f4U9Qeu5xE94W32TxKH27cHPP4QCpBfDLkoOvimhbot5iD7jxViAa6wx8F7YLNHSHbQvDCK6nY3B3pQAA==',
  },
  {
    // Misty morning river — moody Central Oregon vibes
    src: 'https://images.unsplash.com/photo-1676999163461-7d90a767c4fc?w=1920&q=80',
    alt: 'Misty morning on a river in Central Oregon',
    blurDataURL:
      'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADwAQCdASoQAAsAAsBMJYwCdADcaDuhvEAA/C5Ny+MMl1vi7INy3HjnaIry9LPvD5WeD+pYxc6rJZdsfhwvwAAA',
  },
  {
    // Two people kayaking on a clear lake
    src: 'https://images.unsplash.com/photo-1769197047973-265783a7f1f4?w=1920&q=80',
    alt: 'Two people kayaking together on a clear lake',
    blurDataURL:
      'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADwAQCdASoQAAsAAsBMJQBWAB6XcUDJwAAA/uoa8Olvd7uKmK6r4CKkwFvveKE76uAZ7sJ202ZqExF/UJ1fgt+jL5XNUAAA',
  },
  {
    // Three Sisters at sunset — golden hour glow
    src: 'https://images.unsplash.com/photo-1646528487362-962045c5eeb9?w=1920&q=80',
    alt: 'Three Sisters mountains at sunset in Central Oregon',
    blurDataURL:
      'data:image/webp;base64,UklGRsYAAABXRUJQVlA4ILoAAAAwBACdASoQAB0APtFUo0uoJKMhsAgBABoJZQDImdwLgTK8M8G+pGt6wAAA/vF6XUPFm8EwqvDsX3SjBTbqXSJQPsHLapK4A6AJ8QXSmZpqp0yHqAwVm8yl4Z5HDZr+1przfeDuQbqB/4QKKh4QclFzaLC5tNqqLYlplrkpArNoUm9qU2Uh5wTwb58nvLKuSqA2xyP+Iv+JksAok/Ej/+pB1QLPyQgajWX1veJoAAHXsTtKIw21hfYAAAA=',
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
  // Previous image stays mounted underneath while the new one fades in,
  // so combined opacity never dips mid-crossfade.
  const [prevIndex, setPrevIndex] = useState<number | null>(null)

  const goTo = useCallback((next: number) => {
    setCurrentIndex((current) => {
      if (next === current) return current
      setPrevIndex(current)
      return next
    })
  }, [])

  useEffect(() => {
    // Auto-rotation is vestibular motion — don't autoplay for users who
    // prefer reduced motion (manual dot navigation still works).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(
      () => goTo((currentIndex + 1) % heroImages.length),
      INTERVAL_MS,
    )
    return () => clearInterval(timer)
  }, [currentIndex, goTo])

  const current = heroImages[currentIndex]
  const prev = prevIndex === null ? null : heroImages[prevIndex]

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-primary">
      {/* Rotating background: outgoing image below, incoming fades in above */}
      {prev && (
        <Image
          key={`prev-${prev.src}`}
          src={prev.src}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          placeholder="blur"
          blurDataURL={prev.blurDataURL}
        />
      )}
      <AnimatePresence>
        <motion.div
          key={current.src}
          className="absolute inset-0"
          initial={{ opacity: prevIndex === null ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          onAnimationComplete={() => setPrevIndex(null)}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority={currentIndex === 0}
            className="object-cover"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={current.blurDataURL}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay - just enough for text readability, lets the image shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge className="mb-6 tracking-wide">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-light" />
            {content?.heroBadge ?? SERVING_SINCE}
          </Badge>

          <h1 className="font-heading text-display-sm text-white sm:text-display lg:text-display-xl">
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

          <p className="mt-6 max-w-2xl text-body-lg text-white/80 sm:text-xl">
            {content?.heroSubheading ??
              'Trusted by property owners across Bend, Redmond, Sisters, and beyond. We protect your investment and find exceptional tenants — so you can enjoy the Central Oregon lifestyle.'}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              href={content?.heroCTA1Link ?? '/owners'}
              variant="primary"
              size="lg"
              elevated
              withArrow
            >
              {content?.heroCTA1Label ?? 'For Property Owners'}
            </Button>
            <Button
              href={content?.heroCTA2Link ?? '/listings'}
              variant="glass"
              size="lg"
              withArrow
            >
              {content?.heroCTA2Label ?? 'Find a Rental Home'}
            </Button>
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
              {YEARS_IN_BUSINESS} Years in Business
            </div>
          </div>

          {/* Image dots indicator */}
          <div className="mt-6 flex">
            {heroImages.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="group/dot flex min-h-11 items-center p-2"
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                aria-current={i === currentIndex}
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentIndex
                      ? 'w-8 bg-accent'
                      : 'w-1.5 bg-white/40 group-hover/dot:bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
