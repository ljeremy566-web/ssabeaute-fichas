import React from 'react'
import { cn } from './Card'

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ title, description, children, className }: FormSectionProps) => {
  return (
    <div className={cn('animate-slide-up-fade', className)}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink font-outfit">{title}</h2>
        {description && (
          <p className="text-sm text-muted mt-1 font-medium">{description}</p>
        )}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}
