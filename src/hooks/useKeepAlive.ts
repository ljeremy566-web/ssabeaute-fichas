import { useEffect } from 'react'
import { insforge } from '../lib/insforge'

/**
 * Keeps the InsForge Postgres connection warm by running a cheap SELECT
 * every INTERVAL_MS while the app is mounted and the tab is visible.
 *
 * This prevents the database from being paused/suspended due to inactivity
 * on free/shared plans that auto-sleep after a period without queries.
 */
const INTERVAL_MS = 4 * 60 * 1000 // 4 minutes

export function useKeepAlive() {
  useEffect(() => {
    const ping = async () => {
      // Only ping when the tab is active to avoid waking the DB needlessly
      if (document.visibilityState !== 'visible') return
      try {
        await insforge.database
          .from('pacientes')
          .select('id')
          .limit(1)
      } catch {
        // Silently ignore — keep-alive failures are non-critical
      }
    }

    // Run once immediately when the app mounts
    void ping()

    const timer = setInterval(() => void ping(), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])
}
