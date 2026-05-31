import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MENU_MAX_HEIGHT = 240
const MENU_GAP = 6

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 10001,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + MENU_GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove - MENU_GAP) }
        : { top: rect.bottom + MENU_GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow - MENU_GAP) }),
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
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-2.5 min-h-[48px] rounded-xl border border-outline bg-transparent text-sm text-on-surface text-left transition-all duration-300 ease-[var(--ease-google-emphasized)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 disabled:pointer-events-none hover:bg-surface-container/30',
          isOpen && 'border-primary ring-2 ring-primary/20 bg-surface shadow-xs',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-on-surface-variant/50')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-300 ease-[var(--ease-google-emphasized)]',
            isOpen && 'rotate-180 text-primary',
          )}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className="bg-surface border border-outline rounded-xl elevation-3 py-1.5 overflow-y-auto animate-google-pop-in shadow-lg"
        >
          {options.length === 0 ? (
            <div className="px-4 py-2 text-xs text-on-surface-variant/50 text-center">
              Sin opciones
            </div>
          ) : (
            options.map(option => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-on-surface hover:bg-surface-container',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0 animate-scale-in" />}
                </button>
              )
            })
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
