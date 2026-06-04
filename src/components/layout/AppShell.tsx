import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Users, ClipboardPlus, LogOut, Menu, X, UserCircle } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { PatientPickerModal } from '../patients/PatientPickerModal'
import { SidebarNavItem } from './SidebarNavItem'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/cn'

/** Ancho del sidebar fijo en escritorio. */
export const DESKTOP_SIDEBAR_WIDTH_CLASS = 'w-[260px]'
export const DESKTOP_MAIN_OFFSET_CLASS = ''

interface AppShellProps {
  children: React.ReactNode
}

function SidebarContent({
  isPatientsActive,
  isPerfilActive,
  onNavigatePatients,
  onNavigatePerfil,
  onOpenNuevaConsulta,
  onSignOut,
  onItemClick,
  compact = false,
}: {
  isPatientsActive: boolean
  isPerfilActive: boolean
  onNavigatePatients: () => void
  onNavigatePerfil: () => void
  onOpenNuevaConsulta: () => void
  onSignOut: () => void
  onItemClick?: () => void
  compact?: boolean
}) {
  return (
    <>
      <div className={cn(compact ? 'px-2 pt-5 pb-4 flex justify-center' : 'px-6 pt-8 pb-6')}>
        <Logo size={compact ? 'sm' : 'md'} variant="light" className={compact ? 'items-center text-center' : undefined} />
      </div>

      <nav className={cn('py-2 space-y-0.5 flex-1', compact ? 'px-0' : 'overflow-visible')}>
        <SidebarNavItem
          label="Pacientes"
          icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
          active={isPatientsActive}
          compact={compact}
          onClick={() => { onNavigatePatients(); onItemClick?.() }}
        />
        <SidebarNavItem
          label="Perfil"
          icon={<UserCircle className="w-5 h-5" strokeWidth={1.75} />}
          active={isPerfilActive}
          compact={compact}
          onClick={() => { onNavigatePerfil(); onItemClick?.() }}
        />
      </nav>

      <div className={cn('space-y-2 safe-bottom shrink-0', compact ? 'px-2 pb-4' : 'px-4 pb-4')}>
        <button
          type="button"
          title="Nueva consulta"
          aria-label="Nueva consulta"
          onClick={() => { onOpenNuevaConsulta(); onItemClick?.() }}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl text-sm font-semibold font-outfit bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-colors cursor-pointer min-h-[48px]',
            compact ? 'w-full p-3' : 'w-full px-4 py-3.5',
          )}
        >
          <ClipboardPlus className="w-5 h-5" strokeWidth={1.75} />
          {!compact && <span>Nueva Consulta</span>}
        </button>
        <button
          type="button"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          onClick={() => { onSignOut(); onItemClick?.() }}
          className={cn(
            'flex items-center justify-center gap-3 rounded-xl text-sm font-semibold font-outfit text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer min-h-[48px]',
            compact ? 'w-full p-3' : 'w-full px-4 py-3',
          )}
        >
          <LogOut className="w-5 h-5" strokeWidth={1.75} />
          {!compact && <span>Cerrar sesión</span>}
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

  const isPerfilActive = location.pathname === '/admin/perfil'
  const isPatientsActive =
    !isPerfilActive &&
    (location.pathname === '/admin' ||
      (location.pathname.startsWith('/admin/paciente') &&
        !location.pathname.includes('/ficha/') &&
        !location.pathname.includes('/consulta') &&
        !location.pathname.includes('/rutina')))

  const isConsultaFlowActive =
    location.pathname.includes('/ficha/') ||
    location.pathname.includes('/consulta') ||
    location.pathname.includes('/rutina')

  const openNuevaConsulta = () => {
    setPickerRequested(true)
    setMobileOpen(false)
  }

  const closePicker = () => setPickerRequested(false)

  const handlePatientSelect = (pacienteId: string) => {
    navigate(`/admin/paciente/${pacienteId}/consulta`)
  }

  const mobileDrawer = mobileOpen && createPortal(
    <div className="md:hidden fixed inset-0 z-[9990]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-[min(85vw,280px)] bg-sidebar flex flex-col animate-slide-up-fade safe-top safe-bottom overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="flex justify-end p-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="p-2.5 text-sidebar-muted hover:text-white rounded-xl hover:bg-white/10 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <SidebarContent
            isPatientsActive={isPatientsActive}
            isPerfilActive={isPerfilActive}
            onNavigatePatients={() => { navigate('/admin'); setMobileOpen(false) }}
            onNavigatePerfil={() => { navigate('/admin/perfil'); setMobileOpen(false) }}
            onOpenNuevaConsulta={openNuevaConsulta}
            onSignOut={signOut}
            onItemClick={() => setMobileOpen(false)}
          />
        </div>
      </aside>
    </div>,
    document.body,
  )

  return (
    <div className="min-h-screen-safe bg-surface-dim font-sans flex">
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar sticky top-0 z-30 h-dvh min-h-0 shrink-0',
          DESKTOP_SIDEBAR_WIDTH_CLASS,
        )}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <SidebarContent
            isPatientsActive={isPatientsActive}
            isPerfilActive={isPerfilActive}
            onNavigatePatients={() => navigate('/admin')}
            onNavigatePerfil={() => navigate('/admin/perfil')}
            onOpenNuevaConsulta={openNuevaConsulta}
            onSignOut={signOut}
          />
        </div>
      </aside>

      {mobileDrawer}

      <div className={cn('flex-1 flex flex-col min-h-screen-safe w-full min-w-0', DESKTOP_MAIN_OFFSET_CLASS)}>
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

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 w-full min-w-0 pb-mobile-nav md:pb-8">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom safe-x">
          <div className="flex items-stretch justify-around px-1 pt-1 pb-1">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] cursor-pointer transition-colors',
                isPatientsActive ? 'text-primary' : 'text-muted active:bg-surface-container',
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
                isConsultaFlowActive ? 'text-primary' : 'text-muted active:bg-surface-container',
              )}
            >
              {isConsultaFlowActive ? (
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
              onClick={() => navigate('/admin/perfil')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] cursor-pointer transition-colors',
                isPerfilActive ? 'text-primary' : 'text-muted active:bg-surface-container',
              )}
            >
              {isPerfilActive ? (
                <div className="bg-primary-light rounded-full px-4 py-1">
                  <UserCircle className="w-5 h-5" strokeWidth={2.25} />
                </div>
              ) : (
                <UserCircle className="w-5 h-5" strokeWidth={1.75} />
              )}
              <span className="text-[10px] font-semibold font-outfit">Perfil</span>
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
