import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { X, Gift, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adjustStickerCount } from '../../utils/stickerAward'

export default function RewardModal({ stickerCount, threshold, grade, onClose, onRedeemed }) {
  const { user } = useAuth()
  const [rewards, setRewards] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(false)
  const [finalCount, setFinalCount] = useState(null) // số sticker THẬT sau khi trừ (đọc lại từ DB), chỉ có sau khi đổi quà xong

  const cost = selected?.sticker_cost ?? threshold
  // Chỉ để ước lượng hiển thị TRƯỚC khi bấm đổi — dựa vào prop `stickerCount`
  // nên có thể cũ (xem handleRedeem: lúc ghi DB luôn đọc lại số THẬT, không
  // dùng số này để tính toán thật).
  const afterRedeem = stickerCount - cost

  useEffect(() => {
    setTimeout(() => setVisible(true), 30)
    loadRewards()
  }, [])

  async function loadRewards() {
    let query = supabase.from('reward_items').select('*').eq('is_active', true).order('sticker_cost')
    if (grade) {
      query = query.or(`grade.is.null,grade.eq.${grade}`)
    } else {
      query = query.is('grade', null)
    }
    const { data } = await query
    setRewards(data || [])
    setLoading(false)
  }

  async function handleRedeem() {
    if (!selected) return
    setSubmitting(true)
    try {
      // Trừ sticker theo kiểu đọc-lại-rồi-ghi-có-khoá (xem stickerAward.js) —
      // không tin prop `stickerCount` (ảnh chụp lúc mở trang, có thể đã cũ
      // nếu HS mở tab khác kiếm thêm sticker hoặc giáo viên vừa cộng/trừ
      // tay) — đây chính là nguyên nhân từng gây "mất sticker" khi trừ theo
      // kiểu ghi đè tuyệt đối bằng số cũ.
      const { data: updated, error: profErr, insufficient } = await adjustStickerCount(user.id, -cost)
      if (insufficient) { toast.error('Sticker của bạn vừa thay đổi, không đủ để đổi quà này nữa'); return }
      if (profErr) throw profErr

      const { error: reqErr } = await supabase.from('reward_requests').insert({
        student_id: user.id,
        reward_item_id: selected.id,
        sticker_cost: cost,
        status: 'pending',
      })
      if (reqErr) throw reqErr

      setFinalCount(updated.sticker_count)
      setDone(true)
      onRedeemed?.(updated.sticker_count)
    } catch (err) {
      toast.error('Có lỗi xảy ra: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300
      ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={handleClose}>

      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-400
        ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 px-6 py-4 text-white relative">
          <button onClick={handleClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={14} />
          </button>
          <div className="flex items-center gap-2">
            <Gift size={22} />
            <h2 className="text-lg font-black">Đổi phần thưởng!</h2>
          </div>
          <p className="text-sm text-white/90 mt-0.5">
            Bạn có <span className="font-black">⭐ {stickerCount}</span> sticker
            {grade && <span className="ml-1.5 bg-white/25 px-1.5 py-0.5 rounded-full text-xs font-bold">Khóa {grade}</span>}
          </p>
        </div>

        <div className="px-5 py-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-3">🎉</div>
              <h3 className="text-lg font-black text-gray-800 mb-1">Yêu cầu đã gửi!</h3>
              <p className="text-sm text-gray-500 mb-2">
                Giáo viên sẽ trao <span className="font-bold text-orange-500">{selected?.emoji} {selected?.name}</span> cho bạn trong buổi học.
              </p>
              <div className="bg-yellow-50 rounded-2xl px-4 py-3 mb-5">
                <p className="text-xs text-yellow-700">
                  ⭐ Sticker còn lại: <span className="font-black text-yellow-600">{finalCount}</span>
                </p>
              </div>
              <button onClick={handleClose}
                className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-black rounded-2xl hover:opacity-90 transition">
                Tuyệt vời! 🚀
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-orange-400" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎁</div>
              <p className="text-gray-500 text-sm">Giáo viên chưa cài quà thưởng.<br/>Hãy nhắc giáo viên thêm vào nhé!</p>
              <button onClick={handleClose} className="mt-4 px-6 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-200 transition">Đóng</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3 text-center">Chọn 1 phần thưởng bạn muốn:</p>

              <div className="grid grid-cols-3 gap-2 mb-4 max-h-72 overflow-y-auto pr-0.5">
                {rewards.map(r => {
                  const affordable = stickerCount >= r.sticker_cost
                  const isSelected = selected?.id === r.id
                  return (
                    <button key={r.id}
                      onClick={() => affordable && setSelected(r)}
                      disabled={!affordable}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-200
                        ${!affordable
                          ? 'border-gray-100 bg-gray-50 opacity-45 cursor-not-allowed grayscale'
                          : isSelected
                            ? 'border-orange-400 bg-orange-50 scale-105 shadow-md shadow-orange-100'
                            : 'border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/50'}`}>
                      {isSelected && <CheckCircle size={14} className="absolute top-1.5 right-1.5 text-orange-500" />}
                      <span className="text-3xl">{r.emoji}</span>
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2">{r.name}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full mt-0.5
                        ${affordable ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                        ⭐ {r.sticker_cost}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selected && (
                <div className="bg-gray-50 rounded-2xl px-4 py-2.5 mb-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Chi phí: <span className="font-bold text-orange-500">⭐ {cost}</span> sticker
                  </div>
                  <div className="text-xs text-gray-500">
                    Còn lại: <span className="font-bold">{afterRedeem} ⭐</span>
                  </div>
                </div>
              )}

              <button onClick={handleRedeem} disabled={!selected || submitting}
                className={`w-full py-3 rounded-2xl font-black text-base transition-all
                  ${selected
                    ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-200 hover:opacity-90 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : '🎁 Nhận phần thưởng này!'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
