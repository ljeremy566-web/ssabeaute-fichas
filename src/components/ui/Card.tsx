import React from 'react'
import { cn } from '../../lib/cn'

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-surface rounded-xl border border-outline elevation-1 overflow-hidden transition-all duration-200 ease-out",
      className
    )}>
      {children}
    </div>
  )
}
