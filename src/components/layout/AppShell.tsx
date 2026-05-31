import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Users, ClipboardPlus, LogOut, Menu, X, MoreHorizontal } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { PatientPickerModal } from '../patients/PatientPickerModal'
import { SidebarNavItem } from './SidebarNavItem'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/cn'

interface AppShellProps {
  children: React.ReactNode
}

function SidebarContent({
  isPatientsActive,
  isNuevaConsultaActive,
  onNavigatePatients,
  onOpenNuevaConsulta,
  onSignOut,
  onItemClick,
}: {
  isPatientsActive: boolean
  isNuevaConsultaActive: boolean
  onNavigatePatients: () => void
  onOpenNuevaConsulta: () => void
  onSignOut: () => void
  onItemClick?: () => void
}) {
  return (
    <>
      <div className="px-6 pt-8 pb-6">
        <Logo size="md" variant="light" />
      </div>

      <nav className="flex-1 py-2 space-y-0.5 overflow-visible">
        <SidebarNavItem
          label="Pacientes"
          icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
          active={isPatientsActive}
          onClick={() => { onNavigatePatients(); onItemClick?.() }}
        />
        <SidebarNavItem
          label="Nueva Consulta"
          icon={<ClipboardPlus className="w-5 h-5" strokeWidth={1.75} />}
          active={isNuevaConsultaActive}
          onClick={() => { onOpenNuevaConsulta(); onItemClick?.() }}
        />
      </nav>

      <div className="px-4 pb-6 pt-2 safe-bottom">
        <button
          type="button"
          onClick={() => { onSignOut(); onItemClick?.() }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-outfit text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer min-h-[48px]"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

export const AppShell = ({ children }: AppShellProps) => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pickerRequested, setPickerRequested] = useState(false)
  const nuevaConsultaParam = searchParams.get('nuevaConsulta') === '1'
  const pickerOpen = pickerRequested || nuevaConsultaParam

  useEffect(() => {
    if (!nuevaConsultaParam) return
    setPickerRequested(true)
    const next = new URLSearchParams(searchParams)
    next.delete('nuevaConsulta')
    setSearchParams(next, { replace: true })
  }, [nuevaConsultaParam, searchParams, setSearchParams])

  const isPatientsActive =
    location.pathname === '/admin' ||
    (location.pathname.startsWith('/admin/paciente') && !location.pathname.includes('/ficha/'))
  const isNuevaConsultaActive = location.pathname.includes('/ficha/')

  const openNuevaConsulta = () => {
    setPickerRequested(true)
    setMobileOpen(false)
  }

  const closePicker = () => setPickerRequested(false)

  const handlePatientSelect = (pacienteId: string) => {
    navigate(`/admin/paciente/${pacienteId}/ficha/nueva`)
  }

  const mobileDrawer = mobileOpen && createPortal(
    <div className="md:hidden fixed inset-0 z-[9990]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-[min(85vw,300px)] bg-sidebar flex flex-col animate-slide-up-fade safe-top safe-bottom">
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="p-2.5 text-sidebar-muted hover:text-white rounded-xl hover:bg-white/10 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          isPatientsActive={isPatientsActive}
          isNuevaConsultaActive={isNuevaConsultaActive}
          onNavigatePatients={() => { navigate('/admin'); setMobileOpen(false) }}
          onOpenNuevaConsulta={openNuevaConsulta}
          onSignOut={signOut}
          onItemClick={() => setMobileOpen(false)}
        />
      </aside>
    </div>,
    document.body
  )

  return (
    <div className="min-h-screen-safe bg-surface-dim font-sans flex">
      <aside className="hidden md:flex flex-col w-[260px] bg-sidebar fixed inset-y-0 left-0 z-30 overflow-visible">
        <SidebarContent
          isPatientsActive={isPatientsActive}
          isNuevaConsultaActive={isNuevaConsultaActive}
          onNavigatePatients={() => navigate('/admin')}
          onOpenNuevaConsulta={openNuevaConsulta}
          onSignOut={signOut}
        />
      </aside>

      {mobileDrawer}

      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen-safe w-full min-w-0">
        <header className="md:hidden sticky top-0 z-20 bg-surface-dim/95 backdrop-blur-md border-b border-border px-3 py-2.5 flex items-center justify-between safe-top safe-x">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="p-2.5 text-ink rounded-xl hover:bg-surface-container active:bg-surface-container cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <div className="w-11" />
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 w-full min-w-0 pb-mobile-nav md:pb-8">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom safe-x">
          <div className="flex items-stretch justify-around px-1 pt-1 pb-1">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] cursor-pointer transition-colors',
                isPatientsActive ? 'text-primary' : 'text-muted active:bg-surface-container'
              )}
            >
              {isPatientsActive ? (
                <div className="bg-primary-light rounded-full px-4 py-1">
                  <Users className="w-5 h-5" strokeWidth={2.25} />
                </div>
              ) : (
                <Users className="w-5 h-5" strokeWidth={1.75} />
              )}
              <span className="text-[10px] font-semibold font-outfit">Pacientes</span>
            </button>
            <button
              type="button"
              onClick={openNuevaConsulta}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] cursor-pointer transition-colors',
                isNuevaConsultaActive ? 'text-primary' : 'text-muted active:bg-surface-container'
              )}
            >
              {isNuevaConsultaActive ? (
                <div className="bg-primary-light rounded-full px-4 py-1">
                  <ClipboardPlus className="w-5 h-5" strokeWidth={2.25} />
                </div>
              ) : (
                <ClipboardPlus className="w-5 h-5" strokeWidth={1.75} />
              )}
              <span className="text-[10px] font-semibold font-outfit">Consulta</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] text-muted active:bg-surface-container cursor-pointer transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-semibold font-outfit">Más</span>
            </button>
          </div>
        </nav>
      </div>

      <PatientPickerModal
        key={pickerOpen ? 'picker-open' : 'picker-closed'}
        isOpen={pickerOpen}
        onClose={closePicker}
        onSelect={handlePatientSelect}
      />
    </div>
  )
}
