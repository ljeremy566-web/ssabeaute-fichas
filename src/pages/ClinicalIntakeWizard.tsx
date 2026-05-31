import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Stethoscope, ClipboardCheck, PenTool, Camera, FileSignature, ClipboardList, X, Loader2, Download, MessageCircle, Check, Users } from 'lucide-react'
import { WizardTabNav, type WizardTab } from '../components/intake/WizardTabNav'
import { WizardStepFooter } from '../components/intake/WizardStepFooter'
import { FacialMapCanvas } from '../components/intake/FacialMapCanvas'
import { PhotoDropzone } from '../components/intake/PhotoDropzone'
import { ConsentimientoBlock } from '../components/intake/ConsentimientoBlock'
import { ConsentSyncPanel } from '../components/intake/ConsentSyncPanel'
import { MotivoConsultaSelector } from '../components/intake/MotivoConsultaSelector'
import { TratamientosPanel } from '../components/intake/TratamientosPanel'
import { Modal, ModalActions } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'
import { VisitContextPanel } from '../components/intake/VisitContextPanel'
import { getPacienteById } from '../lib/pacienteService'
import { getFichaById, getFichasByPacienteId, type FichaClinica } from '../lib/fichaService'
import { buildClinicalPrefillFromFicha, getCompletedWizardSteps, getPreviousMonthFicha, getPreviousMonthLabel } from '../lib/fichaUtils'
import { downloadFichaPdf, shareViaWhatsApp } from '../lib/generateFichaPdf'
import { Snackbar } from '../components/ui/Snackbar'
import { useConsentSessionSync } from '../hooks/useConsentSessionSync'
import {
  sessionToCompletedPayload,
  type ConsentCompletedPayload,
  type SesionFirma,
} from '../lib/consentSessionService'
import {
  parseMotivoConsulta,
  validateMotivoConsulta,
} from '../lib/serviciosCatalogo'
import { Select } from '../components/ui/Select'
import { useIntakeForm, defaultFormState, type WizardStepId, WIZARD_STEPS } from '../hooks/useIntakeForm'
import { useSaveFicha, stepToAssetScope } from '../hooks/useSaveFicha'


/* ─── Data Constants ─── */

const CONSUMO_AGUA_OPTIONS = [
  { value: 'menos-1L', label: 'Menos de 1L' },
  { value: '1-2L', label: '1–2 litros' },
  { value: '2-3L', label: '2–3 litros' },
  { value: 'mas-3L', label: 'Más de 3L' },
]

const HORAS_SUENO_OPTIONS = [
  { value: 'menos-5', label: 'Menos de 5h' },
  { value: '5-7', label: '5–7 horas' },
  { value: '7-9', label: '7–9 horas' },
  { value: 'mas-9', label: 'Más de 9h' },
]

const NIVEL_ESTRES_OPTIONS = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'alto', label: 'Alto' },
  { value: 'muy-alto', label: 'Muy alto' },
]

const ALERGIAS_OPTIONS = [
  'Ácido salicílico', 'Retinol', 'Hidroquinona', 'Peróxido de benzoilo',
  'Fragancias', 'Parabenos', 'Látex', 'Medicamentos', 'Alimentos', 'Ninguna',
]
const MEDICAMENTOS_OPTIONS = [
  'Anticonceptivos', 'Isotretinoína', 'Corticoides', 'Anticoagulantes',
  'Antihipertensivos', 'Hormonas', 'Suplementos', 'Ninguno',
]
const ENFERMEDADES_OPTIONS = [
  'Diabetes', 'Hipertensión', 'Hipotiroidismo', 'Lupus', 'Psoriasis',
  'Dermatitis', 'Herpes recurrente', 'Epilepsia', 'Ninguna',
]
const RUTINA_FACIAL_OPTIONS = [
  'Limpiador', 'Tónico', 'Sérum', 'Hidratante', 'Protector solar',
  'Exfoliante', 'Mascarilla', 'Contorno de ojos', 'Aceite facial', 'Ninguna',
]
const BIOTIPOS = [
  { value: 'I', label: 'Fototipo I', desc: 'Piel muy clara, se quema siempre' },
  { value: 'II', label: 'Fototipo II', desc: 'Piel clara, se quema fácilmente' },
  { value: 'III', label: 'Fototipo III', desc: 'Piel media, se quema moderadamente' },
  { value: 'IV', label: 'Fototipo IV', desc: 'Piel morena clara, se quema poco' },
  { value: 'V', label: 'Fototipo V', desc: 'Piel morena, rara vez se quema' },
]
const TIPOS_PIEL = ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible']
const ESTADO_PIEL_OPTIONS = [
  'Acné activo', 'Rosácea', 'Hiperpigmentación', 'Deshidratación',
  'Líneas de expresión', 'Poros dilatados', 'Comedones', 'Melasma',
  'Cicatrices', 'Flacidez', 'Eritema', 'Fotodaño',
]
/* ─── Helpers ─── */

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'px-3.5 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-all duration-300 ease-[var(--ease-google-spring)] cursor-pointer hover:scale-[1.02] active:scale-95 shadow-xs',
        checked
          ? 'bg-primary-light text-primary border-primary/30 shadow-sm'
          : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-container active:bg-surface-container'
      )}
    >
      {label}
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-on-surface font-outfit mb-3">{children}</h3>
}

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('block text-sm font-medium text-on-surface-variant mb-1.5', className)}>{children}</label>
}

