import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserPlus, History } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { FichaClinica } from '../../lib/fichaService'
import { parseLocalDate } from '../../lib/dateUtils'

interface VisitContextPanelProps {
  mode: 'first' | 'followup'
  previousMonthFicha: FichaClinica | null
  previousMonthLabel: string
  className?: string
}

export function VisitContextPanel({
  mode,
  previousMonthFicha,
  previousMonthLabel,
  className,
}: VisitContextPanelProps) {
  if (mode === 'first') {
    return (
      <div className={cn('mb-6 p-4 rounded-xl border border-primary/20 bg-primary-light/60', className)}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface font-outfit">Primera consulta</h2>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Registra todos los datos de la paciente paso a paso: consentimiento, anamnesis, evaluación,
              mapa, evidencia y tratamientos de hoy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tr = previousMonthFicha?.tratamientos_realizados ?? {}
  const treatments = tr.tratamientos ?? []
  const visitDate = previousMonthFicha
    ? format(parseLocalDate(previousMonthFicha.fecha_servicio), "d 'de' MMMM yyyy", { locale: es })
    : null

  return (
    <div className={cn('mb-6 p-4 rounded-xl border border-outline bg-surface', className)}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-surface-container text-primary shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-on-surface font-outfit">Consulta de seguimiento</h2>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Anamnesis y evaluación precargadas desde la última visita. Revisa y actualiza si hubo cambios.
            El consentimiento y los tratamientos de hoy se registran en esta sesión.
          </p>

          <div className="mt-4 p-3 rounded-lg bg-surface-dim border border-outline-variant">
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wide mb-2">
              Tratamiento — {previousMonthLabel}
            </p>
            {previousMonthFicha && treatments.length > 0 ? (
              <>
                {visitDate && (
                  <p className="text-xs text-muted mb-2">Visita del {visitDate}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {treatments.map(t => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-light text-primary border border-primary/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {tr.tratamientos_notas && (
                  <p className="text-xs text-on-surface-variant mt-2 italic">{tr.tratamientos_notas}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                {previousMonthFicha
                  ? 'No hay tratamientos registrados en el mes anterior.'
                  : `Sin consultas en ${previousMonthLabel}. Revisa el historial del paciente si necesitas más contexto.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
