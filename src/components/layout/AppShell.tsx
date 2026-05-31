import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Link as LinkIcon, LogOut, Menu, X, MoreHorizontal } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { Snackbar } from '../ui/Snackbar'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../ui/Card'

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const isPatientsActive = location.pathname.startsWith('/admin')

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/formulario`)
    setSnackbarOpen(true)
  }

  const navItems = [
    {
      label: 'Pacientes',
      icon: <Users className="w-5 h-5" />,
      active: isPatientsActive,
      onClick: () => { navigate('/admin'); setMobileOpen(false) },
    },
    {
      label: 'Copiar link del formulario',
      icon: <LinkIcon className="w-5 h-5" />,
      active: false,
      onClick: () => { handleCopyLink(); setMobileOpen(false) },
    },
  ]

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="p-5 sm:p-6 border-b border-border">
        <Logo size="md" />
      </div>
      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => { item.onClick(); onItemClick?.() }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold font-outfit transition-all duration-200 cursor-pointer min-h-[48px]',
              item.active
                ? 'bg-brand-light text-brand-dark'
                : 'text-muted hover:bg-neutral-100 hover:text-ink active:bg-neutral-100'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 sm:p-4 border-t border-border safe-bottom">
        <button
          onClick={() => { signOut(); onItemClick?.() }}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-600 active:bg-red-50 transition-all duration-200 cursor-pointer min-h-[48px]"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  const mobileDrawer = mobileOpen && createPortal(
    <div className="md:hidden fixed inset-0 z-[9990]">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-[min(85vw,320px)] bg-surface-elevated flex flex-col shadow-premium-lg animate-slide-up-fade safe-top safe-bottom">
        <div className="flex justify-end p-3">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="p-2.5 text-muted hover:text-ink rounded-xl hover:bg-neutral-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onItemClick={() => setMobileOpen(false)} />
      </aside>
    </div>,
    document.body
  )

  return (
    <div className="min-h-screen-safe bg-surface font-sans flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-elevated border-r border-border fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {mobileDrawer}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen-safe w-full min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 bg-surface-elevated/95 backdrop-blur-md border-b border-border px-3 py-2.5 flex items-center justify-between safe-top safe-x">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="p-2.5 text-ink rounded-xl hover:bg-neutral-100 active:bg-neutral-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <div className="w-11" />
        </header>

        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 md:p-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-elevated/95 backdrop-blur-md border-t border-border safe-bottom safe-x">
          <div className="flex items-stretch justify-around px-1 pt-1 pb-1">
            <button
              onClick={() => navigate('/admin')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] cursor-pointer transition-colors',
                isPatientsActive && location.pathname === '/admin'
                  ? 'text-brand'
                  : 'text-muted active:bg-neutral-100'
              )}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-semibold font-outfit">Pacientes</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] text-muted active:bg-neutral-100 cursor-pointer transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              <span className="text-[10px] font-semibold font-outfit">Link</span>
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl min-h-[56px] text-muted active:bg-neutral-100 cursor-pointer transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-semibold font-outfit">Más</span>
            </button>
          </div>
        </nav>
      </div>

      <Snackbar
        isOpen={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message="Link del formulario copiado al portapapeles"
      />
    </div>
  )
}
