import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Resting card surface; `interactive` adds the hover lift. */
export default function Card({
  as: Tag = 'div',
  interactive = false,
  className,
  children,
  ...rest
}: {
  as?: ElementType
  interactive?: boolean
  className?: string
  children: ReactNode
} & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        'astra-card rounded-xl border border-neutral-200 bg-surface shadow-sm',
        interactive &&
          'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg motion-reduce:transform-none',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
