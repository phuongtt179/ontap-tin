// Quy tắc đề thi. Hàm thuần: không gọi mạng, không giao diện.

/** điểm tổng 1 lượt (thang 10): đề có thực hành = lý thuyết × hệ số + thực hành × hệ số, làm tròn 1 chữ số */
export function diemTongLuot(de, luot) {
  if (!de?.has_practical) return luot.score
  return Math.round(((luot.score ?? 0) * (de.theory_weight ?? 0) / 100 + (luot.practical_score ?? 0) * (de.practical_weight ?? 0) / 100) * 10) / 10
}

/** điểm cao nhất trong các lượt ĐÃ NỘP (bỏ lượt bỏ dở, submitted_at null); chưa lượt nào nộp → null */
export function diemCaoNhat(de, cacLuot) {
  const xong = cacLuot.filter(s => s.submitted_at != null)
  return xong.length ? Math.max(...xong.map(s => diemTongLuot(de, s))) : null
}

/** test Python dùng được: có output mong đợi */
export const testHopLe = tests => tests.filter(t => String(t.expected).trim() !== '')

/** kiểm tra đề trước khi lưu → câu báo lỗi, hoặc null nếu được */
export function loiDeThi(form, tests = []) {
  if (!form.title.trim()) return 'Nhập tên đề thi'
  if (!form.question_ids.length && !form.has_practical) return 'Chưa chọn câu hỏi nào'
  if (form.has_practical && form.practical_type === 'python' && !testHopLe(tests).length) return 'Đề Python cần ít nhất 1 test có output mong đợi'
  return null
}

/** form → dữ liệu ghi vào exams. Đề chỉ có thực hành → 100% điểm thực hành; không thực hành → 100% lý thuyết */
export function duLieuDeThi(form) {
  const thucHanh = form.has_practical
  const chiThucHanh = form.question_ids.length === 0
  return {
    title: form.title.trim(),
    grade: form.grade,
    class_names: form.class_names.length > 0 ? form.class_names : null,
    time_limit: form.time_limit || null,
    max_attempts: form.max_attempts,
    is_active: form.is_active,
    show_answer: form.show_answer,
    show_score: form.show_score,
    question_ids: form.question_ids,
    has_practical: thucHanh,
    practical_type: thucHanh ? form.practical_type : null,
    practical_instructions: thucHanh ? form.practical_instructions.trim() || null : null,
    theory_weight: thucHanh ? (chiThucHanh ? 0 : form.theory_weight) : 100,
    practical_weight: thucHanh ? (chiThucHanh ? 100 : form.practical_weight) : 0,
    practical_rubric: thucHanh ? form.practical_rubric.trim() || null : null,
  }
}

/** đề hiện cho lớp đang lọc: đề không giới hạn lớp, hoặc có lớp đó trong danh sách */
export const deDanhChoLop = (de, lop) => !lop || !de.class_names?.length || de.class_names.includes(lop)
