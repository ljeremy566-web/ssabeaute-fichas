import { insforge } from './insforge'
import { buildWhatsAppUrl } from './phoneUtils'

const TABLE = 'sesiones_firma'

export type SesionFirmaEstado = 'pendiente' | 'completada' | 'expirada'

export interface SesionFirma {
  id: string
  token: string
  paciente_id: string
  paciente_nombre: string | null
  ficha_id: string | null
  acepta_consentimiento: boolean
  permite_fotos_redes: boolean
  firma_base64: string | null
  estado: SesionFirmaEstado
  created_at: string
  expires_at: string
  completed_at: string | null
}

export interface SesionFirmaPublicView {
  id?: string
  paciente_nombre: string | null
  estado: SesionFirmaEstado | string
  acepta_consentimiento?: boolean
  permite_fotos_redes?: boolean
  expires_at?: string
  error?: string
}

export interface ConsentCompletedPayload {
  acepta_consentimiento: boolean
  permite_fotos_redes: boolean
  firma_base64: string | null
  estado: SesionFirmaEstado
}

export function buildConsentPatientUrl(token: string): string {
  return `${window.location.origin}/firma/${token}`
}

export function shareConsentLinkViaWhatsApp(
  phone: string,
  patientName: string,
  consentUrl: string,
): void {
  const msg =
    `¡Hola ${patientName}! Por favor complete su consentimiento informado y firma digital en el siguiente enlace:\n\n${consentUrl}\n\nGracias — SSABEAUTE`
  const url = buildWhatsAppUrl(phone, msg)
  if (!url) throw new Error('Teléfono argentino inválido para WhatsApp')
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function createConsentSession(
  pacienteId: string,
  pacienteNombre: string,
  fichaId?: string | null,
): Promise<SesionFirma> {
  await expirePendingSessionsForPaciente(pacienteId)

  const { data, error } = await insforge.database
    .from(TABLE)
    .insert([{
      paciente_id: pacienteId,
      paciente_nombre: pacienteNombre,
      ficha_id: fichaId ?? null,
    }])
    .select()
    .single()

  if (error) throw new Error(`Error al crear sesión de firma: ${error.message}`)
  return data as SesionFirma
}

async function expirePendingSessionsForPaciente(pacienteId: string): Promise<void> {
  const { error } = await insforge.database
    .from(TABLE)
    .update({ estado: 'expirada' })
    .eq('paciente_id', pacienteId)
    .eq('estado', 'pendiente')

  if (error) {
    console.warn('No se pudieron expirar sesiones previas:', error.message)
  }
}

export async function getConsentSessionByToken(token: string): Promise<SesionFirma | null> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Error al obtener sesión: ${error.message}`)
  }
  return data as SesionFirma
}

export async function getActiveConsentSessionForPaciente(
  pacienteId: string,
): Promise<SesionFirma | null> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(`Error al buscar sesión activa: ${error.message}`)
  const row = (data ?? [])[0] as SesionFirma | undefined
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    await insforge.database.from(TABLE).update({ estado: 'expirada' }).eq('id', row.id)
    return null
  }
  return row
}

export async function getConsentSessionForFicha(fichaId: string): Promise<SesionFirma | null> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('ficha_id', fichaId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw new Error(`Error al buscar sesión de ficha: ${error.message}`)
  return ((data ?? [])[0] as SesionFirma | undefined) ?? null
}

export async function linkSessionToFicha(sessionId: string, fichaId: string): Promise<void> {
  const { error } = await insforge.database
    .from(TABLE)
    .update({ ficha_id: fichaId })
    .eq('id', sessionId)

  if (error) throw new Error(`Error al vincular sesión: ${error.message}`)
}

export async function resetConsentSession(sessionId: string): Promise<SesionFirma> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .update({
      estado: 'pendiente',
      acepta_consentimiento: false,
      permite_fotos_redes: false,
      firma_base64: null,
      completed_at: null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw new Error(`Error al reiniciar sesión: ${error.message}`)
  return data as SesionFirma
}

/** Patient-facing RPC (works without auth). */
export async function fetchPublicConsentSession(token: string): Promise<SesionFirmaPublicView> {
  const { data, error } = await insforge.database.rpc('obtener_sesion_firma', { p_token: token })

  if (error) throw new Error(error.message)
  return (data ?? { error: 'not_found' }) as SesionFirmaPublicView
}

/** Patient submits consent via RPC. */
export async function submitPatientConsent(
  token: string,
  acepta: boolean,
  redes: boolean,
  firmaBase64: string,
): Promise<{ ok?: boolean; error?: string }> {
  const { data, error } = await insforge.database.rpc('completar_sesion_firma', {
    p_token: token,
    p_acepta: acepta,
    p_redes: redes,
    p_firma_base64: firmaBase64,
  })

  if (error) throw new Error(error.message)
  return (data ?? {}) as { ok?: boolean; error?: string }
}

export function sessionToCompletedPayload(session: SesionFirma): ConsentCompletedPayload {
  return {
    acepta_consentimiento: session.acepta_consentimiento,
    permite_fotos_redes: session.permite_fotos_redes,
    firma_base64: session.firma_base64,
    estado: session.estado,
  }
}
