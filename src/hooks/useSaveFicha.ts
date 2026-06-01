import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadBase64, StorageFolders, deleteFileByUrl } from '../lib/storageService'
import { createFicha, updateFicha, type FichaClinica } from '../lib/fichaService'
import { syncPacienteFromFicha } from '../lib/pacienteService'
import { linkSessionToFicha, type SesionFirma } from '../lib/consentSessionService'
import { buildMotivoConsulta } from '../lib/serviciosCatalogo'
import type { FichaFormState, WizardStepId } from './useIntakeForm'

export type AssetField = 'mapa' | 'antes' | 'despues' | 'firma'
export type AssetScope = 'consentimiento' | 'mapa' | 'evidencia' | 'all' | 'none'

export const ASSET_FORM_KEYS: Record<AssetField, 'mapa_facial_base64' | 'foto_antes_base64' | 'foto_despues_base64' | 'firma_base64'> = {
  mapa: 'mapa_facial_base64',
  antes: 'foto_antes_base64',
  despues: 'foto_despues_base64',
  firma: 'firma_base64',
}

export function stepToAssetScope(step: WizardStepId): AssetScope {
  if (step === 'consentimiento') return 'consentimiento'
  if (step === 'mapa') return 'mapa'
  if (step === 'evidencia') return 'evidencia'
  return 'none'
}

export function shouldUploadAsset(scope: AssetScope, field: AssetField): boolean {
  if (scope === 'all') return true
  if (scope === 'consentimiento' && field === 'firma') return true
  if (scope === 'mapa' && field === 'mapa') return true
  if (scope === 'evidencia' && (field === 'antes' || field === 'despues')) return true
  return false
}

interface UseSaveFichaProps {
  form: FichaFormState
  setForm: React.Dispatch<React.SetStateAction<FichaFormState>>
  resolvedPacienteId: string
  currentFichaId: string | null
  setCurrentFichaId: (id: string) => void
  fechaServicio: string
  consentSession: SesionFirma | null
  setSavedSteps: React.Dispatch<React.SetStateAction<Set<WizardStepId>>>
}

