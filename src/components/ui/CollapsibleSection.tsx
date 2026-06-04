import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CollapsibleSectionProps {
  open: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
  /** Stagger inner fade slightly after height opens */
  animateContent?: boolean
}

/**
 * Height + opacity expand/collapse using CSS grid (no layout jump).
 */
export function CollapsibleSection({
  open,
  children,
  className,
  contentClassName,
  animateContent = true,
}: CollapsibleSectionProps) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-[var(--ease-google-emphasized)]',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        className,
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden min-h-0">
        <div
          className={cn(
            animateContent &&
              'transition-[opacity,transform] duration-300 ease-[var(--ease-google-emphasized)]',
            animateContent && (open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'),
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

interface CollapsibleChevronProps {
  open: boolean
  className?: string
}

export function CollapsibleChevron({ open, className }: CollapsibleChevronProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 text-muted transition-transform duration-300 ease-[var(--ease-google-emphasized)]',
        open && 'rotate-180',
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('w-5 h-5', className)}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}
