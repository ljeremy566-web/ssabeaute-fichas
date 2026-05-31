import React, { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 ease-[var(--ease-google-emphasized)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
          {
            'bg-primary text-on-primary hover:bg-primary-dark hover:scale-[1.01] focus:ring-primary/30 elevation-1 hover:elevation-2 active:scale-[0.98]': variant === 'primary',
            'bg-primary-light text-primary hover:bg-primary-light/80 hover:scale-[1.01] focus:ring-primary/20': variant === 'secondary',
            'border border-outline bg-transparent text-primary hover:bg-primary-light hover:scale-[1.01] focus:ring-primary/20': variant === 'outline',
            'bg-transparent hover:bg-primary-light text-primary focus:ring-primary/20': variant === 'ghost',
            'bg-error text-on-primary hover:bg-error/90 focus:ring-error/30 elevation-1 hover:elevation-2': variant === 'destructive',
            'h-9 px-4 text-xs': size === 'sm',
            'h-11 px-6 text-sm min-h-[48px]': size === 'md',
            'h-12 px-8 text-base min-h-[48px]': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
