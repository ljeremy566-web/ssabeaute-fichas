import React from 'react'
import { cn } from '../../lib/cn'

interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
}

export const Fab = ({ icon, label, className, ...props }: FabProps) => {
  return (
    <button
      className={cn(
        'fixed z-40 flex items-center justify-center gap-2 rounded-2xl elevation-2 bg-primary-light text-primary hover:elevation-3 active:scale-95 transition-all duration-200',
        /* Encima del bottom nav en móvil, safe area incluida */
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4',
        'md:bottom-8 md:right-8',
        label ? 'px-4 py-3.5 min-h-[48px]' : 'p-3.5 min-h-[48px] min-w-[48px]',
        className
      )}
      {...props}
    >
      {icon}
      {label && <span className="text-sm font-semibold font-outfit">{label}</span>}
    </button>
  )
}
