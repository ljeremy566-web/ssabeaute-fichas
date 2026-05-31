import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from './Card'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) => {
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full bg-white shadow-premium-lg animate-slide-up-fade flex flex-col',
          'rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh]',
          {
            'sm:max-w-md': size === 'sm',
            'sm:max-w-lg': size === 'md',
            'sm:max-w-xl': size === 'lg',
          }
        )}
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-lg font-bold text-ink font-outfit leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 p-2 -mr-1 -mt-1 text-muted hover:text-ink rounded-xl hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border bg-neutral-50/80 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
