import { useRef, useState, useCallback, useEffect } from 'react'
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas'
import { cn } from '../../lib/cn'
import { compositeImages } from '../../lib/imageUtils'
import { Undo2, Trash2, Minus, Plus, RefreshCw, Eraser, Pencil } from 'lucide-react'
import rostroFemenino from '../../images/RostroFemenino.png'
import rostroMasculino from '../../images/RostroMasculino.png'

export type FaceGender = 'female' | 'male'

interface FacialMapCanvasProps {
  value?: string | null
  onChange: (base64: string | null) => void
  faceGender?: FaceGender
  onGenderChange?: (gender: FaceGender) => void
  className?: string
}

const STROKE_COLORS = [
  { color: '#D93025', label: 'Rojo' },
  { color: '#E8A0B5', label: 'Rosa' },
  { color: '#93739E', label: 'Malva' },
  { color: '#1E8E3E', label: 'Verde' },
  { color: '#2D2331', label: 'Negro' },
]

const STROKE_WIDTHS = [2, 4, 6]

const MAP_INSTRUCTION =
  'Marca zonas del rostro con lesiones, sensibilidad o áreas a tratar. Puedes dibujar y anotar para el seguimiento visual.'

const FACE_BACKGROUNDS: Record<FaceGender, string> = {
  female: rostroFemenino,
  male: rostroMasculino,
}

const GENDER_LABELS: Record<FaceGender, string> = {
  female: 'Rostro femenino',
  male: 'Rostro masculino',
}

const EXPORT_DEBOUNCE_MS = 400

