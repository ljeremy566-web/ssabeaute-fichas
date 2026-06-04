import { LogOut, Mail, Store, BadgeCheck } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { CLINIC_OWNER } from '../lib/clinicConfig'
import { cn } from '../lib/cn'

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[10px] uppercase font-bold tracking-wider text-muted font-outfit block mb-2',
        className,
      )}
    >
      {children}
    </span>
  )
}

function InfoTile({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-brand-light/40 bg-brand-light/15 p-4 text-center sm:text-left">
      <FieldLabel className="text-center sm:text-left">{label}</FieldLabel>
      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-ink font-outfit">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand shadow-xs shrink-0">
          {icon}
        </span>
        <span className="min-w-0">{children}</span>
      </div>
    </div>
  )
}

export const StaffProfilePage = () => {
  const { user, isStaff, signOut } = useAuth()

  const roleLabel = isStaff ? 'Personal autorizado' : 'Sin acceso staff'

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-lg flex flex-col items-center min-h-[calc(100vh-12rem)] md:min-h-0 py-4 sm:py-8">
        <header className="mb-8 text-center max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-outfit tracking-tight">
            Perfil
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Administra tu información profesional y la sesión.
          </p>
        </header>

        <Card className="w-full overflow-hidden shadow-md border-brand-light/30">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand/80 via-brand to-brand-light" aria-hidden />

          <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-border/80">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/50 text-brand">
              <BadgeCheck className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-xl font-semibold text-ink font-outfit">{roleLabel}</p>
            <p className="text-sm text-muted mt-3 inline-flex items-center justify-center gap-2 break-all max-w-full">
              <Mail className="w-4 h-4 shrink-0 text-brand/80" strokeWidth={1.75} />
              {user?.email ?? '—'}
            </p>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoTile
                label="Clínica"
                icon={<Store className="w-4 h-4" strokeWidth={1.75} />}
              >
                {CLINIC_OWNER.name}
              </InfoTile>
              <InfoTile
                label="Rol"
                icon={<BadgeCheck className="w-4 h-4" strokeWidth={1.75} />}
              >
                {roleLabel}
              </InfoTile>
            </div>

          </div>

          <div className="px-6 sm:px-8 pb-8 pt-2 flex justify-center border-t border-border/60 bg-surface-dim/30">
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200/80 hover:bg-red-50 hover:border-red-300 min-h-[48px] px-6 rounded-xl"
              onClick={() => void signOut()}
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
