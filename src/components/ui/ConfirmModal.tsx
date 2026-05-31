import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  loadingLabel?: string
  details?: ReactNode
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  loadingLabel,
  details,
}: ConfirmModalProps) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, loading])

  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-google-fade">
      <div
        className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="relative w-full sm:max-w-[420px] bg-surface rounded-t-2xl sm:rounded-2xl elevation-3 animate-google-pop-in safe-x safe-bottom"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 min-h-[40px] min-w-[40px] flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-2 text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
              isDanger ? 'bg-error-light text-error' : 'bg-primary-light text-primary',
            )}
          >
            <AlertTriangle className="h-7 w-7" strokeWidth={2} />
          </div>

          <h2
            id="confirm-modal-title"
            className="text-lg font-semibold text-on-surface font-outfit leading-snug px-6"
          >
            {title}
          </h2>

          <p
            id="confirm-modal-message"
            className="mt-2 text-sm text-on-surface-variant leading-relaxed px-2"
          >
            {message}
          </p>

          {details && (
            <div className="mt-4 mx-1 rounded-xl border border-outline bg-surface-dim px-4 py-3 text-left text-sm text-on-surface-variant leading-relaxed">
              {details}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-5">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'destructive' : 'primary'}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
