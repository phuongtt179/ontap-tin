import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Tracks whether user has ever completed an auth check — prevents unnecessary
  // setLoading(true) when Supabase fires SIGNED_IN during token refresh or tab focus,
  // which would unmount ProtectedRoute children and reset all local state.
  const isAuthenticatedRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Only show loading on genuine first sign-in, not on token refresh.
        // Supabase v2 fires SIGNED_IN for both cases; the ref distinguishes them.
        if (event === 'SIGNED_IN' && !isAuthenticatedRef.current) setLoading(true)
        fetchProfile(session.user.id)
      } else {
        isAuthenticatedRef.current = false
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!data) {
      isAuthenticatedRef.current = false
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      return
    }

    if (data?.is_active === false) {
      isAuthenticatedRef.current = false
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      toast.error('Tài khoản đã bị khóa. Liên hệ giáo viên để được hỗ trợ.')
      return
    }
    if (data?.is_approved === false) {
      isAuthenticatedRef.current = false
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      toast.error('Tài khoản đang chờ giáo viên phê duyệt. Vui lòng thử lại sau.')
      return
    }

    isAuthenticatedRef.current = true
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'assistant'
  const canDelete = profile?.role === 'teacher'

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isTeacher, canDelete }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
