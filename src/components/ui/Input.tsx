import React, { forwardRef } from 'react'
import { cn } from './Card'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  variant?: 'default' | 'form';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, optional, variant = 'default', placeholder, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col mb-5 last:mb-0">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <label className="text-sm font-semibold font-outfit text-ink">
            {label}
          </label>
          {optional && (
            <span className="text-[11px] font-medium text-muted uppercase tracking-wide">Opcional</span>
          )}
        </div>
        {hint && <p className="text-xs text-muted mb-2 leading-relaxed">{hint}</p>}
        <input
          ref={ref}
          placeholder={placeholder}
          className={cn(
            "w-full transition-all duration-200 text-sm placeholder:text-neutral-400 text-ink rounded-xl px-4 py-2.5 border border-neutral-200 bg-neutral-50/50",
            "focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand/15 focus:border-neutral-300",
            variant === 'form' && 'bg-brand-light/20 focus:bg-white',
            error && 'border-red-300 focus:ring-red-100',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-600 mt-1.5 font-medium">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
