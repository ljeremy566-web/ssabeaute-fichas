import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Check, Download, Loader2, MessageCircle } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BackNav } from '../components/ui/BackNav'
import { Button } from '../components/ui/Button'
import { Modal, ModalActions } from '../components/ui/Modal'
import { Snackbar } from '../components/ui/Snackbar'
import { RutinasEditor } from '../components/rutinas/RutinasEditor'
import { createFicha, getFichaById, updateFicha, type FichaClinica } from '../lib/fichaService'
import { getPacienteById, syncPacienteFromFicha } from '../lib/pacienteService'
import { downloadRutinasPdf, shareRutinasViaWhatsApp } from '../lib/generateFichaPdf'
import { buildSoloRutinaFichaInsert, isSoloRutinaFicha } from '../lib/soloRutinaFicha'

export const RoutineDeliveryPage = () => {
  const { pacienteId, fichaId } = useParams<{ pacienteId: string; fichaId?: string }>()
  const navigate = useNavigate()

  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [rutinaDia, setRutinaDia] = useState('')
  const [rutinaNoche, setRutinaNoche] = useState('')
  const [fechaServicio, setFechaServicio] = useState(() => new Date().toISOString().split('T')[0])
  const [currentFichaId, setCurrentFichaId] = useState<string | null>(fichaId ?? null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFicha, setSavedFicha] = useState<FichaClinica | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })

  const showSnackbar = (message: string) => setSnackbar({ open: true, message })

  useEffect(() => {
    if (!pacienteId) return
    let aborted = false

    void (async () => {
      setLoading(true)
      setLoadError('')
      try {
        const patient = await getPacienteById(pacienteId)
        if (aborted) return
        if (!patient) {
          setLoadError('Paciente no encontrado')
          return
        }
        setPatientName(patient.nombre_completo ?? '')
        setPatientPhone(patient.telefono ?? '')

        if (fichaId) {
          const ficha = await getFichaById(fichaId)
          if (!ficha || ficha.paciente_id !== pacienteId) {
            setLoadError('No se pudo cargar el registro de rutina')
            return
          }
          if (!isSoloRutinaFicha(ficha)) {
            setLoadError('Este registro pertenece a una consulta clínica. Edítalo desde la consulta completa.')
            return
          }
          const cf = ficha.cuidados_faciales ?? {}
          setRutinaDia((cf.rutina_dia as string) ?? '')
          setRutinaNoche((cf.rutina_noche as string) ?? '')
          setFechaServicio(ficha.fecha_servicio)
          setCurrentFichaId(ficha.id)
        }
      } catch (err) {
        console.error(err)
        if (!aborted) setLoadError('Error al cargar los datos')
      } finally {
        if (!aborted) setLoading(false)
      }
    })()

    return () => { aborted = true }
  }, [pacienteId, fichaId])

  const validate = (): string | null => {
    if (!rutinaDia.trim() && !rutinaNoche.trim()) {
      return 'Completa al menos la rutina de día o de noche'
    }
    return null
  }

  const handleSave = async () => {
    if (!pacienteId) return
    const err = validate()
    if (err) {
      showSnackbar(err)
      return
    }

    setSaving(true)
    try {
      const body = {
        cuidados_faciales: {
          rutina_dia: rutinaDia,
          rutina_noche: rutinaNoche,
        },
      }

      const saved = currentFichaId
        ? await updateFicha(currentFichaId, body)
        : await createFicha(buildSoloRutinaFichaInsert(pacienteId, fechaServicio, rutinaDia, rutinaNoche))

      await syncPacienteFromFicha(pacienteId, saved)

      if (!currentFichaId) {
        setCurrentFichaId(saved.id)
        navigate(`/admin/paciente/${pacienteId}/rutina/${saved.id}`, { replace: true })
      }

      setSavedFicha(saved)
    } catch (err) {
      console.error(err)
      showSnackbar(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    const ficha = savedFicha
    if (!ficha) return
    setDownloadingPdf(true)
    try {
      await downloadRutinasPdf(
        { nombre_completo: patientName, telefono: patientPhone },
        { fecha_servicio: ficha.fecha_servicio, cuidados_faciales: ficha.cuidados_faciales },
      )
    } catch (err) {
      console.error(err)
      showSnackbar('Error al generar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleWhatsApp = () => {
    if (!patientPhone) {
      showSnackbar('El paciente no tiene teléfono registrado')
      return
    }
    try {
      shareRutinasViaWhatsApp(patientPhone, patientName, savedFicha?.fecha_servicio)
    } catch {
      showSnackbar('Teléfono inválido para WhatsApp')
    }
  }

  const handleCloseModal = () => {
    setSavedFicha(null)
    navigate(`/admin/paciente/${pacienteId}`)
  }

  if (!pacienteId) {
    return (
      <AppShell>
        <p className="text-on-surface font-medium">Paciente no especificado.</p>
      </AppShell>
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (loadError) {
    return (
      <AppShell>
        <BackNav to={`/admin/paciente/${pacienteId}`} label="Volver al paciente" className="mb-6" />
        <p className="text-on-surface font-medium mb-4">{loadError}</p>
        <Button variant="primary" onClick={() => navigate(`/admin/paciente/${pacienteId}`)}>
          Ir al paciente
        </Button>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <BackNav to={`/admin/paciente/${pacienteId}`} label="Volver al paciente" className="mb-4 sm:mb-6" />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink font-outfit">Enviar rutina</h1>
            <p className="text-sm text-muted mt-0.5">
              {patientName} · Sin consentimiento ni mapa facial
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="fecha-rutina" className="text-xs font-semibold text-muted uppercase tracking-wide font-outfit block mb-1.5">
            Fecha del envío
          </label>
          <input
            id="fecha-rutina"
            type="date"
            value={fechaServicio}
            onChange={e => setFechaServicio(e.target.value)}
            disabled={!!currentFichaId}
            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </div>

        <RutinasEditor
          rutinaDia={rutinaDia}
          rutinaNoche={rutinaNoche}
          onRutinaDiaChange={setRutinaDia}
          onRutinaNocheChange={setRutinaNoche}
        />

        <div className="mt-8 flex flex-col sm:flex-row gap-3 safe-bottom pb-6">
          <Button
            variant="primary"
            className="w-full sm:flex-1 gap-2 min-h-[48px]"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Guardar y compartir'}
          </Button>
        </div>
      </div>

      <Snackbar
        isOpen={snackbar.open}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
      />

      <Modal
        isOpen={!!savedFicha}
        onClose={handleCloseModal}
        title="Rutina guardada"
        description="Descarga el PDF para el cliente y envía el mensaje por WhatsApp. Adjunta el PDF manualmente en el chat."
        size="sm"
        align="center"
        icon={
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </div>
        }
        footer={
          <ModalActions className="w-full">
            <Button variant="ghost" type="button" onClick={handleCloseModal} className="w-full sm:w-auto">
              Ir al paciente
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleWhatsApp}
              className="w-full sm:w-auto gap-2 text-success border-success/30 hover:bg-success-light"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadPdf()}
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
        </div>
      </Modal>
    </AppShell>
  )
}
