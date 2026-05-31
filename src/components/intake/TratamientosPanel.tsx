import { cn } from '../../lib/cn'

export const TRATAMIENTOS_OPTIONS = [
  'Limpieza profunda', 'Microdermoabrasión', 'Peeling químico',
  'Terapia LED', 'Radiofrecuencia', 'Hidrafacial', 'Dermapen',
  'Extracción de comedones', 'Mascarilla especializada',
  'Electroporación', 'Alta frecuencia', 'Vacuumterapia',
] as const

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'px-3.5 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-all cursor-pointer',
        checked
          ? 'bg-primary-light text-primary border-primary/30'
          : 'bg-surface text-on-surface-variant border-outline hover:bg-surface-container'
      )}
    >
      {label}
    </button>
  )
}

interface TratamientosPanelProps {
  tratamientos: string[]
  onTratamientosChange: (value: string[]) => void
  tratamientosNotas: string
  onTratamientosNotasChange: (value: string) => void
}

export function TratamientosPanel({
  tratamientos,
  onTratamientosChange,
  tratamientosNotas,
  onTratamientosNotasChange,
}: TratamientosPanelProps) {
  return (
    <div className="p-5 bg-surface rounded-xl border border-outline">
      <h3 className="text-base font-semibold text-on-surface font-outfit mb-1">
        Tratamientos realizados
      </h3>
      <p className="text-sm text-on-surface-variant mb-4">
        Puedes volver a este paso en cualquier pausa de la sesión para ir anotando lo realizado.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {TRATAMIENTOS_OPTIONS.map(t => (
          <CheckboxChip
            key={t}
            label={t}
            checked={tratamientos.includes(t)}
            onChange={() => onTratamientosChange(toggleArrayItem(tratamientos, t))}
          />
        ))}
      </div>
      <textarea
        value={tratamientosNotas}
        onChange={e => onTratamientosNotasChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-2.5 rounded-xl border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        placeholder="Notas adicionales sobre los tratamientos..."
      />
    </div>
  )
}
