import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import Container from './Container'

type Tone = 'white' | 'muted' | 'dark'

const toneClasses: Record<Tone, string> = {
  white: 'bg-surface',
  muted: 'bg-neutral-light',
  dark: 'bg-primary text-white',
}

/** Standard section rhythm: py-16 sm:py-24 + Container. */
export default function Section({
  tone = 'white',
  id,
  className,
  containerClassName,
  children,
}: {
  tone?: Tone
  id?: string
  className?: string
  containerClassName?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={cn('astra-section py-16 sm:py-24', toneClasses[tone], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
