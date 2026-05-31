export interface ServicioMotivoOption {
  id: string
  label: string
  /** Shown under the chip when selected or as hint for revision_facial */
  hint?: string
}

export const SERVICIOS_MOTIVO_OPTIONS: ServicioMotivoOption[] = [
  {
    id: 'revision_facial',
    label: 'Revisión facial',
    hint: 'Evaluar qué tratamiento se puede realizar',
  },
  { id: 'dermaplaning_dermapen', label: 'Dermaplaning + Dermapen' },
  { id: 'limpieza_dermapen', label: 'Limpieza Facial + Dermapen' },
  { id: 'peeling_descamante', label: 'PEELING descamante' },
  {
    id: 'full_glow',
    label: 'FULL GLOW (Limpieza + Dermaplaning + Exosomas + Hidralips)',
  },
  { id: 'exosomas_dermapen', label: 'Exosomas con Dermapen' },
  { id: 'limpieza_dermaclean_pro', label: 'Limpieza Facial Dermaclean Pro' },
  { id: 'limpieza_dermaplaning', label: 'Limpieza facial + dermaplaning' },
  { id: 'otro', label: 'Otro' },
]

const LABEL_BY_ID = new Map(SERVICIOS_MOTIVO_OPTIONS.map(o => [o.id, o.label]))

export function getServicioMotivoLabel(id: string): string | undefined {
  return LABEL_BY_ID.get(id)
}

export function buildMotivoConsulta(seleccionados: string[], otroTexto: string): string {
  const parts: string[] = []

  for (const id of seleccionados) {
    if (id === 'otro') {
      const trimmed = otroTexto.trim()
      if (trimmed) parts.push(`Otro: ${trimmed}`)
      continue
    }
    const label = getServicioMotivoLabel(id)
    if (label) parts.push(label)
  }

  return parts.join(', ')
}

export function parseMotivoConsulta(texto: string | null | undefined): {
  seleccionados: string[]
  otroTexto: string
} {
  if (!texto?.trim()) {
    return { seleccionados: [], otroTexto: '' }
  }

  const parts = texto.split(', ').map(p => p.trim()).filter(Boolean)
  const seleccionados: string[] = []
  let otroTexto = ''
  const unmatched: string[] = []

  for (const part of parts) {
    if (part.startsWith('Otro:')) {
      if (!seleccionados.includes('otro')) seleccionados.push('otro')
      otroTexto = part.slice(5).trim()
      continue
    }

    const match = SERVICIOS_MOTIVO_OPTIONS.find(o => o.id !== 'otro' && o.label === part)
    if (match) {
      seleccionados.push(match.id)
    } else {
      unmatched.push(part)
    }
  }

  if (unmatched.length > 0) {
    if (!seleccionados.includes('otro')) seleccionados.push('otro')
    otroTexto = otroTexto || unmatched.join(', ')
  }

  return { seleccionados, otroTexto }
}

export function validateMotivoConsulta(seleccionados: string[], otroTexto: string): string | null {
  if (seleccionados.length === 0) {
    return 'Selecciona al menos un servicio o revisión facial'
  }
  if (seleccionados.includes('otro') && otroTexto.trim().length < 3) {
    return 'Especifica el motivo en "Otro" (mínimo 3 caracteres)'
  }
  return null
}
