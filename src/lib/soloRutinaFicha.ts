import type { FichaClinica, FichaClinicaInsert } from './fichaService'

/** Motivo fijo para registros de rutina sin consulta presencial. */
export const SOLO_RUTINA_MOTIVO = 'Envío de rutina (sin consulta presencial)'

export const SOLO_RUTINA_FLAG = 'solo_rutina' as const

export function isSoloRutinaFicha(ficha: FichaClinica): boolean {
  if (ficha.tratamientos_realizados?.[SOLO_RUTINA_FLAG] === true) return true
  return ficha.motivo_consulta === SOLO_RUTINA_MOTIVO
}

export function buildSoloRutinaFichaInsert(
  pacienteId: string,
  fechaServicio: string,
  rutinaDia: string,
  rutinaNoche: string,
): FichaClinicaInsert {
  return {
    paciente_id: pacienteId,
    fecha_servicio: fechaServicio,
    motivo_consulta: SOLO_RUTINA_MOTIVO,
    datos_medicos: {},
    evaluacion_profesional: {},
    cuidados_faciales: {
      rutina_dia: rutinaDia,
      rutina_noche: rutinaNoche,
    },
    tratamientos_realizados: { [SOLO_RUTINA_FLAG]: true },
    ruta_mapa_facial: null,
    ruta_foto_antes: null,
    ruta_foto_despues: null,
    ruta_firma: null,
  }
}