export const FacialMapCanvas = ({
  value,
  onChange,
  faceGender: faceGenderProp = 'female',
  onGenderChange,
  className,
}: FacialMapCanvasProps) => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0].color)
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1])
  const [eraseMode, setEraseMode] = useState(false)
  const [faceGender, setFaceGender] = useState<FaceGender>(faceGenderProp)
  const [replacing, setReplacing] = useState(false)

  useEffect(() => {
    setFaceGender(faceGenderProp)
  }, [faceGenderProp])

  const isRemoteSavedMap = !!(value && value.startsWith('http') && !replacing)
  const backgroundImage = FACE_BACKGROUNDS[faceGender]

  const exportCanvasImmediate = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const strokes = await canvasRef.current.exportImage('png')
      const composed = await compositeImages(FACE_BACKGROUNDS[faceGender], strokes)
      onChange(composed)
    } catch {
      onChange(null)
    }
  }, [onChange, faceGender])

  const cancelDebouncedExport = useCallback(() => {
    if (exportTimerRef.current) {
      clearTimeout(exportTimerRef.current)
      exportTimerRef.current = null
    }
  }, [])

  const scheduleDebouncedExport = useCallback(() => {
    cancelDebouncedExport()
    exportTimerRef.current = setTimeout(() => {
      exportTimerRef.current = null
      void exportCanvasImmediate()
    }, EXPORT_DEBOUNCE_MS)
  }, [cancelDebouncedExport, exportCanvasImmediate])

  const exportCanvasImmediateRef = useRef(exportCanvasImmediate)
  exportCanvasImmediateRef.current = exportCanvasImmediate

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) {
        clearTimeout(exportTimerRef.current)
        exportTimerRef.current = null
        void exportCanvasImmediateRef.current()
      }
    }
  }, [])

  const handleUndo = useCallback(async () => {
    if (canvasRef.current) {
      cancelDebouncedExport()
      await canvasRef.current.undo()
      await exportCanvasImmediate()
    }
  }, [cancelDebouncedExport, exportCanvasImmediate])

  const handleClear = useCallback(async () => {
    cancelDebouncedExport()
    if (canvasRef.current) {
      await canvasRef.current.clearCanvas()
      onChange(null)
    }
  }, [cancelDebouncedExport, onChange])

  const handleGenderChange = useCallback(async (gender: FaceGender) => {
    if (gender === faceGender) return
    cancelDebouncedExport()
    if (canvasRef.current) {
      await canvasRef.current.clearCanvas()
    }
    setFaceGender(gender)
    onGenderChange?.(gender)
    onChange(null)
  }, [faceGender, cancelDebouncedExport, onChange, onGenderChange])

  const handleReplaceMap = () => {
    setReplacing(true)
    onChange(null)
  }

  const toggleEraseMode = useCallback(() => {
    const newMode = !eraseMode
    setEraseMode(newMode)
    canvasRef.current?.eraseMode(newMode)
  }, [eraseMode])

  const handleColorChange = useCallback((color: string) => {
    setStrokeColor(color)
    if (eraseMode) {
      setEraseMode(false)
      canvasRef.current?.eraseMode(false)
    }
  }, [eraseMode])

  const adjustWidth = useCallback((delta: number) => {
    setStrokeWidth(prev => {
      const idx = STROKE_WIDTHS.indexOf(prev)
      const newIdx = Math.max(0, Math.min(STROKE_WIDTHS.length - 1, idx + delta))
      return STROKE_WIDTHS[newIdx]
    })
  }, [])

  if (isRemoteSavedMap && value) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-on-surface font-outfit">Mapa facial guardado</span>
          <button
            type="button"
            onClick={handleReplaceMap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-light hover:text-primary transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reemplazar mapa
          </button>
        </div>
        <div className="rounded-xl border border-outline overflow-hidden bg-primary-light">
          <img src={value} alt="Mapa facial guardado" className="w-full max-h-[480px] object-contain" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header + selector de género */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink font-outfit uppercase tracking-wide">
            Mapa facial
          </h3>
          <p className="text-xs text-muted mt-1 max-w-xl">{MAP_INSTRUCTION}</p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void handleGenderChange('female')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[40px]',
              faceGender === 'female'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface'
            )}
          >
            Femenino
          </button>
          <button
            type="button"
            onClick={() => void handleGenderChange('male')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[40px]',
              faceGender === 'male'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted hover:text-ink hover:bg-surface'
            )}
          >
            Masculino
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap p-3 bg-surface rounded-xl border border-outline elevation-1">
        <Pencil className={cn('w-4 h-4 shrink-0', !eraseMode ? 'text-primary' : 'text-muted')} />

        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
          {STROKE_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              title={label}
              onClick={() => handleColorChange(color)}
              className={cn(
                'w-7 h-7 rounded-lg border-2 transition-all cursor-pointer',
                strokeColor === color && !eraseMode
                  ? 'border-ink scale-110'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-surface-container rounded-xl p-1">
          <button
            type="button"
            onClick={() => adjustWidth(-1)}
            disabled={strokeWidth === STROKE_WIDTHS[0]}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-6 text-center text-xs font-medium text-on-surface-variant">{strokeWidth}</span>
          <button
            type="button"
            onClick={() => adjustWidth(1)}
            disabled={strokeWidth === STROKE_WIDTHS[STROKE_WIDTHS.length - 1]}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleEraseMode}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer',
            eraseMode
              ? 'bg-warning-light text-warning'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface'
          )}
        >
          <Eraser className="w-3.5 h-3.5" />
          Borrador
        </button>

        <button
          type="button"
          onClick={() => void handleUndo()}
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-light rounded-xl transition-colors cursor-pointer"
          title="Deshacer"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => void handleClear()}
          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-light rounded-xl transition-colors cursor-pointer"
          title="Limpiar todo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl border border-outline overflow-hidden bg-primary-light p-4 sm:p-6">
        <p className="text-xs font-semibold text-primary text-center uppercase tracking-wide mb-3">
          {GENDER_LABELS[faceGender]}
        </p>

        <div className="relative rounded-xl border border-outline/60 overflow-hidden bg-white mx-auto max-w-md" style={{ touchAction: 'none' }}>
          <ReactSketchCanvas
            key={faceGender}
            ref={canvasRef}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            eraserWidth={strokeWidth * 3}
            backgroundImage={backgroundImage}
            preserveBackgroundImageAspectRatio="xMidYMid meet"
            width="100%"
            height="400px"
            canvasColor="transparent"
            onStroke={scheduleDebouncedExport}
            style={{ cursor: eraseMode ? 'cell' : 'crosshair' }}
          />
        </div>
      </div>

      <p className="text-xs text-muted text-center">
        Selecciona femenino o masculino antes de dibujar. Al cambiar de rostro se reinicia el lienzo.
      </p>
    </div>
  )
}
