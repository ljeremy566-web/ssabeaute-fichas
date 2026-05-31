import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, UserPlus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getAllPacientes, createPaciente, type Paciente } from '../../lib/pacienteService'
import { PatientFormModal, type PatientFormData } from './PatientFormModal'
import { calcAge } from '../../lib/dateUtils'
import { formatArgentinaPhoneDisplay } from '../../lib/phoneUtils'

interface PatientPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (pacienteId: string) => void
}

export const PatientPickerModal = ({ isOpen, onClose, onSelect }: PatientPickerModalProps) => {
  const [patients, setPatients] = useState<Paciente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAllPacientes()
        if (!cancelled) setPatients(data)
      } catch {
        if (!cancelled) setError('No se pudieron cargar los pacientes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen])

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

  const handleCreatePatient = async (data: PatientFormData) => {
    setCreating(true)
    try {
      const edad = data.fecha_nacimiento ? calcAge(data.fecha_nacimiento) : undefined
      const created = await createPaciente({
        nombre_completo: data.nombre_completo,
        telefono: data.telefono,
        ...(data.correo ? { correo: data.correo } : {}),
        ...(data.fecha_nacimiento ? { fecha_nacimiento: data.fecha_nacimiento } : {}),
        ...(edad != null ? { edad } : {}),
        ...(data.como_nos_conocio ? { como_nos_conocio: data.como_nos_conocio } : {}),
        ...(data.nacionalidad ? { nacionalidad: data.nacionalidad } : {}),
        ...(data.domicilio ? { domicilio: data.domicilio } : {}),
      })
      setCreateOpen(false)
      onSelect(created.id)
      onClose()
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  const filtered = patients.filter(p => {
    const name = p.nombre_completo?.toLowerCase() ?? ''
    const phone = p.telefono ?? ''
    const q = searchTerm.toLowerCase()
    return name.includes(q) || phone.includes(searchTerm)
  })

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="absolute inset-0 bg-on-surface/50" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl elevation-3 animate-slide-up-fade flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3 shrink-0 safe-x">
            <h2 className="text-lg font-semibold text-on-surface font-outfit">Seleccionar paciente</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-6 pb-3 shrink-0 space-y-2 safe-x">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium text-primary bg-primary-light hover:bg-primary-light/80 rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo paciente
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 safe-bottom overscroll-contain">
            {loading && (
              <p className="text-sm text-muted text-center py-8">Cargando pacientes...</p>
            )}
            {error && (
              <p className="text-sm text-error text-center py-8">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                {searchTerm ? 'Sin resultados' : 'No hay pacientes registrados'}
              </p>
            )}
            {!loading && !error && filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onSelect(p.id); onClose() }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 min-h-[56px] rounded-xl text-left transition-colors cursor-pointer',
                  'hover:bg-primary-light/50 active:bg-primary-light'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 font-bold text-sm font-outfit">
                  {(p.nombre_completo ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface truncate font-outfit">{p.nombre_completo}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {p.telefono ? formatArgentinaPhoneDisplay(p.telefono) : 'Sin teléfono'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PatientFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreatePatient}
        isLoading={creating}
      />
    </>,
    document.body
  )
}
