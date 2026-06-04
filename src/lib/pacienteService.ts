import { insforge } from './insforge'
import { normalizeArgentinaWhatsApp } from './phoneUtils'

// ── Types ──────────────────────────────────────────────────

/** Full row shape for the pacientes table */
export interface Paciente {
  id: string
  nombre_completo: string | null
  fecha_registro: string | null
  nacionalidad: string | null
  domicilio: string | null
  telefono: string | null
  edad: number | null
  correo: string | null
  fecha_nacimiento: string | null
  como_nos_conocio: string | null
  alergias_cosmeticos_alimentos: string | null
  anticonceptivos_menopausia: string | null
  suplementos_testosterona: string | null
  implantes_metalicos: string | null
  problemas_gastrointestinales: string | null
  embarazo: boolean | null
  agua_alimentacion: string | null
  sueno_estres: string | null
  rutina_higiene: string | null
  usa_rasuradora: boolean | null
  biotipo_cutaneo: string | null
  consiente_tratamiento: boolean | null
  permite_fotos_redes: boolean | null
  created_at: string
}

/** Payload for creating a new paciente (id and created_at auto-generated) */
export type PacienteInsert = Omit<Paciente, 'id' | 'created_at'>

/** Payload for updating — all fields optional */
export type PacienteUpdate = Partial<Omit<Paciente, 'id' | 'created_at'>>

/** Slim row for patient directory list */
export type PacienteDirectory = Pick<
  Paciente,
  'id' | 'nombre_completo' | 'telefono' | 'consiente_tratamiento' | 'permite_fotos_redes' | 'created_at' | 'fecha_registro'
>

// ── Table constant ─────────────────────────────────────────
const TABLE = 'pacientes'

// ── CRUD ───────────────────────────────────────────────────

/**
 * Fetch all pacientes, newest first.
 */
export async function getAllPacientes(): Promise<Paciente[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error fetching pacientes: ${error.message}`)
  return (data ?? []) as Paciente[]
}

/**
 * Fetch pacientes with only fields needed for the directory list.
 */
export async function getPacientesDirectory(): Promise<PacienteDirectory[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('id,nombre_completo,telefono,consiente_tratamiento,permite_fotos_redes,created_at,fecha_registro')
    .order('nombre_completo', { ascending: true })

  if (error) throw new Error(`Error fetching pacientes directory: ${error.message}`)
  return (data ?? []) as PacienteDirectory[]
}

/**
 * Fetch a single paciente by ID.
 */
export async function getPacienteById(id: string): Promise<Paciente | null> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Error fetching paciente: ${error.message}`)
  }
  return data as Paciente
}

/**
 * Search pacientes by name (case-insensitive partial match).
 */
export async function searchPacientesByName(
  query: string,
): Promise<Paciente[]> {
  const { data, error } = await insforge.database
    .from(TABLE)
    .select('*')
    .ilike('nombre_completo', `%${query}%`)
    .order('nombre_completo', { ascending: true })

  if (error) throw new Error(`Error searching pacientes: ${error.message}`)
  return (data ?? []) as Paciente[]
}

/**
 * Build insert payload omitting empty optional fields.
 * Avoids PostgREST 400 when optional columns are absent in older schemas.
 */
export function buildPacienteInsert(
  input: Partial<PacienteInsert> & Pick<PacienteInsert, 'nombre_completo' | 'telefono'>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nombre_completo: input.nombre_completo,
    telefono: input.telefono?.trim() ? normalizeArgentinaWhatsApp(input.telefono.trim()) : null,
    fecha_registro: input.fecha_registro ?? new Date().toISOString().split('T')[0],
  }

  const optionalFields: (keyof PacienteInsert)[] = [
    'correo', 'fecha_nacimiento', 'como_nos_conocio', 'nacionalidad', 'domicilio', 'edad',
    'alergias_cosmeticos_alimentos', 'anticonceptivos_menopausia', 'suplementos_testosterona',
    'implantes_metalicos', 'problemas_gastrointestinales', 'embarazo', 'agua_alimentacion',
    'sueno_estres', 'rutina_higiene', 'usa_rasuradora', 'biotipo_cutaneo',
    'consiente_tratamiento', 'permite_fotos_redes',
  ]

  for (const key of optionalFields) {
    const value = input[key]
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value
    }
  }

  return payload
}

/**
 * Create a new paciente.
 * InsForge insert always takes an array.
 */
export async function createPaciente(
  paciente: Partial<PacienteInsert> & Pick<PacienteInsert, 'nombre_completo' | 'telefono'>,
): Promise<Paciente> {
  const payload = buildPacienteInsert(paciente)
  const { data, error } = await insforge.database
    .from(TABLE)
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(`Error creating paciente: ${error.message}`)
  return data as Paciente
}

/**
 * Update an existing paciente by ID.
 */
export async function updatePaciente(
  id: string,
  updates: PacienteUpdate,
): Promise<Paciente> {
  const payload = {
    ...updates,
    ...(updates.telefono != null
      ? { telefono: updates.telefono.trim() ? normalizeArgentinaWhatsApp(updates.telefono.trim()) : null }
      : {}),
  }
  const { data, error } = await insforge.database
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error updating paciente: ${error.message}`)
  return data as Paciente
}

/**
 * Delete a paciente by ID.
 * Related fichas_clinicas are cascade-deleted.
 */
export async function deletePaciente(id: string): Promise<void> {
  const { error } = await insforge.database
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error deleting paciente: ${error.message}`)
}

/** Sync key profile fields from a saved ficha into the paciente row. */
export async function syncPacienteFromFicha(
  pacienteId: string,
  ficha: {
    datos_medicos?: import('./fichaService').DatosMedicos
    cuidados_faciales?: import('./fichaService').CuidadosFaciales
    evaluacion_profesional?: import('./fichaService').EvaluacionProfesional
    tratamientos_realizados?: import('./fichaService').TratamientosRealizados
  },
): Promise<void> {
  const dm = ficha.datos_medicos ?? {}
  const cf = ficha.cuidados_faciales ?? {}
  const ep = ficha.evaluacion_profesional ?? {}
  const tr = ficha.tratamientos_realizados ?? {}

  const alergiasText = [
    ...(dm.alergias ?? []),
    dm.alergias_detalle ? `(${dm.alergias_detalle})` : '',
  ].filter(Boolean).join(', ')

  const updates: PacienteUpdate = {}
  if (alergiasText) updates.alergias_cosmeticos_alimentos = alergiasText
  if (dm.consumo_agua) updates.agua_alimentacion = dm.consumo_agua
  if (dm.horas_sueno || dm.nivel_estres) {
    updates.sueno_estres = [dm.horas_sueno, dm.nivel_estres].filter(Boolean).join(' / ')
  }
  if (cf.rutina_facial?.length) {
    updates.rutina_higiene = cf.rutina_facial.join(', ')
  }
  if (dm.embarazo === 'Sí') updates.embarazo = true
  else if (dm.embarazo === 'No') updates.embarazo = false
  if (ep.tipo_piel) updates.biotipo_cutaneo = ep.tipo_piel
  if (tr.acepta_consentimiento !== undefined) {
    updates.consiente_tratamiento = tr.acepta_consentimiento
  }
  if (tr.permite_fotos_redes !== undefined) {
    updates.permite_fotos_redes = tr.permite_fotos_redes
  }

  if (Object.keys(updates).length === 0) return
  await updatePaciente(pacienteId, updates)
}
