// Trang Phần thưởng (/teacher/rewards). Xử lý: hooks/usePhanThuong · các tab + form quà: components/teacher/phanThuong/.
import { Gift, Loader2, Package, Clock, Settings } from 'lucide-react'
import { useGrades } from '../../hooks/useGrades'
import { usePhanThuong } from '../../hooks/usePhanThuong'
import TabQua from '../../components/teacher/phanThuong/TabQua'
import TabYeuCau from '../../components/teacher/phanThuong/TabYeuCau'
import TabNguong from '../../components/teacher/phanThuong/TabNguong'
import FormQua from '../../components/teacher/phanThuong/FormQua'

export default function RewardsPage() {
  const { grades } = useGrades()
  const h = usePhanThuong()
  const { tab, setTab, loading, pendingCount, items } = h

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Gift size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-800">Quản lý phần thưởng</h1>
          <p className="text-sm text-gray-400">Cài đặt quà và duyệt yêu cầu đổi quà</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setTab('items')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'items' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Package size={15} className="inline mr-1.5 -mt-0.5" />
          Danh sách quà ({items.length})
        </button>
        <button onClick={() => setTab('requests')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${tab === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Clock size={15} className="inline mr-1.5 -mt-0.5" />
          Yêu cầu đổi quà
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => setTab('config')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
          <Settings size={15} className="inline mr-1.5 -mt-0.5" />
          Cài đặt ngưỡng
        </button>
      </div>

      <TabQua h={h} grades={grades} />
      <TabYeuCau h={h} />
      <TabNguong h={h} grades={grades} />
      <FormQua h={h} grades={grades} />
    </div>
  )
}
