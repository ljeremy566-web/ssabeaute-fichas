import React, { forwardRef } from 'react'
import { cn } from '../../lib/cn'

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
          <label className="text-sm font-semibold font-outfit text-on-surface">
            {label}
          </label>
          {optional && (
            <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wide">Opcional</span>
          )}
        </div>
        {hint && <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">{hint}</p>}
        <input
          ref={ref}
          placeholder={placeholder}
          className={cn(
            "w-full transition-all duration-200 text-sm placeholder:text-on-surface-variant/60 text-on-surface rounded-xl px-4 py-2.5 border border-outline bg-surface",
            "focus:outline-none focus:bg-surface focus:ring-0 focus:border-primary focus:border-2 focus:-m-px",
            variant === 'form' && 'bg-surface-container focus:bg-surface',
            error && 'border-error focus:border-error',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error mt-1.5 font-medium">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
