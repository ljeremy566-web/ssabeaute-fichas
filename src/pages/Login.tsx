import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Logo } from '../components/ui/Logo'

export const Login = () => {
  const { session, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/admin', { replace: true })
    }
  }, [session, navigate])

  return (
    <div className="min-h-screen-safe bg-white flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 font-sans relative overflow-hidden safe-x safe-bottom">
      <div className="absolute top-0 right-0 w-64 sm:w-[480px] h-64 sm:h-[480px] bg-brand-light/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 sm:w-[320px] h-48 sm:h-[320px] bg-brand/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="w-full max-w-md mx-auto text-center animate-slide-up-fade relative z-10">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="text-sm text-muted font-medium">
          Gestión de fichas dermatocosmetológicas
        </p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto animate-slide-up-fade [animation-delay:100ms] relative z-10">
        <Card className="py-8 px-5 sm:py-10 sm:px-10">
          <p className="text-center text-sm text-muted mb-6 sm:mb-8 font-medium leading-relaxed">
            Acceso administrativo para gestionar pacientes, fichas y sesiones.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-ink hover:bg-neutral-50 rounded-xl min-h-[48px] h-12 border border-ink/15 active:scale-[0.98] transition-all duration-200 font-outfit font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Iniciar sesión con Google</span>
          </button>
        </Card>
      </div>
    </div>
  )
}
