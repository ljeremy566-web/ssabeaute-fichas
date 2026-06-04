import { cn } from '../../lib/cn'
import { getPatientInitials } from '../../lib/patientHistoryUtils'

interface PatientAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-base',
  lg: 'w-16 h-16 text-lg',
}

export function PatientAvatar({ name, size = 'md', className }: PatientAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-brand text-on-primary font-bold font-outfit flex items-center justify-center shrink-0 shadow-sm',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getPatientInitials(name)}
    </div>
  )
}
