'use client'

const testimonials = [
  {
    quote:
      'High Desert PM has managed our Bend rental for over 5 years. They found excellent tenants every time and handle maintenance before I even know about it. My property value has only gone up.',
    author: 'Mark & Sarah T.',
    context: 'Property Owners, NW Bend',
    rating: 5,
  },
  {
    quote:
      'Moving to Central Oregon from out of state was daunting, but the HDPM team made finding a rental home seamless. They were responsive, professional, and genuinely cared about matching us to the right place.',
    author: 'Jennifer L.',
    context: 'Tenant, Redmond',
    rating: 5,
  },
  {
    quote:
      'I own three rental properties in Sisters and Redmond. The financial reporting alone is worth it — I can see exactly how each property performs. The team really knows the Central Oregon market.',
    author: 'David K.',
    context: 'Multi-property Owner',
    rating: 5,
  },
  {
    quote:
      'After trying to self-manage for two years, switching to High Desert PM was the best decision I made. They reduced my vacancy rate and increased my rental income by 15%. Highly recommend.',
    author: 'Patricia W.',
    context: 'Property Owner, Bend',
    rating: 5,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-accent' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
            Testimonials
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
            Don&apos;t just take our word for it. Hear from the property owners and
            tenants who trust us with their Central Oregon homes.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative mt-16">
          <div
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="relative w-[85vw] max-w-md flex-shrink-0 snap-center first:ml-0 sm:w-[400px]"
              >
                <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-neutral-light p-8 shadow-sm">
                  {/* Decorative quote mark */}
                  <div className="absolute -top-3 left-6">
                    <span className="inline-block rounded-lg bg-accent px-3 py-1 font-heading text-2xl font-bold leading-none text-white">
                      &ldquo;
                    </span>
                  </div>

                  <StarRating rating={testimonial.rating} />

                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-neutral-dark">
                    {testimonial.quote}
                  </blockquote>

                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <p className="font-heading text-sm font-bold text-neutral-dark">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-neutral-mid">{testimonial.context}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll hint - subtle gradient fades on edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
        </div>

        {/* Scroll indicator dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === 0 ? 'w-6 bg-accent' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
