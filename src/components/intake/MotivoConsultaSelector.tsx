import { cn } from '../../lib/cn'
import {
  SERVICIOS_MOTIVO_OPTIONS,
  type ServicioMotivoOption,
} from '../../lib/serviciosCatalogo'

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function CheckboxChip({
  label,
  checked,
  onChange,
  highlighted,
}: {
  label: string
  checked: boolean
  onChange: () => void
  highlighted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'px-3.5 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-all cursor-pointer text-left',
        checked
          ? 'bg-primary-light text-primary border-primary/30'
          : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-container',
        highlighted && !checked && 'border-primary/40 bg-primary-light/30',
      )}
    >
      {label}
    </button>
  )
}

interface MotivoConsultaSelectorProps {
  seleccionados: string[]
  onSeleccionadosChange: (value: string[]) => void
  otroTexto: string
  onOtroTextoChange: (value: string) => void
}

export function MotivoConsultaSelector({
  seleccionados,
  onSeleccionadosChange,
  otroTexto,
  onOtroTextoChange,
}: MotivoConsultaSelectorProps) {
  const revisionOption = SERVICIOS_MOTIVO_OPTIONS.find(o => o.id === 'revision_facial')
  const catalogOptions = SERVICIOS_MOTIVO_OPTIONS.filter(o => o.id !== 'revision_facial')
  const otroSelected = seleccionados.includes('otro')

  const renderChip = (option: ServicioMotivoOption) => (
    <CheckboxChip
      key={option.id}
      label={option.label}
      checked={seleccionados.includes(option.id)}
      highlighted={option.id === 'revision_facial'}
      onChange={() => onSeleccionadosChange(toggleArrayItem(seleccionados, option.id))}
    />
  )

  return (
    <div className="mb-6 p-5 bg-surface rounded-xl border border-outline">
      <h3 className="text-base font-semibold text-on-surface font-outfit mb-1">
        Motivo de la consulta
      </h3>
      <p className="text-sm text-on-surface-variant mb-4">
        Selecciona el servicio solicitado o una revisión facial para evaluar opciones.
      </p>

      {revisionOption && (
        <div className="mb-4">
          {renderChip(revisionOption)}
          {revisionOption.hint && (
            <p className="text-xs text-on-surface-variant mt-2 ml-1">{revisionOption.hint}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {catalogOptions.map(renderChip)}
      </div>

      {otroSelected && (
        <div className="mt-4 pt-4 border-t border-outline">
          <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
            Especificar motivo
          </label>
          <textarea
            value={otroTexto}
            onChange={e => onOtroTextoChange(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            placeholder="Describe el motivo de la consulta..."
          />
        </div>
      )}
    </div>
  )
}
