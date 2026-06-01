import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { cn } from '../../lib/cn'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Select } from '../ui/Select'
import { DateInput } from '../ui/DateInput'
import { PhoneInput } from '../ui/PhoneInput'
import { calcAge } from '../../lib/dateUtils'

export interface PatientFormData {
  nombre_completo: string
  correo: string
  telefono: string
  fecha_nacimiento: string
  como_nos_conocio: string
  nacionalidad: string
  domicilio: string
}

export interface PatientRecord extends PatientFormData {
  id: string
  edad?: number
  fecha_registro?: string
}

interface PatientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PatientFormData) => Promise<void>
  initialData?: Partial<PatientRecord> | null
  isLoading?: boolean
}

const COMO_NOS_CONOCIO_OPTIONS = [
  'Redes Sociales',
  'Recomendación',
  'Google',
  'Publicidad',
  'Otro',
]

const COMO_NOS_CONOCIO_SELECT_OPTIONS = COMO_NOS_CONOCIO_OPTIONS.map(opt => ({
  value: opt,
  label: opt,
}))

export const PatientFormModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: PatientFormModalProps) => {
  const isEditing = !!initialData?.id

  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = useForm<PatientFormData>({
    defaultValues: {
      nombre_completo: '',
      correo: '',
      telefono: '',
      fecha_nacimiento: '',
      como_nos_conocio: '',
      nacionalidad: '',
      domicilio: '',
    },
  })

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        nombre_completo: initialData.nombre_completo || '',
        correo: initialData.correo || '',
        telefono: initialData.telefono || '',
        fecha_nacimiento: initialData.fecha_nacimiento || '',
        como_nos_conocio: initialData.como_nos_conocio || '',
        nacionalidad: initialData.nacionalidad || '',
        domicilio: initialData.domicilio || '',
      })
    } else if (isOpen) {
      reset({
        nombre_completo: '',
        correo: '',
        telefono: '',
        fecha_nacimiento: '',
        como_nos_conocio: '',
        nacionalidad: '',
        domicilio: '',
      })
    }
  }, [isOpen, initialData, reset])

  const fechaNacimiento = watch('fecha_nacimiento')
  const calculatedAge = useMemo(() => calcAge(fechaNacimiento), [fechaNacimiento])

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

  const handleFormSubmit = async (data: PatientFormData) => {
    await onSubmit(data)
  }

  const saving = isSubmitting || isLoading

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-on-surface/50" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl elevation-3 animate-slide-up-fade flex flex-col max-h-[92vh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3 shrink-0 safe-x">
          <h2 className="text-lg font-semibold text-on-surface font-outfit">
            {isEditing ? 'Editar paciente' : 'Nuevo paciente'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form id="patient-form" onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto px-4 sm:px-6 pb-3 overscroll-contain">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nombre completo *</label>
              <input
                {...register('nombre_completo', {
                  required: 'El nombre es obligatorio',
                  minLength: { value: 3, message: 'Ingresa al menos 3 caracteres' },
                })}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  errors.nombre_completo ? 'border-error' : 'border-outline'
                )}
                placeholder="Nombre y apellido"
              />
              {errors.nombre_completo && <span className="text-xs text-error mt-1 block">{errors.nombre_completo.message}</span>}
            </div>

            {/* Correo & Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Correo</label>
                <input
                  type="email"
                  {...register('correo', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Correo electrónico inválido',
                    },
                  })}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
                    errors.correo ? 'border-error' : 'border-outline',
                  )}
                  placeholder="correo@ejemplo.com"
                />
                {errors.correo && <span className="text-xs text-error mt-1 block">{errors.correo.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Teléfono (WhatsApp)</label>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.telefono?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Fecha nacimiento & Edad calculada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Fecha de nacimiento</label>
                <Controller
                  name="fecha_nacimiento"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Edad</label>
                <div className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-dim text-sm text-on-surface-variant">
                  {calculatedAge !== null ? `${calculatedAge} años` : '—'}
                </div>
              </div>
            </div>

            {/* Nacionalidad & Domicilio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Nacionalidad</label>
                <input
                  {...register('nacionalidad')}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ej: Mexicana"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5">Domicilio</label>
                <input
                  {...register('domicilio')}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ciudad, Estado"
                />
              </div>
            </div>

            {/* Cómo nos conoció */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5">¿Cómo nos conoció?</label>
              <Controller
                name="como_nos_conocio"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={COMO_NOS_CONOCIO_SELECT_OPTIONS}
                    placeholder="Seleccionar..."
                  />
                )}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-outline-variant safe-bottom safe-x">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 min-h-[48px] text-sm font-medium text-primary hover:bg-primary-light rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="patient-form"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-3 min-h-[48px] text-sm font-medium text-on-primary bg-primary hover:bg-primary-dark rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear paciente'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
