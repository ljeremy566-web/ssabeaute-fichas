import { useRef, useCallback, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { cn } from '../../lib/cn'
import { Eraser, RotateCcw } from 'lucide-react'

interface SignaturePadProps {
  value?: string | null
  onChange: (base64: string | null) => void
  className?: string
  disabled?: boolean
}

const CANVAS_HEIGHT = 200

export const SignaturePad = ({ value, onChange, className, disabled = false }: SignaturePadProps) => {
  const sigRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hydratedRef = useRef<string | null>(null)
  const [hasSignature, setHasSignature] = useState(!!value)

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current
    const sig = sigRef.current
    if (!container || !sig) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const width = container.clientWidth
    const height = CANVAS_HEIGHT
    const canvas = sig.getCanvas()

    const savedData = sig.isEmpty() ? null : sig.toData()

    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    ctx?.scale(ratio, ratio)

    if (savedData && savedData.length > 0) {
      sig.fromData(savedData)
    } else if (hydratedRef.current && sig.isEmpty()) {
      sig.fromDataURL(hydratedRef.current)
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => resizeCanvas())
    observer.observe(container)
    return () => observer.disconnect()
  }, [resizeCanvas])

  useEffect(() => {
    if (!value || !sigRef.current || hydratedRef.current === value) return
    sigRef.current.fromDataURL(value)
    hydratedRef.current = value
    setHasSignature(true)
  }, [value])

  const exportSignature = useCallback((): string | null => {
    if (!sigRef.current || sigRef.current.isEmpty()) return null
    return sigRef.current.toDataURL('image/png')
  }, [])

  const handleEnd = useCallback(() => {
    if (disabled) return
    const base64 = exportSignature()
    if (base64) {
      onChange(base64)
      setHasSignature(true)
    }
  }, [onChange, exportSignature, disabled])

  const handleClear = useCallback(() => {
    if (disabled) return
    sigRef.current?.clear()
    hydratedRef.current = null
    onChange(null)
    setHasSignature(false)
  }, [onChange, disabled])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-on-surface font-outfit">Firma del paciente</span>
        <div className="flex items-center gap-1">
          {!disabled && (
            <>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-error hover:bg-error-light rounded-full transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              if (disabled) return
              if (sigRef.current) {
                const data = sigRef.current.toData()
                if (data.length > 0) {
                  data.pop()
                  sigRef.current.fromData(data)
                  if (sigRef.current.isEmpty()) {
                    onChange(null)
                    setHasSignature(false)
                  } else {
                    const base64 = exportSignature()
                    if (base64) {
                      onChange(base64)
                      setHasSignature(true)
                    }
                  }
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary-light rounded-full transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Deshacer
          </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
        'relative rounded-xl border-2 border-dashed border-outline-variant bg-surface-dim overflow-hidden',
        disabled && 'opacity-80 pointer-events-none',
      )}>
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-on-surface-variant/40 font-medium select-none">
              Firme aquí
            </p>
          </div>
        )}
        <SignatureCanvas
          ref={sigRef}
          penColor="#202124"
          minWidth={1.5}
          maxWidth={3}
          canvasProps={{
            className: 'w-full cursor-crosshair',
            style: { width: '100%', height: CANVAS_HEIGHT },
          }}
          onEnd={handleEnd}
        />
      </div>

      <p className="text-xs text-on-surface-variant">
        El paciente debe firmar directamente en el recuadro con el dedo o un lápiz óptico.
      </p>
    </div>
  )
}
