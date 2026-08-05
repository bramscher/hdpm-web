import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'glass' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const baseClasses =
  'group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ease-spring hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:duration-75 motion-reduce:transform-none'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md',
  glass:
    'border border-white/20 bg-white/10 text-white shadow-lg shadow-black/20 backdrop-blur-sm hover:bg-white/20 hover:shadow-xl',
  'outline-light':
    'border border-white/30 text-white/90 hover:border-accent hover:text-accent',
}

/* Deeper shadows for buttons sitting on imagery (hero, CTA banners). */
const elevatedClasses: Partial<Record<Variant, string>> = {
  primary: 'shadow-lg shadow-black/20 hover:shadow-xl',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

type CommonProps = {
  variant?: Variant
  size?: Size
  /** Deeper shadows for buttons on imagery. Glass is always elevated. */
  elevated?: boolean
  /** Trailing chevron that nudges right on hover. */
  withArrow?: boolean
  className?: string
  children: ReactNode
}

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string
  }

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined
  }

export type ButtonProps = ButtonAsLink | ButtonAsButton

export default function Button({
  variant = 'primary',
  size = 'md',
  elevated = false,
  withArrow = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    elevated && elevatedClasses[variant],
    sizeClasses[size],
    className,
  )

  const content = (
    <>
      {children}
      {withArrow && <ArrowIcon />}
    </>
  )

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchorProps } = rest as ButtonAsLink
    // Plain <a> for external / non-route destinations, next/link otherwise
    if (/^(https?:|tel:|mailto:)/.test(href)) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} {...(rest as ButtonAsButton)}>
      {content}
    </button>
  )
}
