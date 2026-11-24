// Các bài của kỳ thi nhiều bài Python (giống thi Tin học trẻ): thêm / sửa / xoá / đổi thứ tự bài, đề bài (markdown) và bộ test riêng từng bài.
// Bài lấy từ ngân hàng (bai_luyen_id) là LIÊN KẾT: đề + test sửa ở trang Ngân hàng bài, ở đây chỉ đặt điểm / thứ tự.
// Học sinh làm ở components/student/KyThiPython.jsx; máy chủ chấm ở api/thi-python.js (bai_id).
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2, Plus, ArrowUp, ArrowDown, Trash2, Eye, Pencil, Library } from 'lucide-react'
import { layBaiCuaKyThi, luuBaiKyThi, xoaBaiKyThi, layTestCuaBai, ghiTestCuaBai, themBaiNganHangVaoKyThi } from '../../../data/deThi'
import ChonBaiNganHang from '../nganHang/ChonBaiNganHang'
import { testHopLe } from '../../../domain/deThi'
import MarkdownContent from '../../ui/MarkdownContent'
import KhungTest from './KhungTest'

export default function BaiKyThiModal({ exam, onClose }) {
  const [cacBai, setCacBai] = useState(null)   // null = đang tải
  const [chon, setChon] = useState(null)       // id bài đang sửa, 'moi' = bài mới
  const [form, setForm] = useState({ ten: '', diem: 100, de_bai: '' })
  const [tests, setTests] = useState([])
  const [xem, setXem] = useState(false)
  const [dang, setDang] = useState(false)
  const [chonNH, setChonNH] = useState(null)   // null | 'them' | id bài trống cần thay bằng bài ngân hàng

  async function taiLai() {
    const { data } = await layBaiCuaKyThi(exam.id)
    setCacBai(data || [])
    return data || []
  }
  useEffect(() => {
    let huy = false
    layBaiCuaKyThi(exam.id).then(({ data }) => { if (!huy) setCacBai(data || []) })
    return () => { huy = true }
  }, [exam.id])

  async function moBai(b) {
    setXem(false)
    if (!b) { setChon('moi'); setForm({ ten: '', diem: 100, de_bai: '' }); setTests([]); return }
    setChon(b.id)
    setForm({ ten: b.ten, diem: Number(b.diem), de_bai: b.de_bai, lien_ket: !!b.bai_luyen_id })
    if (b.bai_luyen_id) { setTests([]); return }
    const { data } = await layTestCuaBai(b.id)
    setTests((data || []).map(t => ({ ...t, diem: Number(t.diem) })))
  }

  async function luu() {
    if (!form.ten.trim()) { toast.error('Nhập tên bài'); return }
    setDang(true)
    const thuTu = chon === 'moi' ? (cacBai.length ? Math.max(...cacBai.map(b => b.thu_tu)) + 1 : 0) : undefined
    const duLieu = { ten: form.ten.trim(), diem: Number(form.diem) || 100, de_bai: form.de_bai, ...(chon === 'moi' ? { exam_id: exam.id, thu_tu: thuTu } : {}) }
    if (form.lien_ket) {   // bài ngân hàng: chỉ đổi điểm
      const { error } = await luuBaiKyThi(chon, { diem: Number(form.diem) || 100 })
      setDang(false)
      if (error) toast.error('Lưu thất bại: ' + error.message); else { toast.success('Đã lưu điểm bài'); taiLai() }
      return
    }
    const { data, error } = await luuBaiKyThi(chon === 'moi' ? null : chon, duLieu)
    if (!error) {
      const { error: loiTest } = await ghiTestCuaBai(exam.id, data.id, testHopLe(tests))
      if (loiTest) toast.error('Đã lưu bài nhưng lưu test lỗi: ' + loiTest.message)
      else toast.success('Đã lưu bài')
      await taiLai()
      setChon(data.id)
    } else toast.error('Lưu thất bại: ' + error.message)
    setDang(false)
  }

  async function xoa(b) {
    if (!confirm(`Xoá bài "${b.ten}" cùng toàn bộ test và điểm học sinh đã làm bài này?`)) return
    const { error } = await xoaBaiKyThi(b.id)
    if (error) { toast.error('Xoá thất bại'); return }
    if (chon === b.id) setChon(null)
    taiLai()
  }

  async function nhanTuNganHang(ds) {
    const che = chonNH
    setChonNH(null)
    if (!ds.length) return
    const { error } = che === 'them'
      ? await themBaiNganHangVaoKyThi(exam.id, ds, cacBai.length ? Math.max(...cacBai.map(b => b.thu_tu)) + 1 : 0)
      : await luuBaiKyThi(che, { bai_luyen_id: ds[0].id, ten: ds[0].ten })
    if (error) { toast.error('Lỗi: ' + error.message); return }
    toast.success(che === 'them' ? `Đã thêm ${ds.length} bài từ ngân hàng` : 'Đã thay bằng bài ngân hàng')
    setChon(null); taiLai()
  }

  async function doiCho(i, j) {
    // đánh lại thứ tự 0, 1, 2, … theo danh sách sau khi đổi chỗ; chỉ ghi những bài thay đổi
    const moi = [...cacBai]
    ;[moi[i], moi[j]] = [moi[j], moi[i]]
    const loi = (await Promise.all(moi.map((b, k) => (b.thu_tu === k ? null : luuBaiKyThi(b.id, { thu_tu: k })))))
      .some(r => r?.error)
    if (loi) toast.error('Đổi thứ tự thất bại')
    taiLai()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Các bài của kỳ thi</h2>
            <p className="text-xs text-gray-500">{exam.title} · mỗi bài có đề và bộ test riêng, học sinh nộp mỗi bài tối đa 10 lần</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 grid md:grid-cols-[220px_1fr] gap-5">
          <div className="space-y-2">
            {cacBai === null && <Loader2 className="animate-spin text-gray-400" />}
            {cacBai?.map((b, i) => (
              <div key={b.id} className={`border rounded-lg px-2 py-1.5 text-sm flex items-center gap-1 ${chon === b.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                <button onClick={() => moBai(b)} className="flex-1 text-left min-w-0">
                  <span className="font-semibold">Bài {i + 1}.</span> <span className="truncate">{b.ten}</span>
                  {b.bai_luyen_id && <span className="block text-[11px] text-indigo-600">📚 bài ngân hàng</span>}
                  {!b.bai_luyen_id && !b.de_bai?.trim() && <span className="block text-[11px] text-orange-600">chưa có đề</span>}
                </button>
                <button disabled={i === 0} onClick={() => doiCho(i, i - 1)} className="text-gray-400 disabled:opacity-30" title="Lên"><ArrowUp size={13} /></button>
                <button disabled={i === cacBai.length - 1} onClick={() => doiCho(i, i + 1)} className="text-gray-400 disabled:opacity-30" title="Xuống"><ArrowDown size={13} /></button>
                <button onClick={() => xoa(b)} className="text-red-400" title="Xoá bài"><Trash2 size={13} /></button>
              </div>
            ))}
            <button onClick={() => moBai(null)} className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 border border-dashed border-indigo-300 rounded-lg py-1.5 hover:bg-indigo-50">
              <Plus size={14} /> Thêm bài
            </button>
            <button onClick={() => setChonNH('them')} className="w-full flex items-center justify-center gap-1 text-sm font-semibold text-white bg-indigo-600 rounded-lg py-1.5 hover:bg-indigo-700">
              <Library size={14} /> Thêm từ ngân hàng
            </button>
          </div>

          {chon && form.lien_ket ? (
            <div className="space-y-3">
              <p className="text-sm bg-indigo-50 text-indigo-800 rounded-lg px-3 py-2">📚 <b>{form.ten}</b> là bài trong <b>Ngân hàng bài</b> (liên kết). Muốn sửa đề hoặc test thì sửa ở trang Ngân hàng bài — mọi kỳ thi dùng bài này sẽ cùng đổi.</p>
              <label className="text-sm block w-32">Điểm bài
                <input type="number" min={1} value={form.diem} onChange={e => setForm(f => ({ ...f, diem: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </label>
              <div className="border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 max-h-80 overflow-auto"><MarkdownContent text={form.de_bai} /></div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setChon(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Đóng bài</button>
                <button onClick={luu} disabled={dang} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">Lưu điểm</button>
              </div>
            </div>
          ) : chon ? (
            <div className="space-y-3">
              {chon !== 'moi' && (
                <button onClick={() => setChonNH(chon)} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"><Library size={12} /> Thay bài này bằng một bài trong ngân hàng</button>
              )}
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <label className="text-sm">Tên bài
                  <input value={form.ten} onChange={e => setForm(f => ({ ...f, ten: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                </label>
                <label className="text-sm" title="Trọng số của bài trong kỳ thi (đề thật: mỗi bài 100)">Điểm bài
                  <input type="number" min={1} value={form.diem} onChange={e => setForm(f => ({ ...f, diem: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Đề bài (viết được markdown: **đậm**, bảng, khối ```code```)</span>
                  <button onClick={() => setXem(v => !v)} className="text-xs text-indigo-600 flex items-center gap-1">{xem ? <><Pencil size={12} /> Sửa</> : <><Eye size={12} /> Xem thử</>}</button>
                </div>
                {xem
                  ? <div className="mt-1 border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 max-h-80 overflow-auto"><MarkdownContent text={form.de_bai} /></div>
                  : <textarea value={form.de_bai} onChange={e => setForm(f => ({ ...f, de_bai: e.target.value }))} rows={12}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Nội dung đề, dữ liệu vào, kết quả, giới hạn, ví dụ…" />}
              </div>
              <KhungTest tests={tests} setTests={setTests} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setChon(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Đóng bài</button>
                <button onClick={luu} disabled={dang} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                  {dang && <Loader2 size={14} className="animate-spin" />} Lưu bài
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 self-center text-center">Chọn một bài bên trái để sửa đề và test, hoặc bấm “Thêm bài”.</p>
          )}
        </div>
      </div>
      {chonNH && <ChonBaiNganHang daCo={(cacBai || []).map(b => b.bai_luyen_id).filter(Boolean)} onChon={nhanTuNganHang} onClose={() => setChonNH(null)} />}
    </div>
  )
}
