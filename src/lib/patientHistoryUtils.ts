import type { FichaClinica } from './fichaService'
import { getPendingWizardSteps } from './fichaUtils'
import { isSoloRutinaFicha } from './soloRutinaFicha'

export const HISTORY_INITIAL_VISIBLE = 5
export const HISTORY_LOAD_MORE_STEP = 5

export type ConsultaFilter = 'all' | 'incomplete' | 'complete'

export type FichaStatusBadge = {
  label: string
  tone: 'success' | 'warning' | 'neutral'
}

export function partitionFichas(fichas: FichaClinica[]) {
  const consultas: FichaClinica[] = []
  const rutinas: FichaClinica[] = []
  for (const f of fichas) {
    if (isSoloRutinaFicha(f)) rutinas.push(f)
    else consultas.push(f)
  }
  return { consultas, rutinas }
}

export function getLatestConsultaPresencial(consultas: FichaClinica[]): FichaClinica | null {
  return consultas[0] ?? null
}

export function getLatestRutinaRemota(rutinas: FichaClinica[]): FichaClinica | null {
  return rutinas[0] ?? null
}

export function getIncompleteConsultas(consultas: FichaClinica[]): FichaClinica[] {
  return consultas.filter(f => getPendingWizardSteps(f).length > 0)
}

export function isConsultaComplete(ficha: FichaClinica): boolean {
  return getPendingWizardSteps(ficha).length === 0
}

export function filterConsultas(consultas: FichaClinica[], filter: ConsultaFilter): FichaClinica[] {
  if (filter === 'all') return consultas
  if (filter === 'incomplete') return getIncompleteConsultas(consultas)
  return consultas.filter(isConsultaComplete)
}

export function getFichaDisplayTitle(ficha: FichaClinica, soloRutina: boolean): string {
  if (soloRutina) return 'Rutina personalizada'
  return ficha.motivo_consulta?.trim() || 'Consulta sin motivo registrado'
}

export function getFichaStatusBadge(ficha: FichaClinica, soloRutina: boolean): FichaStatusBadge {
  const pending = getPendingWizardSteps(ficha)
  if (pending.length === 0) {
    return soloRutina
      ? { label: 'Lista', tone: 'success' }
      : { label: 'Completa', tone: 'success' }
  }
  if (soloRutina) return { label: 'Sin completar', tone: 'warning' }
  return { label: `Incompleta · ${pending.length}`, tone: 'warning' }
}

export function getPatientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function countAttachedPhotos(ficha: FichaClinica): number {
  let n = 0
  if (ficha.ruta_foto_antes) n++
  if (ficha.ruta_foto_despues) n++
  return n
}

export function parseRutinaLines(text: string | undefined): string[] {
  if (!text?.trim()) return []
  return text
    .split(/\n+/)
    .map(l => l.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6)
}

export function hasRutinaContent(ficha: FichaClinica): boolean {
  const cf = ficha.cuidados_faciales ?? {}
  return Boolean((cf.rutina_dia as string)?.trim() || (cf.rutina_noche as string)?.trim())
}

export function getClinicalContextChips(ficha: FichaClinica | null): string[] {
  if (!ficha || isSoloRutinaFicha(ficha)) return []
  const chips: string[] = []
  const ep = ficha.evaluacion_profesional ?? {}
  if (ep.tipo_piel) chips.push(ep.tipo_piel)
  if (ep.estado_piel?.length) chips.push(...ep.estado_piel.slice(0, 2))
  const tr = ficha.tratamientos_realizados?.tratamientos ?? []
  if (tr.length) chips.push(tr[0])
  return chips.slice(0, 4)
}

/** True when patient has no in-person consultas yet (skip start screen). */
export function shouldSkipConsultationStart(consultas: FichaClinica[]): boolean {
  return consultas.length === 0
}
