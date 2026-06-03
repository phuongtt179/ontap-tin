import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Chỉ show loading spinner khi đăng nhập lần đầu, không show khi token tự refresh
        if (event === 'SIGNED_IN') setLoading(true)
        fetchProfile(session.user.id)
      } else {
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
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      return
    }

    if (data?.is_active === false) {
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      toast.error('Tài khoản đã bị khóa. Liên hệ giáo viên để được hỗ trợ.')
      return
    }
    if (data?.is_approved === false) {
      await supabase.auth.signOut()
      setProfile(null)
      setLoading(false)
      toast.error('Tài khoản đang chờ giáo viên phê duyệt. Vui lòng thử lại sau.')
      return
    }

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
