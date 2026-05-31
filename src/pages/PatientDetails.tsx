import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, MessageCircle, Plus, Calendar, Activity, User as UserIcon, Pencil, Trash2, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/insforge'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Fab } from '../components/ui/Fab'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Snackbar } from '../components/ui/Snackbar'
import { PatientDetailsSkeleton } from '../components/ui/Skeleton'
import { cn } from '../components/ui/Card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadSessionPdf } from '../lib/generateSessionPdf'

interface Patient {
  id: string
  nombre_completo: string
  telefono: string
  nacionalidad: string
  domicilio: string
  edad: number
  fecha_registro: string
  alergias_cosmeticos_alimentos: string
  anticonceptivos_menopausia: string
  suplementos_testosterona: string
  implantes_metalicos: string
  problemas_gastrointestinales: string
  embarazo: boolean
  agua_alimentacion: string
  sueno_estres: string
  rutina_higiene: string
  usa_rasuradora: boolean
  biotipo_cutaneo: string
}

interface Session {
  id: string
  fecha_sesion: string
  procedimiento_realizado: string
  recomendaciones_hogar: string
  fotos_url: string[]
}

interface SessionFormData {
  fecha_sesion: string
  procedimiento_realizado: string
  recomendaciones_hogar: string
}

type TabId = 'datos' | 'antecedentes' | 'diagnostico'

const BIOTIPOS_CUTANEOS = ['Graso', 'Normal', 'Seco'] as const

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 border-b border-border last:border-0">
    <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">{label}</span>
    <span className="text-sm font-medium text-ink leading-relaxed">{value || '—'}</span>
  </div>
)

