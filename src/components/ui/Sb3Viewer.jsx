import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { Loader2, ExternalLink } from 'lucide-react'

// Dịch từ vi.json chính thức của Scratch (scratchfoundation/scratch-l10n)
// %1 %2 %3 là placeholder — bỏ để hiển thị gọn
const OPCODE_VI = {
  // Sự kiện
  event_whenflagclicked:      'Khi bấm cờ xanh',
  event_whenkeypressed:       'Khi bấm phím',
  event_whenthisspriteclicked:'Khi bấm vào nhân vật này',
  event_whenstageclicked:     'Khi bấm vào phông nền',
  event_whenbroadcastreceived:'Khi nhận tin nhắn',
  event_whenbackdropswitchesto:'Khi phông nền chuyển thành',
  event_whengreaterthan:      'Khi ... > ...',
  event_broadcast:            'Phát tin',
  event_broadcastandwait:     'Phát tin và đợi',
  // Điều khiển
  control_forever:            'Liên tục (lặp mãi)',
  control_repeat:             'Lặp lại ... lần',
  control_if:                 'Nếu ... thì',
  control_if_else:            'Nếu ... thì ... nếu không thì',
  control_wait:               'Đợi ... giây',
  control_wait_until:         'Đợi đến khi',
  control_repeat_until:       'Lặp lại cho đến khi',
  control_while:              'Trong khi',
  control_stop:               'Dừng lại',
  control_start_as_clone:     'Khi tôi bắt đầu là một bản sao',
  control_create_clone_of:    'Tạo bản sao của',
  control_delete_this_clone:  'Xóa bản sao này',
  // Chuyển động
  motion_movesteps:           'Di chuyển ... bước',
  motion_turnright:           'Xoay phải ... độ',
  motion_turnleft:            'Xoay trái ... độ',
  motion_pointindirection:    'Đặt hướng bằng',
  motion_pointtowards:        'Hướng về phía đối tượng',
  motion_goto:                'Đi tới',
  motion_gotoxy:              'Đi tới điểm x:... y:...',
  motion_glideto:             'Lướt ... giây tới',
  motion_glidesecstoxy:       'Lướt ... giây tới điểm x:... y:...',
  motion_setx:                'Đặt x bằng',
  motion_sety:                'Đặt y bằng',
  motion_changexby:           'Thay đổi x một lượng',
  motion_changeyby:           'Thay đổi y một lượng',
  motion_ifonedgebounce:      'Bật lại nếu chạm cạnh',
  motion_setrotationstyle:    'Đặt kiểu xoay',
  // Hiển thị
  looks_say:                  'Nói',
  looks_sayforsecs:           'Nói ... trong ... giây',
  looks_think:                'Nghĩ',
  looks_thinkforsecs:         'Nghĩ ... trong ... giây',
  looks_show:                 'Hiện nhân vật',
  looks_hide:                 'Ẩn nhân vật',
  looks_switchcostumeto:      'Chuyển sang trang phục',
  looks_nextcostume:          'Trang phục kế tiếp',
  looks_switchbackdropto:     'Đổi phông nền thành',
  looks_switchbackdroptoandwait: 'Đổi phông nền và đợi',
  looks_nextbackdrop:         'Phông nền tiếp theo',
  looks_changeeffectby:       'Thay đổi hiệu ứng một lượng',
  looks_seteffectto:          'Đặt hiệu ứng bằng',
  looks_cleargraphiceffects:  'Bỏ các hiệu ứng đồ họa',
  looks_changesizeby:         'Đổi kích thước một lượng',
  looks_setsizeto:            'Đặt kích thước thành',
  looks_gotofrontback:        'Đi tới lớp',
  looks_goforwardbackwardlayers: 'Đi tới/lùi ... lớp',
  // Âm thanh
  sound_play:                 'Bắt đầu âm thanh',
  sound_playuntildone:        'Phát âm thanh đến hết',
  sound_stopallsounds:        'Ngừng mọi âm thanh',
  sound_changevolumeby:       'Thay đổi âm lượng một lượng',
  sound_setvolumeto:          'Đặt âm lượng',
  sound_changeeffectby:       'Thay đổi hiệu ứng âm thanh',
  sound_seteffectto:          'Đặt hiệu ứng âm thanh',
  sound_cleareffects:         'Xóa hiệu ứng âm thanh',
  // Cảm biến
  sensing_touchingobject:     'Đang chạm vào?',
  sensing_touchingcolor:      'Đang chạm màu?',
  sensing_coloristouchingcolor: 'Màu ... đang chạm?',
  sensing_distanceto:         'Khoảng cách đến',
  sensing_askandwait:         'Hỏi ... và đợi',
  sensing_keypressed:         'Phím ... được bấm?',
  sensing_mousedown:          'Chuột được nhấn?',
  sensing_mousex:             'Tọa độ x con trỏ chuột',
  sensing_mousey:             'Tọa độ y con trỏ chuột',
  sensing_setdragmode:        'Đặt chế độ kéo',
  sensing_resettimer:         'Đặt lại đồng hồ bấm giờ',
  sensing_of:                 'Thuộc tính của',
  sensing_current:            'Thời gian hiện tại',
  // Biến số
  data_setvariableto:         'Đặt biến thành',
  data_changevariableby:      'Thay đổi biến một lượng',
  data_showvariable:          'Hiện biến số',
  data_hidevariable:          'Ẩn biến số',
  data_addtolist:             'Thêm phần tử vào danh sách',
  data_deleteoflist:          'Xóa phần tử của danh sách',
  data_deletealloflist:       'Xóa hết tất cả trong danh sách',
  data_insertatlist:          'Thêm phần tử tại vị trí của danh sách',
  data_replaceitemoflist:     'Thay thế phần tử của danh sách',
  data_showlist:              'Hiện danh sách',
  data_hidelist:              'Ẩn danh sách',
  // Bút vẽ (pen extension)
  pen_clear:                  'Xóa bút',
  pen_stamp:                  'Đóng dấu',
  pen_penDown:                'Hạ bút',
  pen_penUp:                  'Nâng bút',
  pen_setPenColorToColor:     'Đặt màu bút',
  pen_changePenColorParamBy:  'Thay đổi màu bút',
  pen_setPenColorParamTo:     'Đặt màu bút thành',
  pen_changePenSizeBy:        'Thay đổi kích thước bút',
  pen_setPenSizeTo:           'Đặt kích thước bút thành',
  // Khối của tôi
  procedures_definition:      'Định nghĩa hàm',
  procedures_call:            'Gọi hàm',
}

