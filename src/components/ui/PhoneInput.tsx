import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import {
  extractArgentinaNationalNumber,
  formatArgentinaNationalInput,
  normalizeArgentinaWhatsApp,
  stripPhoneDigits,
  validateArgentinaMobilePhone,
} from '../../lib/phoneUtils'

interface PhoneInputProps {
  value: string
  onChange: (normalized: string) => void
  disabled?: boolean
  className?: string
  error?: string
}

export function PhoneInput({ value, onChange, disabled, className, error }: PhoneInputProps) {
  const [display, setDisplay] = useState(() =>
    formatArgentinaNationalInput(extractArgentinaNationalNumber(value)),
  )

  useEffect(() => {
    setDisplay(formatArgentinaNationalInput(extractArgentinaNationalNumber(value)))
  }, [value])

  const handleChange = (raw: string) => {
    const digits = stripPhoneDigits(raw).slice(0, 10)
    const formatted = formatArgentinaNationalInput(digits)
    setDisplay(formatted)
    onChange(digits ? normalizeArgentinaWhatsApp(digits) : '')
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex items-center rounded-xl border bg-transparent transition-all overflow-hidden',
          'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary',
          error ? 'border-error' : 'border-outline',
        )}
      >
        <span className="shrink-0 pl-4 pr-2 py-2.5 text-sm font-medium text-on-surface-variant border-r border-outline bg-surface-dim select-none">
          +54 9
        </span>
        <input
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={display}
          onChange={e => handleChange(e.target.value)}
          placeholder="11 2254-2737"
          className="flex-1 min-w-0 px-3 py-2.5 min-h-[48px] text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none"
        />
      </div>
      {error && <span className="text-xs text-error mt-1 block">{error}</span>}
    </div>
  )
}

export function validatePhoneField(value: string): string | true {
  const err = validateArgentinaMobilePhone(value)
  return err ?? true
}
