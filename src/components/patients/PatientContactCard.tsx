import { Card } from '../ui/Card'
import { formatArgentinaPhoneDisplay } from '../../lib/phoneUtils'
import type { Paciente } from '../../lib/pacienteService'

interface PatientContactCardProps {
  patient: Paciente
}

export function PatientContactCard({ patient }: PatientContactCardProps) {
  return (
    <Card className="p-5 space-y-4">
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">
          Teléfono
        </span>
        <span className="text-sm font-medium text-ink">
          {patient.telefono ? formatArgentinaPhoneDisplay(patient.telefono) : '—'}
        </span>
      </div>
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-1">
          Email
        </span>
        <span className="text-sm font-medium text-ink break-all">{patient.correo || '—'}</span>
      </div>
      {patient.permite_fotos_redes !== null && (
        <p
          className={`text-xs font-medium pt-1 ${
            patient.permite_fotos_redes ? 'text-green-700' : 'text-muted'
          }`}
        >
          {patient.permite_fotos_redes
            ? 'Autoriza publicación en redes sociales'
            : 'No autoriza publicación en redes sociales'}
        </p>
      )}
    </Card>
  )
}
