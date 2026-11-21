// Quy tắc hộp thư giáo viên: gom tin thành cuộc trò chuyện theo học sinh, lọc, đếm chưa đọc. Hàm thuần.

/**
 * Gom tin thầy–trò + mốc giờ hỏi AI (đã xếp cũ → mới) thành cuộc trò chuyện từng em, mới hoạt động nhất lên đầu.
 * hocSinh: { id: { id, full_name, class_name } } — em không có tên → "Học sinh".
 * Mốc AI chỉ có giờ (nội dung tải riêng khi mở em đó) → đánh dấu _moc.
 */
export function gomHoiThoai(tinGiaoVien, mocAi, hocSinh = {}) {
  const ai = mocAi.map(m => ({ ...m, content: '🤖 Hỏi đáp AI', sender_role: 'student', _moc: true }))
  const ids = [...new Set([...tinGiaoVien, ...ai].map(m => m.student_id))]
  const tinTheoEm = {}; tinGiaoVien.forEach(m => { (tinTheoEm[m.student_id] ||= []).push(m) })
  const aiTheoEm = {}; ai.forEach(m => { (aiTheoEm[m.student_id] ||= []).push(m) })
  return ids.map(sid => {
    const messages = tinTheoEm[sid] || []
    const aiMessages = aiTheoEm[sid] || []
    const cuoiTin = messages[messages.length - 1]
    const cuoiAi = aiMessages[aiMessages.length - 1]
    return {
      student: hocSinh[sid] || { id: sid, full_name: 'Học sinh', class_name: '' },
      messages, aiMessages,
      lastMsg: cuoiTin || cuoiAi,
      lastAt: Math.max(cuoiTin ? +new Date(cuoiTin.created_at) : 0, cuoiAi ? +new Date(cuoiAi.created_at) : 0),
      unread: messages.filter(m => m.sender_role === 'student' && !m.is_read).length,
    }
  }).sort((a, b) => b.lastAt - a.lastAt)
}

/** thêm tin mới vào cuộc trò chuyện (bỏ tin đã có) → cuộc trò chuyện mới, hoặc chính nó nếu không có gì mới */
export function themTinMoi(hoiThoai, tinMoi) {
  const daCo = new Set(hoiThoai.messages.map(m => m.id))
  const moi = tinMoi.filter(m => !daCo.has(m.id))
  return moi.length ? { ...hoiThoai, messages: [...hoiThoai.messages, ...moi], lastMsg: moi[moi.length - 1] } : hoiThoai
}

/** bỏ 1 tin khỏi cuộc trò chuyện */
export function boTin(hoiThoai, tinId) {
  if (!hoiThoai.messages.some(m => m.id === tinId)) return hoiThoai
  const conLai = hoiThoai.messages.filter(m => m.id !== tinId)
  return { ...hoiThoai, messages: conLai, lastMsg: conLai[conLai.length - 1] || hoiThoai.lastMsg }
}

/** lọc theo tên / lớp (ô tìm), lớp, chỉ chưa đọc */
export function locHoiThoai(ds, { tim = '', lop = '', chuaDoc = false } = {}) {
  const t = tim.toLowerCase()
  return ds.filter(h => (h.student.full_name.toLowerCase().includes(t) || (h.student.class_name || '').toLowerCase().includes(t))
    && (!lop || h.student.class_name === lop) && (!chuaDoc || h.unread > 0))
}
