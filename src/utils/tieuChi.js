// Tách "Tiêu chí chấm" (rubric giáo viên viết, nhiều kiểu: dòng "Tên: 1đ", bảng | Tiêu chí | Điểm |, gạch đầu dòng
// "* … **2 điểm**") thành danh sách câu tiêu chí NGUYÊN VĂN của giáo viên — bỏ phần điểm, bỏ dòng chạy thử ẩn [test:…].
// Dùng cho "Rà soát lỗi": AI chỉ phân loại đạt / chưa đạt từng câu này, học sinh thấy đúng câu của giáo viên.
// Không phụ thuộc trình duyệt (dùng chung cho api/ra-soat.js).

export const TIEU_CHI_CHUNG = 'Bài làm đáp ứng yêu cầu của đề bài'
const TOI_DA = 12

// Từ dòng này trở đi là ĐÁP ÁN / BÀI MẪU (vd bản chép khối lệnh Scratch "Nhân vật: …", "▶ …") → dừng, không lộ lời giải
const MO_DAP_AN = /^(đáp án|bài mẫu|code mẫu|mã mẫu|lời giải|tham khảo|gợi ý đáp án|nhân vật\s*:|tổng scripts|-{3,}|```|▶|└)/i
// Ghi chú dành cho người chấm, không phải tiêu chí
const GHI_CHU_CHAM = /(chấp nhận|không yêu cầu|không bắt buộc|không trừ|lưu ý|ghi chú|giáo viên)/i

export function tachTieuChi(rubric) {
  const out = []
  const coCotDiem = /tiêu chí\s+(\|\s*)?điểm/i.test(String(rubric || ''))   // bảng "Tiêu chí  Điểm" → số cuối dòng là điểm
  for (let dong of String(rubric || '').split(/\r?\n/)) {
    dong = dong.trim()
    if (!dong || /^\[test/i.test(dong)) continue
    if (MO_DAP_AN.test(dong)) break
    if (GHI_CHU_CHAM.test(dong)) continue
    if (coCotDiem) dong = dong.replace(/\s+\d+([.,]\d+)?\s*$/, '')
    if (dong.includes('|') || dong.includes('\t')) {   // dòng bảng (| hoặc Tab): lấy ô chữ dài nhất, bỏ ô STT / ô điểm
      const o = dong.split(/[|\t]/).map(c => c.trim()).filter(c => c && !/^:?-{2,}:?$/.test(c) && !/^\d+([.,]\d+)?\s*(đ|điểm)?$/i.test(c))
      if (!o.length) continue
      dong = o.reduce((a, b) => (b.length > a.length ? b : a))
    }
    dong = dong.replace(/^[^\p{L}\p{N}"'(]+/u, '')                       // bỏ emoji / gạch đầu dòng ở đầu
      .replace(/^\d+[.)]\s+/, '').replace(/\*\*/g, '').replace(/`/g, '')
    // bỏ phần điểm: ở đầu "2 điểm: …" và ở cuối ": 1đ", "(2đ)", "– 2 điểm", ": (10 điểm)"
    dong = dong.replace(/^\d+([.,]\d+)?\s*(đ|điểm)\s*[:\-–—]\s*/i, '')
      .replace(/\s*[:\-–—]?\s*\(?\s*\d+([.,]\d+)?\s*(đ|điểm)\s*\)?\s*\.?\s*$/i, '').replace(/\s*[:：]\s*$/, '').trim()
    if (dong.length < 4 || !/\p{L}{2,}\S*\s+\S*\p{L}/u.test(dong)) continue   // phải có ít nhất 2 từ (bỏ dòng toàn số / dữ liệu thử)
    if (/^(stt\b|tiêu chí|tổng|điểm|yêu cầu)/i.test(dong) && dong.length < 32) continue   // dòng tiêu đề bảng / tiêu đề mục
    out.push(dong)
  }
  return out.slice(0, TOI_DA)
}

/** tiêu chí dùng để rà soát 1 bài: từ rubric, không có thì 1 tiêu chí chung */
export function tieuChiRaSoat(task) {
  const ds = tachTieuChi(task?.rubric)
  return ds.length ? ds : [TIEU_CHI_CHUNG]
}
