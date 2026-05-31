import { useRef, useState, useCallback } from 'react'
import { cn } from '../../lib/cn'
import { convertToWebP } from '../../lib/imageUtils'
import { Upload, X, ZoomIn, Loader2 } from 'lucide-react'

interface PhotoDropzoneProps {
  label: string
  value?: string | null
  onChange: (base64: string | null, file?: File) => void
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const PHOTO_MAX_DIMENSION = 2048

export const PhotoDropzone = ({ label, value, onChange, className }: PhotoDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [sizeError, setSizeError] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_FILE_SIZE) {
      setSizeError('La imagen supera el límite de 10 MB')
      return
    }
    setSizeError('')
    setProcessing(true)

    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const webp = await convertToWebP(dataUrl, {
        maxWidth: PHOTO_MAX_DIMENSION,
        maxHeight: PHOTO_MAX_DIMENSION,
        quality: 0.88,
        preserveAlpha: false,
      })
      onChange(webp, file)
    } catch {
      setSizeError('No se pudo procesar la imagen')
    } finally {
      setProcessing(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }, [handleFile])

  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm font-semibold text-on-surface font-outfit">{label}</span>
      {sizeError && (
        <p className="text-xs text-error font-medium">{sizeError}</p>
      )}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-outline bg-surface-container">
          <img
            src={value}
            alt={label}
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-on-surface/0 group-hover:bg-on-surface/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="p-2.5 bg-surface rounded-full elevation-2 text-on-surface hover:bg-surface-dim transition-colors cursor-pointer"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 bg-error-light rounded-full elevation-2 text-error hover:bg-error/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !processing && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-3 h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
            processing && 'pointer-events-none opacity-70',
            isDragging
              ? 'border-primary bg-primary-light scale-[1.02]'
              : 'border-outline-variant bg-surface-dim hover:border-primary hover:bg-primary-light/50'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
          )}>
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-on-surface">
              {processing ? 'Optimizando imagen...' : isDragging ? 'Suelta la imagen aquí' : 'Arrastra o haz clic'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">JPG, PNG — se optimizan automáticamente</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Zoom modal */}
      {isZoomed && value && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={value}
              alt={label}
              className="max-w-full max-h-[85vh] object-contain rounded-xl elevation-3"
            />
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute -top-3 -right-3 p-2 bg-surface rounded-full elevation-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
