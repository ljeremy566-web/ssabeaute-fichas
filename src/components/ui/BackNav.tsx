import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'

interface BackNavProps {
  to: string
  label?: string
  className?: string
}

export function BackNav({
  to,
  label = 'Volver al directorio',
  className,
}: BackNavProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={cn(
        'inline-flex items-center gap-2 min-h-[44px] px-1 -ml-1',
        'text-sm font-semibold font-outfit text-muted hover:text-primary',
        'rounded-xl hover:bg-primary-light/50 transition-colors cursor-pointer',
        className,
      )}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{label}</span>
    </button>
  )
}
