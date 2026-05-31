import { Skeleton } from '../ui/Skeleton'

export function PatientDirectorySkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface px-4 py-4 sm:px-5 sm:py-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="space-y-2 lg:w-44">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex gap-2 lg:w-56">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PatientDirectoryColumnHeader() {
  return (
    <div
      className="hidden lg:grid lg:grid-cols-[minmax(0,280px)_1fr_auto] lg:gap-6 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted font-outfit"
      aria-hidden
    >
      <span>Paciente</span>
      <span>Estado clínico</span>
      <span className="text-right pr-1">Acciones</span>
    </div>
  )
}
