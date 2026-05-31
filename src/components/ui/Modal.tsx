import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  align?: 'start' | 'center'
}

export function ModalActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}>
      {children}
    </div>
  )
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  icon,
  align = 'start',
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const centered = align === 'center'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-google-fade">
      <div
        className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full bg-surface elevation-3 animate-google-pop-in flex flex-col',
          'rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh]',
          {
            'sm:max-w-md': size === 'sm',
            'sm:max-w-lg': size === 'md',
            'sm:max-w-xl': size === 'lg',
          },
        )}
      >
        <div
          className={cn(
            'relative shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 safe-x',
            centered && 'text-center',
          )}
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className={cn(
              'absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center',
              'text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer',
            )}
          >
            <X className="w-5 h-5" />
          </button>

          {icon && (
            <div className={cn('mb-4', centered ? 'flex justify-center' : '')}>
              {icon}
            </div>
          )}

          <h2
            id="modal-title"
            className={cn(
              'text-lg font-semibold text-on-surface font-outfit leading-snug pr-10',
              centered && 'px-6',
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                'text-sm text-on-surface-variant mt-2 leading-relaxed',
                centered && 'px-4',
              )}
            >
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4 overscroll-contain safe-x">
            {children}
          </div>
        )}

        {footer && (
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-outline safe-bottom safe-x">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
