import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2, BookOpen } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PatientMoreActionsMenuProps {
  onEnviarRutina?: () => void
  onEliminar?: () => void
  showEnviarRutina?: boolean
  className?: string
}

export function PatientMoreActionsMenu({
  onEnviarRutina,
  onEliminar,
  showEnviarRutina = true,
  className,
}: PatientMoreActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="p-2.5 rounded-xl border border-border text-muted hover:text-ink hover:bg-surface-container min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 min-w-[180px] py-1 rounded-xl border border-border bg-surface shadow-lg"
        >
          {showEnviarRutina && onEnviarRutina && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { onEnviarRutina(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-surface-dim cursor-pointer text-left"
            >
              <BookOpen className="w-4 h-4 text-brand" />
              Enviar rutina
            </button>
          )}
          {onEliminar && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { onEliminar(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer text-left"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar paciente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
