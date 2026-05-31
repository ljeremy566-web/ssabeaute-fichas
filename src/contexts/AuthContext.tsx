import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { insforge } from '../lib/insforge'

interface AuthUser {
  id: string
  email?: string
  [key: string]: unknown
}

interface AuthSession {
  user: AuthUser
}

interface AuthContextType {
  session: AuthSession | null
  user: AuthUser | null
  isStaff: boolean
  loading: boolean
  authError: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const FOCUS_REFRESH_MIN_MS = 60_000
const UNAUTHORIZED_MESSAGE = 'No tienes acceso a este sistema.'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const lastRefreshAtRef = useRef(0)

  const refreshSession = useCallback(async () => {
    const { data } = await insforge.auth.getCurrentUser()
    if (data?.user) {
      const { data: staffResult, error } = await insforge.database.rpc('is_staff')
      const staff = staffResult === true

      if (error || !staff) {
        await insforge.auth.signOut()
        setSession(null)
        setUser(null)
        setIsStaff(false)
        setAuthError(UNAUTHORIZED_MESSAGE)
        return
      }

      setSession({ user: data.user as AuthUser })
      setUser(data.user as AuthUser)
      setIsStaff(true)
      setAuthError(null)
    } else {
      setSession(null)
      setUser(null)
      setIsStaff(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await refreshSession()
      lastRefreshAtRef.current = Date.now()
      setLoading(false)
    }
    init()

    const onFocus = () => {
      const now = Date.now()
      if (now - lastRefreshAtRef.current < FOCUS_REFRESH_MIN_MS) return
      lastRefreshAtRef.current = now
      void refreshSession()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshSession])

  const signInWithGoogle = async () => {
    setAuthError(null)
    const { data, error } = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: window.location.origin + '/login',
    })

    if (error) {
      console.error('OAuth error:', error)
      setAuthError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
      return
    }

    if (data?.url) {
      window.location.href = data.url
    }
  }

  const signOut = async () => {
    await insforge.auth.signOut()
    setSession(null)
    setUser(null)
    setIsStaff(false)
    setAuthError(null)
  }

  return (
    <AuthContext.Provider
      value={{ session, user, isStaff, loading, authError, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