/* ─── Main Component ─── */

export const ClinicalIntakeWizard = () => {
  const { pacienteId, fichaId } = useParams<{ pacienteId?: string; fichaId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const resolvedPacienteId = pacienteId || searchParams.get('paciente') || ''
  const isEditingRoute = !!fichaId

  const { form, setForm, updateForm, activeTab, setActiveTab, savedSteps, setSavedSteps, remoteConsentCompleted, setRemoteConsentCompleted } = useIntakeForm()
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [currentFichaId, setCurrentFichaId] = useState<string | null>(fichaId ?? null)
  const [loadingData, setLoadingData] = useState(!!resolvedPacienteId || !!fichaId)
  const [loadError, setLoadError] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const [savedFicha, setSavedFicha] = useState<FichaClinica | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [fechaServicio, setFechaServicio] = useState(() => new Date().toISOString().split('T')[0])
  const mainRef = useRef<HTMLElement>(null)
  const [visitMode, setVisitMode] = useState<'first' | 'followup' | null>(null)
  const [previousMonthFicha, setPreviousMonthFicha] = useState<FichaClinica | null>(null)
  const [consentSession, setConsentSession] = useState<SesionFirma | null>(null)
  const [localFallbackOpen, setLocalFallbackOpen] = useState(false)

  const { saving, setSaving, saveStatus, setSaveStatus, setLoadedAssets, handleAssetChange, persistForm } = useSaveFicha({
    form, setForm, resolvedPacienteId, currentFichaId, setCurrentFichaId, fechaServicio, consentSession, setSavedSteps
  })

  const goBack = () => {
    if (resolvedPacienteId) {
      navigate(`/admin/paciente/${resolvedPacienteId}`)
    } else {
      navigate('/admin')
    }
  }

  // Load patient + optional ficha in one pass
  useEffect(() => {
    if (!resolvedPacienteId) return
    let aborted = false

    void (async () => {
      setLoadingData(true)
      setLoadError('')
      try {
        const [patientData, fichaData] = await Promise.all([
          getPacienteById(resolvedPacienteId),
          fichaId ? getFichaById(fichaId) : Promise.resolve(null),
        ])
        if (aborted) return

        if (!patientData) {
          setLoadError('Paciente no encontrado')
          return
        }

        setPatientName(patientData.nombre_completo ?? '')
        setPatientPhone(patientData.telefono ?? '')

        if (fichaId) {
          if (!fichaData) {
            setLoadError('No se pudo cargar la ficha clínica')
            return
          }
          if (fichaData.paciente_id !== resolvedPacienteId) {
            setLoadError('Esta ficha no pertenece al paciente seleccionado')
            return
          }

          const dm = fichaData.datos_medicos || {}
          const cf = fichaData.cuidados_faciales || {}
          const ep = fichaData.evaluacion_profesional || {}
          const tr = fichaData.tratamientos_realizados || {}

          setFechaServicio(fichaData.fecha_servicio)
          setLoadedAssets({
            mapa: fichaData.ruta_mapa_facial,
            antes: fichaData.ruta_foto_antes,
            despues: fichaData.ruta_foto_despues,
            firma: fichaData.ruta_firma,
          })

          const parsedMotivo = parseMotivoConsulta(fichaData.motivo_consulta)

          setForm({
            motivo_consulta: fichaData.motivo_consulta || '',
            motivo_servicios: parsedMotivo.seleccionados,
            motivo_otro: parsedMotivo.otroTexto,
            alergias: dm.alergias || [],
            alergias_detalle: dm.alergias_detalle || '',
            medicamentos: dm.medicamentos || [],
            medicamentos_detalle: dm.medicamentos_detalle || '',
            enfermedades: dm.enfermedades || [],
            enfermedades_detalle: dm.enfermedades_detalle || '',
            embarazo: dm.embarazo || '',
            consumo_agua: dm.consumo_agua || '',
            horas_sueno: dm.horas_sueno || '',
            nivel_estres: dm.nivel_estres || '',
            rutina_facial: cf.rutina_facial || [],
            rutina_detalle: cf.rutina_detalle || '',
            biotipo: ep.biotipo || '',
            tipo_piel: ep.tipo_piel || '',
            estado_piel: ep.estado_piel || [],
            estado_piel_notas: ep.estado_piel_notas || '',
            mapa_facial_base64: fichaData.ruta_mapa_facial || null,
            mapa_genero: ep.mapa_genero === 'male' ? 'male' : 'female',
            foto_antes_base64: fichaData.ruta_foto_antes || null,
            foto_despues_base64: fichaData.ruta_foto_despues || null,
            tratamientos: tr.tratamientos || [],
            tratamientos_notas: tr.tratamientos_notas || '',
            firma_base64: fichaData.ruta_firma || null,
            acepta_consentimiento: tr.acepta_consentimiento || false,
            permite_fotos_redes: tr.permite_fotos_redes ?? patientData.permite_fotos_redes ?? false,
          })
          setRemoteConsentCompleted(!!(tr.acepta_consentimiento && fichaData.ruta_firma))
          setCurrentFichaId(fichaId)
          setSavedSteps(new Set(getCompletedWizardSteps(fichaData)))
        } else {
          const priorFichas = await getFichasByPacienteId(resolvedPacienteId)
          if (aborted) return

          if (priorFichas.length === 0) {
            setVisitMode('first')
            setPreviousMonthFicha(null)
            setForm({
              ...defaultFormState,
              permite_fotos_redes: patientData.permite_fotos_redes ?? false,
            })
          } else {
            setVisitMode('followup')
            setPreviousMonthFicha(getPreviousMonthFicha(priorFichas))
            setForm({
              ...defaultFormState,
              ...buildClinicalPrefillFromFicha(priorFichas[0]),
              permite_fotos_redes: patientData.permite_fotos_redes ?? false,
            })
          }
        }
      } catch (err) {
        if (!aborted) {
          console.error(err)
          setLoadError('Error al cargar los datos de la consulta')
        }
      } finally {
        if (!aborted) setLoadingData(false)
      }
    })()

    return () => { aborted = true }
  }, [resolvedPacienteId, fichaId])



  const showSnackbar = (message: string) => setSnackbar({ open: true, message })

  const handleRemoteConsent = useCallback((payload: ConsentCompletedPayload) => {
    setForm(prev => ({
      ...prev,
      acepta_consentimiento: payload.acepta_consentimiento,
      permite_fotos_redes: payload.permite_fotos_redes,
      firma_base64: payload.firma_base64,
    }))
    setRemoteConsentCompleted(true)
    setSavedSteps(prev => new Set([...prev, 'consentimiento']))
  }, [])

  const handleConsentSessionReady = useCallback((session: SesionFirma) => {
    setConsentSession(session)
    if (session.estado === 'completada' && session.firma_base64) {
      handleRemoteConsent(sessionToCompletedPayload(session))
    }
  }, [handleRemoteConsent])

  const handleResetRemoteConsent = useCallback(() => {
    setRemoteConsentCompleted(false)
    setForm(prev => ({
      ...prev,
      acepta_consentimiento: false,
      permite_fotos_redes: false,
      firma_base64: null,
    }))
    setSavedSteps(prev => {
      const next = new Set(prev)
      next.delete('consentimiento')
      return next
    })
  }, [])

  useConsentSessionSync({
    token: consentSession?.token ?? null,
    enabled: activeTab === 'consentimiento'
      && !!consentSession?.token
      && !remoteConsentCompleted,
    onCompleted: handleRemoteConsent,
  })

    const validateStep = (step: WizardStepId): string | null => {
    if (step === 'consentimiento') {
      if (!form.acepta_consentimiento) return 'Debes aceptar el consentimiento informado'
      if (!form.firma_base64) return 'La firma del paciente es obligatoria'
    }
    if (step === 'anamnesis') {
      const motivoErr = validateMotivoConsulta(form.motivo_servicios, form.motivo_otro)
      if (motivoErr) return motivoErr
    }
    if (step === 'evaluacion' && (!form.biotipo || !form.tipo_piel)) {
      return 'Selecciona el biotipo y el tipo de piel'
    }
    return null
  }

  const currentStepIndex = WIZARD_STEPS.indexOf(activeTab)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1

  const scrollMainToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goPrevious = () => {
    if (isFirstStep) return
    setActiveTab(WIZARD_STEPS[currentStepIndex - 1])
    scrollMainToTop()
  }

  const goNext = async () => {
    if (isLastStep) return

    const err = validateStep(activeTab)
    if (err) {
      showSnackbar(err)
      return
    }

    setSaving(true)
    setSaveStatus('saving')
    try {
      await persistForm(stepToAssetScope(activeTab))
      setSavedSteps(prev => new Set([...prev, activeTab]))
      setSaveStatus('saved')
      setActiveTab(WIZARD_STEPS[currentStepIndex + 1])
      scrollMainToTop()
    } catch (err) {
      console.error(err)
      setSaveStatus('idle')
      showSnackbar(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      const saved = await persistForm('all')
      setSavedSteps(new Set(WIZARD_STEPS))
      setSaveStatus('saved')
      setSavedFicha(saved)
    } catch (err) {
      console.error(err)
      setSaveStatus('idle')
      showSnackbar(err instanceof Error ? err.message : 'Error inesperado al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as WizardStepId)
    scrollMainToTop()
  }

  const handleDownloadSavedPdf = async () => {
    if (!savedFicha) return
    setDownloadingPdf(true)
    try {
      await downloadFichaPdf(
        { nombre_completo: patientName, telefono: patientPhone },
        {
          fecha_servicio: savedFicha.fecha_servicio,
          motivo_consulta: savedFicha.motivo_consulta ?? undefined,
          datos_medicos: savedFicha.datos_medicos,
          cuidados_faciales: savedFicha.cuidados_faciales,
          evaluacion_profesional: savedFicha.evaluacion_profesional,
          tratamientos_realizados: savedFicha.tratamientos_realizados,
          ruta_mapa_facial: savedFicha.ruta_mapa_facial,
          ruta_foto_antes: savedFicha.ruta_foto_antes,
          ruta_foto_despues: savedFicha.ruta_foto_despues,
          ruta_firma: savedFicha.ruta_firma,
        },
      )
    } catch (err) {
      console.error(err)
      showSnackbar('Error al generar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleShareWhatsApp = () => {
    if (!patientPhone) {
      showSnackbar('El paciente no tiene teléfono registrado')
      return
    }
    try {
      shareViaWhatsApp(patientPhone, patientName, savedFicha?.fecha_servicio)
    } catch {
      showSnackbar('Teléfono inválido para WhatsApp')
    }
  }

  const handleCloseSuccessModal = () => {
    setSavedFicha(null)
    navigate(`/admin/paciente/${resolvedPacienteId}`)
  }

  const tabs: WizardTab[] = [
    { id: 'consentimiento', label: 'Consentimiento', icon: <FileSignature className="w-5 h-5" />, completed: savedSteps.has('consentimiento') },
    { id: 'anamnesis', label: 'Anamnesis', icon: <Stethoscope className="w-5 h-5" />, completed: savedSteps.has('anamnesis') },
    { id: 'evaluacion', label: 'Evaluación', icon: <ClipboardCheck className="w-5 h-5" />, completed: savedSteps.has('evaluacion') },
    { id: 'mapa', label: 'Mapa Facial', icon: <PenTool className="w-5 h-5" />, completed: savedSteps.has('mapa') },
    { id: 'evidencia', label: 'Evidencia', icon: <Camera className="w-5 h-5" />, completed: savedSteps.has('evidencia') },
    { id: 'tratamientos', label: 'Tratamientos', icon: <ClipboardList className="w-5 h-5" />, completed: savedSteps.has('tratamientos') },
  ]

  if (!resolvedPacienteId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-dim p-6">
        <p className="text-on-surface font-medium mb-4">Selecciona un paciente para iniciar la consulta.</p>
        <button
          onClick={() => navigate('/admin?nuevaConsulta=1')}
          className="px-5 py-2.5 text-sm font-medium text-on-primary bg-primary rounded-xl cursor-pointer"
        >
          Elegir paciente
        </button>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-dim p-6">
        <p className="text-error font-medium mb-4">{loadError}</p>
        <button
          onClick={goBack}
          className="px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary-light rounded-xl cursor-pointer"
        >
          Volver
        </button>
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dim">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-dim">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 bg-surface border-b border-outline elevation-1 z-10 safe-top">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={goBack}
            aria-label="Cerrar consulta"
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-on-surface font-outfit truncate">
              {isEditingRoute || currentFichaId ? 'Editar Consulta' : 'Nueva Consulta en Vivo'}
            </h1>
            {patientName && (
              <p className="text-xs text-on-surface-variant truncate">{patientName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-xs font-medium text-on-surface-variant">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            aria-label="Ir al directorio de pacientes"
            className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-light/50 transition-colors cursor-pointer"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary-light/50 transition-colors cursor-pointer font-semibold font-outfit"
          >
            <Users className="w-4 h-4" />
            Directorio
          </button>
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-success">
              <Check className="w-3.5 h-3.5" />
              Guardado
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          <WizardTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

          <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-h-0 overscroll-contain">
          <div className={cn('mx-auto w-full', activeTab === 'consentimiento' ? 'max-w-5xl' : 'max-w-3xl')}>
            {visitMode && !fichaId && (
              <VisitContextPanel
                mode={visitMode}
                previousMonthFicha={previousMonthFicha}
                previousMonthLabel={getPreviousMonthLabel()}
              />
            )}
            {/* ─── TAB 1: CONSENTIMIENTO Y FIRMA ─── */}
            {activeTab === 'consentimiento' && (
              <div className="animate-google-slide-up space-y-6">
                <ConsentSyncPanel
                  pacienteId={resolvedPacienteId}
                  pacienteNombre={patientName}
                  patientPhone={patientPhone}
                  fichaId={currentFichaId}
                  remoteCompleted={remoteConsentCompleted}
                  onSessionReady={handleConsentSessionReady}
                  onResetRemote={handleResetRemoteConsent}
                />

                <div className="border border-outline rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLocalFallbackOpen(open => !open)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 min-h-[48px] bg-surface-container text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                  >
                    <span className="min-w-0">
                      <span className="block sm:hidden">Firma en este dispositivo</span>
                      <span className="hidden sm:block">Firmar en este dispositivo (alternativa)</span>
                    </span>
                    <span className="text-on-surface-variant text-xs">
                      {localFallbackOpen ? 'Ocultar' : 'Mostrar'}
                    </span>
                  </button>
                  {localFallbackOpen && (
                    <div className="p-5 border-t border-outline">
                      <ConsentimientoBlock
                        mode="staff"
                        readOnly={remoteConsentCompleted}
                        aceptaConsentimiento={form.acepta_consentimiento}
                        onAceptaConsentimientoChange={v => updateForm('acepta_consentimiento', v)}
                        permiteFotosRedes={form.permite_fotos_redes}
                        onPermiteFotosRedesChange={v => updateForm('permite_fotos_redes', v)}
                        firmaBase64={form.firma_base64}
                        onFirmaChange={base64 => void handleAssetChange('firma', base64)}
                      />
                    </div>
                  )}
                </div>

                {remoteConsentCompleted && form.firma_base64 && !localFallbackOpen && (
                  <div className="p-5 bg-surface rounded-xl border border-outline">
                    <p className="text-sm font-medium text-on-surface mb-3">Firma recibida del paciente</p>
                    <img
                      src={form.firma_base64}
                      alt="Firma del paciente"
                      className="max-h-32 rounded-lg border border-outline bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 1: ANAMNESIS & HÁBITOS ─── */}
            {activeTab === 'anamnesis' && (
              <div className="animate-google-slide-up space-y-6">
                <MotivoConsultaSelector
                  seleccionados={form.motivo_servicios}
                  onSeleccionadosChange={v => updateForm('motivo_servicios', v)}
                  otroTexto={form.motivo_otro}
                  onOtroTextoChange={v => updateForm('motivo_otro', v)}
                />
                {/* Alergias */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Alergias conocidas</SectionTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ALERGIAS_OPTIONS.map(a => (
                      <CheckboxChip
                        key={a}
                        label={a}
                        checked={form.alergias.includes(a)}
                        onChange={() => updateForm('alergias', toggleArrayItem(form.alergias, a))}
                      />
                    ))}
                  </div>
                  <input
                    value={form.alergias_detalle}
                    onChange={e => updateForm('alergias_detalle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Detalles adicionales de alergias..."
                  />
                </div>

                {/* Medicamentos */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Medicamentos actuales</SectionTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {MEDICAMENTOS_OPTIONS.map(m => (
                      <CheckboxChip
                        key={m}
                        label={m}
                        checked={form.medicamentos.includes(m)}
                        onChange={() => updateForm('medicamentos', toggleArrayItem(form.medicamentos, m))}
                      />
                    ))}
                  </div>
                  <input
                    value={form.medicamentos_detalle}
                    onChange={e => updateForm('medicamentos_detalle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Detalles de medicamentos..."
                  />
                </div>

                {/* Enfermedades crónicas */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Enfermedades crónicas</SectionTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ENFERMEDADES_OPTIONS.map(e => (
                      <CheckboxChip
                        key={e}
                        label={e}
                        checked={form.enfermedades.includes(e)}
                        onChange={() => updateForm('enfermedades', toggleArrayItem(form.enfermedades, e))}
                      />
                    ))}
                  </div>
                  <input
                    value={form.enfermedades_detalle}
                    onChange={e => updateForm('enfermedades_detalle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Detalles adicionales..."
                  />
                </div>

                {/* Embarazo */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Embarazo</SectionTitle>
                  <div className="flex gap-2">
                    {['No', 'Sí', 'Posible'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateForm('embarazo', opt)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer',
                          form.embarazo === opt
                            ? 'bg-primary-light text-primary border-primary/30'
                            : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-container'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hábitos */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Hábitos de vida</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <FieldLabel>Consumo de agua</FieldLabel>
                      <Select
                        value={form.consumo_agua}
                        onChange={val => updateForm('consumo_agua', val)}
                        options={CONSUMO_AGUA_OPTIONS}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div>
                      <FieldLabel>Horas de sueño</FieldLabel>
                      <Select
                        value={form.horas_sueno}
                        onChange={val => updateForm('horas_sueno', val)}
                        options={HORAS_SUENO_OPTIONS}
                        placeholder="Seleccionar..."
                      />
                    </div>
                    <div>
                      <FieldLabel>Nivel de estrés</FieldLabel>
                      <Select
                        value={form.nivel_estres}
                        onChange={val => updateForm('nivel_estres', val)}
                        options={NIVEL_ESTRES_OPTIONS}
                        placeholder="Seleccionar..."
                      />
                    </div>
                  </div>
                </div>

                {/* Rutina facial */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Rutina facial actual</SectionTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {RUTINA_FACIAL_OPTIONS.map(r => (
                      <CheckboxChip
                        key={r}
                        label={r}
                        checked={form.rutina_facial.includes(r)}
                        onChange={() => updateForm('rutina_facial', toggleArrayItem(form.rutina_facial, r))}
                      />
                    ))}
                  </div>
                  <input
                    value={form.rutina_detalle}
                    onChange={e => updateForm('rutina_detalle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Marcas o productos específicos..."
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 2: EVALUACIÓN PROFESIONAL ─── */}
            {activeTab === 'evaluacion' && (
              <div className="animate-google-slide-up space-y-6">
                {/* Biotipo cutáneo */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Biotipo cutáneo (Fototipo de Fitzpatrick)</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {BIOTIPOS.map(b => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => updateForm('biotipo', b.value)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all cursor-pointer',
                          form.biotipo === b.value
                            ? 'bg-primary-light border-primary/30 ring-2 ring-primary/20'
                            : 'bg-surface border-outline hover:bg-surface-container'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                            form.biotipo === b.value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                          )}>
                            {b.value}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{b.label}</p>
                            <p className="text-xs text-on-surface-variant">{b.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de piel */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Tipo de piel</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_PIEL.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateForm('tipo_piel', t)}
                        className={cn(
                          'px-5 py-2.5 rounded-full text-sm font-medium border transition-all cursor-pointer',
                          form.tipo_piel === t
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-container'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estado actual de la piel */}
                <div className="p-5 bg-surface rounded-xl border border-outline">
                  <SectionTitle>Estado actual de la piel</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                    {ESTADO_PIEL_OPTIONS.map(e => (
                      <CheckboxChip
                        key={e}
                        label={e}
                        checked={form.estado_piel.includes(e)}
                        onChange={() => updateForm('estado_piel', toggleArrayItem(form.estado_piel, e))}
                      />
                    ))}
                  </div>
                  <textarea
                    value={form.estado_piel_notas}
                    onChange={e => updateForm('estado_piel_notas', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Observaciones adicionales del estado de la piel..."
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 3: MAPA FACIAL ─── */}
            {activeTab === 'mapa' && (
              <div className="animate-google-slide-up">
                <FacialMapCanvas
                  value={form.mapa_facial_base64}
                  onChange={base64 => void handleAssetChange('mapa', base64)}
                  faceGender={form.mapa_genero}
                  onGenderChange={gender => updateForm('mapa_genero', gender)}
                />
              </div>
            )}

            {/* ─── TAB 4: EVIDENCIA ─── */}
            {activeTab === 'evidencia' && (
              <div className="animate-google-slide-up p-5 bg-surface rounded-xl border border-outline">
                <SectionTitle>Fotografías de evidencia</SectionTitle>
                <p className="text-sm text-on-surface-variant mb-5">
                  Capture las fotografías del estado actual del paciente. Estas imágenes se incluirán en el PDF de la ficha.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PhotoDropzone
                    label="📸 Foto ANTES"
                    value={form.foto_antes_base64}
                    onChange={base64 => void handleAssetChange('antes', base64)}
                  />
                  <PhotoDropzone
                    label="📸 Foto DESPUÉS"
                    value={form.foto_despues_base64}
                    onChange={base64 => void handleAssetChange('despues', base64)}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 6: TRATAMIENTOS ─── */}
            {activeTab === 'tratamientos' && (
              <div className="animate-google-slide-up">
                <TratamientosPanel
                  tratamientos={form.tratamientos}
                  onTratamientosChange={v => updateForm('tratamientos', v)}
                  tratamientosNotas={form.tratamientos_notas}
                  onTratamientosNotasChange={v => updateForm('tratamientos_notas', v)}
                />
              </div>
            )}
          </div>
        </main>
        </div>

        <WizardStepFooter
          currentStep={currentStepIndex + 1}
          totalSteps={WIZARD_STEPS.length}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          saving={saving}
          onPrevious={goPrevious}
          onNext={goNext}
          onFinalize={handleFinalize}
        />
      </div>

      <Snackbar
        isOpen={snackbar.open}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
      />

      <Modal
        isOpen={!!savedFicha}
        onClose={handleCloseSuccessModal}
        title="Consulta guardada"
        description="Descarga el PDF y envía el mensaje por WhatsApp. Deberás adjuntar el PDF manualmente en el chat."
        size="sm"
        align="center"
        icon={
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </div>
        }
        footer={
          <ModalActions className="w-full">
            <Button variant="ghost" type="button" onClick={handleCloseSuccessModal} className="w-full sm:w-auto">
              Ir al paciente
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto gap-2 text-success border-success/30 hover:bg-success-light"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadSavedPdf}
              className="w-full sm:w-auto gap-2"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingPdf ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </ModalActions>
        }
      >
        <div className="rounded-xl border border-outline bg-surface-dim px-4 py-3 text-sm text-on-surface-variant">
          <p>
            Paciente: <strong className="text-on-surface font-medium">{patientName}</strong>
          </p>
          {isEditingRoute && (
            <p className="mt-1 text-xs">Fecha de consulta: {fechaServicio}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
