import React, { forwardRef } from 'react'
import { cn } from './Card'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  variant?: 'default' | 'form';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, optional, variant = 'default', placeholder, rows = 3, ...props }, ref) => {
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
        <textarea
          ref={ref}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            "w-full transition-all duration-200 text-sm placeholder:text-neutral-400 text-ink leading-relaxed rounded-xl px-4 py-3 border border-neutral-200 bg-neutral-50/50 resize-none",
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

Textarea.displayName = 'Textarea'
