import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, MessageCircle, Loader2, Smartphone, RefreshCw } from 'lucide-react'
import {
  buildConsentPatientUrl,
  createConsentSession,
  getActiveConsentSessionForPaciente,
  getConsentSessionForFicha,
  resetConsentSession,
  shareConsentLinkViaWhatsApp,
  type SesionFirma,
} from '../../lib/consentSessionService'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

interface ConsentSyncPanelProps {
  pacienteId: string
  pacienteNombre: string
  patientPhone: string
  fichaId: string | null
  remoteCompleted: boolean
  onSessionReady: (session: SesionFirma) => void
  onResetRemote: () => void
}

export function ConsentSyncPanel({
  pacienteId,
  pacienteNombre,
  patientPhone,
  fichaId,
  remoteCompleted,
  onSessionReady,
  onResetRemote,
}: ConsentSyncPanelProps) {
  const [session, setSession] = useState<SesionFirma | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [resetting, setResetting] = useState(false)

  const initSession = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let existing: SesionFirma | null = null
      if (fichaId) {
        existing = await getConsentSessionForFicha(fichaId)
        if (existing && existing.estado !== 'pendiente') existing = null
      }
      if (!existing) {
        existing = await getActiveConsentSessionForPaciente(pacienteId)
      }
      const active = existing ?? await createConsentSession(pacienteId, pacienteNombre, fichaId)
      setSession(active)
      onSessionReady(active)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la sesión de firma')
    } finally {
      setLoading(false)
    }
  }, [pacienteId, pacienteNombre, fichaId, onSessionReady])

  useEffect(() => {
    void initSession()
  }, [initSession])

  const consentUrl = session ? buildConsentPatientUrl(session.token) : ''

  const handleCopy = async () => {
    if (!consentUrl) return
    try {
      await navigator.clipboard.writeText(consentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('No se pudo copiar el enlace')
    }
  }

  const handleWhatsApp = () => {
    if (!consentUrl || !patientPhone) return
    shareConsentLinkViaWhatsApp(patientPhone, pacienteNombre, consentUrl)
  }

  const handleReset = async () => {
    if (!session) return
    setResetting(true)
    try {
      const refreshed = await resetConsentSession(session.id)
      setSession(refreshed)
      onSessionReady(refreshed)
      onResetRemote()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reiniciar la sesión')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-5 bg-surface rounded-xl border border-outline flex items-center justify-center gap-2 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Preparando enlace para el paciente…</span>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="p-5 bg-surface rounded-xl border border-error/30 text-error text-sm">
        {error}
        <button
          type="button"
          onClick={() => void initSession()}
          className="mt-3 block text-primary font-medium cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-5 bg-surface rounded-xl border border-outline space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-on-surface font-outfit flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Firma en dispositivo del paciente
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            El paciente solo verá el consentimiento y la firma en su teléfono o tablet.
          </p>
        </div>
        <span className={cn(
          'shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold',
          remoteCompleted
            ? 'bg-primary-light text-primary'
            : 'bg-surface-container text-on-surface-variant',
        )}>
          {remoteCompleted ? 'Firma recibida' : 'Esperando paciente'}
        </span>
      </div>

      {session && !remoteCompleted && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-white rounded-xl border border-outline shrink-0">
            <QRCodeSVG value={consentUrl} size={140} level="M" />
          </div>
          <div className="flex-1 w-full space-y-2">
            <p className="text-xs text-on-surface-variant break-all">{consentUrl}</p>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="md" className="flex-1 sm:flex-none min-h-[44px]" onClick={() => void handleCopy()}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              {patientPhone && (
                <Button type="button" variant="outline" size="md" className="flex-1 sm:flex-none min-h-[44px]" onClick={handleWhatsApp}>
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {remoteCompleted && (
        <div className="p-4 rounded-xl bg-primary-light/50 border border-primary/20 text-sm text-on-surface">
          El paciente completó el consentimiento y la firma. Puede continuar al siguiente paso.
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetting}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', resetting && 'animate-spin')} />
            Limpiar y volver a enviar
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}
