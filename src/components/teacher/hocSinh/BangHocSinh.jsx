// Danh sách học sinh đã duyệt: thẻ trên điện thoại, bảng trên máy tính. Mỗi em: thành tích, khoá học, sửa, xoá.
import { Trash2, UserPlus, Pencil, BarChart3 } from 'lucide-react'

const MAU_MAC_DINH = 'bg-gray-100 text-gray-600'

function NutThaoTac({ s, coQuyenXoa, onThanhTich, onGhiDanh, onSua, onXoa, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={() => onThanhTich(s)} className="text-gray-300 hover:text-violet-600 transition p-1" title="Bảng thành tích"><BarChart3 size={size} /></button>
      <button onClick={() => onGhiDanh(s)} className="text-gray-300 hover:text-green-600 transition p-1" title="Thêm vào khoá học"><UserPlus size={size} /></button>
      <button onClick={() => onSua(s)} className="text-gray-300 hover:text-indigo-500 transition p-1" title="Sửa"><Pencil size={size} /></button>
      {coQuyenXoa && <button onClick={() => onXoa(s)} className="text-gray-300 hover:text-red-500 transition p-1" title="Xóa học sinh"><Trash2 size={size} /></button>}
    </div>
  )
}

const TenDangNhap = ({ s }) => s.username
  ? <span>{s.username}<span className="text-gray-300">@school.local</span></span>
  : <span className="text-gray-300 italic">—</span>

export default function BangHocSinh({ ds, mauKhoa, coQuyenXoa, daChon, onChon, onChonHet, ...thaoTac }) {
  const chonHet = daChon.size === ds.length && ds.length > 0
  const nut = { coQuyenXoa, ...thaoTac }
  return (
    <>
      {/* điện thoại */}
      <div className="sm:hidden space-y-2">
        {ds.map(s => (
          <div key={s.id} className={`bg-white border rounded-xl p-3 ${daChon.has(s.id) ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start gap-2">
              {coQuyenXoa && (
                <input type="checkbox" checked={daChon.has(s.id)} onChange={() => onChon(s.id)}
                  className="mt-0.5 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-gray-800 text-sm truncate">{s.full_name}</span>
                  <NutThaoTac s={s} size={14} {...nut} />
                </div>
                <p className="text-xs text-gray-400 font-mono truncate mt-0.5"><TenDangNhap s={s} /></p>
                {s.enrollments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.enrollments.map(e => (
                      <span key={e.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${mauKhoa[e.grade] || MAU_MAC_DINH}`}>
                        {e.grade}{e.class_name ? ` · ${e.class_name}` : ''}{!e.is_approved ? ' (chờ)' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* máy tính */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {coQuyenXoa && (
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={chonHet} onChange={onChonHet} className="rounded border-gray-300 text-indigo-600 cursor-pointer" />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Họ và tên</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Email đăng nhập</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Khoá học</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ca học</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {ds.map((s, i) => (
              <tr key={s.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${daChon.has(s.id) ? 'bg-red-50' : ''}`}>
                {coQuyenXoa && (
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={daChon.has(s.id)} onChange={() => onChon(s.id)} className="rounded border-gray-300 text-indigo-600 cursor-pointer" />
                  </td>
                )}
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500"><TenDangNhap s={s} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.enrollments.length > 0
                      ? s.enrollments.map(e => (
                          <span key={e.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${mauKhoa[e.grade] || MAU_MAC_DINH}`}>
                            {e.grade}{!e.is_approved && <span className="ml-1 opacity-60">(chờ)</span>}
                          </span>
                        ))
                      : <span className="text-gray-300 text-xs">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.enrollments.some(e => e.class_name)
                      ? s.enrollments.filter(e => e.class_name).map(e => (
                          <span key={e.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{e.class_name}</span>
                        ))
                      : <span className="text-gray-300 text-xs">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3"><NutThaoTac s={s} {...nut} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
