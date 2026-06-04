import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { parseLocalDate } from '../../lib/dateUtils'
import type { FichaClinica } from '../../lib/fichaService'
import { getFichaStatusBadge, isConsultaComplete } from '../../lib/patientHistoryUtils'
import { isSoloRutinaFicha } from '../../lib/soloRutinaFicha'

interface PatientActivitySummaryProps {
  latestConsulta: FichaClinica | null
  latestRutina: FichaClinica | null
  incompleteConsulta: FichaClinica | null
  pacienteId: string
  tipoPielLabel?: string
}

export function PatientActivitySummary({
  latestConsulta,
  latestRutina,
  incompleteConsulta,
  pacienteId,
  tipoPielLabel,
}: PatientActivitySummaryProps) {
  const navigate = useNavigate()
  const consultaBadge = latestConsulta
    ? getFichaStatusBadge(latestConsulta, false)
    : null

  return (
    <Card className="p-4 sm:p-5 mb-6 bg-brand-light/25 border-brand-light/50">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted font-outfit mb-1">
            Última consulta
          </p>
          {latestConsulta ? (
            <>
              <p className="font-semibold text-ink">
                {format(parseLocalDate(latestConsulta.fecha_servicio), "d MMM yyyy", { locale: es })}
              </p>
              {consultaBadge && (
                <span
                  className={`inline-block mt-1 text-xs font-medium ${
                    consultaBadge.tone === 'success' ? 'text-success' : 'text-warning'
                  }`}
                >
                  {consultaBadge.label}
                </span>
              )}
            </>
          ) : (
            <p className="text-muted">Sin consultas presenciales</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted font-outfit mb-1">
            Última rutina enviada
          </p>
          {latestRutina ? (
            <p className="font-semibold text-ink">
              {format(parseLocalDate(latestRutina.fecha_servicio), "d MMM yyyy", { locale: es })}
            </p>
          ) : (
            <p className="text-muted">Sin rutinas registradas</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted font-outfit mb-1">
            Tipo de piel
          </p>
          <p className="font-semibold text-ink">{tipoPielLabel || '—'}</p>
        </div>
      </div>
      {incompleteConsulta && !isSoloRutinaFicha(incompleteConsulta) && !isConsultaComplete(incompleteConsulta) && (
        <div className="mt-4 pt-4 border-t border-brand-light/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-ink">
            Tienes una consulta incompleta del{' '}
            <strong>
              {format(parseLocalDate(incompleteConsulta.fecha_servicio), "d MMM yyyy", { locale: es })}
            </strong>
          </p>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            onClick={() =>
              navigate(`/admin/paciente/${pacienteId}/ficha/${incompleteConsulta.id}/editar`)
            }
          >
            Continuar consulta
          </Button>
        </div>
      )}
    </Card>
  )
}
