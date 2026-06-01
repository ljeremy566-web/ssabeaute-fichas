import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  formatDisplayDate,
  parseFlexibleDate,
  parseLocalDate,
  toIsoDate,
} from '../../lib/dateUtils'

interface DateInputProps {
  value: string
  onChange: (isoDate: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minYear?: number
  maxDate?: Date
  error?: string
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), 'MMMM', { locale: es }),
)

export function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  className,
  minYear = 1920,
  maxDate = new Date(),
  error,
}: DateInputProps) {
  const [text, setText] = useState(() => formatDisplayDate(value))
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return parseLocalDate(value)
    const d = new Date()
    d.setFullYear(d.getFullYear() - 25)
    return d
  })
  const [yearSearch, setYearSearch] = useState('')
  const [inputError, setInputError] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  const maxYear = maxDate.getFullYear()

  useEffect(() => {
    setText(formatDisplayDate(value))
    if (value) setViewDate(parseLocalDate(value))
    setInputError('')
  }, [value])

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = maxYear; y >= minYear; y--) list.push(y)
    const q = yearSearch.trim()
    if (!q) return list
    return list.filter(y => String(y).includes(q))
  }, [maxYear, minYear, yearSearch])

  const visibleYears = useMemo(() => {
    if (yearSearch.trim()) return years.slice(0, 16)
    const center = viewDate.getFullYear()
    const result: number[] = []
    for (let y = center + 2; y >= center - 10; y--) {
      if (y >= minYear && y <= maxYear) result.push(y)
    }
    return result
  }, [years, yearSearch, viewDate, minYear, maxYear])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [viewDate])

  const updatePosition = useCallback(() => {
    const el = inputRef.current ?? triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, 320)
    const left = Math.min(rect.left, window.innerWidth - width - 12)
    const spaceBelow = window.innerHeight - rect.bottom
    const popoverHeight = 420
    const openUpward = spaceBelow < popoverHeight && rect.top > spaceBelow

    setMenuStyle({
      position: 'fixed',
      left: Math.max(12, left),
      width,
      zIndex: 10001,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setIsOpen(false)
      setYearSearch('')
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const commitText = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) {
      onChange('')
      setInputError('')
      return true
    }
    const parsed = parseFlexibleDate(trimmed)
    if (!parsed) {
      setInputError('Fecha inválida. Usa dd/mm/aaaa')
      return false
    }
    if (parsed > maxDate) {
      setInputError('La fecha no puede ser futura')
      return false
    }
    if (parsed.getFullYear() < minYear) {
      setInputError(`Año mínimo: ${minYear}`)
      return false
    }
    const iso = toIsoDate(parsed)
    onChange(iso)
    setText(formatDisplayDate(iso))
    setViewDate(parsed)
    setInputError('')
    return true
  }, [text, onChange, maxDate, minYear])

  const selectDate = (date: Date) => {
    if (date > maxDate) return
    const iso = toIsoDate(date)
    onChange(iso)
    setText(formatDisplayDate(iso))
    setViewDate(date)
    setInputError('')
    setIsOpen(false)
    setYearSearch('')
  }

  const openPicker = () => {
    if (disabled) return
    if (value) setViewDate(parseLocalDate(value))
    setYearSearch('')
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (commitText()) setIsOpen(false)
    }
    if (e.key === 'Escape') {
      setText(formatDisplayDate(value))
      setInputError('')
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={e => {
            setText(e.target.value)
            setInputError('')
          }}
          onBlur={() => { commitText() }}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputError('')}
          className={cn(
            'w-full px-4 py-2.5 pr-11 min-h-[48px] rounded-xl border text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            (error || inputError) ? 'border-error' : 'border-outline',
          )}
        />
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={openPicker}
          aria-label="Abrir calendario"
          className="absolute right-1.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-light/60 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {(error || inputError) && (
        <span className="text-xs text-error mt-1 block">{error || inputError}</span>
      )}

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={menuStyle}
          className="bg-surface border border-outline rounded-2xl elevation-3 shadow-xl animate-google-pop-in overflow-hidden"
        >
          {/* Month / year navigation */}
          <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-outline-variant">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={viewDate.getMonth()}
              onChange={e => setViewDate(d => new Date(d.getFullYear(), Number(e.target.value), 1))}
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-outline text-sm text-on-surface bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year search */}
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-dim">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={yearSearch}
                onChange={e => setYearSearch(e.target.value.replace(/\D/g, ''))}
                placeholder="Buscar año (ej. 1990)"
                className="w-full px-3 py-2 pr-8 rounded-lg border border-outline text-sm text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {yearSearch && (
                <button
                  type="button"
                  onClick={() => setYearSearch('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {visibleYears.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setViewDate(d => new Date(year, d.getMonth(), 1))}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    viewDate.getFullYear() === year
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface border border-outline text-on-surface hover:bg-surface-container',
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase text-on-surface-variant py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map(day => {
                const inMonth = isSameMonth(day, viewDate)
                const selected = value ? isSameDay(day, parseLocalDate(value)) : false
                const disabledDay = day > maxDate
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => selectDate(day)}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer',
                      !inMonth && 'text-on-surface-variant/40',
                      inMonth && !selected && !disabledDay && 'text-on-surface hover:bg-surface-container',
                      isToday(day) && !selected && 'ring-1 ring-primary/40',
                      selected && 'bg-primary text-on-primary font-semibold',
                      disabledDay && 'opacity-30 pointer-events-none',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer shortcuts */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-outline-variant bg-surface-dim">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setText('')
                setInputError('')
                setIsOpen(false)
              }}
              className="text-xs font-medium text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-lg hover:bg-surface-container cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                if (commitText()) setIsOpen(false)
              }}
              className="text-xs font-semibold text-primary hover:bg-primary-light px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Aplicar texto
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
