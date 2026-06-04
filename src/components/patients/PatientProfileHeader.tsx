import { ArrowLeft, BookOpen, ClipboardPlus, Eye, MessageCircle, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { PatientAvatar } from './PatientAvatar'
import { PatientMoreActionsMenu } from './PatientMoreActionsMenu'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate } from '../../lib/dateUtils'

interface PatientProfileHeaderProps {
  pacienteId: string
  nombre: string
  fechaRegistro: string | null
  hasConsultas: boolean
  hasLatestFicha: boolean
  downloadingCompleta: boolean
  onEditar: () => void
  onWhatsApp: () => void
  onFichaCompleta: () => void
  onEnviarRutina: () => void
  onEliminarPaciente: () => void
}

export function PatientProfileHeader({
  pacienteId,
  nombre,
  fechaRegistro,
  hasConsultas,
  hasLatestFicha,
  downloadingCompleta,
  onEditar,
  onWhatsApp,
  onFichaCompleta,
  onEnviarRutina,
  onEliminarPaciente,
}: PatientProfileHeaderProps) {
  const navigate = useNavigate()

  const sinceLabel = fechaRegistro
    ? `Paciente desde ${format(parseLocalDate(fechaRegistro), 'MMM yyyy', { locale: es })}`
    : 'Paciente registrado'

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="p-2 -ml-2 text-muted hover:text-brand rounded-xl cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Volver al directorio"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PatientAvatar name={nombre} size="lg" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-outfit truncate">{nombre}</h1>
          <p className="text-sm text-muted mt-0.5 capitalize">{sinceLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {hasLatestFicha && (
          <Button
            variant="outline"
            size="md"
            className="gap-2 min-h-[44px]"
            onClick={onFichaCompleta}
            disabled={downloadingCompleta}
          >
            {downloadingCompleta ? (
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="hidden xs:inline">Ficha completa</span>
            <span className="xs:hidden">Ficha</span>
          </Button>
        )}
        <Button variant="outline" size="md" className="gap-2 min-h-[44px]" onClick={onEditar}>
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="md"
          className="gap-2 text-green-700 border-green-200 hover:bg-green-50 min-h-[44px]"
          onClick={onWhatsApp}
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="md"
          className="gap-2 min-h-[44px] hidden sm:inline-flex"
          onClick={onEnviarRutina}
        >
          <BookOpen className="w-4 h-4" />
          Enviar rutina
        </Button>
        <Button
          variant="primary"
          size="md"
          className="gap-2 min-h-[44px] flex-1 sm:flex-none"
          onClick={() => navigate(`/admin/paciente/${pacienteId}/consulta`)}
        >
          <ClipboardPlus className="w-4 h-4" />
          {hasConsultas ? 'Nueva visita' : 'Primera consulta'}
        </Button>
        <PatientMoreActionsMenu
          showEnviarRutina
          onEnviarRutina={onEnviarRutina}
          onEliminar={onEliminarPaciente}
          className="sm:hidden"
        />
        <PatientMoreActionsMenu
          showEnviarRutina={false}
          onEliminar={onEliminarPaciente}
          className="hidden sm:block"
        />
      </div>
    </div>
  )
}
