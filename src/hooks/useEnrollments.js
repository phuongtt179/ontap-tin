import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Danh sách enrollment đã duyệt của học sinh
export function useEnrollments(userId) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setEnrollments([]); setLoading(false); return }
    supabase
      .from('student_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_approved', true)
      .then(({ data }) => { setEnrollments(data || []); setLoading(false) })
  }, [userId])

  return { enrollments, grades: enrollments.map(e => e.grade), loading }
}

// Enrollment + grade đang chọn (dùng cho LearnPage, PracticePage, ExamsPage)
export function useSelectedGrade(userId) {
  const { enrollments, grades, loading } = useEnrollments(userId)
  const [selectedGrade, setSelectedGrade] = useState(null)

  useEffect(() => {
    if (grades.length > 0 && !selectedGrade) setSelectedGrade(grades[0])
  }, [grades.join(',')])

  const selectedEnrollment = enrollments.find(e => e.grade === selectedGrade) || null

  return { enrollments, grades, selectedGrade, setSelectedGrade, selectedEnrollment, loading }
}
