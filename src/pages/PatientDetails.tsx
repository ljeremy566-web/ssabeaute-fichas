import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageCircle, Calendar, Activity, User as UserIcon, Pencil, Trash2, Download, ClipboardPlus } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BackNav } from '../components/ui/BackNav'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Snackbar } from '../components/ui/Snackbar'
import { PatientDetailsSkeleton } from '../components/ui/Skeleton'
import { PatientFormModal, type PatientFormData } from '../components/patients/PatientFormModal'
import { cn } from '../lib/cn'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadRutinasPdf, downloadFichaPdf, shareViaWhatsApp } from '../lib/generateFichaPdf'
import { getFichasByPacienteId, deleteFichaWithAssets, type FichaClinica } from '../lib/fichaService'
import { getPacienteById, updatePaciente, deletePaciente, type Paciente } from '../lib/pacienteService'
import { calcAge, formatLocalDate, parseLocalDate } from '../lib/dateUtils'
import { formatArgentinaPhoneDisplay } from '../lib/phoneUtils'
import {
  FICHA_WIZARD_STEP_LABELS,
  FICHA_WIZARD_STEPS,
  getPendingWizardSteps,
} from '../lib/fichaUtils'

type TabId = 'datos' | 'antecedentes' | 'diagnostico'

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 border-b border-border last:border-0">
    <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">{label}</span>
    <span className="text-sm font-medium text-ink leading-relaxed">{value || '—'}</span>
  </div>
)

function formatChipList(items?: string[]): string {
  return items?.length ? items.join(', ') : ''
}

