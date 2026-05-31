import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { AdminDashboard } from './pages/AdminDashboard'
import { PatientDetails } from './pages/PatientDetails'
import { PublicForm } from './pages/PublicForm'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/formulario" element={<PublicForm />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/paciente/:id" element={<PatientDetails />} />
      </Route>

      {/* Redirect root to admin or login */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
