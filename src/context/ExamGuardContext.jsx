import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

// Khoá học sinh không cho rời khỏi trang khi đang làm đề thi (chuyển sang trang khác trong
// app, đăng xuất, đổi khoá...) mà không nộp bài — trước đây học sinh "đi chỗ khác quay lại"
// là được làm lại từ đầu, không hề tính là 1 lần làm bài (vì exam_sessions chỉ ghi khi nộp
// thật), khiến giới hạn "số lần làm" giáo viên đặt cho đề vô tác dụng. Mọi hành động điều
// hướng lúc đang làm đề (Layout.jsx) đều phải đi qua guardedAction() — nếu học sinh cố rời
// đi, cảnh báo rõ và NỘP BÀI với đáp án hiện có trước khi cho đi tiếp.
//
// Giới hạn: chỉ chặn được điều hướng TRONG app (đổi trang, đăng xuất...) — không thể chặn
// tuyệt đối việc đóng hẳn tab/trình duyệt (giới hạn chung của mọi web app), beforeunload chỉ
// hiện được cảnh báo mặc định của trình duyệt cho trường hợp đó.
const ExamGuardContext = createContext(null)

export function ExamGuardProvider({ children }) {
  const [guard, setGuard] = useState(null)               // { onForceSubmit } | null — chỉ để trigger re-render (Layout đọc isExamActive)
  const [pendingAction, setPendingAction] = useState(null) // () => void | null
  const [submitting, setSubmitting] = useState(false)
  // Đọc giá trị guard MỚI NHẤT trong guardedAction (callback ổn định, không phụ thuộc state)
  // mà không gọi side-effect (action điều hướng) bên trong updater của setState — updater bị
  // React 19 StrictMode gọi 2 lần lúc dev nếu không thuần, sẽ khiến điều hướng bị lặp.
  const guardRef = useRef(null)
  guardRef.current = guard

  useEffect(() => {
    if (!guard) return
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [guard])

  const startExamGuard = useCallback(onForceSubmit => setGuard({ onForceSubmit }), [])
  const endExamGuard = useCallback(() => setGuard(null), [])

  const guardedAction = useCallback(action => {
    if (!guardRef.current) { action(); return }
    setPendingAction(() => action)
  }, [])

  async function confirmLeave() {
    setSubmitting(true)
    try { await guard?.onForceSubmit?.() } catch { /* vẫn cho đi tiếp dù nộp lỗi, tránh kẹt HS lại */ }
    setSubmitting(false)
    setGuard(null)
    pendingAction?.()
    setPendingAction(null)
  }
  function cancelLeave() { setPendingAction(null) }

  return (
    <ExamGuardContext.Provider value={{ isExamActive: !!guard, startExamGuard, endExamGuard, guardedAction }}>
      {children}
      {pendingAction && (
        <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Rời khỏi bài thi?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Bạn đang làm đề thi. Nếu rời đi bây giờ, bài làm sẽ được <b>nộp ngay với đáp án hiện có</b> và tính là 1 lần làm bài — không thể quay lại làm tiếp lần này.
            </p>
            <div className="flex gap-2">
              <button onClick={cancelLeave} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition">
                Tiếp tục làm bài
              </button>
              <button onClick={confirmLeave} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition">
                {submitting ? 'Đang nộp...' : 'Nộp bài và rời đi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ExamGuardContext.Provider>
  )
}

export function useExamGuard() {
  const ctx = useContext(ExamGuardContext)
  if (!ctx) throw new Error('useExamGuard phải dùng bên trong ExamGuardProvider')
  return ctx
}
