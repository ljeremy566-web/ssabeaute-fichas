import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardPlus, Loader2, ArrowRight } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BackNav } from '../components/ui/BackNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PatientAvatar } from '../components/patients/PatientAvatar'
import { getPacienteById } from '../lib/pacienteService'
import { getFichasByPacienteId } from '../lib/fichaService'
import {
  partitionFichas,
  getIncompleteConsultas,
  getFichaDisplayTitle,
  getFichaStatusBadge,
  shouldSkipConsultationStart,
  HISTORY_INITIAL_VISIBLE,
  HISTORY_LOAD_MORE_STEP,
} from '../lib/patientHistoryUtils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate } from '../lib/dateUtils'
import { FICHA_WIZARD_STEP_LABELS, getPendingWizardSteps } from '../lib/fichaUtils'

export const ConsultationStartPage = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [patientName, setPatientName] = useState('')
  const [incomplete, setIncomplete] = useState<ReturnType<typeof getIncompleteConsultas>>([])
  const [visibleIncomplete, setVisibleIncomplete] = useState(HISTORY_INITIAL_VISIBLE)

  useEffect(() => {
    if (!pacienteId) return
    let aborted = false

    void (async () => {
      setLoading(true)
      try {
        const [patient, fichas] = await Promise.all([
          getPacienteById(pacienteId),
          getFichasByPacienteId(pacienteId),
        ])
        if (aborted) return
        if (!patient) {
          navigate('/admin')
          return
        }
        setPatientName(patient.nombre_completo ?? 'Paciente')
        const { consultas } = partitionFichas(fichas)
        if (shouldSkipConsultationStart(consultas)) {
          navigate(`/admin/paciente/${pacienteId}/ficha/nueva`, { replace: true })
          return
        }
        setIncomplete(getIncompleteConsultas(consultas))
      } catch {
        if (!aborted) navigate('/admin')
      } finally {
        if (!aborted) setLoading(false)
      }
    })()

    return () => { aborted = true }
  }, [pacienteId, navigate])

  const visibleList = useMemo(
    () => incomplete.slice(0, visibleIncomplete),
    [incomplete, visibleIncomplete],
  )

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (!pacienteId) return null

  return (
    <AppShell>
      <BackNav
        to={`/admin/paciente/${pacienteId}`}
        label="Volver al paciente"
        className="mb-6"
      />

      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <PatientAvatar name={patientName} size="md" />
          <div>
            <h1 className="text-xl font-bold text-ink font-outfit">Iniciar consulta</h1>
            <p className="text-sm text-muted">{patientName}</p>
          </div>
        </div>

        {incomplete.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-ink font-outfit mb-3">
              Consultas incompletas
            </h2>
            <div className="space-y-2">
              {visibleList.map(ficha => {
                const badge = getFichaStatusBadge(ficha, false)
                const pending = getPendingWizardSteps(ficha)
                return (
                  <Card key={ficha.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-brand">
                        {format(parseLocalDate(ficha.fecha_servicio), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-sm font-medium text-ink line-clamp-1 mt-0.5">
                        {getFichaDisplayTitle(ficha, false)}
                      </p>
                      <p className="text-xs text-warning mt-1">{badge.label}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {pending.slice(0, 3).map(step => (
                          <span
                            key={step}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-warning-light/40 text-warning"
                          >
                            {FICHA_WIZARD_STEP_LABELS[step]}
                          </span>
                        ))}
                        {pending.length > 3 && (
                          <span className="text-[10px] text-muted">+{pending.length - 3}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1"
                      onClick={() =>
                        navigate(`/admin/paciente/${pacienteId}/ficha/${ficha.id}/editar`)
                      }
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                )
              })}
            </div>
            {visibleIncomplete < incomplete.length && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => setVisibleIncomplete(c => c + HISTORY_LOAD_MORE_STEP)}
              >
                Ver más incompletas
              </Button>
            )}
          </section>
        )}

        <Card className="p-5 border-brand-light/50 bg-brand-light/20">
          <h2 className="text-sm font-semibold text-ink font-outfit mb-2">Nueva consulta de hoy</h2>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            Se precargará anamnesis y evaluación desde la última consulta presencial. El consentimiento
            y los datos de hoy se registran en esta sesión.
          </p>
          <Button
            variant="primary"
            className="w-full gap-2 min-h-[48px]"
            onClick={() => navigate(`/admin/paciente/${pacienteId}/ficha/nueva`)}
          >
            <ClipboardPlus className="w-4 h-4" />
            Registrar visita de hoy
          </Button>
        </Card>

        <p className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate(`/admin/paciente/${pacienteId}`)}
            className="text-sm text-brand font-semibold hover:underline cursor-pointer"
          >
            Ver historial completo
          </button>
        </p>
      </div>
    </AppShell>
  )
}
