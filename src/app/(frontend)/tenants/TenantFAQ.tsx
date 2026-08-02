'use client'

import { useState } from 'react'
import { defaultFaqs, type FAQItem } from './faq-data'

export default function TenantFAQ({ faqs }: { faqs?: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = faqs && faqs.length > 0 ? faqs : defaultFaqs

  return (
    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-neutral-light">
      {items.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
              aria-expanded={isOpen}
            >
              <span className="font-heading text-sm font-bold text-neutral-dark sm:text-base">
                {faq.question}
              </span>
              <svg aria-hidden="true"
                className={`h-5 w-5 flex-shrink-0 text-accent transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-96 pb-5' : 'max-h-0'
              }`}
            >
              <p className="px-6 text-sm leading-relaxed text-neutral-mid">
                {faq.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
