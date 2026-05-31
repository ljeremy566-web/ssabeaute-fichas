import { useState, useCallback } from 'react'

export interface FichaFormState {
  motivo_consulta: string
  motivo_servicios: string[]
  motivo_otro: string
  // Tab 1: Anamnesis
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
  // Tab 2: Evaluación
  biotipo: string
  tipo_piel: string
  estado_piel: string[]
  estado_piel_notas: string
  // Tab 3: Mapa facial
  mapa_facial_base64: string | null
  mapa_genero: 'female' | 'male'
  // Tab 4: Fotos
  foto_antes_base64: string | null
  foto_despues_base64: string | null
  // Consentimiento
  tratamientos: string[]
  tratamientos_notas: string
  firma_base64: string | null
  acepta_consentimiento: boolean
  permite_fotos_redes: boolean
}

export const defaultFormState: FichaFormState = {
  motivo_consulta: '',
  motivo_servicios: [],
  motivo_otro: '',
  alergias: [], alergias_detalle: '',
  medicamentos: [], medicamentos_detalle: '',
  enfermedades: [], enfermedades_detalle: '',
  embarazo: '', consumo_agua: '', horas_sueno: '', nivel_estres: '',
  rutina_facial: [], rutina_detalle: '',
  biotipo: '', tipo_piel: '', estado_piel: [], estado_piel_notas: '',
  mapa_facial_base64: null,
  mapa_genero: 'female',
  foto_antes_base64: null, foto_despues_base64: null,
  tratamientos: [], tratamientos_notas: '',
  firma_base64: null, acepta_consentimiento: false, permite_fotos_redes: false,
}

export const WIZARD_STEPS = ['consentimiento', 'anamnesis', 'evaluacion', 'mapa', 'evidencia', 'tratamientos'] as const
export type WizardStepId = typeof WIZARD_STEPS[number]

export function useIntakeForm() {
  const [form, setForm] = useState<FichaFormState>(defaultFormState)
  const [activeTab, setActiveTab] = useState<WizardStepId>('consentimiento')
  const [savedSteps, setSavedSteps] = useState<Set<WizardStepId>>(new Set())
  
  // Consent and remote sign state
  const [remoteConsentCompleted, setRemoteConsentCompleted] = useState(false)

  const updateForm = useCallback(<K extends keyof FichaFormState>(key: K, value: FichaFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  return {
    form,
    setForm,
    updateForm,
    activeTab,
    setActiveTab,
    savedSteps,
    setSavedSteps,
    remoteConsentCompleted,
    setRemoteConsentCompleted,
  }
}
