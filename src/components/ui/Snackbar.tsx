import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SnackbarProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Snackbar = ({ message, isOpen, onClose, duration = 3000 }: SnackbarProps) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[9998] animate-slide-up-fade bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-8">
      <div className="bg-ink text-white px-4 py-3.5 rounded-xl elevation-3 text-sm flex items-center justify-between gap-3 sm:min-w-[280px] sm:max-w-md font-sans mx-auto border border-white/10">
        <span className="font-medium leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="text-primary-muted hover:text-primary-light font-semibold focus:outline-none transition-colors shrink-0 min-h-[44px] px-2 -mr-2"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  )
}
