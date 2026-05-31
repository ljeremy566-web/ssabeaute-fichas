import { insforge } from './insforge'
import { convertToWebP, normalizeImageForPdf, toPngFileName, toWebpFileName, type WebPOptions } from './imageUtils'

// ── Bucket & folder constants ──────────────────────────────
const BUCKET = 'fichas-archivos'

export const StorageFolders = {
  MAPAS_FACIALES: 'mapas-faciales',
  FOTOS_ANTES: 'fotos-antes',
  FOTOS_DESPUES: 'fotos-despues',
  FIRMAS: 'firmas',
} as const

export type StorageFolder = (typeof StorageFolders)[keyof typeof StorageFolders]

// ── Return type ────────────────────────────────────────────
export interface UploadResult {
  /** Full public URL for displaying the file */
  url: string
  /** Storage key for referencing the file in the database */
  key: string
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Build a unique storage path from a folder and an optional filename.
 * Falls back to a timestamped name to avoid collisions.
 */
function buildPath(folder: StorageFolder, fileName?: string): string {
  const safeName = fileName
    ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`
  return `${folder}/${safeName}`
}

/**
 * Convert a base64-encoded data-URI (or raw base64 string) into a Blob.
 * Handles both `data:image/png;base64,iVBOR...` and raw `iVBOR...` formats.
 */
function base64ToBlob(base64: string, fallbackMime = 'image/webp'): Blob {
  let mime = fallbackMime
  let raw = base64

  if (base64.startsWith('data:')) {
    const match = base64.match(/^data:([^;]+);base64,(.*)$/)
    if (match) {
      mime = match[1]
      raw = match[2]
    }
  }

  const byteChars = atob(raw)
  const byteArray = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i)
  }
  return new Blob([byteArray], { type: mime })
}

function optsForFolder(folder: StorageFolder, override?: WebPOptions): WebPOptions {
  const base: WebPOptions = { quality: 0.88, preserveAlpha: true }

  switch (folder) {
    case StorageFolders.FOTOS_ANTES:
    case StorageFolders.FOTOS_DESPUES:
      return { ...base, maxWidth: 2048, maxHeight: 2048, preserveAlpha: false, ...override }
    case StorageFolders.FIRMAS:
      return { ...base, quality: 0.92, preserveAlpha: false, ...override }
    case StorageFolders.MAPAS_FACIALES:
      return { ...base, ...override }
    default:
      return { ...base, ...override }
  }
}

// ── Public API ─────────────────────────────────────────────

/**
 * Upload a File or Blob to the given folder in `fichas-archivos`.
 */
export async function uploadFile(
  folder: StorageFolder,
  file: File | Blob,
  fileName?: string,
): Promise<UploadResult> {
  const resolvedName =
    fileName ?? (file instanceof File ? toWebpFileName(file.name) : undefined)
  const path = buildPath(folder, resolvedName)

  const { data, error } = await insforge.storage
    .from(BUCKET)
    .upload(path, file)

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  if (!data) throw new Error('Storage upload returned no data')

  return {
    url: data.url,
    key: data.key,
  }
}

/**
 * Upload a base64-encoded string (with or without data-URI prefix)
 * to the given folder. Converts to WebP before upload.
 */
export async function uploadBase64(
  folder: StorageFolder,
  base64Data: string,
  fileName?: string,
  opts?: WebPOptions,
): Promise<UploadResult> {
  if (folder === StorageFolders.FIRMAS) {
    const pngData = await normalizeImageForPdf(base64Data, { whiteBackground: true, maxWidth: 1200 })
    const blob = base64ToBlob(pngData, 'image/png')
    const pngName = toPngFileName(fileName)
    return uploadFile(folder, blob, pngName)
  }

  const webpData = await convertToWebP(base64Data, optsForFolder(folder, opts))
  const blob = base64ToBlob(webpData, 'image/webp')
  const webpName = toWebpFileName(fileName)
  return uploadFile(folder, blob, webpName)
}

/**
 * Delete a file from the bucket by its storage key.
 */
export async function deleteFile(key: string): Promise<void> {
  const { error } = await insforge.storage.from(BUCKET).remove(key)
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

/**
 * Try to derive a storage key from a public URL returned by InsForge storage.
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url.startsWith('http')) return null
  try {
    const pathname = new URL(url).pathname
    // InsForge URLs typically have /api/storage/buckets/{BUCKET}/objects/{KEY}
    const markerWithObjects = `/${BUCKET}/objects/`
    const idxObjects = pathname.indexOf(markerWithObjects)
    if (idxObjects >= 0) return decodeURIComponent(pathname.slice(idxObjects + markerWithObjects.length))

    // Fallback if the URL doesn't have /objects/
    const marker = `/${BUCKET}/`
    const idx = pathname.indexOf(marker)
    if (idx >= 0) return decodeURIComponent(pathname.slice(idx + marker.length))

    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) return decodeURIComponent(segments.slice(-2).join('/'))
  } catch {
    return null
  }
  return null
}

/**
 * Delete a file from the bucket using its public URL.
 */
export async function deleteFileByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return
  const key = extractKeyFromUrl(url)
  if (!key) return
  try {
    await deleteFile(key)
  } catch (err) {
    console.warn('Could not delete storage file:', key, err)
  }
}

/**
 * Delete all asset URLs associated with a ficha clínica.
 */
export async function deleteFichaAssets(ficha: {
  ruta_mapa_facial?: string | null
  ruta_foto_antes?: string | null
  ruta_foto_despues?: string | null
  ruta_firma?: string | null
}): Promise<void> {
  await Promise.all([
    deleteFileByUrl(ficha.ruta_mapa_facial),
    deleteFileByUrl(ficha.ruta_foto_antes),
    deleteFileByUrl(ficha.ruta_foto_despues),
    deleteFileByUrl(ficha.ruta_firma),
  ])
}

/**
 * Get the public URL for a given storage key.
 */
export function getPublicUrl(key: string): string {
  return insforge.storage.from(BUCKET).getPublicUrl(key)
}
