import { createClient } from '@insforge/sdk'

const supabaseUrl = import.meta.env.VITE_INSFORGE_BASE_URL
const supabaseAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing InsForge environment variables')
}

export const supabase = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey
})
