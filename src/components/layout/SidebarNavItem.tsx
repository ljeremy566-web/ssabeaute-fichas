import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SidebarNavItemProps {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
}

export function SidebarNavItem({ label, icon, active = false, onClick }: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 pl-6 pr-4 py-3.5 text-sm font-semibold font-outfit transition-colors duration-200 cursor-pointer min-h-[48px] group',
        active
          ? 'sidebar-nav-active text-ink'
          : 'text-sidebar-muted hover:text-white'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 transition-colors duration-200',
          active ? 'text-primary' : 'text-sidebar-muted group-hover:text-white'
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
