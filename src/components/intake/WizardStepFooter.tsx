import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'

interface WizardStepFooterProps {
  currentStep: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  saving?: boolean
  onPrevious: () => void
  onNext: () => void
  onFinalize: () => void
}

export function WizardStepFooter({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  saving = false,
  onPrevious,
  onNext,
  onFinalize,
}: WizardStepFooterProps) {
  return (
    <footer className="shrink-0 border-t border-outline bg-surface px-4 md:px-8 py-3 md:py-4 safe-bottom">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:contents">
          {!isFirstStep ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onPrevious}
              disabled={saving}
              className="gap-1.5 flex-1 sm:flex-none sm:min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          ) : (
            <div className="hidden sm:block sm:min-w-[120px]" aria-hidden />
          )}

          <span className="text-xs font-semibold text-muted font-outfit tabular-nums shrink-0">
            Paso {currentStep} de {totalSteps}
          </span>
        </div>

        {isLastStep ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onFinalize}
            disabled={saving}
            className={cn('gap-1.5 w-full sm:w-auto sm:min-w-[160px]')}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              'Finalizar consulta'
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onNext}
            disabled={saving}
            className={cn('gap-1.5 w-full sm:w-auto sm:min-w-[140px]')}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  )
}
