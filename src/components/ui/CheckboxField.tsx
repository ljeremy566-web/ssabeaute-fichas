import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'

interface CheckboxFieldProps<T extends FieldValues> {
  label: string;
  error?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  required?: boolean;
}

export const CheckboxField = <T extends FieldValues>({
  label,
  error,
  register,
  name,
  required,
}: CheckboxFieldProps<T>) => {
  return (
    <div className="mb-3 last:mb-0">
      <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-brand-light/20 hover:bg-brand-light/40 cursor-pointer transition-all duration-200">
        <input
          type="checkbox"
          className="mt-0.5 w-4 h-4 accent-brand rounded border-border cursor-pointer shrink-0"
          {...register(name, required ? { required: 'Debes aceptar para continuar' } : undefined)}
        />
        <span className="text-sm text-ink-secondary font-medium select-none leading-relaxed">{label}</span>
      </label>
      {error && <span className="text-xs text-red-600 mt-1.5 block font-medium ml-1">{error}</span>}
    </div>
  )
}
