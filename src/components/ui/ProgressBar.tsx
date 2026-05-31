import { cn } from './Card'
import { Check } from 'lucide-react'

interface Step {
  id: number;
  label: string;
  shortLabel?: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const ProgressBar = ({ steps, currentStep, className }: ProgressBarProps) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100
  const current = steps.find((s) => s.id === currentStep)

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile: paso actual + barra */}
      <div className="sm:hidden mb-3">
        <p className="text-xs font-semibold text-muted font-outfit">
          Paso {currentStep} de {steps.length}
        </p>
        <p className="text-sm font-bold text-brand font-outfit mt-0.5">
          {current?.shortLabel ?? current?.label}
        </p>
        <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: steps */}
      <div className="hidden sm:flex relative items-center justify-between">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-10 mx-8" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-brand -z-10 mx-8 transition-all duration-300"
          style={{ width: `calc(${progress}% - 4rem * ${progress / 100})` }}
        />
        {steps.map((step) => {
          const isCompleted = step.id < currentStep
          const isActive = step.id === currentStep
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-outfit transition-all duration-300 border-2 z-10',
                  isCompleted && 'bg-brand border-brand text-white',
                  isActive && 'bg-brand border-brand text-white ring-4 ring-brand/20',
                  !isCompleted && !isActive && 'bg-white border-border text-muted'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={cn(
                'text-[10px] mt-2 font-semibold text-center max-w-[72px] leading-tight',
                isActive ? 'text-brand' : 'text-muted'
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
