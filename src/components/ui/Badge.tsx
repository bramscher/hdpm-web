import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'glass-dark' | 'glass-light' | 'solid'
type Size = 'sm' | 'md'

/* Text on translucent surfaces: one weight step heavier, ≥ /90 opacity. */
const variantClasses: Record<Variant, string> = {
  'glass-dark': 'border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm',
  'glass-light': 'bg-white/95 text-neutral-dark shadow-md backdrop-blur-sm',
  solid: 'bg-accent-dark/90 text-white backdrop-blur-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
}

export default function Badge({
  variant = 'glass-dark',
  size = 'md',
  className,
  children,
}: {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
