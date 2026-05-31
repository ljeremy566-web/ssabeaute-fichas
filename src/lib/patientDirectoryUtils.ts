import type { FichaClinica, FichaDirectorySummary } from './fichaService'
import type { Paciente, PacienteDirectory } from './pacienteService'
import { parseLocalDate } from './dateUtils'

export type ConsentimientoEstado = 'firmado' | 'falta_firma' | 'sin_consulta'

export interface PatientDirectoryMeta {
  ultimaVisita: string | null
  consentimiento: ConsentimientoEstado
}

type DirectoryPatient = Paciente | PacienteDirectory
type DirectoryFicha = FichaClinica | FichaDirectorySummary

export function isFichaFirmada(ficha: DirectoryFicha): boolean {
  const tr = ficha.tratamientos_realizados ?? {}
  return !!(ficha.ruta_firma && tr.acepta_consentimiento)
}

export function buildFichasByPaciente(
  fichas: DirectoryFicha[],
): Map<string, DirectoryFicha[]> {
  const map = new Map<string, DirectoryFicha[]>()
  for (const ficha of fichas) {
    const list = map.get(ficha.paciente_id) ?? []
    list.push(ficha)
    map.set(ficha.paciente_id, list)
  }
  return map
}

export function getPatientDirectoryMeta(
  patient: DirectoryPatient,
  patientFichas: DirectoryFicha[] | undefined,
): PatientDirectoryMeta {
  if (!patientFichas?.length) {
    return {
      ultimaVisita: null,
      consentimiento: patient.consiente_tratamiento ? 'firmado' : 'sin_consulta',
    }
  }

  const sorted = [...patientFichas].sort(
    (a, b) => parseLocalDate(b.fecha_servicio).getTime() - parseLocalDate(a.fecha_servicio).getTime(),
  )
  const latest = sorted[0]

  const hasSignedFicha = sorted.some(isFichaFirmada)
  let consentimiento: ConsentimientoEstado = 'falta_firma'
  if (patient.consiente_tratamiento || hasSignedFicha) {
    consentimiento = 'firmado'
  }

  return {
    ultimaVisita: latest.fecha_servicio,
    consentimiento,
  }
}

export function consentimientoLabel(estado: ConsentimientoEstado): string {
  switch (estado) {
    case 'firmado':
      return 'Firmado'
    case 'falta_firma':
      return 'Falta firma'
    default:
      return 'Sin consulta'
  }
}

export function consultaActionLabel(meta: PatientDirectoryMeta): string {
  return meta.ultimaVisita ? 'Nueva visita' : 'Primera consulta'
}

export function consultaActionAriaLabel(
  meta: PatientDirectoryMeta,
  patientName: string | null | undefined,
): string {
  const name = patientName?.trim() || 'paciente'
  return meta.ultimaVisita
    ? `Registrar nueva visita clínica de ${name}`
    : `Registrar primera consulta de ${name}`
}
