import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { cn } from './Card'

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: RadioOption[];
  value?: string;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
}

export const RadioGroup = <T extends FieldValues>({
  name,
  label,
  options,
  value,
  register,
  error,
  required,
}: RadioGroupProps<T>) => {
  return (
    <div className="w-full mb-4 last:mb-0">
      <label className="text-sm font-semibold mb-3 block font-outfit text-ink leading-snug">{label}</label>
      <div className="flex gap-2 sm:gap-3">
        {options.map((opt) => {
          const id = `${String(name)}-${opt.value.toLowerCase()}`
          const isSelected = value === opt.value
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={cn(
                'flex-1 flex items-center justify-center px-3 sm:px-4 py-3.5 min-h-[48px] rounded-xl border cursor-pointer transition-all duration-200 select-none font-semibold text-sm active:scale-[0.98]',
                isSelected
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-ink border-border active:bg-brand-light/30'
              )}
            >
              <input
                id={id}
                type="radio"
                value={opt.value}
                className="sr-only"
                {...register(name, required ? { required: 'Selecciona una opción' } : undefined)}
              />
              {opt.label}
            </label>
          )
        })}
      </div>
      {error && <span className="text-xs text-red-600 mt-2 block font-medium">{error}</span>}
    </div>
  )
}
