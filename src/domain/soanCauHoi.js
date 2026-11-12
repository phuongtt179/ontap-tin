// Quy tắc soạn câu hỏi (cửa sổ thêm / sửa của giáo viên): form trống, form từ câu đã lưu, kiểm tra + dữ liệu lưu theo 8 loại.
// Hàm thuần: không gọi mạng, không giao diện (lỗi trả về dạng chữ để nơi gọi hiện thông báo).
import { splitPhrases, storedPhrases } from '../utils/wordOrder.js'

export const LOAI_CAU_HOI = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng / Sai' },
  { value: 'fill_blank', label: 'Điền từ' },
  { value: 'matching', label: 'Nối đôi' },
  { value: 'ordering', label: 'Sắp xếp' },
  { value: 'drag_word', label: 'Kéo thả từ' },
  { value: 'word_order', label: 'Sắp xếp từ' },
  { value: 'essay', label: 'Tự luận' },
]

const BON_LUA_CHON = () => ['A', 'B', 'C', 'D'].map(key => ({ key, text: '', image_url: '' }))
const CAP_TRONG = () => ({ left: '', leftImage: '', right: '', rightImage: '' })

/** form câu hỏi mới */
export function formMoi({ grade, topic, unitId } = {}) {
  return {
    type: 'multiple_choice', question: '', grade: grade || '3', topic: topic || '', unit_id: unitId || '', lesson_title_id: '',
    difficulty: 'easy', image_url: '', audio_url: '', options: BON_LUA_CHON(), correct_answer: '',
    pairs: [CAP_TRONG(), CAP_TRONG()], items: ['', '', ''], drag_answers: [''], drag_distractors: ['', ''], fill_answers: [''],
    allow_file: false, essay_max_score: 1, hint: '',
  }
}

/** form để sửa 1 câu đã lưu (mỗi loại đổi đáp án đã lưu về dạng ô nhập) */
export function formTuCauHoi(q) {
  const f = {
    ...formMoi(),
    type: q.type, question: q.question || '', grade: q.grade || '3', topic: q.topic || '', unit_id: q.unit_id || '',
    lesson_title_id: q.lesson_title_id || '', difficulty: q.difficulty || 'easy', image_url: q.image_url || '', audio_url: q.audio_url || '',
    correct_answer: q.correct_answer || '', hint: q.hint || '',
    options: q.options?.length ? q.options.map(o => ({ ...o })) : BON_LUA_CHON(),
  }
  if (q.type === 'matching' && q.options?.length) {
    f.pairs = q.options.map((o, i) => ({
      left: o.text || '', leftImage: o.image_url || '', right: q.match_options?.[i]?.text || '', rightImage: q.match_options?.[i]?.image_url || '',
    }))
  }
  if (q.type === 'ordering' && q.options?.length) f.items = q.options.map(o => o.text || '')
  if (q.type === 'drag_word') {
    const dung = (q.correct_answer || '').split(',').map(s => s.trim())
    f.drag_answers = dung.length ? dung : ['']
    const tapDung = new Set(dung)
    f.drag_distractors = q.options?.filter(o => !tapDung.has(o.text)).map(o => o.text) || ['', '']
    if (!f.drag_distractors.length) f.drag_distractors = ['', '']
  }
  if (q.type === 'word_order') {
    // câu đã lưu theo cụm → hiện lại "cụm 1 / cụm 2 / …" để giáo viên sửa được cách chia cụm
    const { chunks, distractors } = storedPhrases(q)
    if (chunks.some(c => /\s/.test(c))) f.correct_answer = chunks.join(' / ')
    f.drag_distractors = distractors.length ? distractors : ['', '']
  }
  if (q.type === 'fill_blank' && q.correct_answer) f.fill_answers = q.correct_answer.split(',').map(s => s.trim())
  if (q.type === 'essay') {
    f.allow_file = q.options?.[0]?.allow_file || false
    f.essay_max_score = q.options?.[0]?.max_score || 1
  }
  return f
}

/** số chỗ trống ___ trong đề */
export const soChoTrong = cauHoi => (cauHoi.match(/___/g) || []).length

const loi = thongBao => ({ loi: thongBao })

