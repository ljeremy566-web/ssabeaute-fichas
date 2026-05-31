import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/insforge'

interface AuthContextType {
  session: any
  user: any
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // getCurrentUser() automatically detects OAuth callback (insforge_code in URL)
      // and exchanges it for a session before returning the user
      const { data } = await supabase.auth.getCurrentUser()
      if (data?.user) {
        setSession({ user: data.user })
        setUser(data.user)
      }
      setLoading(false)
    }
    init()
  }, [])

  const signInWithGoogle = async () => {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: window.location.origin + '/login',
    })

    // SDK returns a URL — redirect the browser to it
    if (data?.url) {
      window.location.href = data.url
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
