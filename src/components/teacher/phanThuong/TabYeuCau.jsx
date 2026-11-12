// Phần thưởng — tab yêu cầu đổi quà: lọc trạng thái, xếp cột, trao / từ chối (hoàn sticker).
import { CheckCircle, X, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

function SortTh({ label, col, sortBy, sortAsc, onSort }) {
  const active = sortBy === col
  return (
    <th className="px-4 py-3 text-left">
      <button onClick={() => onSort(col)}
        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 transition group">
        {label}
        {active
          ? sortAsc ? <ChevronUp size={13} className="text-indigo-500" /> : <ChevronDown size={13} className="text-indigo-500" />
          : <ChevronsUpDown size={12} className="text-gray-300 group-hover:text-indigo-400" />}
      </button>
    </th>
  )
}

export default function TabYeuCau({ h }) {
  const { tab, requests, fulfilling, filterStatus, setFilterStatus, sortBy, sortAsc, fulfillRequest, cancelRequest, toggleSort, filteredReqs } = h
  return (
    <>
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'pending', label: '⏳ Chờ trao' },
              { key: 'fulfilled', label: '✅ Đã trao' },
              { key: 'cancelled', label: '✕ Từ chối' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterStatus === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                {label}
                <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full">
                  {requests.filter(r => r.status === key).length}
                </span>
              </button>
            ))}
          </div>

          {filteredReqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
              <div className="text-4xl mb-2">{filterStatus === 'pending' ? '✨' : filterStatus === 'fulfilled' ? '🎉' : '📭'}</div>
              <p className="text-gray-400 text-sm font-medium">
                {filterStatus === 'pending' ? 'Không có yêu cầu nào đang chờ' : filterStatus === 'fulfilled' ? 'Chưa có quà nào được trao' : 'Không có yêu cầu bị từ chối'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-bold text-gray-500 text-xs w-8">#</th>
                      <SortTh label="Học sinh" col="student" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <SortTh label="Lớp" col="class" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <SortTh label="Phần thưởng" col="reward" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      <th className="px-4 py-3 text-left font-bold text-gray-500 text-xs">Sticker</th>
                      <SortTh label="Ngày" col="date" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
                      {filterStatus === 'pending' && <th className="px-4 py-3 text-center font-bold text-gray-500 text-xs">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReqs.map((req, idx) => (
                      <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-300 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800">{req.profiles?.full_name || 'Học sinh'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {req.class_name
                            ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{req.class_name}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl leading-none">{req.reward_items?.emoji || '🎁'}</span>
                            <span className="font-semibold text-orange-600">{req.reward_items?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-amber-600">⭐ {req.sticker_cost}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('vi-VN')}
                          {req.fulfilled_at && (
                            <div className="text-green-500 mt-0.5">
                              Trao {new Date(req.fulfilled_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </td>
                        {filterStatus === 'pending' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => fulfillRequest(req)} disabled={fulfilling === req.id}
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50">
                                {fulfilling === req.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                Đã trao
                              </button>
                              <button onClick={() => cancelRequest(req)} disabled={fulfilling === req.id}
                                className="flex items-center gap-1 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
                                <X size={11} /> Từ chối
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                {filteredReqs.length} yêu cầu
              </div>
            </div>
          )}
        </div>
      )}

    </>
  )
}