/** phần đáp án theo loại → { duLieu: { options?, match_options?, correct_answer } } hoặc { loi } */
export function duLieuDapAn(form) {
  const soCho = soChoTrong(form.question)
  switch (form.type) {
    case 'multiple_choice': {
      const luaChon = form.options.filter(o => o.text.trim())
      if (luaChon.length < 2) return loi('Cần ít nhất 2 đáp án')
      if (!form.correct_answer) return loi('Chọn đáp án đúng')
      return { duLieu: { options: luaChon, correct_answer: form.correct_answer } }
    }
    case 'true_false':
      if (!form.correct_answer) return loi('Chọn đáp án đúng')
      return { duLieu: { correct_answer: form.correct_answer } }
    case 'fill_blank': {
      if (soCho > 0) {
        // đủ 1 đáp án cho MỖI chỗ trống (trước 12/11 thiếu ô cuối vẫn lưu được → câu thiếu đáp án)
        const dapAn = Array.from({ length: soCho }, (_, i) => (form.fill_answers[i] || '').trim())
        if (dapAn.some(w => !w)) return loi(`Nhập đủ ${soCho} đáp án cho các chỗ trống`)
        return { duLieu: { correct_answer: dapAn.join(',') } }
      }
      if (!form.correct_answer.trim()) return loi('Nhập đáp án')
      return { duLieu: { correct_answer: form.correct_answer.trim() } }
    }
    case 'matching': {
      const cap = form.pairs.filter(p => p.left.trim() && p.right.trim())
      if (cap.length < 2) return loi('Cần ít nhất 2 cặp')
      return { duLieu: {
        options: cap.map((p, i) => ({ key: String.fromCharCode(65 + i), text: p.left, image_url: p.leftImage || '' })),
        match_options: cap.map((p, i) => ({ key: String(i + 1), text: p.right, image_url: p.rightImage || '' })),
        correct_answer: cap.map((_, i) => `${String.fromCharCode(65 + i)}-${i + 1}`).join(','),
      } }
    }
    case 'ordering': {
      const muc = form.items.filter(t => t.trim())
      if (muc.length < 2) return loi('Cần ít nhất 2 mục')
      return { duLieu: { options: muc.map((text, i) => ({ key: String(i + 1), text })), correct_answer: muc.map((_, i) => String(i + 1)).join(',') } }
    }
    case 'drag_word': {
      if (soCho === 0) return loi('Câu hỏi cần có ít nhất 1 chỗ trống ___')
      const dung = Array.from({ length: soCho }, (_, i) => (form.drag_answers[i] || '').trim())
      if (dung.some(w => !w)) return loi(`Nhập đủ ${soCho} từ đúng cho các chỗ trống`)
      const tu = [...dung, ...form.drag_distractors.map(w => w.trim()).filter(Boolean)]
      return { duLieu: { options: tu.map((text, i) => ({ key: String(i + 1), text })), correct_answer: dung.join(',') } }
    }
    case 'word_order': {
      if (!form.correct_answer.trim()) return loi('Nhập câu đúng cần sắp xếp')
      // tách theo CỤM TỪ: giáo viên chia bằng "/", không có "/" thì tự gom 2–3 tiếng / cụm
      const { sentence, chunks } = splitPhrases(form.correct_answer)
      if (chunks.length < 2) return loi('Câu phải có ít nhất 2 cụm')
      const tu = [...chunks, ...form.drag_distractors.map(w => w.trim()).filter(Boolean)]
      return { duLieu: { options: tu.map((text, i) => ({ key: String.fromCharCode(65 + i), text })), correct_answer: sentence } }
    }
    case 'essay':
      return { duLieu: {
        options: [{ allow_file: form.allow_file, max_score: Number(form.essay_max_score) || 1 }],
        correct_answer: form.correct_answer.trim() || null,
      } }
    default: return loi('Loại câu hỏi không hợp lệ')
  }
}

/** toàn bộ dữ liệu lưu vào questions → { duLieu } hoặc { loi } */
export function duLieuCauHoi(form) {
  if (!form.question.trim()) return loi('Nhập nội dung câu hỏi')
  const dapAn = duLieuDapAn(form)
  if (dapAn.loi) return dapAn
  return { duLieu: {
    type: form.type, question: form.question.trim(), grade: form.grade, topic: form.topic || null, difficulty: form.difficulty,
    image_url: form.image_url || null, audio_url: form.audio_url || null, hint: form.hint.trim() || null,
    unit_id: form.unit_id || null, lesson_title_id: form.lesson_title_id || null, ...dapAn.duLieu,
  } }
}
