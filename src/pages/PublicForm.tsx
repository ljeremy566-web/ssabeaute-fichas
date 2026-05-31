import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/insforge'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Logo } from '../components/ui/Logo'
import { FormSection } from '../components/ui/FormSection'
import { ProgressBar } from '../components/ui/ProgressBar'
import { RadioGroup } from '../components/ui/RadioGroup'
import { CheckboxField } from '../components/ui/CheckboxField'
import { YesNoDetailField } from '../components/ui/YesNoDetailField'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

interface PublicFormData {
  nombre_completo: string
  nacionalidad: string
  domicilio: string
  telefono: string
  edad: number
  tiene_alergias: string
  alergias_detalle: string
  tiene_anticonceptivos: string
  anticonceptivos_detalle: string
  tiene_suplementos: string
  suplementos_detalle: string
  tiene_implantes: string
  implantes_detalle: string
  tiene_problemas_gi: string
  problemas_gi_detalle: string
  embarazo: string
  agua_alimentacion: string
  sueno_estres: string
  rutina_higiene: string
  usa_rasuradora: string
  biotipo_cutaneo: string
  consiente_tratamiento: boolean
  permite_fotos_redes: boolean
}

const STEPS = [
  { id: 1, label: 'Datos personales', shortLabel: 'Datos personales' },
  { id: 2, label: 'Salud y antecedentes', shortLabel: 'Salud' },
  { id: 3, label: 'Hábitos', shortLabel: 'Hábitos' },
  { id: 4, label: 'Consentimientos', shortLabel: 'Consentimientos' },
]

const STEP_FIELDS: (keyof PublicFormData)[][] = [
  ['nombre_completo', 'telefono', 'edad'],
  [
    'tiene_alergias', 'alergias_detalle',
    'tiene_anticonceptivos', 'anticonceptivos_detalle',
    'tiene_suplementos', 'suplementos_detalle',
    'tiene_implantes', 'implantes_detalle',
    'tiene_problemas_gi', 'problemas_gi_detalle',
    'embarazo',
  ],
  ['usa_rasuradora'],
  ['consiente_tratamiento'],
]

const composeYesNo = (tiene: string, detalle: string, noValue = 'No') =>
  tiene === 'Si' ? detalle.trim() : noValue

