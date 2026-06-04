import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Activity, User as UserIcon } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Snackbar } from '../components/ui/Snackbar'
import { PatientDetailsSkeleton } from '../components/ui/Skeleton'
import { PatientFormModal, type PatientFormData } from '../components/patients/PatientFormModal'
import { PatientProfileHeader } from '../components/patients/PatientProfileHeader'
import { PatientActivitySummary } from '../components/patients/PatientActivitySummary'
import { PatientContactCard } from '../components/patients/PatientContactCard'
import {
  PatientClinicalTabsCard,
  type ClinicalTabId,
} from '../components/patients/PatientClinicalTabsCard'
import { PatientHistoryTabs } from '../components/patients/PatientHistoryTabs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadRutinasPdf, downloadFichaPdf, shareViaWhatsApp } from '../lib/generateFichaPdf'
import { getFichasByPacienteId, deleteFichaWithAssets, type FichaClinica } from '../lib/fichaService'
import { getPacienteById, updatePaciente, deletePaciente, type Paciente } from '../lib/pacienteService'
import { calcAge, formatLocalDate, parseLocalDate } from '../lib/dateUtils'
import {
  partitionFichas,
  getLatestConsultaPresencial,
  getLatestRutinaRemota,
  getIncompleteConsultas,
  getClinicalContextChips,
} from '../lib/patientHistoryUtils'
import { isSoloRutinaFicha } from '../lib/soloRutinaFicha'

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 border-b border-border last:border-0">
    <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">
      {label}
    </span>
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
  const [activeTab, setActiveTab] = useState<ClinicalTabId>('datos')
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [downloadingFichaId, setDownloadingFichaId] = useState<string | null>(null)
  const [deleteFichaTarget, setDeleteFichaTarget] = useState<FichaClinica | null>(null)
  const [deletingFicha, setDeletingFicha] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)
  const [deletePatientOpen, setDeletePatientOpen] = useState(false)
  const [deletingPatient, setDeletingPatient] = useState(false)

  const { consultas, rutinas } = useMemo(() => partitionFichas(fichas), [fichas])
  const latestConsulta = useMemo(() => getLatestConsultaPresencial(consultas), [consultas])
  const latestRutina = useMemo(() => getLatestRutinaRemota(rutinas), [rutinas])
  const incompleteConsulta = useMemo(() => getIncompleteConsultas(consultas)[0] ?? null, [consultas])
  const contextChips = useMemo(() => getClinicalContextChips(latestConsulta), [latestConsulta])

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
    shareViaWhatsApp(patient.telefono, patient.nombre_completo ?? 'paciente', ficha?.fecha_servicio)
    showSnackbar('Abriendo WhatsApp...')
  }

  const handleDownloadFichaPdf = async (ficha: FichaClinica) => {
    if (!patient) return
    setDownloadingFichaId(ficha.id)
    try {
      await downloadRutinasPdf(
        { nombre_completo: patient.nombre_completo ?? '', telefono: patient.telefono ?? undefined },
        { fecha_servicio: ficha.fecha_servicio, cuidados_faciales: ficha.cuidados_faciales },
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
    if (!patient || !latestConsulta) return
    setDownloadingFichaId('completa')
    try {
      await downloadFichaPdf(
        {
          nombre_completo: patient.nombre_completo ?? '',
          telefono: patient.telefono ?? undefined,
          edad: calcAge(patient.fecha_nacimiento) ?? patient.edad ?? undefined,
        },
        {
          fecha_servicio: latestConsulta.fecha_servicio,
          motivo_consulta: latestConsulta.motivo_consulta ?? undefined,
          datos_medicos: latestConsulta.datos_medicos,
          cuidados_faciales: latestConsulta.cuidados_faciales,
          evaluacion_profesional: latestConsulta.evaluacion_profesional,
          tratamientos_realizados: latestConsulta.tratamientos_realizados,
          ruta_mapa_facial: latestConsulta.ruta_mapa_facial,
          ruta_foto_antes: latestConsulta.ruta_foto_antes,
          ruta_foto_despues: latestConsulta.ruta_foto_despues,
          ruta_firma: latestConsulta.ruta_firma,
        },
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
      showSnackbar(isSoloRutinaFicha(deleteFichaTarget) ? 'Envío de rutina eliminado' : 'Consulta eliminada')
      void fetchData()
    } catch {
      showSnackbar('Error al eliminar')
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

  const handleEditFicha = (ficha: FichaClinica) => {
    if (!pacienteId) return
    if (isSoloRutinaFicha(ficha)) {
      navigate(`/admin/paciente/${pacienteId}/rutina/${ficha.id}`)
    } else {
      navigate(`/admin/paciente/${pacienteId}/ficha/${ficha.id}/editar`)
    }
  }

  const clinicalTabs: { id: ClinicalTabId; label: string; shortLabel: string; icon: ReactNode }[] = [
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

  if (!patient || !pacienteId) {
    return (
      <AppShell>
        <div className="text-center py-16 text-muted font-medium">
          {fetchError || 'Paciente no encontrado'}
        </div>
      </AppShell>
    )
  }

  const dm = latestConsulta?.datos_medicos
  const cf = latestConsulta?.cuidados_faciales
  const ep = latestConsulta?.evaluacion_profesional
  const tipoPielLabel = ep?.tipo_piel ?? patient.biotipo_cutaneo ?? undefined

  return (
    <AppShell>
      <PatientProfileHeader
        pacienteId={pacienteId}
        nombre={patient.nombre_completo ?? 'Paciente'}
        fechaRegistro={patient.fecha_registro}
        hasConsultas={consultas.length > 0}
        hasLatestFicha={!!latestConsulta}
        downloadingCompleta={downloadingFichaId === 'completa'}
        onEditar={() => setEditModalOpen(true)}
        onWhatsApp={() => handleSendWA()}
        onFichaCompleta={() => void handleDownloadFichaCompletaPdf()}
        onEnviarRutina={() => navigate(`/admin/paciente/${pacienteId}/rutina`)}
        onEliminarPaciente={() => setDeletePatientOpen(true)}
      />

      <PatientActivitySummary
        latestConsulta={latestConsulta}
        latestRutina={latestRutina}
        incompleteConsulta={incompleteConsulta}
        pacienteId={pacienteId}
        tipoPielLabel={tipoPielLabel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
        <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-none">
          <PatientContactCard patient={patient} />
          <PatientClinicalTabsCard
            tabs={clinicalTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            contextChips={contextChips}
          >
            {activeTab === 'datos' && (
              <>
                <InfoField label="Edad" value={displayAge} />
                <InfoField label="Fecha de nacimiento" value={patient.fecha_nacimiento ? formatLocalDate(patient.fecha_nacimiento) : ''} />
                <InfoField label="¿Cómo nos conoció?" value={patient.como_nos_conocio ?? ''} />
                <InfoField label="Nacionalidad" value={patient.nacionalidad ?? ''} />
                <InfoField label="Domicilio" value={patient.domicilio ?? ''} />
                <InfoField label="Registro" value={patient.fecha_registro ? formatLocalDate(patient.fecha_registro) : '—'} />
              </>
            )}
            {activeTab === 'antecedentes' && (
              <>
                {latestConsulta ? (
                  <>
                    <p className="text-xs text-muted mb-3 font-medium">
                      Desde consulta del{' '}
                      {format(parseLocalDate(latestConsulta.fecha_servicio), "d MMM yyyy", { locale: es })}
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
                  </>
                ) : (
                  <>
                    <InfoField label="Tipo de piel" value={patient.biotipo_cutaneo ?? ''} />
                    <p className="text-xs text-muted mt-3">Sin evaluación profesional registrada.</p>
                  </>
                )}
              </div>
            )}
          </PatientClinicalTabsCard>
        </div>

        <div className="min-w-0">
          <PatientHistoryTabs
            consultas={consultas}
            rutinas={rutinas}
            downloadingFichaId={downloadingFichaId}
            onDownloadPdf={f => void handleDownloadFichaPdf(f)}
            onWhatsApp={handleSendWA}
            onEdit={handleEditFicha}
            onDelete={setDeleteFichaTarget}
            onNuevaConsulta={() => navigate(`/admin/paciente/${pacienteId}/consulta`)}
            onNuevaRutina={() => navigate(`/admin/paciente/${pacienteId}/rutina`)}
          />
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
        title={deleteFichaTarget && isSoloRutinaFicha(deleteFichaTarget) ? 'Eliminar envío de rutina' : 'Eliminar consulta clínica'}
        message={
          deleteFichaTarget
            ? `¿Seguro que deseas eliminar el registro del ${format(parseLocalDate(deleteFichaTarget.fecha_servicio), "d 'de' MMMM, yyyy", { locale: es })}?`
            : ''
        }
        details="Se borrarán los datos y archivos asociados. Esta acción no se puede deshacer."
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
        details="Se eliminarán también todas sus consultas y rutinas. Esta acción no se puede deshacer."
        confirmLabel="Eliminar paciente"
        loading={deletingPatient}
        loadingLabel="Eliminando..."
        variant="danger"
      />

      <Snackbar isOpen={snackbarOpen} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </AppShell>
  )
}
