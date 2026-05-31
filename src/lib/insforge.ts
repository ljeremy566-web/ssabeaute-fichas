import { createClient } from '@insforge/sdk'

const supabaseUrl = import.meta.env.VITE_INSFORGE_BASE_URL
const supabaseAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'VITE_INSFORGE_BASE_URL',
    !supabaseAnonKey && 'VITE_INSFORGE_ANON_KEY',
  ].filter(Boolean).join(', ')

  throw new Error(
    `Faltan variables de InsForge (${missing}). ` +
    'En Cloudflare Pages: Settings → Environment variables → añádelas en Production y redeploy. ' +
    'En local: copia .env.example a .env.local'
  )
}

export const supabase = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey
})
