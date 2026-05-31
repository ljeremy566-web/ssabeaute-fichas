import { useEffect, useRef, useCallback } from 'react'
import { insforge } from '../lib/insforge'
import {
  getConsentSessionByToken,
  sessionToCompletedPayload,
  type ConsentCompletedPayload,
} from '../lib/consentSessionService'

const POLL_INTERVAL_MS = 3000

interface UseConsentSessionSyncOptions {
  token: string | null
  enabled: boolean
  onCompleted: (payload: ConsentCompletedPayload) => void
}

export function useConsentSessionSync({
  token,
  enabled,
  onCompleted,
}: UseConsentSessionSyncOptions) {
  const onCompletedRef = useRef(onCompleted)
  onCompletedRef.current = onCompleted

  const handleCompletedPayload = useCallback((payload: ConsentCompletedPayload) => {
    if (payload.estado !== 'completada' || !payload.firma_base64) return
    onCompletedRef.current(payload)
  }, [])

  const pollSession = useCallback(async (sessionToken: string) => {
    try {
      const session = await getConsentSessionByToken(sessionToken)
      if (session?.estado === 'completada' && session.firma_base64) {
        handleCompletedPayload(sessionToCompletedPayload(session))
      }
    } catch (err) {
      console.warn('Error al consultar sesión de firma:', err)
    }
  }, [handleCompletedPayload])

  useEffect(() => {
    if (!token || !enabled) return

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null
    const channel = `firma:${token}`

    const onRealtimeCompleted = (payload: unknown) => {
      const data = payload as ConsentCompletedPayload
      handleCompletedPayload(data)
    }

    void (async () => {
      try {
        await insforge.realtime.connect()
        const response = await insforge.realtime.subscribe(channel)
        if (!response.ok) {
          console.warn('Realtime subscribe failed:', response.error?.message)
        } else {
          insforge.realtime.on('consent_completed', onRealtimeCompleted)
        }
      } catch (err) {
        console.warn('Realtime connection failed:', err)
      }

      if (!cancelled) {
        void pollSession(token)
        pollTimer = setInterval(() => void pollSession(token), POLL_INTERVAL_MS)
      }
    })()

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      insforge.realtime.off('consent_completed', onRealtimeCompleted)
      insforge.realtime.unsubscribe(channel)
    }
  }, [token, enabled, pollSession, handleCompletedPayload])
}
