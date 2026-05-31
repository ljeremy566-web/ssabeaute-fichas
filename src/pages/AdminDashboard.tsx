import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { supabase } from '../lib/insforge'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'

interface Patient {
  id: string
  nombre_completo: string
  telefono: string
  fecha_registro: string
}

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase.database
        .from('pacientes')
        .select('id, nombre_completo, telefono, fecha_registro')
        .order('fecha_registro', { ascending: false })

      if (!error && data) setPatients(data)
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefono.includes(searchTerm)
  )

  return (
    <AppShell>
      <div className="mb-5 sm:mb-8">
        <div className="flex items-baseline gap-2 sm:gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-outfit">Pacientes</h1>
          <span className="text-xs sm:text-sm font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-lg">
            {patients.length}
          </span>
        </div>
        <p className="text-sm text-muted font-medium">Administra fichas y sesiones de tus pacientes.</p>
      </div>

      <div className="relative mb-4 sm:mb-6">
        <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 min-h-[48px] rounded-xl border border-border bg-white text-base sm:text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <Card className="overflow-hidden">
        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={searchTerm ? 'Sin resultados' : 'Aún no hay pacientes'}
            description={searchTerm
              ? 'Prueba con otro nombre o número de teléfono.'
              : 'Comparte el link del formulario desde el menú para que tus pacientes se registren.'}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => navigate(`/admin/paciente/${patient.id}`)}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[64px] hover:bg-brand-light/30 active:bg-brand-light/40 transition-colors duration-200 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center flex-shrink-0 font-bold text-sm font-outfit">
                  {patient.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate font-outfit">
                    {patient.nombre_completo}
                  </p>
                  <p className="text-xs text-muted truncate mt-0.5">{patient.telefono}</p>
                  <p className="text-[10px] text-muted mt-0.5 sm:hidden">
                    {new Date(patient.fecha_registro).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-semibold text-muted bg-neutral-100 px-2.5 py-1 rounded-lg shrink-0 hidden sm:block">
                  {new Date(patient.fecha_registro).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  )
}
