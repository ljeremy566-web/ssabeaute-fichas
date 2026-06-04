import { lazy, Suspense } from 'react'
import { useRoutes, Navigate, type RouteObject } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Login } from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PageTransition } from './components/layout/PageTransition'
import { useKeepAlive } from './hooks/useKeepAlive'

const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })),
)
const PatientDetails = lazy(() =>
  import('./pages/PatientDetails').then(m => ({ default: m.PatientDetails })),
)
const ClinicalIntakeWizard = lazy(() =>
  import('./pages/ClinicalIntakeWizard').then(m => ({ default: m.ClinicalIntakeWizard })),
)
const PatientConsentPage = lazy(() =>
  import('./pages/PatientConsentPage').then(m => ({ default: m.PatientConsentPage })),
)
const RoutineDeliveryPage = lazy(() =>
  import('./pages/RoutineDeliveryPage').then(m => ({ default: m.RoutineDeliveryPage })),
)
const ConsultationStartPage = lazy(() =>
  import('./pages/ConsultationStartPage').then(m => ({ default: m.ConsultationStartPage })),
)
const StaffProfilePage = lazy(() =>
  import('./pages/StaffProfilePage').then(m => ({ default: m.StaffProfilePage })),
)

const appRoutes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  { path: '/firma/:token', element: <PatientConsentPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/perfil', element: <StaffProfilePage /> },
      {
        path: '/admin/consulta/nueva',
        element: <Navigate to="/admin?nuevaConsulta=1" replace />,
      },
      { path: '/admin/paciente/:pacienteId', element: <PatientDetails /> },
      { path: '/admin/paciente/:pacienteId/consulta', element: <ConsultationStartPage /> },
      { path: '/admin/paciente/:pacienteId/ficha/nueva', element: <ClinicalIntakeWizard /> },
      {
        path: '/admin/paciente/:pacienteId/ficha/:fichaId/editar',
        element: <ClinicalIntakeWizard />,
      },
      { path: '/admin/paciente/:pacienteId/rutina', element: <RoutineDeliveryPage /> },
      {
        path: '/admin/paciente/:pacienteId/rutina/:fichaId',
        element: <RoutineDeliveryPage />,
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]

function PageLoader() {
  return (
    <div className="min-h-screen-safe flex flex-col items-center justify-center gap-3 bg-surface-dim">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted font-medium">Cargando…</p>
    </div>
  )
}

function AppRoutes() {
  const element = useRoutes(appRoutes)
  return <PageTransition>{element}</PageTransition>
}

function App() {
  useKeepAlive()

  return (
    <Suspense fallback={<PageLoader />}>
      <AppRoutes />
    </Suspense>
  )
}

export default App
