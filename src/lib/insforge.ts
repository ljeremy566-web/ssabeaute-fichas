import { createClient } from '@insforge/sdk'

const insforgeUrl = import.meta.env.VITE_INSFORGE_BASE_URL
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!insforgeUrl || !insforgeAnonKey) {
  const missing = [
    !insforgeUrl && 'VITE_INSFORGE_BASE_URL',
    !insforgeAnonKey && 'VITE_INSFORGE_ANON_KEY',
  ].filter(Boolean).join(', ')

  throw new Error(
    `Faltan variables de InsForge (${missing}). ` +
    'En Cloudflare Pages: Settings → Environment variables → añádelas en Production y redeploy. ' +
    'En local: copia .env.example a .env.local'
  )
}

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey
})
