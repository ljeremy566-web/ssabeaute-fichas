import { useMemo, useState } from 'react'
import { ClipboardPlus, Filter } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import type { FichaClinica } from '../../lib/fichaService'
import {
  HISTORY_INITIAL_VISIBLE,
  HISTORY_LOAD_MORE_STEP,
  filterConsultas,
  type ConsultaFilter,
} from '../../lib/patientHistoryUtils'
import { FichaTimelineCard } from './FichaTimelineCard'

type HistoryTab = 'consultas' | 'rutinas'

interface PatientHistoryTabsProps {
  consultas: FichaClinica[]
  rutinas: FichaClinica[]
  downloadingFichaId: string | null
  onDownloadPdf: (ficha: FichaClinica) => void
  onWhatsApp: (ficha: FichaClinica) => void
  onEdit: (ficha: FichaClinica) => void
  onDelete: (ficha: FichaClinica) => void
  onNuevaConsulta: () => void
  onNuevaRutina: () => void
}

export function PatientHistoryTabs({
  consultas,
  rutinas,
  downloadingFichaId,
  onDownloadPdf,
  onWhatsApp,
  onEdit,
  onDelete,
  onNuevaConsulta,
  onNuevaRutina,
}: PatientHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('consultas')
  const [consultaFilter, setConsultaFilter] = useState<ConsultaFilter>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(HISTORY_INITIAL_VISIBLE)

  const filteredConsultas = useMemo(
    () => filterConsultas(consultas, consultaFilter),
    [consultas, consultaFilter],
  )

  const activeList = activeTab === 'consultas' ? filteredConsultas : rutinas
  const visibleList = activeList.slice(0, visibleCount)
  const hasMore = visibleCount < activeList.length

  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab)
    setVisibleCount(HISTORY_INITIAL_VISIBLE)
  }

  const handleFilterChange = (f: ConsultaFilter) => {
    setConsultaFilter(f)
    setFilterOpen(false)
    setVisibleCount(HISTORY_INITIAL_VISIBLE)
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2 font-outfit">
          <ClipboardPlus className="w-5 h-5 text-brand" />
          Consultas clínicas
        </h2>
        {activeTab === 'consultas' && consultas.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted hover:text-ink cursor-pointer min-h-[40px]"
            >
              <Filter className="w-4 h-4" />
              {consultaFilter === 'all'
                ? 'Todas'
                : consultaFilter === 'incomplete'
                  ? 'Incompletas'
                  : 'Completas'}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl border border-border bg-surface shadow-lg min-w-[140px]">
                {(['all', 'incomplete', 'complete'] as ConsultaFilter[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFilterChange(f)}
                    className={cn(
                      'w-full px-4 py-2 text-sm text-left hover:bg-surface-dim cursor-pointer',
                      consultaFilter === f && 'text-brand font-semibold',
                    )}
                  >
                    {f === 'all' ? 'Todas' : f === 'incomplete' ? 'Incompletas' : 'Completas'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-surface-container/50 border border-border mb-5">
        <button
          type="button"
          onClick={() => handleTabChange('consultas')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold font-outfit transition-colors cursor-pointer min-h-[44px]',
            activeTab === 'consultas'
              ? 'bg-surface text-brand shadow-xs'
              : 'text-muted hover:text-ink',
          )}
        >
          Consultas ({consultas.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('rutinas')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold font-outfit transition-colors cursor-pointer min-h-[44px]',
            activeTab === 'rutinas'
              ? 'bg-surface text-brand shadow-xs'
              : 'text-muted hover:text-ink',
          )}
        >
          Rutinas enviadas ({rutinas.length})
        </button>
      </div>

      {activeList.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted font-medium mb-4">
            {activeTab === 'consultas'
              ? 'No hay consultas presenciales registradas.'
              : 'No hay rutinas remotas enviadas.'}
          </p>
          <Button
            variant="primary"
            onClick={activeTab === 'consultas' ? onNuevaConsulta : onNuevaRutina}
          >
            {activeTab === 'consultas' ? 'Nueva visita' : 'Enviar rutina'}
          </Button>
        </Card>
      ) : (
        <>
          <div
            className={cn(
              'space-y-3 sm:space-y-4',
              activeTab === 'consultas' &&
                'relative before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-light',
            )}
          >
            {visibleList.map((ficha, index) => (
              <FichaTimelineCard
                key={ficha.id}
                ficha={ficha}
                defaultExpanded={index === 0}
                showTimelineNode={activeTab === 'consultas'}
                downloading={downloadingFichaId === ficha.id}
                onDownloadPdf={() => onDownloadPdf(ficha)}
                onWhatsApp={() => onWhatsApp(ficha)}
                onEdit={() =>
                  onEdit(ficha)
                }
                onDelete={() => onDelete(ficha)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                className="rounded-full px-6"
                onClick={() => setVisibleCount(c => c + HISTORY_LOAD_MORE_STEP)}
              >
                Cargar consultas anteriores
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
