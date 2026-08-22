import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import { useSelectedGrade } from '../hooks/useEnrollments'

// Khoá (grade) học sinh đang chọn — dùng CHUNG giữa Layout (avatar menu) và
// LearnPage, tránh mỗi nơi tự gọi useSelectedGrade → tự fetch student_enrollments
// riêng (trước đây bị gọi 2 lần độc lập). Giáo viên/trợ giảng không cần —
// hook bên trong tự bỏ qua fetch khi userId=null.
const SelectedGradeContext = createContext(null)

export function SelectedGradeProvider({ children }) {
  const { user, isTeacher } = useAuth()
  const value = useSelectedGrade(!isTeacher ? user?.id : null)
  return (
    <SelectedGradeContext.Provider value={value}>
      {children}
    </SelectedGradeContext.Provider>
  )
}

export function useSelectedGradeContext() {
  const ctx = useContext(SelectedGradeContext)
  if (!ctx) throw new Error('useSelectedGradeContext phải dùng bên trong SelectedGradeProvider')
  return ctx
}