export const PatientDetails = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Paciente | null>(null)
  const [fichas, setFichas] = useState<FichaClinica[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('datos')
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [downloadingFichaId, setDownloadingFichaId] = useState<string | null>(null)
  const [deleteFichaTarget, setDeleteFichaTarget] = useState<FichaClinica | null>(null)
  const [deletingFicha, setDeletingFicha] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)
  const [deletePatientOpen, setDeletePatientOpen] = useState(false)
  const [deletingPatient, setDeletingPatient] = useState(false)

  const latestFicha = fichas[0] ?? null

  const fetchData = async () => {
    if (!pacienteId) return
    setLoading(true)
    setFetchError('')
    try {
      const [patientData, fichasData] = await Promise.all([
        getPacienteById(pacienteId),
        getFichasByPacienteId(pacienteId),
      ])
      if (!patientData) {
        setFetchError('Paciente no encontrado')
        setPatient(null)
      } else {
        setPatient(patientData)
      }
      setFichas(fichasData)
    } catch {
      setFetchError('Error al cargar los datos del paciente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!pacienteId) return
    let aborted = false
    void (async () => {
      await fetchData()
      if (aborted) return
    })()
    return () => { aborted = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  const displayAge = useMemo(() => {
    if (!patient) return '—'
    const fromBirth = calcAge(patient.fecha_nacimiento)
    if (fromBirth != null) return `${fromBirth} años`
    if (patient.edad != null) return `${patient.edad} años`
    return '—'
  }, [patient])

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message)
    setSnackbarOpen(true)
  }

  const handleSendWA = (ficha?: FichaClinica) => {
    if (!patient?.telefono) {
      showSnackbar('El paciente no tiene teléfono registrado')
      return
    }
    shareViaWhatsApp(
      patient.telefono,
      patient.nombre_completo ?? 'paciente',
      ficha?.fecha_servicio,
    )
    showSnackbar('Abriendo WhatsApp...')
  }

  const handleDownloadFichaPdf = async (ficha: FichaClinica) => {
    if (!patient) return
    setDownloadingFichaId(ficha.id)
    try {
      await downloadRutinasPdf(
        {
          nombre_completo: patient.nombre_completo ?? '',
          telefono: patient.telefono ?? undefined,
        },
        {
          fecha_servicio: ficha.fecha_servicio,
          cuidados_faciales: ficha.cuidados_faciales,
        }
      )
      showSnackbar('PDF de rutinas descargado')
    } catch (err) {
      console.error(err)
      showSnackbar('Error al generar el PDF')
    } finally {
      setDownloadingFichaId(null)
    }
  }

  const handleDownloadFichaCompletaPdf = async () => {
    if (!patient || !latestFicha) return
    setDownloadingFichaId('completa')
    try {
      await downloadFichaPdf(
        {
          nombre_completo: patient.nombre_completo ?? '',
          telefono: patient.telefono ?? undefined,
          edad: calcAge(patient.fecha_nacimiento) ?? patient.edad ?? undefined,
        },
        {
          fecha_servicio: latestFicha.fecha_servicio,
          motivo_consulta: latestFicha.motivo_consulta ?? undefined,
          datos_medicos: latestFicha.datos_medicos,
          cuidados_faciales: latestFicha.cuidados_faciales,
          evaluacion_profesional: latestFicha.evaluacion_profesional,
          tratamientos_realizados: latestFicha.tratamientos_realizados,
          ruta_mapa_facial: latestFicha.ruta_mapa_facial,
          ruta_foto_antes: latestFicha.ruta_foto_antes,
          ruta_foto_despues: latestFicha.ruta_foto_despues,
          ruta_firma: latestFicha.ruta_firma,
        }
      )
      showSnackbar('Ficha completa descargada')
    } catch (err) {
      console.error(err)
      showSnackbar('Error al generar el PDF de la ficha completa')
    } finally {
      setDownloadingFichaId(null)
    }
  }

  const handleDeleteFicha = async () => {
    if (!deleteFichaTarget) return
    setDeletingFicha(true)
    try {
      await deleteFichaWithAssets(deleteFichaTarget)
      setDeleteFichaTarget(null)
      showSnackbar('Consulta clínica eliminada')
      void fetchData()
    } catch {
      showSnackbar('Error al eliminar la consulta')
    } finally {
      setDeletingFicha(false)
    }
  }

  const handleUpdatePatient = async (data: PatientFormData) => {
    if (!pacienteId) return
    setSavingPatient(true)
    try {
      const edad = data.fecha_nacimiento ? calcAge(data.fecha_nacimiento) : undefined
      const updated = await updatePaciente(pacienteId, {
        nombre_completo: data.nombre_completo,
        telefono: data.telefono,
        correo: data.correo || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        como_nos_conocio: data.como_nos_conocio || null,
        nacionalidad: data.nacionalidad || null,
        domicilio: data.domicilio || null,
        ...(edad != null ? { edad } : {}),
      })
      setPatient(updated)
      setEditModalOpen(false)
      showSnackbar('Paciente actualizado')
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al actualizar paciente')
    } finally {
      setSavingPatient(false)
    }
  }

  const handleDeletePatient = async () => {
    if (!pacienteId) return
    setDeletingPatient(true)
    try {
      await deletePaciente(pacienteId)
      setDeletePatientOpen(false)
      navigate('/admin')
    } catch {
      showSnackbar('Error al eliminar paciente')
      setDeletingPatient(false)
    }
  }

  const tabs: { id: TabId; label: string; shortLabel: string; icon: ReactNode }[] = [
    { id: 'datos', label: 'Datos', shortLabel: 'Datos', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'antecedentes', label: 'Antecedentes', shortLabel: 'Antec.', icon: <Activity className="w-4 h-4" /> },
    { id: 'diagnostico', label: 'Tipo de piel', shortLabel: 'Piel', icon: <Activity className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <AppShell>
        <PatientDetailsSkeleton />
      </AppShell>
    )
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="text-center py-16 text-muted font-medium">
          {fetchError || 'Paciente no encontrado'}
        </div>
      </AppShell>
    )
  }

  const dm = latestFicha?.datos_medicos
  const cf = latestFicha?.cuidados_faciales
  const ep = latestFicha?.evaluacion_profesional

  return (
    <AppShell>
      <BackNav to="/admin" label="Directorio de pacientes" className="mb-4 sm:mb-6" />

      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-outfit truncate">{patient.nombre_completo}</h1>
          <p className="text-sm text-muted mt-0.5">
            {patient.telefono ? formatArgentinaPhoneDisplay(patient.telefono) : 'Sin teléfono'}
          </p>
          {patient.permite_fotos_redes !== null && (
            <p className={`text-xs font-medium mt-1.5 ${patient.permite_fotos_redes ? 'text-green-700' : 'text-muted'}`}>
              {patient.permite_fotos_redes ? 'Autoriza publicación en redes sociales' : 'No autoriza publicación en redes sociales'}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2">
          <Button variant="primary" className="gap-2 col-span-2 sm:col-span-1 w-full sm:w-auto min-h-[48px] order-first sm:order-none" onClick={() => navigate(`/admin/paciente/${pacienteId}/ficha/nueva`)}>
            <ClipboardPlus className="w-4 h-4 shrink-0" />
            {fichas.length > 0 ? 'Nueva visita' : 'Primera consulta'}
          </Button>
          <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-[48px]" onClick={() => setEditModalOpen(true)}>
            <Pencil className="w-4 h-4 shrink-0" />
            Editar
          </Button>
          {latestFicha && (
            <Button
              variant="outline"
              className="gap-2 text-brand border-brand-light hover:bg-brand-light/20 w-full sm:w-auto min-h-[48px]"
              onClick={handleDownloadFichaCompletaPdf}
              disabled={downloadingFichaId === 'completa'}
            >
              {downloadingFichaId === 'completa' ? (
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 shrink-0" />
              )}
              Ficha Completa
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 text-green-700 border-green-200 hover:bg-green-50 w-full sm:w-auto min-h-[48px]"
            onClick={() => handleSendWA()}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto min-h-[48px]"
            onClick={() => setDeletePatientOpen(true)}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-3 min-h-[48px] text-xs font-semibold font-outfit transition-colors cursor-pointer',
                    activeTab === tab.id
                      ? 'text-brand border-b-2 border-brand bg-brand-light/30'
                      : 'text-muted hover:text-ink hover:bg-neutral-50 active:bg-neutral-50'
                  )}
                >
                  {tab.icon}
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === 'datos' && (
                <>
                  <InfoField label="Edad" value={displayAge} />
                  <InfoField label="Correo" value={patient.correo ?? ''} />
                  <InfoField label="Fecha de nacimiento" value={patient.fecha_nacimiento ? formatLocalDate(patient.fecha_nacimiento) : ''} />
                  <InfoField label="¿Cómo nos conoció?" value={patient.como_nos_conocio ?? ''} />
                  <InfoField label="Nacionalidad" value={patient.nacionalidad ?? ''} />
                  <InfoField label="Domicilio" value={patient.domicilio ?? ''} />
                  <InfoField label="Registro" value={patient.fecha_registro ? formatLocalDate(patient.fecha_registro) : '—'} />
                </>
              )}
              {activeTab === 'antecedentes' && (
                <>
                  {latestFicha ? (
                    <>
                      <p className="text-xs text-muted mb-3 font-medium">
                        Desde consulta del {format(parseLocalDate(latestFicha.fecha_servicio), "d MMM yyyy", { locale: es })}
                      </p>
                      <InfoField label="Alergias" value={formatChipList(dm?.alergias) || patient.alergias_cosmeticos_alimentos || 'Ninguna'} />
                      {dm?.alergias_detalle && <InfoField label="Detalle alergias" value={dm.alergias_detalle} />}
                      <InfoField label="Medicamentos" value={formatChipList(dm?.medicamentos) || patient.anticonceptivos_menopausia || ''} />
                      {dm?.medicamentos_detalle && <InfoField label="Detalle medicamentos" value={dm.medicamentos_detalle} />}
                      <InfoField label="Enfermedades" value={formatChipList(dm?.enfermedades) || patient.problemas_gastrointestinales || ''} />
                      <InfoField label="Embarazo" value={dm?.embarazo || (patient.embarazo ? 'Sí' : patient.embarazo === false ? 'No' : '')} />
                      <InfoField label="Consumo de agua" value={dm?.consumo_agua || patient.agua_alimentacion || ''} />
                      <InfoField label="Sueño / Estrés" value={[dm?.horas_sueno, dm?.nivel_estres].filter(Boolean).join(' / ') || patient.sueno_estres || ''} />
                      <InfoField label="Rutina facial" value={formatChipList(cf?.rutina_facial) || patient.rutina_higiene || ''} />
                      {cf?.rutina_detalle && <InfoField label="Detalle rutina" value={cf.rutina_detalle} />}
                    </>
                  ) : (
                    <>
                      <InfoField label="Alergias" value={patient.alergias_cosmeticos_alimentos || 'Sin consultas registradas'} />
                      <InfoField label="Agua y alimentación" value={patient.agua_alimentacion ?? ''} />
                      <InfoField label="Sueño y estrés" value={patient.sueno_estres ?? ''} />
                      <InfoField label="Higiene facial" value={patient.rutina_higiene ?? ''} />
                      <p className="text-xs text-muted mt-3">Inicia una consulta clínica para registrar antecedentes detallados.</p>
                    </>
                  )}
                </>
              )}
              {activeTab === 'diagnostico' && (
                <div className="py-2">
                  {ep?.tipo_piel || ep?.biotipo ? (
                    <>
                      {ep.tipo_piel && <InfoField label="Tipo de piel" value={ep.tipo_piel} />}
                      {ep.biotipo && <InfoField label="Fototipo Fitzpatrick" value={`Tipo ${ep.biotipo}`} />}
                      {ep.estado_piel?.length ? <InfoField label="Estado de la piel" value={formatChipList(ep.estado_piel)} /> : null}
                      {ep.estado_piel_notas && <InfoField label="Observaciones" value={ep.estado_piel_notas} />}
                      <p className="text-xs text-muted mt-3">
                        Datos de la última consulta ({format(parseLocalDate(latestFicha!.fecha_servicio), "d MMM yyyy", { locale: es })})
                      </p>
                    </>
                  ) : (
                    <>
                      <InfoField label="Tipo de piel" value={patient.biotipo_cutaneo ?? ''} />
                      <p className="text-xs text-muted mt-3">Sin evaluación profesional registrada. Completa una consulta en vivo.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <section>
            <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2 font-outfit">
              <ClipboardPlus className="w-5 h-5 text-brand" />
              Consultas clínicas
            </h2>

            {fichas.length === 0 ? (
              <Card className="p-8 text-center text-muted font-medium text-sm">
                No hay consultas clínicas registradas. Usa &quot;Nueva consulta clínica&quot; para iniciar una ficha en vivo.
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4 relative pl-5 sm:pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-light">
                {fichas.map((ficha, index) => {
                  const pendingSteps = getPendingWizardSteps(ficha)
                  const pendingCount = pendingSteps.length
                  const isComplete = pendingCount === 0

                  return (
                  <div key={ficha.id} className="relative animate-slide-up-fade" style={{ animationDelay: `${index * 60}ms` }}>
                    <div className="absolute -left-5 sm:-left-6 top-4 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-brand border-2 border-white shadow-sm" />
                    <Card className="p-4 sm:p-5 group">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-brand font-outfit leading-snug flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {format(parseLocalDate(ficha.fecha_servicio), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </p>
                          {ficha.motivo_consulta && (
                            <p className="text-sm text-ink font-medium mt-1 line-clamp-2">{ficha.motivo_consulta}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto -mr-1">
                          <button
                            onClick={() => handleDownloadFichaPdf(ficha)}
                            disabled={downloadingFichaId === ficha.id}
                            title="Descargar PDF de Rutinas (Para el Cliente)"
                            aria-label="Descargar PDF de Rutinas"
                            className="px-3 py-2 text-brand bg-brand-light/20 hover:bg-brand-light/40 active:bg-brand-light/50 rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {downloadingFichaId === ficha.id ? (
                              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : (
                              <Download className="w-4 h-4 shrink-0" />
                            )}
                            <span className="text-xs font-semibold hidden sm:inline">Rutinas</span>
                          </button>
                          <button
                            onClick={() => handleSendWA(ficha)}
                            title="Enviar por WhatsApp"
                            aria-label="Enviar por WhatsApp"
                            className="p-2.5 text-muted hover:text-green-700 hover:bg-green-50 active:bg-green-50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/paciente/${pacienteId}/ficha/${ficha.id}/editar`)}
                            title="Editar consulta"
                            aria-label="Editar consulta"
                            className="p-2.5 text-muted hover:text-brand hover:bg-brand-light/50 active:bg-brand-light/50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteFichaTarget(ficha)}
                            title="Eliminar consulta"
                            aria-label="Eliminar consulta"
                            className="p-2.5 text-muted hover:text-red-600 hover:bg-red-50 active:bg-red-50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {pendingCount > 0 && (
                        <div className="mt-3 rounded-xl border border-warning/30 bg-warning-light/40 px-3 py-2.5">
                          <p className="text-xs font-semibold text-warning font-outfit">
                            {pendingCount === FICHA_WIZARD_STEPS.length
                              ? `Consulta sin completar · faltan ${pendingCount} pasos`
                              : `Faltan ${pendingCount} paso${pendingCount > 1 ? 's' : ''} por completar`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {pendingSteps.map(step => (
                              <span
                                key={step}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-warning border border-warning/25"
                              >
                                {FICHA_WIZARD_STEP_LABELS[step]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {isComplete && (
                        <p className="mt-2 text-xs font-medium text-success">
                          Consulta completa · {FICHA_WIZARD_STEPS.length}/{FICHA_WIZARD_STEPS.length} pasos
                        </p>
                      )}
                      {ficha.evaluacion_profesional?.tipo_piel && (
                        <p className="text-xs text-muted">
                          Tipo de piel: {ficha.evaluacion_profesional.tipo_piel}
                        </p>
                      )}
                      {ficha.tratamientos_realizados?.tratamientos?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ficha.tratamientos_realizados.tratamientos.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-light/80 text-brand"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Card>
                  </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <PatientFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdatePatient}
        initialData={{
          id: patient.id,
          nombre_completo: patient.nombre_completo ?? '',
          correo: patient.correo ?? '',
          telefono: patient.telefono ?? '',
          fecha_nacimiento: patient.fecha_nacimiento ?? '',
          como_nos_conocio: patient.como_nos_conocio ?? '',
          nacionalidad: patient.nacionalidad ?? '',
          domicilio: patient.domicilio ?? '',
          edad: patient.edad ?? undefined,
        }}
        isLoading={savingPatient}
      />

      <ConfirmModal
        isOpen={!!deleteFichaTarget}
        onClose={() => setDeleteFichaTarget(null)}
        onConfirm={handleDeleteFicha}
        title="Eliminar consulta clínica"
        message={
          deleteFichaTarget
            ? `¿Seguro que deseas eliminar la consulta del ${format(parseLocalDate(deleteFichaTarget.fecha_servicio), "d 'de' MMMM, yyyy", { locale: es })}?`
            : ''
        }
        details="Se borrarán los datos de la ficha y sus archivos (mapa, fotos y firma). Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deletingFicha}
        loadingLabel="Eliminando..."
        variant="danger"
      />

      <ConfirmModal
        isOpen={deletePatientOpen}
        onClose={() => setDeletePatientOpen(false)}
        onConfirm={handleDeletePatient}
        title="Eliminar paciente"
        message={`¿Seguro que deseas eliminar a ${patient.nombre_completo}?`}
        details="Se eliminarán también todas sus consultas clínicas. Esta acción no se puede deshacer."
        confirmLabel="Eliminar paciente"
        loading={deletingPatient}
        loadingLabel="Eliminando..."
        variant="danger"
      />

      <Snackbar isOpen={snackbarOpen} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </AppShell>
  )
}
