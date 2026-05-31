import { insforge } from './insforge'
import { deleteFichaAssets } from './storageService'

// ── Types ──────────────────────────────────────────────────

/** Shape of the JSONB `datos_medicos` column */
export interface DatosMedicos {
  alergias?: string[]
  alergias_detalle?: string
  medicamentos?: string[]
  medicamentos_detalle?: string
  enfermedades?: string[]
  enfermedades_detalle?: string
  embarazo?: string
  consumo_agua?: string
  horas_sueno?: string
  nivel_estres?: string
  [key: string]: unknown
}

/** Shape of the JSONB `cuidados_faciales` column */
export interface CuidadosFaciales {
  rutina_facial?: string[]
  rutina_detalle?: string
  [key: string]: unknown
}

/** Shape of the JSONB `evaluacion_profesional` column */
export interface EvaluacionProfesional {
  biotipo?: string
  tipo_piel?: string
  estado_piel?: string[]
  estado_piel_notas?: string
  mapa_genero?: 'female' | 'male'
  [key: string]: unknown
}

/** Shape of the JSONB `tratamientos_realizados` column */
export interface TratamientosRealizados {
  tratamientos?: string[]
  tratamientos_notas?: string
  acepta_consentimiento?: boolean
  permite_fotos_redes?: boolean
  [key: string]: unknown
}

/** Row shape for fichas_clinicas */
export interface FichaClinica {
  id: string
  paciente_id: string
  fecha_servicio: string
  motivo_consulta: string | null
  datos_medicos: DatosMedicos
  cuidados_faciales: CuidadosFaciales
  evaluacion_profesional: EvaluacionProfesional
  tratamientos_realizados: TratamientosRealizados
  ruta_mapa_facial: string | null
  ruta_foto_antes: string | null
  ruta_foto_despues: string | null
  ruta_firma: string | null
  created_at: string
}

/** Payload for creating a new ficha (id and created_at are auto-generated) */
export type FichaClinicaInsert = Omit<FichaClinica, 'id' | 'created_at'>

/** Payload for updating – all fields optional except we never change id */
export type FichaClinicaUpdate = Partial<Omit<FichaClinica, 'id' | 'created_at'>>

/** Slim row for patient directory (consent + last visit) */
export type FichaDirectorySummary = Pick<
  FichaClinica,
  'id' | 'paciente_id' | 'fecha_servicio' | 'ruta_firma' | 'tratamientos_realizados'
>

// ── Table constant ─────────────────────────────────────────
const TABLE = 'fichas_clinicas'

// ── CRUD ───────────────────────────────────────────────────

/**
 * Fetch all fichas, newest first.
 */
export async function getAllFichas(): Promise<FichaClinica[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .order('fecha_servicio', { ascending: false })

  if (error) throw new Error(`Error fetching fichas: ${error.message}`)
  return (data ?? []) as FichaClinica[]
}

/**
 * Fetch fichas with only fields needed for directory metadata.
 */
export async function getFichasDirectorySummary(): Promise<FichaDirectorySummary[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('id,paciente_id,fecha_servicio,ruta_firma,tratamientos_realizados')
    .order('fecha_servicio', { ascending: false })

  if (error) throw new Error(`Error fetching fichas directory: ${error.message}`)
  return (data ?? []) as FichaDirectorySummary[]
}

/**
 * Fetch a single ficha by its ID.
 */
export async function getFichaById(id: string): Promise<FichaClinica | null> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Error fetching ficha: ${error.message}`)
  }
  return data as FichaClinica
}

/**
 * Fetch all fichas for a given paciente, newest first.
 */
export async function getFichasByPacienteId(
  pacienteId: string,
): Promise<FichaClinica[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha_servicio', { ascending: false })

  if (error) throw new Error(`Error fetching fichas for paciente: ${error.message}`)
  return (data ?? []) as FichaClinica[]
}

/**
 * Create a new ficha clínica.
 * InsForge insert always takes an array.
 */
export async function createFicha(
  ficha: FichaClinicaInsert,
): Promise<FichaClinica> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .insert([ficha])
    .select()
    .single()

  if (error) throw new Error(`Error creating ficha: ${error.message}`)
  return data as FichaClinica
}

/**
 * Update an existing ficha by ID.
 */
export async function updateFicha(
  id: string,
  updates: FichaClinicaUpdate,
): Promise<FichaClinica> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error updating ficha: ${error.message}`)
  return data as FichaClinica
}

/**
 * Delete a ficha by ID and its storage assets.
 */
export async function deleteFichaWithAssets(ficha: FichaClinica): Promise<void> {
  await deleteFichaAssets(ficha)
  await deleteFicha(ficha.id)
}

/**
 * Delete a ficha by ID.
 */
export async function deleteFicha(id: string): Promise<void> {
  const { error } = await insforge.database
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error deleting ficha: ${error.message}`)
}
