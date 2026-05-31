import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Login } from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'

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

function PageLoader() {
  return (
    <div className="min-h-screen-safe flex flex-col items-center justify-center gap-3 bg-surface-dim">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted font-medium">Cargando…</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/firma/:token" element={<PatientConsentPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/consulta/nueva" element={<Navigate to="/admin?nuevaConsulta=1" replace />} />
          <Route path="/admin/paciente/:pacienteId" element={<PatientDetails />} />
          <Route path="/admin/paciente/:pacienteId/ficha/nueva" element={<ClinicalIntakeWizard />} />
          <Route path="/admin/paciente/:pacienteId/ficha/:fichaId/editar" element={<ClinicalIntakeWizard />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
