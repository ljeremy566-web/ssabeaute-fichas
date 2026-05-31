import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { ConsentimientoBlock } from '../components/intake/ConsentimientoBlock'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import {
  fetchPublicConsentSession,
  submitPatientConsent,
  type SesionFirmaPublicView,
} from '../lib/consentSessionService'
import { cn } from '../lib/cn'

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Este enlace no es válido. Solicite uno nuevo al personal de la clínica.',
  expired: 'Este enlace ha expirado. Solicite uno nuevo al personal de la clínica.',
  already_completed: 'Ya completó el consentimiento con este enlace.',
  consent_required: 'Debe aceptar el consentimiento informado.',
  signature_required: 'La firma es obligatoria.',
}

export function PatientConsentPage() {
  const { token } = useParams<{ token: string }>()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [sessionInfo, setSessionInfo] = useState<SesionFirmaPublicView | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [aceptaConsentimiento, setAceptaConsentimiento] = useState(false)
  const [permiteFotosRedes, setPermiteFotosRedes] = useState(false)
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    if (!token) {
      setErrorMessage(ERROR_MESSAGES.not_found)
      setPageState('error')
      return
    }

    setPageState('loading')
    try {
      const data = await fetchPublicConsentSession(token)
      if (data.error) {
        setErrorMessage(ERROR_MESSAGES[data.error] ?? 'No se pudo cargar la sesión.')
        setPageState('error')
        return
      }
      if (data.estado === 'completada') {
        setSessionInfo(data)
        setPageState('success')
        return
      }
      if (data.estado === 'expirada') {
        setErrorMessage(ERROR_MESSAGES.expired)
        setPageState('error')
        return
      }
      setSessionInfo(data)
      setPageState('ready')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al cargar la sesión')
      setPageState('error')
    }
  }, [token])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const handleSubmit = async () => {
    if (!token) return
    if (!aceptaConsentimiento) {
      setErrorMessage(ERROR_MESSAGES.consent_required)
      return
    }
    if (!firmaBase64) {
      setErrorMessage(ERROR_MESSAGES.signature_required)
      return
    }

    setPageState('submitting')
    setErrorMessage('')
    try {
      const result = await submitPatientConsent(
        token,
        aceptaConsentimiento,
        permiteFotosRedes,
        firmaBase64,
      )
      if (result.error) {
        setErrorMessage(ERROR_MESSAGES[result.error] ?? 'No se pudo enviar la firma.')
        setPageState('ready')
        return
      }
      setPageState('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al enviar')
      setPageState('ready')
    }
  }

  const showStickyFooter = pageState === 'ready' || pageState === 'submitting'

  return (
    <div className="min-h-dvh bg-surface-dim flex flex-col">
      <header className="shrink-0 px-4 py-4 sm:py-5 bg-surface border-b border-outline safe-top safe-x">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Logo size="sm" />
          <div className="min-w-0">
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Consentimiento</p>
            {sessionInfo?.paciente_nombre && (
              <h1 className="text-base font-semibold text-on-surface font-outfit truncate">
                {sessionInfo.paciente_nombre}
              </h1>
            )}
          </div>
        </div>
      </header>

      <main className={cn(
        'flex-1 px-4 py-6 overflow-y-auto overscroll-contain safe-x',
        showStickyFooter && 'pb-28',
      )}>
        <div className="max-w-lg mx-auto">
          {pageState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Cargando consentimiento…</p>
            </div>
          )}

          {pageState === 'error' && (
            <div className="p-6 bg-surface rounded-xl border border-outline text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-error mx-auto" />
              <p className="text-sm text-on-surface">{errorMessage}</p>
            </div>
          )}

          {pageState === 'success' && (
            <div className="p-6 bg-surface rounded-xl border border-outline text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-lg font-semibold text-on-surface font-outfit">¡Gracias!</h2>
              <p className="text-sm text-on-surface-variant">
                Su consentimiento y firma fueron registrados correctamente.
                Ya puede devolver el dispositivo al personal de la clínica.
              </p>
            </div>
          )}

          {(pageState === 'ready' || pageState === 'submitting') && (
            <div className="space-y-6">
              <ConsentimientoBlock
                mode="patient"
                aceptaConsentimiento={aceptaConsentimiento}
                onAceptaConsentimientoChange={setAceptaConsentimiento}
                permiteFotosRedes={permiteFotosRedes}
                onPermiteFotosRedesChange={setPermiteFotosRedes}
                firmaBase64={firmaBase64}
                onFirmaChange={setFirmaBase64}
              />

              {errorMessage && (
                <p className="text-sm text-error text-center">{errorMessage}</p>
              )}

              {/* Botón visible en desktop / fallback cuando no hay sticky */}
              <div className="hidden sm:block">
                <Button
                  type="button"
                  className="w-full"
                  disabled={pageState === 'submitting' || !aceptaConsentimiento || !firmaBase64}
                  onClick={() => void handleSubmit()}
                >
                  {pageState === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    'Confirmar y firmar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showStickyFooter && (
        <footer className="fixed bottom-0 inset-x-0 z-20 border-t border-outline bg-surface/95 backdrop-blur-md px-4 py-3 safe-bottom safe-x sm:hidden">
          <div className="max-w-lg mx-auto">
            <Button
              type="button"
              className="w-full"
              disabled={pageState === 'submitting' || !aceptaConsentimiento || !firmaBase64}
              onClick={() => void handleSubmit()}
            >
              {pageState === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                'Confirmar y firmar'
              )}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
