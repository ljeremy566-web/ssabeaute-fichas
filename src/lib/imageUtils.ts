export interface WebPOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  preserveAlpha?: boolean
}

const DEFAULT_QUALITY = 0.88

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) return { width, height }

  const maxW = maxWidth ?? Infinity
  const maxH = maxHeight ?? Infinity
  if (width <= maxW && height <= maxH) return { width, height }

  const ratio = Math.min(maxW / width, maxH / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

function canvasToWebP(canvas: HTMLCanvasElement, quality: number, preserveAlpha: boolean): string {
  const webp = canvas.toDataURL('image/webp', quality)
  if (webp.startsWith('data:image/webp')) return webp
  if (preserveAlpha) return canvas.toDataURL('image/png')
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Resize (optional) and encode a data-URL or remote image as WebP.
 */
export async function convertToWebP(
  dataUrl: string,
  options: WebPOptions = {},
): Promise<string> {
  const {
    quality = DEFAULT_QUALITY,
    maxWidth,
    maxHeight,
    preserveAlpha = true,
  } = options

  if (
    dataUrl.startsWith('data:image/webp') &&
    !maxWidth &&
    !maxHeight
  ) {
    return dataUrl
  }

  const img = await loadImage(dataUrl)
  const { width, height } = scaleDimensions(img.width, img.height, maxWidth, maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  if (!preserveAlpha) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)
  return canvasToWebP(canvas, quality, preserveAlpha)
}

/**
 * Composite a background image with an overlay (e.g. face template + sketch strokes).
 * Output matches overlay dimensions with background scaled using xMidYMid meet.
 */
export async function compositeImages(
  backgroundSrc: string,
  overlayDataUrl: string,
  options: WebPOptions = {},
): Promise<string> {
  const [bg, overlay] = await Promise.all([
    loadImage(backgroundSrc),
    loadImage(overlayDataUrl),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = overlay.width
  canvas.height = overlay.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  const bgScale = Math.min(canvas.width / bg.width, canvas.height / bg.height)
  const bgW = bg.width * bgScale
  const bgH = bg.height * bgScale
  const bgX = (canvas.width - bgW) / 2
  const bgY = (canvas.height - bgH) / 2

  ctx.drawImage(bg, bgX, bgY, bgW, bgH)
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)

  return convertToWebP(canvas.toDataURL('image/png'), {
    preserveAlpha: true,
    ...options,
  })
}

/** Ensure uploaded file names use .webp extension */
export function toWebpFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined
  return fileName.replace(/\.\w+$/, '') + '.webp'
}

/** Ensure uploaded file names use .png extension */
export function toPngFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined
  return fileName.replace(/\.\w+$/, '') + '.png'
}

export interface NormalizePdfImageOptions {
  whiteBackground?: boolean
  maxWidth?: number
  maxHeight?: number
}

/**
 * Decode any image (WebP/PNG/JPEG URL or data-URI) to PNG for jsPDF.
 * Optional white background removes alpha artifacts in PDF output.
 */
export async function normalizeImageForPdf(
  src: string,
  options: NormalizePdfImageOptions = {},
): Promise<string> {
  const { whiteBackground = false, maxWidth, maxHeight } = options
  const img = await loadImage(src)
  const { width, height } = scaleDimensions(img.width, img.height, maxWidth, maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  if (whiteBackground) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}
