import { cn } from './Card'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) => (
  <div className={cn('py-16 px-6 text-center', className)}>
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-bold text-ink font-outfit mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-muted font-medium max-w-sm mx-auto mb-6">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
)
