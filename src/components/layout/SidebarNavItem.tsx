import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SidebarNavItemProps {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
  compact?: boolean
}

export function SidebarNavItem({
  label,
  icon,
  active = false,
  onClick,
  compact = false,
}: SidebarNavItemProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative w-full flex items-center justify-center p-3 min-h-[48px] transition-colors duration-200 cursor-pointer group',
          active
            ? 'sidebar-nav-active text-ink'
            : 'text-sidebar-muted hover:text-white hover:bg-white/10',
        )}
      >
        <span
          className={cn(
            'flex-shrink-0 transition-colors duration-200',
            active ? 'text-primary' : 'text-sidebar-muted group-hover:text-white',
          )}
        >
          {icon}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 pl-6 pr-4 py-3.5 text-sm font-semibold font-outfit transition-colors duration-200 cursor-pointer min-h-[48px] group',
        active
          ? 'sidebar-nav-active text-ink'
          : 'text-sidebar-muted hover:text-white',
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 transition-colors duration-200',
          active ? 'text-primary' : 'text-sidebar-muted group-hover:text-white',
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
