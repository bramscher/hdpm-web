import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Standard page gutter + max width. */
export default function Container({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  return (
    <Tag className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </Tag>
  )
}
