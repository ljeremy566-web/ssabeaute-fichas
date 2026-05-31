import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-surface-elevated rounded-2xl border border-border shadow-premium overflow-hidden transition-all duration-300 ease-out",
      className
    )}>
      {children}
    </div>
  )
}
