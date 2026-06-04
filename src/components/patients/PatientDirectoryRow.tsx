import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import type { PacienteDirectory } from '../../lib/pacienteService'
import { parseLocalDate } from '../../lib/dateUtils'
import { formatArgentinaPhoneDisplay } from '../../lib/phoneUtils'
import {
  consentimientoLabel,
  consultaActionLabel,
  consultaActionAriaLabel,
  type PatientDirectoryMeta,
} from '../../lib/patientDirectoryUtils'
import { cn } from '../../lib/cn'

interface PatientDirectoryRowProps {
  patient: PacienteDirectory
  meta: PatientDirectoryMeta
  onViewProfile: () => void
  onStartConsulta: () => void
}

function initials(name: string | null | undefined): string {
  const trimmed = (name ?? '?').trim()
  return trimmed.charAt(0).toUpperCase()
}

export function PatientDirectoryRow({
  patient,
  meta,
  onViewProfile,
  onStartConsulta,
}: PatientDirectoryRowProps) {
  const badgeLabel = consentimientoLabel(meta.consentimiento)
  const isFirmado = meta.consentimiento === 'firmado'
  const actionLabel = consultaActionLabel(meta)
  const actionAriaLabel = consultaActionAriaLabel(meta, patient.nombre_completo)

  return (
    <article
      className={cn(
        'group rounded-xl border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5',
        'hover:shadow-md hover:border-primary/30 transition-all',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        {/* Columna 1 — Identidad (clic → perfil) */}
        <button
          type="button"
          onClick={onViewProfile}
          className="flex items-center gap-3 min-w-0 flex-1 lg:max-w-[280px] text-left cursor-pointer rounded-lg -m-1 p-1 hover:bg-surface-container/60 transition-colors"
        >
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 font-bold text-sm font-outfit shadow-sm"
            aria-hidden
          >
            {initials(patient.nombre_completo)}
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold text-ink truncate font-outfit group-hover:text-primary transition-colors">
              {patient.nombre_completo ?? 'Sin nombre'}
            </p>
            <p className="text-xs text-muted truncate mt-0.5">
              {patient.telefono ? formatArgentinaPhoneDisplay(patient.telefono) : 'Sin teléfono'}
            </p>
          </div>
        </button>

        {/* Columna 2 — Estado clínico */}
        <div className="flex flex-col gap-1.5 lg:flex-1 lg:items-start lg:min-w-[180px]">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold font-outfit',
                isFirmado
                  ? 'bg-success-light text-success border border-success/10'
                  : meta.consentimiento === 'sin_consulta'
                    ? 'bg-surface-container text-muted border border-border'
                    : 'bg-warning-light text-warning border border-warning/10',
              )}
            >
              {badgeLabel}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold font-outfit transition-all duration-200',
                patient.permite_fotos_redes === true
                  ? 'bg-success-light text-success border border-success/15'
                  : patient.permite_fotos_redes === false
                    ? 'bg-error-light text-error border border-error/15'
                    : 'bg-surface-container text-muted border border-border',
              )}
            >
              {patient.permite_fotos_redes === true
                ? 'Redes: Sí'
                : patient.permite_fotos_redes === false
                  ? 'Redes: No'
                  : 'Redes: Pendiente'}
            </span>
          </div>
          <p className="text-xs text-muted">
            {meta.ultimaVisita
              ? `Última visita: ${format(parseLocalDate(meta.ultimaVisita), "d MMM yyyy", { locale: es })}`
              : 'Sin visitas registradas'}
          </p>
        </div>

        {/* Columna 3 — Acciones rápidas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:shrink-0 lg:justify-end w-full lg:w-auto">
          <button
            type="button"
            onClick={onViewProfile}
            className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-xl border border-border bg-surface text-sm font-semibold font-outfit text-ink-secondary hover:bg-surface-container hover:border-primary/20 transition-colors cursor-pointer w-full sm:w-auto"
          >
            Ver perfil
          </button>
          <button
            type="button"
            onClick={onStartConsulta}
            aria-label={actionAriaLabel}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-primary hover:bg-primary-dark text-on-primary text-sm font-semibold font-outfit shadow-sm transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
            {actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