export function useSaveFicha({
  form,
  setForm,
  resolvedPacienteId,
  currentFichaId,
  setCurrentFichaId,
  fechaServicio,
  consentSession,
  setSavedSteps,
}: UseSaveFichaProps) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loadedAssets, setLoadedAssets] = useState<{
    mapa?: string | null
    antes?: string | null
    despues?: string | null
    firma?: string | null
  }>({})

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAutoSavingRef = useRef(false)

  const uploadIfNeeded = async (
    src: string | null,
    folder: typeof StorageFolders[keyof typeof StorageFolders],
    label: string,
  ): Promise<string | null> => {
    if (!src) return null
    if (!src.startsWith('data:')) return src
    try {
      const { url } = await uploadBase64(folder, src, `${resolvedPacienteId}_${label}_${Date.now()}.webp`)
      return url
    } catch (err) {
      console.error(`Upload failed (${label}):`, err)
      throw new Error(`No se pudo subir ${label}`, { cause: err })
    }
  }

  const handleAssetChange = useCallback(async (field: AssetField, newValue: string | null) => {
    const formKey = ASSET_FORM_KEYS[field]
    let prevToDelete: string | null = null
    setForm(prev => {
      const prevValue = prev[formKey]
      if (prevValue?.startsWith('http') && prevValue !== newValue) {
        prevToDelete = prevValue
      }
      return { ...prev, [formKey]: newValue }
    })
    if (prevToDelete) {
      await deleteFileByUrl(prevToDelete)
      setLoadedAssets(prev => ({ ...prev, [field]: null }))
    }
  }, [setForm])

  const buildFichaBody = async (scope: AssetScope) => {
    const resolveRoute = async (
      formVal: string | null,
      loaded: string | null | undefined,
      field: AssetField,
      folder: typeof StorageFolders[keyof typeof StorageFolders],
      label: string,
    ): Promise<string | null> => {
      if (shouldUploadAsset(scope, field)) {
        return uploadIfNeeded(formVal, folder, label)
      }
      if (formVal?.startsWith('http')) return formVal
      return loaded ?? null
    }

    const rutaMapaFacial = await resolveRoute(
      form.mapa_facial_base64, loadedAssets.mapa, 'mapa', StorageFolders.MAPAS_FACIALES, 'mapa',
    )
    const rutaFotoAntes = await resolveRoute(
      form.foto_antes_base64, loadedAssets.antes, 'antes', StorageFolders.FOTOS_ANTES, 'antes',
    )
    const rutaFotoDespues = await resolveRoute(
      form.foto_despues_base64, loadedAssets.despues, 'despues', StorageFolders.FOTOS_DESPUES, 'despues',
    )
    const rutaFirma = await resolveRoute(
      form.firma_base64, loadedAssets.firma, 'firma', StorageFolders.FIRMAS, 'firma',
    )

    if (currentFichaId) {
      if (shouldUploadAsset(scope, 'mapa') && loadedAssets.mapa && loadedAssets.mapa !== rutaMapaFacial) {
        await deleteFileByUrl(loadedAssets.mapa)
      }
      if (shouldUploadAsset(scope, 'antes') && loadedAssets.antes && loadedAssets.antes !== rutaFotoAntes) {
        await deleteFileByUrl(loadedAssets.antes)
      }
      if (shouldUploadAsset(scope, 'despues') && loadedAssets.despues && loadedAssets.despues !== rutaFotoDespues) {
        await deleteFileByUrl(loadedAssets.despues)
      }
      if (shouldUploadAsset(scope, 'firma') && loadedAssets.firma && loadedAssets.firma !== rutaFirma) {
        await deleteFileByUrl(loadedAssets.firma)
      }
    }

    setLoadedAssets({
      mapa: rutaMapaFacial,
      antes: rutaFotoAntes,
      despues: rutaFotoDespues,
      firma: rutaFirma,
    })

    if (shouldUploadAsset(scope, 'mapa') && rutaMapaFacial && rutaMapaFacial !== form.mapa_facial_base64) {
      setForm(prev => ({ ...prev, mapa_facial_base64: rutaMapaFacial }))
    }
    if (shouldUploadAsset(scope, 'antes') && rutaFotoAntes && rutaFotoAntes !== form.foto_antes_base64) {
      setForm(prev => ({ ...prev, foto_antes_base64: rutaFotoAntes }))
    }
    if (shouldUploadAsset(scope, 'despues') && rutaFotoDespues && rutaFotoDespues !== form.foto_despues_base64) {
      setForm(prev => ({ ...prev, foto_despues_base64: rutaFotoDespues }))
    }
    if (shouldUploadAsset(scope, 'firma') && rutaFirma && rutaFirma !== form.firma_base64) {
      setForm(prev => ({ ...prev, firma_base64: rutaFirma }))
    }

    return {
      motivo_consulta: buildMotivoConsulta(form.motivo_servicios, form.motivo_otro),
      datos_medicos: {
        alergias: form.alergias,
        alergias_detalle: form.alergias_detalle,
        medicamentos: form.medicamentos,
        medicamentos_detalle: form.medicamentos_detalle,
        enfermedades: form.enfermedades,
        enfermedades_detalle: form.enfermedades_detalle,
        embarazo: form.embarazo,
        consumo_agua: form.consumo_agua,
        horas_sueno: form.horas_sueno,
        nivel_estres: form.nivel_estres,
      },
      cuidados_faciales: {
        rutina_facial: form.rutina_facial,
        rutina_detalle: form.rutina_detalle,
        rutina_dia: form.rutina_dia,
        rutina_noche: form.rutina_noche,
      },
      evaluacion_profesional: {
        biotipo: form.biotipo,
        tipo_piel: form.tipo_piel,
        estado_piel: form.estado_piel,
        estado_piel_notas: form.estado_piel_notas,
        mapa_genero: form.mapa_genero,
      },
      tratamientos_realizados: {
        tratamientos: form.tratamientos,
        tratamientos_notas: form.tratamientos_notas,
        acepta_consentimiento: form.acepta_consentimiento,
        permite_fotos_redes: form.permite_fotos_redes,
      },
      ruta_mapa_facial: rutaMapaFacial,
      ruta_foto_antes: rutaFotoAntes,
      ruta_foto_despues: rutaFotoDespues,
      ruta_firma: rutaFirma,
    }
  }

  const persistForm = async (assetScope: AssetScope = 'none'): Promise<FichaClinica> => {
    if (!resolvedPacienteId) throw new Error('No se ha seleccionado un paciente')

    const fichaBody = await buildFichaBody(assetScope)

    const saved = currentFichaId
      ? await updateFicha(currentFichaId, { paciente_id: resolvedPacienteId, ...fichaBody })
      : await createFicha({
        paciente_id: resolvedPacienteId,
        fecha_servicio: fechaServicio,
        ...fichaBody,
      })

    // Remove shouldSyncPacienteFromScope and always sync
    await syncPacienteFromFicha(resolvedPacienteId, saved)

    if (consentSession?.id && (assetScope === 'consentimiento' || assetScope === 'all')) {
      await linkSessionToFicha(consentSession.id, saved.id)
    }

    if (!currentFichaId) {
      setCurrentFichaId(saved.id)
      navigate(`/admin/paciente/${resolvedPacienteId}/ficha/${saved.id}/editar`, { replace: true })
    }

    return saved
  }

  const persistTratamientosOnly = async (): Promise<void> => {
    if (!currentFichaId || !resolvedPacienteId) return

    const saved = await updateFicha(currentFichaId, {
      tratamientos_realizados: {
        tratamientos: form.tratamientos,
        tratamientos_notas: form.tratamientos_notas,
        acepta_consentimiento: form.acepta_consentimiento,
        permite_fotos_redes: form.permite_fotos_redes,
      },
    })
    await syncPacienteFromFicha(resolvedPacienteId, saved)
  }

  useEffect(() => {
    if (!currentFichaId) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(() => {
      if (saving || isAutoSavingRef.current) return

      isAutoSavingRef.current = true
      setSaveStatus('saving')
      void (async () => {
        try {
          await persistTratamientosOnly()
          setSaveStatus('saved')
          setSavedSteps(prev => new Set([...prev, 'tratamientos']))
        } catch (err) {
          console.error(err)
          setSaveStatus('idle')
        } finally {
          isAutoSavingRef.current = false
        }
      })()
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [form.tratamientos, form.tratamientos_notas, currentFichaId, saving])

  const persistRutinasOnly = async (): Promise<void> => {
    if (!currentFichaId || !resolvedPacienteId) return

    const saved = await updateFicha(currentFichaId, {
      cuidados_faciales: {
        rutina_facial: form.rutina_facial,
        rutina_detalle: form.rutina_detalle,
        rutina_dia: form.rutina_dia,
        rutina_noche: form.rutina_noche,
      },
    })
    await syncPacienteFromFicha(resolvedPacienteId, saved)
  }

  useEffect(() => {
    if (!currentFichaId) return

    const timer = setTimeout(() => {
      if (saving || isAutoSavingRef.current) return

      isAutoSavingRef.current = true
      setSaveStatus('saving')
      void (async () => {
        try {
          await persistRutinasOnly()
          setSaveStatus('saved')
          setSavedSteps(prev => new Set([...prev, 'rutinas']))
        } catch (err) {
          console.error(err)
          setSaveStatus('idle')
        } finally {
          isAutoSavingRef.current = false
        }
      })()
    }, 2000)

    return () => clearTimeout(timer)
  }, [form.rutina_dia, form.rutina_noche, currentFichaId, saving])


  return {
    saving,
    setSaving,
    saveStatus,
    setSaveStatus,
    loadedAssets,
    setLoadedAssets,
    handleAssetChange,
    persistForm
  }
}