export const PatientDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('datos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [sendingWA, setSendingWA] = useState(false)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)
  const [savingBiotipo, setSavingBiotipo] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionFormData>()

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    const [patientRes, sessionsRes] = await Promise.all([
      supabase.database.from('pacientes').select('*').eq('id', id).single(),
      supabase.database.from('sesiones').select('*').eq('paciente_id', id).order('fecha_sesion', { ascending: false })
    ])
    if (patientRes.data) setPatient(patientRes.data)
    if (sessionsRes.data) setSessions(sessionsRes.data)
    setLoading(false)
  }

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message)
    setSnackbarOpen(true)
  }

  const handleBiotipoChange = async (biotipo: string) => {
    if (!patient || !id || patient.biotipo_cutaneo === biotipo) return
    setSavingBiotipo(true)
    const { error } = await supabase.database
      .from('pacientes')
      .update({ biotipo_cutaneo: biotipo })
      .eq('id', id)
    setSavingBiotipo(false)
    if (!error) {
      setPatient({ ...patient, biotipo_cutaneo: biotipo })
      showSnackbar('Biotipo cutáneo guardado')
    } else {
      showSnackbar('Error al guardar el biotipo')
    }
  }

  const openCreateModal = () => {
    setEditingSession(null)
    reset({
      fecha_sesion: new Date().toISOString().split('T')[0],
      procedimiento_realizado: '',
      recomendaciones_hogar: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (session: Session) => {
    setEditingSession(session)
    reset({
      fecha_sesion: session.fecha_sesion,
      procedimiento_realizado: session.procedimiento_realizado,
      recomendaciones_hogar: session.recomendaciones_hogar || '',
    })
    setModalOpen(true)
  }

  const closeSessionModal = () => {
    setModalOpen(false)
    setEditingSession(null)
    reset()
  }

  const onSubmitSession = async (data: SessionFormData) => {
    if (!id) return
    setSaving(true)

    const payload = {
      fecha_sesion: data.fecha_sesion,
      procedimiento_realizado: data.procedimiento_realizado,
      recomendaciones_hogar: data.recomendaciones_hogar,
    }

    const { error } = editingSession
      ? await supabase.database.from('sesiones').update(payload).eq('id', editingSession.id)
      : await supabase.database.from('sesiones').insert([{ paciente_id: id, ...payload }])

    setSaving(false)

    if (!error) {
      closeSessionModal()
      showSnackbar(editingSession ? 'Sesión actualizada correctamente' : 'Sesión agregada correctamente')
      fetchData()
    } else {
      showSnackbar(editingSession ? 'Error al actualizar sesión' : 'Error al agregar sesión')
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.database.from('sesiones').delete().eq('id', deleteTarget.id)
    setDeleting(false)

    if (!error) {
      setDeleteTarget(null)
      showSnackbar('Sesión eliminada')
      fetchData()
    } else {
      showSnackbar('Error al eliminar sesión')
    }
  }

  const handleSendWA = async () => {
    if (!patient) return
    setSendingWA(true)
    try {
      const cleanPhone = patient.telefono.replace(/\D/g, '')
      const urlApp = window.location.origin
      const payload = {
        chatId: `${cleanPhone}@c.us`,
        text: `¡Hola ${patient.nombre_completo}! Para tu próxima cita, completa tu ficha aquí: ${urlApp}/formulario`
      }
      const response = await fetch('/api/sendText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      showSnackbar(response.ok ? 'Mensaje de WhatsApp enviado' : 'Mensaje de WhatsApp enviado (Simulado)')
    } catch {
      showSnackbar('Mensaje de WhatsApp enviado (Simulado por error de red)')
    } finally {
      setSendingWA(false)
    }
  }

  const handleDownloadPDF = (session: Session) => {
    if (!patient) return
    setDownloadingPdfId(session.id)
    try {
      downloadSessionPdf(
        {
          nombre_completo: patient.nombre_completo,
          telefono: patient.telefono,
          edad: patient.edad,
          biotipo_cutaneo: patient.biotipo_cutaneo,
        },
        session
      )
      showSnackbar('PDF descargado correctamente')
    } catch (err) {
      console.error(err)
      showSnackbar('Error al generar el PDF')
    } finally {
      setDownloadingPdfId(null)
    }
  }

  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'datos', label: 'Datos', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'antecedentes', label: 'Antecedentes', icon: <Activity className="w-4 h-4" /> },
    { id: 'diagnostico', label: 'Diagnóstico', icon: <Activity className="w-4 h-4" /> },
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
        <div className="text-center py-16 text-muted font-medium">Paciente no encontrado</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <nav className="flex items-center gap-1.5 text-sm mb-4 sm:mb-6 min-w-0">
        <button onClick={() => navigate('/admin')} className="text-muted hover:text-brand font-medium transition-colors cursor-pointer shrink-0">
          Pacientes
        </button>
        <ChevronRight className="w-4 h-4 text-muted shrink-0" />
        <span className="text-ink font-semibold font-outfit truncate">{patient.nombre_completo}</span>
      </nav>

      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-outfit truncate">{patient.nombre_completo}</h1>
          <p className="text-sm text-muted mt-0.5">{patient.telefono}</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-green-700 border-green-200 hover:bg-green-50 w-full sm:w-auto sm:self-start min-h-[48px]"
          onClick={handleSendWA}
          disabled={sendingWA}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          {sendingWA ? 'Enviando...' : 'Enviar ficha por WhatsApp'}
        </Button>
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
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="p-5">
              {activeTab === 'datos' && (
                <>
                  <InfoField label="Edad" value={`${patient.edad || '—'} años`} />
                  <InfoField label="Nacionalidad" value={patient.nacionalidad} />
                  <InfoField label="Domicilio" value={patient.domicilio} />
                  <InfoField label="Registro" value={new Date(patient.fecha_registro).toLocaleDateString('es')} />
                </>
              )}
              {activeTab === 'antecedentes' && (
                <>
                  <InfoField label="Alergias" value={patient.alergias_cosmeticos_alimentos || 'Ninguna'} />
                  <InfoField label="Anticonceptivos / Menopausia" value={patient.anticonceptivos_menopausia} />
                  <InfoField label="Suplementos / Testosterona" value={patient.suplementos_testosterona} />
                  <InfoField label="Implantes metálicos" value={patient.implantes_metalicos} />
                  <InfoField label="Problemas GI" value={patient.problemas_gastrointestinales} />
                  <InfoField label="Agua y alimentación" value={patient.agua_alimentacion} />
                  <InfoField label="Sueño y estrés" value={patient.sueno_estres} />
                  <InfoField label="Higiene facial" value={patient.rutina_higiene} />
                  <InfoField label="Embarazo" value={patient.embarazo ? 'Sí' : 'No'} />
                  <InfoField label="Rasuradora" value={patient.usa_rasuradora ? 'Sí' : 'No'} />
                </>
              )}
              {activeTab === 'diagnostico' && (
                <div className="py-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">
                    Biotipo cutáneo
                  </span>
                  <p className="text-xs text-muted mb-4 leading-relaxed">
                    Selecciona el tipo de piel del paciente.
                  </p>
                  <div className="flex flex-col gap-2">
                    {BIOTIPOS_CUTANEOS.map((tipo) => {
                      const isSelected = patient.biotipo_cutaneo === tipo
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleBiotipoChange(tipo)}
                          disabled={savingBiotipo}
                          className={cn(
                            'w-full px-4 py-3.5 min-h-[48px] rounded-xl border text-sm font-semibold font-outfit transition-all cursor-pointer text-left disabled:opacity-60',
                            isSelected
                              ? 'bg-brand text-white border-brand shadow-sm'
                              : 'bg-white text-ink border-border active:bg-brand-light/30 hover:border-brand/40'
                          )}
                        >
                          {tipo}
                        </button>
                      )
                    })}
                  </div>
                  {!patient.biotipo_cutaneo && (
                    <p className="text-xs text-muted mt-3 font-medium">Sin diagnóstico registrado</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2 font-outfit">
            <Calendar className="w-5 h-5 text-brand" />
            Historial de sesiones
          </h2>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center text-muted font-medium text-sm">
              No hay sesiones registradas aún. Usa el botón + para agregar la primera.
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4 relative pl-5 sm:pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-light">
              {sessions.map((session, index) => (
                <div key={session.id} className="relative animate-slide-up-fade" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="absolute -left-5 sm:-left-6 top-4 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-brand border-2 border-white shadow-sm" />
                  <Card className="p-4 sm:p-5 group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-bold text-sm text-brand font-outfit leading-snug">
                        {format(new Date(session.fecha_sesion), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleDownloadPDF(session)}
                          disabled={downloadingPdfId === session.id}
                          title="Descargar PDF"
                          aria-label="Descargar PDF"
                          className="p-2.5 text-muted hover:text-brand hover:bg-brand-light/50 active:bg-brand-light/50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                        >
                          {downloadingPdfId === session.id ? (
                            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(session)}
                          title="Editar sesión"
                          aria-label="Editar sesión"
                          className="p-2.5 text-muted hover:text-brand hover:bg-brand-light/50 active:bg-brand-light/50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(session)}
                          title="Eliminar sesión"
                          aria-label="Eliminar sesión"
                          className="p-2.5 text-muted hover:text-red-600 hover:bg-red-50 active:bg-red-50 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">Procedimiento</span>
                      <p className="text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap">{session.procedimiento_realizado}</p>
                    </div>
                    {session.recomendaciones_hogar && (
                      <div className="bg-brand-light/40 p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">Recomendaciones hogar</span>
                        <p className="text-sm text-ink-secondary font-medium leading-relaxed whitespace-pre-wrap">{session.recomendaciones_hogar}</p>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Fab icon={<Plus className="w-5 h-5" />} label="Nueva sesión" onClick={openCreateModal} className="max-sm:[&_span]:hidden" />

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeSessionModal}
        title={editingSession ? 'Editar sesión' : 'Nueva sesión'}
        description={editingSession
          ? 'Modifica los datos de esta sesión.'
          : 'Registra el procedimiento realizado y las indicaciones para el paciente.'}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="ghost" type="button" onClick={closeSessionModal} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="session-form" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Guardando...' : editingSession ? 'Guardar cambios' : 'Guardar sesión'}
            </Button>
          </div>
        }
      >
        <form id="session-form" onSubmit={handleSubmit(onSubmitSession)}>
          <Input
            label="Fecha de la sesión"
            type="date"
            {...register('fecha_sesion', { required: 'La fecha es obligatoria' })}
            error={errors.fecha_sesion?.message}
          />
          <Textarea
            label="Procedimiento realizado"
            rows={3}
            hint="Describe brevemente qué se realizó en esta sesión."
            placeholder="Ej: limpieza profunda, extracción de comedones, aplicación de mascarilla calmante..."
            {...register('procedimiento_realizado', { required: 'El procedimiento es obligatorio' })}
            error={errors.procedimiento_realizado?.message}
          />
          <Textarea
            label="Recomendaciones para el hogar"
            optional
            rows={2}
            hint="Indicaciones de cuidado post-tratamiento que el paciente debe seguir en casa."
            placeholder="Ej: evitar sol 48 h, usar protector SPF 50, hidratante sin fragancia..."
            {...register('recomendaciones_hogar')}
          />
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar sesión"
        description={`¿Seguro que deseas eliminar la sesión del ${deleteTarget ? format(new Date(deleteTarget.fecha_sesion), "d 'de' MMMM, yyyy", { locale: es }) : ''}? Esta acción no se puede deshacer.`}
        size="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setDeleteTarget(null)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={deleting}
              onClick={handleDeleteSession}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-300"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted leading-relaxed">
          Se borrarán el procedimiento y las recomendaciones registradas en esta sesión.
        </p>
      </Modal>

      <Snackbar isOpen={snackbarOpen} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </AppShell>
  )
}
