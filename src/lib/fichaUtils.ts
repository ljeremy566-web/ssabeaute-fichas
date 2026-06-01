import type { FichaClinica } from './fichaService'
import { parseLocalDate } from './dateUtils'
import { parseMotivoConsulta } from './serviciosCatalogo'

export type FichaWizardStepId =
  | 'consentimiento'
  | 'anamnesis'
  | 'evaluacion'
  | 'mapa'
  | 'evidencia'
  | 'tratamientos'
  | 'rutinas'

export const FICHA_WIZARD_STEPS: FichaWizardStepId[] = [
  'consentimiento',
  'anamnesis',
  'evaluacion',
  'mapa',
  'evidencia',
  'tratamientos',
  'rutinas',
]

export const FICHA_WIZARD_STEP_LABELS: Record<FichaWizardStepId, string> = {
  consentimiento: 'Consentimiento',
  anamnesis: 'Anamnesis',
  evaluacion: 'Evaluación',
  mapa: 'Mapa facial',
  evidencia: 'Evidencia',
  tratamientos: 'Tratamientos',
  rutinas: 'Rutinas',
}

/** Completed wizard steps inferred from persisted ficha data. */
export function getCompletedWizardSteps(ficha: FichaClinica): FichaWizardStepId[] {
  const tr = ficha.tratamientos_realizados ?? {}
  const ep = ficha.evaluacion_profesional ?? {}
  const parsedMotivo = parseMotivoConsulta(ficha.motivo_consulta)

  const completed: FichaWizardStepId[] = []

  if (ficha.ruta_firma && tr.acepta_consentimiento) completed.push('consentimiento')
  if (ficha.motivo_consulta || parsedMotivo.seleccionados.length > 0) completed.push('anamnesis')
  if (ep.biotipo && ep.tipo_piel) completed.push('evaluacion')
  if (ficha.ruta_mapa_facial) completed.push('mapa')
  if (ficha.ruta_foto_antes || ficha.ruta_foto_despues) completed.push('evidencia')
  if ((tr.tratamientos?.length ?? 0) > 0 || tr.tratamientos_notas) completed.push('tratamientos')

  const cf = ficha.cuidados_faciales ?? {}
  if (cf.rutina_dia || cf.rutina_noche) completed.push('rutinas')

  return completed
}

export function getPendingWizardSteps(ficha: FichaClinica): FichaWizardStepId[] {
  const completed = new Set(getCompletedWizardSteps(ficha))
  return FICHA_WIZARD_STEPS.filter(step => !completed.has(step))
}

/**
 * Most recent ficha whose fecha_servicio falls in the calendar month before `reference`.
 * Falls back to the newest ficha before the current month if none in previous month.
 */
export function getPreviousMonthFicha(
  fichas: FichaClinica[],
  reference: Date = new Date(),
): FichaClinica | null {
  if (fichas.length === 0) return null

  const prevMonth = reference.getMonth() === 0 ? 11 : reference.getMonth() - 1
  const prevYear = reference.getMonth() === 0 ? reference.getFullYear() - 1 : reference.getFullYear()

  const inPreviousMonth = fichas.filter(f => {
    const d = parseLocalDate(f.fecha_servicio)
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear
  })

  if (inPreviousMonth.length > 0) return inPreviousMonth[0]

  const beforeCurrentMonth = fichas.filter(f => {
    const d = parseLocalDate(f.fecha_servicio)
    return d.getFullYear() < reference.getFullYear()
      || (d.getFullYear() === reference.getFullYear() && d.getMonth() < reference.getMonth())
  })

  return beforeCurrentMonth[0] ?? null
}

export function getPreviousMonthLabel(reference: Date = new Date()): string {
  const d = new Date(reference.getFullYear(), reference.getMonth() - 1, 1)
  return d.toLocaleDateString('es', { month: 'long', year: 'numeric' })
}

/** Clinical fields to pre-fill on follow-up visits (not today's session data). */
export function buildClinicalPrefillFromFicha(ficha: FichaClinica): {
  motivo_consulta: string
  motivo_servicios: string[]
  motivo_otro: string
  alergias: string[]
  alergias_detalle: string
  medicamentos: string[]
  medicamentos_detalle: string
  enfermedades: string[]
  enfermedades_detalle: string
  embarazo: string
  consumo_agua: string
  horas_sueno: string
  nivel_estres: string
  rutina_facial: string[]
  rutina_detalle: string
  rutina_dia: string
  rutina_noche: string
  biotipo: string
  tipo_piel: string
  estado_piel: string[]
  estado_piel_notas: string
  mapa_genero: 'female' | 'male'
} {
  const dm = ficha.datos_medicos ?? {}
  const cf = ficha.cuidados_faciales ?? {}
  const ep = ficha.evaluacion_profesional ?? {}

  return {
    motivo_consulta: '',
    motivo_servicios: [],
    motivo_otro: '',
    alergias: dm.alergias ?? [],
    alergias_detalle: dm.alergias_detalle ?? '',
    medicamentos: dm.medicamentos ?? [],
    medicamentos_detalle: dm.medicamentos_detalle ?? '',
    enfermedades: dm.enfermedades ?? [],
    enfermedades_detalle: dm.enfermedades_detalle ?? '',
    embarazo: dm.embarazo ?? '',
    consumo_agua: dm.consumo_agua ?? '',
    horas_sueno: dm.horas_sueno ?? '',
    nivel_estres: dm.nivel_estres ?? '',
    rutina_facial: cf.rutina_facial ?? [],
    rutina_detalle: cf.rutina_detalle ?? '',
    rutina_dia: (cf.rutina_dia as string) ?? '',
    rutina_noche: (cf.rutina_noche as string) ?? '',
    biotipo: ep.biotipo ?? '',
    tipo_piel: ep.tipo_piel ?? '',
    estado_piel: ep.estado_piel ?? [],
    estado_piel_notas: ep.estado_piel_notas ?? '',
    mapa_genero: ep.mapa_genero === 'male' ? 'male' : 'female',
  }
}
