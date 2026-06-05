import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, School, Loader2, CheckCircle, Clock, X } from 'lucide-react'

const COLOR_SCHEMES = [
  { color: 'border-blue-200 bg-blue-50',   text: 'text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  { color: 'border-green-200 bg-green-50', text: 'text-green-700',  btn: 'bg-green-600 hover:bg-green-700' },
  { color: 'border-purple-200 bg-purple-50', text: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
  { color: 'border-orange-200 bg-orange-50', text: 'text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700' },
  { color: 'border-rose-200 bg-rose-50',   text: 'text-rose-700',   btn: 'bg-rose-600 hover:bg-rose-700' },
  { color: 'border-teal-200 bg-teal-50',   text: 'text-teal-700',   btn: 'bg-teal-600 hover:bg-teal-700' },
]

export default function JoinCoursePage() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)
  const [switchingGrade, setSwitchingGrade] = useState(null) // grade đang chọn ca mới

  useEffect(() => { if (user) loadAll() }, [user?.id])

  async function loadAll() {
    setLoading(true)
    const [{ data: gradeData }, { data: classData }, { data: enrollData }] = await Promise.all([
      supabase.from('grades').select('value').order('value'),
      supabase.from('classes').select('*').order('grade').order('name'),
      supabase.from('student_enrollments').select('*').eq('user_id', user.id),
    ])
    setGrades(gradeData?.map(g => g.value) || [])
    setClasses(classData || [])
    setEnrollments(enrollData || [])
    setLoading(false)
  }

  async function handleJoin(grade, className) {
    setJoining(className || grade)
    const { error } = await supabase.from('student_enrollments').insert({
      user_id: user.id, grade,
      class_name: className || null,
      is_approved: false,
    })
    setJoining(null)
    if (error) {
      if (error.code === '23505') toast.error('Bạn đã đăng ký khoá học này rồi')
      else toast.error('Đăng ký thất bại: ' + error.message)
    } else {
      toast.success('Đã gửi yêu cầu! Chờ giáo viên duyệt.')
      loadAll()
    }
  }

  async function handleCancel(enrollmentId) {
    await supabase.from('student_enrollments').delete().eq('id', enrollmentId)
    toast('Đã huỷ yêu cầu')
    loadAll()
  }

  async function handleSwitch(enrollmentId, newClassName) {
    setJoining(newClassName)
    const { error } = await supabase.from('student_enrollments')
      .update({ class_name: newClassName, is_approved: false })
      .eq('id', enrollmentId)
    setJoining(null)
    setSwitchingGrade(null)
    if (error) toast.error('Đổi ca thất bại: ' + error.message)
    else { toast.success(`Đã đổi sang ${newClassName}, chờ giáo viên duyệt lại`); loadAll() }
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
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tham gia khoá học</h1>
        <p className="text-gray-400 text-sm mt-0.5">Chọn khoá học và ca học phù hợp, giáo viên sẽ duyệt yêu cầu</p>
      </div>

      {grades.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có khoá học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {grades.map((grade, i) => {
            const scheme = COLOR_SCHEMES[i % COLOR_SCHEMES.length]
            const gradeClasses = classes.filter(c => c.grade === grade)
            const enrollment = enrollMap[grade]

            return (
              <div key={grade} className={`border-2 rounded-2xl p-6 ${scheme.color}`}>
                {/* Tên khoá học */}
                <div className={`text-2xl font-black mb-5 ${scheme.text}`}>{grade}</div>

                {/* Stats */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                    <School size={18} className="text-gray-400" />
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{gradeClasses.length}</div>
                      <div className="text-xs text-gray-500">ca học</div>
                    </div>
                  </div>
                </div>

                {/* Trạng thái / Nút đăng ký */}
                {enrollment ? (
                  <div className="space-y-2">
                    {/* Trạng thái hiện tại */}
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-2
                      ${enrollment.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      <span className="flex items-center gap-1.5">
                        {enrollment.is_approved
                          ? <><CheckCircle size={14} /> Đã tham gia{enrollment.class_name ? ` · ${enrollment.class_name}` : ''}</>
                          : <><Clock size={14} /> Chờ duyệt{enrollment.class_name ? ` · ${enrollment.class_name}` : ''}</>
                        }
                      </span>
                      {!enrollment.is_approved && (
                        <button onClick={() => handleCancel(enrollment.id)}
                          className="shrink-0 text-amber-600 hover:text-amber-800 transition" title="Huỷ yêu cầu">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Đổi ca — chỉ hiện khi có >1 ca */}
                    {gradeClasses.length > 1 && (
                      switchingGrade === grade ? (
                        <div className="space-y-1.5">
                          <p className="text-xs text-gray-500 px-1">Chọn ca mới:</p>
                          {gradeClasses
                            .filter(cls => cls.name !== enrollment.class_name)
                            .map(cls => (
                              <button key={cls.id}
                                onClick={() => handleSwitch(enrollment.id, cls.name)}
                                disabled={!!joining}
                                className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-50">
                                {joining === cls.name && <Loader2 size={12} className="animate-spin" />}
                                Đổi sang {cls.name}
                              </button>
                            ))}
                          <button onClick={() => setSwitchingGrade(null)}
                            className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => setSwitchingGrade(grade)}
                          className="w-full text-xs text-gray-500 hover:text-indigo-600 py-1.5 rounded-lg hover:bg-white transition">
                          Đổi ca học
                        </button>
                      )
                    )}
                  </div>
                ) : gradeClasses.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {gradeClasses.map(cls => (
                      <button key={cls.id}
                        onClick={() => handleJoin(grade, cls.name)}
                        disabled={!!joining}
                        className={`flex items-center justify-center gap-2 text-white text-sm py-2.5 rounded-xl transition disabled:opacity-50 ${scheme.btn}`}>
                        {joining === cls.name && <Loader2 size={13} className="animate-spin" />}
                        Đăng ký {cls.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => handleJoin(grade, null)} disabled={!!joining}
                    className={`w-full flex items-center justify-center gap-2 text-white text-sm py-2.5 rounded-xl transition disabled:opacity-50 ${scheme.btn}`}>
                    {joining === grade ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={14} />}
                    Đăng ký tham gia
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