const HAT_OPCODES = new Set([
  'event_whenflagclicked', 'event_whenkeypressed', 'event_whenthisspriteclicked',
  'event_whenstageclicked', 'event_whenbroadcastreceived', 'event_whenbackdropswitchesto',
  'event_whengreaterthan', 'control_start_as_clone', 'procedures_definition',
])

const HAT_COLORS = {
  event_whenflagclicked:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenkeypressed:        'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenthisspriteclicked: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenstageclicked:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenbroadcastreceived: 'bg-orange-100 text-orange-800 border-orange-200',
  event_whenbackdropswitchesto:'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whengreaterthan:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  control_start_as_clone:      'bg-amber-100 text-amber-800 border-amber-200',
  procedures_definition:       'bg-red-100 text-red-700 border-red-200',
}

const CATEGORY_COLOR = {
  event:       'text-yellow-600',
  control:     'text-amber-600',
  motion:      'text-blue-600',
  looks:       'text-purple-600',
  sound:       'text-pink-500',
  sensing:     'text-cyan-600',
  data:        'text-orange-500',
  pen:         'text-teal-600',
  procedures:  'text-red-500',
}

function getLabel(opcode) {
  if (OPCODE_VI[opcode]) return OPCODE_VI[opcode]
  const parts = opcode.split('_')
  return parts.slice(1).join(' ')
}

function getCategoryColor(opcode) {
  const cat = opcode.split('_')[0]
  return CATEGORY_COLOR[cat] || 'text-gray-500'
}

function getChain(blocks, startId, maxLen = 12) {
  const chain = []
  let id = startId
  const visited = new Set()
  while (id && chain.length < maxLen && !visited.has(id)) {
    visited.add(id)
    const b = blocks[id]
    if (!b) break
    chain.push({ id, opcode: b.opcode })
    id = b.next
  }
  return chain
}

function chainLength(blocks, startId) {
  let count = 0, id = startId
  const visited = new Set()
  while (id && !visited.has(id)) {
    visited.add(id)
    const b = blocks[id]
    if (!b) break
    count++; id = b.next
  }
  return count
}

