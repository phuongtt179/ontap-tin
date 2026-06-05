import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, CheckCircle, Clock, Loader2, Users } from 'lucide-react'

export default function JoinCoursePage() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])       // khoá học
  const [classes, setClasses] = useState([])      // ca học
  const [enrollments, setEnrollments] = useState([]) // enrollment của học sinh này
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)    // class_name đang xử lý

  useEffect(() => { if (user) loadAll() }, [user?.id])

  async function loadAll() {
    setLoading(true)
    const [{ data: gradeData }, { data: classData }, { data: enrollData }] = await Promise.all([
      supabase.from('grades').select('*').order('name'),
      supabase.from('classes').select('*').order('grade').order('name'),
      supabase.from('student_enrollments').select('*').eq('user_id', user.id),
    ])
    setGrades(gradeData || [])
    setClasses(classData || [])
    setEnrollments(enrollData || [])
    setLoading(false)
  }

  async function handleJoin(grade, className) {
    setJoining(className || grade)
    const { error } = await supabase.from('student_enrollments').insert({
      user_id: user.id,
      grade,
      class_name: className || null,
      is_approved: false,
    })
    setJoining(null)
    if (error) {
      if (error.code === '23505') toast.error('Bạn đã đăng ký khoá học này rồi')
      else toast.error('Đăng ký thất bại: ' + error.message)
    } else {
      toast.success('Đã gửi yêu cầu tham gia! Chờ giáo viên duyệt.')
      loadAll()
    }
  }

  async function handleCancel(enrollmentId) {
    const { error } = await supabase.from('student_enrollments').delete().eq('id', enrollmentId)
    if (error) toast.error('Huỷ thất bại')
    else { toast('Đã huỷ yêu cầu'); loadAll() }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const enrollMap = {}
  enrollments.forEach(e => { enrollMap[e.grade] = e })

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Tham gia khoá học</h1>
      <p className="text-sm text-gray-500 mb-6">Chọn khoá học và ca học phù hợp, giáo viên sẽ duyệt yêu cầu của bạn.</p>

      {grades.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có khoá học nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grades.map(grade => {
            const gradeClasses = classes.filter(c => c.grade === grade.name)
            const enrollment = enrollMap[grade.name]

            return (
              <div key={grade.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Course header */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-500" />
                    <span className="font-semibold text-gray-800 text-sm">{grade.name}</span>
                  </div>
                  {enrollment && (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      enrollment.is_approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {enrollment.is_approved
                        ? <><CheckCircle size={11} /> Đã tham gia{enrollment.class_name ? ` · ${enrollment.class_name}` : ''}</>
                        : <><Clock size={11} /> Chờ duyệt{enrollment.class_name ? ` · ${enrollment.class_name}` : ''}</>
                      }
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {enrollment ? (
                    /* Already enrolled or pending */
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {enrollment.is_approved
                          ? 'Bạn đã tham gia khoá học này.'
                          : 'Đang chờ giáo viên duyệt yêu cầu của bạn.'}
                      </p>
                      {!enrollment.is_approved && (
                        <button
                          onClick={() => handleCancel(enrollment.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline ml-3 shrink-0"
                        >
                          Huỷ yêu cầu
                        </button>
                      )}
                    </div>
                  ) : gradeClasses.length > 0 ? (
                    /* Choose a class */
                    <div>
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <Users size={12} /> Chọn ca học:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {gradeClasses.map(cls => (
                          <button
                            key={cls.id}
                            onClick={() => handleJoin(grade.name, cls.name)}
                            disabled={!!joining}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            {joining === cls.name
                              ? <Loader2 size={13} className="animate-spin" />
                              : null}
                            Đăng ký {cls.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* No classes — join course directly */
                    <button
                      onClick={() => handleJoin(grade.name, null)}
                      disabled={!!joining}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {joining === grade.name
                        ? <Loader2 size={13} className="animate-spin" />
                        : <BookOpen size={14} />}
                      Đăng ký tham gia
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
