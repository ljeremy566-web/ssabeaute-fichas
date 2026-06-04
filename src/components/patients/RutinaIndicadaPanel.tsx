import { useState } from 'react'
import { cn } from '../../lib/cn'
import { parseRutinaLines } from '../../lib/patientHistoryUtils'
import { CollapsibleSection, CollapsibleChevron } from '../ui/CollapsibleSection'

interface RutinaIndicadaPanelProps {
  rutinaDia?: string
  rutinaNoche?: string
  defaultExpanded?: boolean
  onVerDetalle?: () => void
  className?: string
}

export function RutinaIndicadaPanel({
  rutinaDia,
  rutinaNoche,
  defaultExpanded = false,
  onVerDetalle,
  className,
}: RutinaIndicadaPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const dayLines = parseRutinaLines(rutinaDia)
  const nightLines = parseRutinaLines(rutinaNoche)

  if (dayLines.length === 0 && nightLines.length === 0) return null

  const previewLines = [...dayLines.slice(0, 2), ...nightLines.slice(0, 2)]

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-dim/80 p-3.5 transition-colors duration-300',
        expanded && 'border-brand-light/50 bg-surface-dim',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand font-outfit">
          Rutina indicada
        </span>
        <div className="flex items-center gap-2">
          {onVerDetalle && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onVerDetalle()
              }}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Ver detalle
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1 text-muted hover:text-ink rounded-lg cursor-pointer"
            aria-expanded={expanded}
            aria-label={expanded ? 'Ocultar rutina' : 'Mostrar rutina'}
          >
            <CollapsibleChevron open={expanded} className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CollapsibleSection open={!expanded} className="mt-2" animateContent>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-ink leading-relaxed">
          {previewLines.map((line, i) => (
            <li key={i} className="line-clamp-1">
              {line}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection open={expanded} className={expanded ? 'mt-2' : ''} animateContent>
        <div className="space-y-2 text-sm text-ink">
          {dayLines.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase mb-1">Día</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs leading-relaxed">
                {dayLines.map((line, i) => (
                  <li
                    key={`d-${i}`}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nightLines.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase mb-1">Noche</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs leading-relaxed">
                {nightLines.map((line, i) => (
                  <li
                    key={`n-${i}`}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(dayLines.length + i) * 40}ms`, animationFillMode: 'backwards' }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  )
}
