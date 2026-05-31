import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = () => {
  const { session, isStaff, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen-safe flex flex-col items-center justify-center gap-3 bg-surface-dim">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted font-medium">Cargando sesión...</p>
      </div>
    )
  }

  if (!session || !isStaff) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
