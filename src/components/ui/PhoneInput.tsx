import { cn } from '../../lib/cn'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  error?: string
}

export function PhoneInput({ value, onChange, disabled, className, error }: PhoneInputProps) {
  return (
    <div className={cn('w-full', className)}>
      <input
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ej: +54 9 11 2345-6789"
        className={cn(
          'w-full px-4 py-2.5 min-h-[48px] rounded-xl border text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          error ? 'border-error' : 'border-outline',
        )}
      />
      {error && <span className="text-xs text-error mt-1 block">{error}</span>}
    </div>
  )
}

export function validatePhoneField(_value: string): string | true {
  return true
}