export const PublicForm = () => {
  const { register, handleSubmit, trigger, watch, formState: { errors, isSubmitting } } = useForm<PublicFormData>()
  const [currentStep, setCurrentStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const embarazo = watch('embarazo')
  const usaRasuradora = watch('usa_rasuradora')

  const onSubmit = async (data: PublicFormData) => {
    setErrorMsg('')
    const payload = {
      nombre_completo: data.nombre_completo,
      nacionalidad: data.nacionalidad,
      domicilio: data.domicilio,
      telefono: data.telefono,
      edad: data.edad,
      alergias_cosmeticos_alimentos: composeYesNo(data.tiene_alergias, data.alergias_detalle, 'Ninguna'),
      anticonceptivos_menopausia: composeYesNo(data.tiene_anticonceptivos, data.anticonceptivos_detalle),
      suplementos_testosterona: composeYesNo(data.tiene_suplementos, data.suplementos_detalle),
      implantes_metalicos: composeYesNo(data.tiene_implantes, data.implantes_detalle),
      problemas_gastrointestinales: composeYesNo(data.tiene_problemas_gi, data.problemas_gi_detalle),
      embarazo: data.embarazo === 'Si',
      agua_alimentacion: data.agua_alimentacion,
      sueno_estres: data.sueno_estres,
      rutina_higiene: data.rutina_higiene,
      usa_rasuradora: data.usa_rasuradora === 'Si',
      biotipo_cutaneo: data.biotipo_cutaneo,
      consiente_tratamiento: data.consiente_tratamiento,
      permite_fotos_redes: data.permite_fotos_redes,
      fecha_registro: new Date().toISOString().split('T')[0],
    }
    const { error } = await supabase.database.from('pacientes').insert([payload])
    if (error) {
      setErrorMsg('Ocurrió un error al enviar el formulario. Por favor intenta de nuevo.')
    } else {
      setSuccess(true)
    }
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep - 1]
    const valid = await trigger(fields)
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 1))

  if (success) {
    return (
      <div className="min-h-screen-safe bg-white py-8 px-4 flex items-center justify-center font-sans safe-x safe-bottom">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="mb-6 flex justify-center">
            <Logo size="md" />
          </div>
          <Card className="p-6 sm:p-10">
            <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-brand mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-3 font-outfit">Ficha enviada</h2>
            <p className="text-muted text-sm font-medium leading-relaxed">
              Hemos recibido tus datos con éxito. Tu cosmetóloga los revisará antes de tu sesión. ¡Gracias!
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen-safe bg-surface font-sans safe-x">
      <div className="max-w-2xl mx-auto px-3 pt-6 pb-32 md:pb-12 sm:px-4 sm:pt-8">
        <div className="text-center mb-6 sm:mb-8 animate-slide-up-fade">
          <Logo size="md" className="items-center mb-4 sm:mb-6" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink font-outfit">Ficha Dermatocosmetológica</h1>
          <p className="text-sm text-muted font-medium mt-2 max-w-md mx-auto leading-relaxed px-2">
            Completa con honestidad la siguiente información. Todos los datos son confidenciales.
          </p>
        </div>

        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md py-3 mb-4 sm:mb-6 -mx-3 px-3 sm:-mx-4 sm:px-4 safe-top">
          <ProgressBar steps={STEPS} currentStep={currentStep} />
        </div>

        <form id="public-form" onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-4 sm:p-8 mb-4 sm:mb-6">
            {currentStep === 1 && (
              <FormSection title="Datos personales" description="Información básica de contacto">
                <Input
                  variant="form"
                  label="Nombre completo *"
                  {...register('nombre_completo', { required: 'Esta pregunta es obligatoria' })}
                  error={errors.nombre_completo?.message}
                />
                <Input variant="form" label="Nacionalidad" {...register('nacionalidad')} />
                <Input variant="form" label="Domicilio" {...register('domicilio')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    variant="form"
                    label="Teléfono (WhatsApp) *"
                    type="tel"
                    {...register('telefono', { required: 'Esta pregunta es obligatoria' })}
                    error={errors.telefono?.message}
                  />
                  <Input
                    variant="form"
                    label="Edad *"
                    type="number"
                    {...register('edad', { required: 'Esta pregunta es obligatoria', valueAsNumber: true })}
                    error={errors.edad?.message}
                  />
                </div>
              </FormSection>
            )}

            {currentStep === 2 && (
              <FormSection title="Salud y antecedentes" description="Responde Sí o No. Solo detalla cuando aplique.">
                <YesNoDetailField
                  radioName="tiene_alergias"
                  detailName="alergias_detalle"
                  label="¿Tiene alergias a cosméticos, alimentos o medicamentos? *"
                  detailLabel="¿Cuáles alergias tiene?"
                  detailPlaceholder="Ej: alergia al ácido salicílico, mariscos, penicilina..."
                  register={register}
                  watch={watch}
                  errors={errors}
                />
                <YesNoDetailField
                  radioName="tiene_anticonceptivos"
                  detailName="anticonceptivos_detalle"
                  label="¿Usa anticonceptivos o está en menopausia? *"
                  detailLabel="Indique cuál método o estado"
                  detailPlaceholder="Ej: anticonceptivos orales, DIU, menopausia desde 2022..."
                  register={register}
                  watch={watch}
                  errors={errors}
                />
                <YesNoDetailField
                  radioName="tiene_suplementos"
                  detailName="suplementos_detalle"
                  label="¿Consume suplementos, testosterona o vitaminas? *"
                  detailLabel="¿Qué consume y con qué frecuencia?"
                  detailPlaceholder="Ej: vitamina D diaria, colágeno, testosterona..."
                  register={register}
                  watch={watch}
                  errors={errors}
                />
                <YesNoDetailField
                  radioName="tiene_implantes"
                  detailName="implantes_detalle"
                  label="¿Tiene implantes metálicos o marcapasos? *"
                  detailLabel="Indique tipo y ubicación"
                  detailPlaceholder="Ej: marcapasos en tórax, implante dental..."
                  register={register}
                  watch={watch}
                  errors={errors}
                />
                <YesNoDetailField
                  radioName="tiene_problemas_gi"
                  detailName="problemas_gi_detalle"
                  label="¿Tiene problemas gastrointestinales? *"
                  detailLabel="Describa el problema"
                  detailPlaceholder="Ej: gastritis, estreñimiento frecuente, SII..."
                  register={register}
                  watch={watch}
                  errors={errors}
                />
                <RadioGroup
                  name="embarazo"
                  label="¿Está embarazada? *"
                  options={[{ value: 'Si', label: 'Sí' }, { value: 'No', label: 'No' }]}
                  value={embarazo}
                  register={register}
                  required
                  error={errors.embarazo?.message}
                />
              </FormSection>
            )}

            {currentStep === 3 && (
              <FormSection title="Hábitos" description="Cuéntanos sobre tu estilo de vida y rutina de cuidado">
                <Textarea
                  variant="form"
                  label="Consumo de agua y hábitos de alimentación"
                  placeholder="Ej: 2 litros de agua al día, dieta balanceada, veganismo..."
                  {...register('agua_alimentacion')}
                />
                <Textarea
                  variant="form"
                  label="Calidad de sueño y nivel de estrés"
                  placeholder="Ej: duermo 7 horas, estrés laboral moderado..."
                  {...register('sueno_estres')}
                />
                <Textarea
                  variant="form"
                  label="Rutina de higiene facial actual"
                  placeholder="Ej: limpiador CeraVe, sérum vitamina C, protector solar SPF 50..."
                  {...register('rutina_higiene')}
                />
                <RadioGroup
                  name="usa_rasuradora"
                  label="¿Usa rasuradora en el rostro? *"
                  options={[{ value: 'Si', label: 'Sí' }, { value: 'No', label: 'No' }]}
                  value={usaRasuradora}
                  register={register}
                  required
                  error={errors.usa_rasuradora?.message}
                />
              </FormSection>
            )}

            {currentStep === 4 && (
              <FormSection title="Consentimientos legales" description="Lee y acepta antes de enviar">
                <input type="hidden" value="" {...register('biotipo_cutaneo')} />
                <CheckboxField
                  name="consiente_tratamiento"
                  label="Consiento realizarme los procedimientos dermatocosmetológicos acordados y entiendo las posibles reacciones temporales de mi piel. *"
                  register={register}
                  required
                  error={errors.consiente_tratamiento?.message}
                />
                <CheckboxField
                  name="permite_fotos_redes"
                  label="Autorizo el uso de fotografías (sin revelar identidad completa) para fines de registro y contenido en redes sociales."
                  register={register}
                />
              </FormSection>
            )}
          </Card>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl text-sm font-medium mb-4 mx-1">
              {errorMsg}
            </div>
          )}
        </form>
      </div>

      {/* Barra de navegación — fija en móvil, inline en desktop */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-elevated/95 backdrop-blur-md border-t border-border px-3 py-3 safe-bottom safe-x md:relative md:inset-auto md:z-auto md:bg-transparent md:border-0 md:px-0 md:py-0 md:mt-2">
        <div className="max-w-2xl mx-auto flex items-center gap-3 md:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-1 flex-1 md:flex-none min-h-[48px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" variant="primary" onClick={handleNext} className="gap-1 flex-1 md:flex-none min-h-[48px]">
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" type="submit" form="public-form" disabled={isSubmitting} className="flex-1 md:flex-none min-h-[48px]">
              {isSubmitting ? 'Enviando...' : 'Enviar ficha'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
