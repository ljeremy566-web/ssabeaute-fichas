import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Download,
  MessageCircle,
  Pencil,
  Trash2,
  Camera,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { CollapsibleSection, CollapsibleChevron } from '../ui/CollapsibleSection'
import { cn } from '../../lib/cn'
import { parseLocalDate } from '../../lib/dateUtils'
import type { FichaClinica } from '../../lib/fichaService'
import { FICHA_WIZARD_STEP_LABELS, getPendingWizardSteps } from '../../lib/fichaUtils'
import {
  countAttachedPhotos,
  getFichaDisplayTitle,
  getFichaStatusBadge,
  hasRutinaContent,
} from '../../lib/patientHistoryUtils'
import { isSoloRutinaFicha } from '../../lib/soloRutinaFicha'
import { RutinaIndicadaPanel } from './RutinaIndicadaPanel'

interface FichaTimelineCardProps {
  ficha: FichaClinica
  defaultExpanded?: boolean
  showTimelineNode?: boolean
  downloading?: boolean
  onDownloadPdf: () => void
  onWhatsApp: () => void
  onEdit: () => void
  onDelete: () => void
}

export function FichaTimelineCard({
  ficha,
  defaultExpanded = false,
  showTimelineNode = true,
  downloading = false,
  onDownloadPdf,
  onWhatsApp,
  onEdit,
  onDelete,
}: FichaTimelineCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const soloRutina = isSoloRutinaFicha(ficha)
  const badge = getFichaStatusBadge(ficha, soloRutina)
  const pendingSteps = getPendingWizardSteps(ficha)
  const cf = ficha.cuidados_faciales ?? {}
  const photoCount = countAttachedPhotos(ficha)
  const tr = ficha.tratamientos_realizados ?? {}

  const badgeToneClass =
    badge.tone === 'success'
      ? 'bg-success-light/50 text-success border-success/20'
      : badge.tone === 'warning'
        ? 'bg-warning-light/50 text-warning border-warning/20'
        : 'bg-surface-container text-muted border-border'

  return (
    <div className={cn('relative', showTimelineNode && 'pl-5 sm:pl-6')}>
      {showTimelineNode && (
        <div
          className={cn(
            'absolute left-0 top-5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white shadow-sm z-[1] transition-colors duration-300',
            expanded ? 'bg-brand scale-110' : 'bg-brand/80',
          )}
        />
      )}
      <Card
        className={cn(
          'p-4 sm:p-5 transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-google-emphasized)]',
          expanded && 'shadow-md border-brand-light/40',
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left cursor-pointer group"
          aria-expanded={expanded}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brand font-outfit flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(parseLocalDate(ficha.fecha_servicio), "d MMM yyyy", { locale: es })}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    badgeToneClass,
                  )}
                >
                  {soloRutina ? 'Remota' : 'Presencial'}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', badgeToneClass)}>
                  {badge.label}
                </span>
              </div>
              <p
                className={cn(
                  'text-sm font-semibold text-ink transition-[line-clamp] duration-300',
                  expanded ? 'line-clamp-none' : 'line-clamp-2',
                )}
              >
                {getFichaDisplayTitle(ficha, soloRutina)}
              </p>
            </div>
            <CollapsibleChevron
              open={expanded}
              className="text-muted group-hover:text-brand mt-0.5"
            />
          </div>
        </button>

        <CollapsibleSection open={expanded} contentClassName="min-h-0">
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {tr.tratamientos_notas && (
              <p className="text-sm text-ink leading-relaxed">{tr.tratamientos_notas}</p>
            )}
            {tr.tratamientos?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tr.tratamientos.map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-light/80 text-brand"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {ficha.evaluacion_profesional?.tipo_piel && (
              <p className="text-xs text-muted">Tipo de piel: {ficha.evaluacion_profesional.tipo_piel}</p>
            )}
            {pendingSteps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingSteps.map(step => (
                  <span
                    key={step}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning-light/40 text-warning border border-warning/25"
                  >
                    {FICHA_WIZARD_STEP_LABELS[step]}
                  </span>
                ))}
              </div>
            )}
            {hasRutinaContent(ficha) && (
              <RutinaIndicadaPanel
                rutinaDia={cf.rutina_dia as string}
                rutinaNoche={cf.rutina_noche as string}
                defaultExpanded
                onVerDetalle={onEdit}
              />
            )}
            {photoCount > 0 && (
              <p className="text-xs text-muted flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                {photoCount} foto{photoCount > 1 ? 's' : ''} adjunta{photoCount > 1 ? 's' : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={downloading}
                className="px-3 py-2 text-brand bg-brand-light/20 hover:bg-brand-light/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Rutinas PDF
              </button>
              <button
                type="button"
                onClick={onWhatsApp}
                className="p-2 text-muted hover:text-green-700 hover:bg-green-50 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="p-2 text-muted hover:text-brand hover:bg-brand-light/50 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </Card>
    </div>
  )
}
