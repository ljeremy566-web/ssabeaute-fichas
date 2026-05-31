import type { UseFormRegister, FieldValues, Path, FieldErrors, UseFormWatch } from 'react-hook-form'
import { RadioGroup } from './RadioGroup'
import { Textarea } from './Textarea'

interface YesNoDetailFieldProps<T extends FieldValues> {
  radioName: Path<T>;
  detailName: Path<T>;
  label: string;
  detailLabel?: string;
  detailPlaceholder?: string;
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  required?: boolean;
}

export const YesNoDetailField = <T extends FieldValues>({
  radioName,
  detailName,
  label,
  detailLabel = 'Por favor, detalla',
  detailPlaceholder = 'Describe con el mayor detalle posible...',
  register,
  watch,
  errors,
  required = true,
}: YesNoDetailFieldProps<T>) => {
  const response = watch(radioName) as string | undefined
  const isYes = response === 'Si'

  return (
    <div className="mb-6 last:mb-0 pb-6 last:pb-0 border-b border-outline last:border-0">
      <RadioGroup
        name={radioName}
        label={label}
        options={[{ value: 'Si', label: 'Sí' }, { value: 'No', label: 'No' }]}
        value={response}
        register={register}
        required={required}
        error={errors[radioName]?.message as string | undefined}
      />
      {isYes && (
        <div className="mt-1 animate-slide-up-fade">
          <Textarea
            variant="form"
            label={`${detailLabel} *`}
            placeholder={detailPlaceholder}
            rows={3}
            {...register(detailName, {
              validate: (val) => {
                if (watch(radioName) === 'Si' && !String(val ?? '').trim()) {
                  return 'Por favor detalla esta información'
                }
                return true
              },
            })}
            error={errors[detailName]?.message as string | undefined}
          />
        </div>
      )}
    </div>
  )
}