export default function Sb3Viewer({ url }) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [closedSprites, setClosedSprites] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        const zip = await JSZip.loadAsync(buf)
        const jsonStr = await zip.file('project.json').async('string')
        setProject(JSON.parse(jsonStr))
      } catch (e) {
        setError('Không đọc được file SB3: ' + e.message)
      }
      setLoading(false)
    }
    load()
  }, [url])

  function toggle(name) {
    setClosedSprites(prev => ({ ...prev, [name]: !prev[name] }))
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-500 py-3 px-4 bg-yellow-50 rounded-xl border border-yellow-200">
      <Loader2 size={13} className="animate-spin text-yellow-500" /> Đang phân tích file Scratch...
    </div>
  )

  if (error) return (
    <div className="text-xs text-red-500 py-2 px-3 bg-red-50 rounded-xl border border-red-200">{error}</div>
  )

  if (!project) return null

  const stage = project.targets?.find(t => t.isStage)
  const sprites = (project.targets || []).filter(t => !t.isStage)
  const allTargets = [stage, ...sprites].filter(Boolean)

  const totalScripts = allTargets.reduce((s, t) =>
    s + Object.values(t.blocks || {}).filter(b => b.topLevel).length, 0)

  return (
    <div className="rounded-xl border border-yellow-200 overflow-hidden bg-white text-sm">

      {/* Sprite list header */}
      <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
        <p className="text-[11px] font-bold text-yellow-700 mb-2">
          🎭 Nhân vật ({sprites.length}) · 📜 {totalScripts} script
        </p>
        <div className="flex flex-wrap gap-1.5">
          {stage && (
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] text-gray-500 border border-yellow-100 font-medium">🖼 Sân khấu</span>
          )}
          {sprites.map(s => (
            <span key={s.name} className="px-2.5 py-1 bg-white rounded-full text-[11px] text-gray-700 border border-yellow-100 font-semibold">🐱 {s.name}</span>
          ))}
        </div>
      </div>

      {/* Section label */}
      <div className="text-[11px] text-gray-400 font-bold px-4 py-2 bg-gray-50 border-b border-gray-100 tracking-wide">
        📜 MÃ LỆNH
      </div>

      {/* Scripts per sprite */}
      <div className="divide-y divide-gray-100">
        {allTargets.map(target => {
          const entries = Object.entries(target.blocks || {}).filter(([, b]) => b.topLevel)
          if (entries.length === 0) return null
          const isOpen = !closedSprites[target.name]

          return (
            <div key={target.name}>
              <button onClick={() => toggle(target.name)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition">
                <span className="text-sm">{target.isStage ? '🖼' : '🐱'}</span>
                <span className="font-semibold text-gray-700 flex-1 text-sm">{target.name}</span>
                <span className="text-[11px] text-gray-400">{entries.length} script</span>
                <span className="text-gray-300 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2 bg-gray-50/60">
                  {entries.map(([hatId]) => {
                    const hatBlock = target.blocks[hatId]
                    const chain = getChain(target.blocks, hatId)
                    const total = chainLength(target.blocks, hatId)
                    const hatColor = HAT_COLORS[hatBlock.opcode] || 'bg-gray-100 text-gray-700 border-gray-200'

                    return (
                      <div key={hatId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {chain.map((item, idx) => {
                          const isHat = idx === 0 && HAT_OPCODES.has(item.opcode)
                          return (
                            <div key={item.id}
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-50 last:border-0
                                ${isHat ? hatColor + ' font-semibold border-b' : 'text-gray-600'}`}>
                              <span className={`shrink-0 text-[13px] ${isHat ? '' : getCategoryColor(item.opcode)}`}>
                                {isHat ? '⚑' : '└'}
                              </span>
                              <span className="flex-1">{getLabel(item.opcode)}</span>
                              <span className="text-[9px] text-gray-300 font-mono shrink-0 hidden sm:block">
                                {item.opcode}
                              </span>
                            </div>
                          )
                        })}
                        {total > 12 && (
                          <div className="px-4 py-1.5 text-[10px] text-gray-400 italic bg-gray-50">
                            ... còn {total - 12} lệnh nữa
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* TurboWarp link */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <a href={`https://turbowarp.org/editor?project_url=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 justify-center w-full py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-700 text-xs font-semibold hover:bg-yellow-100 transition">
          <ExternalLink size={12} /> Mở trong TurboWarp để chạy chương trình
        </a>
      </div>
    </div>
  )
}
