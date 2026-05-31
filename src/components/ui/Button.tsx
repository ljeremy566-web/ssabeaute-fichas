import React, { forwardRef } from 'react'
import { cn } from './Card'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          {
            'bg-brand text-white hover:bg-brand-dark focus:ring-brand/30': variant === 'primary',
            'bg-ink text-white hover:bg-ink-secondary focus:ring-ink/30': variant === 'secondary',
            'border border-ink/20 bg-transparent text-ink hover:bg-neutral-50 focus:ring-brand/20': variant === 'outline',
            'bg-transparent hover:bg-brand-light text-ink focus:ring-brand/20': variant === 'ghost',
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
