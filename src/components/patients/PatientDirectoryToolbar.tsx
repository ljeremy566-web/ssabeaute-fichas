import { Search, Filter } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ConsentimientoEstado } from '../../lib/patientDirectoryUtils'
import { Select } from '../ui/Select'

export type ConsentFilter = 'all' | ConsentimientoEstado
export type SocialMediaFilter = 'all' | 'yes' | 'no' | 'pending'
export type DirectorySort = 'name' | 'lastVisit' | 'recent'

const FILTER_OPTIONS: { value: ConsentFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'firmado', label: 'Firmado' },
  { value: 'falta_firma', label: 'Falta firma' },
  { value: 'sin_consulta', label: 'Sin consulta' },
]

const SOCIAL_MEDIA_FILTER_OPTIONS: { value: SocialMediaFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Acepta redes' },
  { value: 'no', label: 'No acepta' },
  { value: 'pending', label: 'Pendiente' },
]

const SORT_OPTIONS: { value: DirectorySort; label: string }[] = [
  { value: 'name', label: 'Nombre A–Z' },
  { value: 'lastVisit', label: 'Última visita' },
  { value: 'recent', label: 'Registro reciente' },
]

interface PatientDirectoryToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  consentFilter: ConsentFilter
  onConsentFilterChange: (value: ConsentFilter) => void
  socialMediaFilter: SocialMediaFilter
  onSocialMediaFilterChange: (value: SocialMediaFilter) => void
  sortBy: DirectorySort
  onSortChange: (value: DirectorySort) => void
  filtersOpen: boolean
  onToggleFilters: () => void
  totalCount: number
  filteredCount: number
}

export function PatientDirectoryToolbar({
  searchTerm,
  onSearchChange,
  consentFilter,
  onConsentFilterChange,
  socialMediaFilter,
  onSocialMediaFilterChange,
  sortBy,
  onSortChange,
  filtersOpen,
  onToggleFilters,
  totalCount,
  filteredCount,
}: PatientDirectoryToolbarProps) {
  const activeFilterLabel = FILTER_OPTIONS.find(o => o.value === consentFilter)?.label
  const activeSocialFilterLabel = SOCIAL_MEDIA_FILTER_OPTIONS.find(o => o.value === socialMediaFilter)?.label
  const hasActiveFilters = consentFilter !== 'all' || socialMediaFilter !== 'all'

  return (
    <div className="space-y-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 min-h-[48px] rounded-xl border border-border bg-surface-container/50 text-base sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleFilters}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border text-sm font-semibold font-outfit transition-colors cursor-pointer flex-1 sm:flex-none',
              filtersOpen || hasActiveFilters
                ? 'border-primary/30 bg-primary-light text-primary'
                : 'border-border bg-surface text-ink-secondary hover:bg-surface-container hover:border-primary/20',
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="text-xs font-medium opacity-80">
                ({[
                  consentFilter !== 'all' ? activeFilterLabel : null,
                  socialMediaFilter !== 'all' ? activeSocialFilterLabel : null
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </button>
          <Select
            value={sortBy}
            onChange={val => onSortChange(val as DirectorySort)}
            options={SORT_OPTIONS}
            placeholder="Ordenar..."
            className="w-40 sm:w-44 shrink-0 font-semibold font-outfit text-ink-secondary text-sm"
          />
        </div>
      </div>

      {filtersOpen && (
        <div className="p-4 rounded-xl border border-border bg-surface-container/40 animate-fade-in space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2.5 font-outfit">
              Consentimiento Clínico
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onConsentFilterChange(option.value)}
                  className={cn(
                    'px-3.5 py-2.5 min-h-[44px] rounded-full text-xs font-semibold font-outfit border transition-all cursor-pointer',
                    consentFilter === option.value
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-ink-secondary border-border hover:border-primary/30 hover:bg-primary-light/50',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-outline">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2.5 font-outfit">
              Consentimiento Redes Sociales
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_MEDIA_FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSocialMediaFilterChange(option.value)}
                  className={cn(
                    'px-3.5 py-2.5 min-h-[44px] rounded-full text-xs font-semibold font-outfit border transition-all cursor-pointer',
                    socialMediaFilter === option.value
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-ink-secondary border-border hover:border-primary/30 hover:bg-primary-light/50',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted font-medium font-outfit">
        {filteredCount === totalCount
          ? `${totalCount} paciente${totalCount !== 1 ? 's' : ''}`
          : `${filteredCount} de ${totalCount} pacientes`}
      </p>
    </div>
  )
}
