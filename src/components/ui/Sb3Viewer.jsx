import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { Loader2, ExternalLink } from 'lucide-react'

// Lấy giá trị từ input của block (literal hoặc sub-block menu)
function resolveInput(blocks, input) {
  if (!input) return null
  const mode = input[0]
  const inner = input[1]

  if (mode === 1) {
    if (Array.isArray(inner)) return String(inner[1] ?? '') // literal value
    if (typeof inner === 'string') {
      // sub-block (menu dropdown)
      const sub = blocks[inner]
      if (sub) {
        const firstField = Object.values(sub.fields || {})[0]
        return firstField?.[0] ?? null
      }
    }
  } else if (mode === 3) {
    if (typeof inner === 'string') {
      const sub = blocks[inner]
      if (sub) {
        const firstField = Object.values(sub.fields || {})[0]
        if (firstField?.[0]) return firstField[0]
      }
    }
    const fallback = input[2]
    if (Array.isArray(fallback)) return String(fallback[1] ?? '')
  } else if (mode === 2) {
    if (typeof inner === 'string') {
      const sub = blocks[inner]
      if (sub) {
        const firstField = Object.values(sub.fields || {})[0]
        return firstField?.[0] ?? null
      }
    }
  }
  return null
}

const STOP_VI = { all: 'tất cả', 'this script': 'kịch bản này', 'other scripts in sprite': 'kịch bản khác' }
const ROT_VI = { 'left-right': 'trái-phải', "don't rotate": 'không xoay', 'all around': 'xung quanh' }
const FB_VI = { front: 'trên cùng', back: 'sau cùng', forward: 'lên trước', backward: 'ra sau' }

function q(s) { return s ? `"${s}"` : '...' }  // quoted or placeholder
function n(s) { return s ?? '...' }              // number or placeholder

// Format block label với giá trị thực tế
function formatBlock(blocks, block) {
  const { opcode, inputs = {}, fields = {} } = block
  const v = (key) => resolveInput(blocks, inputs[key])
  const f = (key) => fields[key]?.[0] ?? null

  switch (opcode) {
    // ── Chuyển động ──
    case 'motion_movesteps':        return `Di chuyển ${n(v('STEPS'))} bước`
    case 'motion_turnright':        return `Xoay phải ${n(v('DEGREES'))} độ`
    case 'motion_turnleft':         return `Xoay trái ${n(v('DEGREES'))} độ`
    case 'motion_pointindirection': return `Đặt hướng bằng ${n(v('DIRECTION'))}`
    case 'motion_pointtowards':     return `Hướng về phía ${n(v('TOWARDS'))}`
    case 'motion_goto':             return `Đi tới ${n(v('TO'))}`
    case 'motion_gotoxy':           return `Đi tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_glideto':          return `Lướt ${n(v('SECS'))} giây tới ${n(v('TO'))}`
    case 'motion_glidesecstoxy':    return `Lướt ${n(v('SECS'))} giây tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_setx':             return `Đặt x = ${n(v('X'))}`
    case 'motion_sety':             return `Đặt y = ${n(v('Y'))}`
    case 'motion_changexby':        return `Thay đổi x ${n(v('DX'))}`
    case 'motion_changeyby':        return `Thay đổi y ${n(v('DY'))}`
    case 'motion_ifonedgebounce':   return 'Bật lại nếu chạm cạnh'
    case 'motion_setrotationstyle': return `Đặt kiểu xoay: ${ROT_VI[f('STYLE')] ?? f('STYLE') ?? '...'}`

    // ── Hiển thị ──
    case 'looks_say':           return `Nói ${q(v('MESSAGE'))}`
    case 'looks_sayforsecs':    return `Nói ${q(v('MESSAGE'))} trong ${n(v('SECS'))} giây`
    case 'looks_think':         return `Nghĩ ${q(v('MESSAGE'))}`
    case 'looks_thinkforsecs':  return `Nghĩ ${q(v('MESSAGE'))} trong ${n(v('SECS'))} giây`
    case 'looks_show':          return 'Hiện nhân vật'
    case 'looks_hide':          return 'Ẩn nhân vật'
    case 'looks_switchcostumeto':  return `Chuyển trang phục: ${q(v('COSTUME') ?? f('COSTUME'))}`
    case 'looks_nextcostume':      return 'Trang phục kế tiếp'
    case 'looks_switchbackdropto': return `Đổi phông nền: ${q(v('BACKDROP') ?? f('BACKDROP'))}`
    case 'looks_switchbackdroptoandwait': return `Đổi phông nền ${q(v('BACKDROP') ?? f('BACKDROP'))} và đợi`
    case 'looks_nextbackdrop':     return 'Phông nền tiếp theo'
    case 'looks_changeeffectby':   return `Thay đổi hiệu ứng ${f('EFFECT') ?? '...'} ${n(v('CHANGE'))}`
    case 'looks_seteffectto':      return `Đặt hiệu ứng ${f('EFFECT') ?? '...'} = ${n(v('VALUE'))}`
    case 'looks_cleargraphiceffects': return 'Bỏ các hiệu ứng đồ họa'
    case 'looks_changesizeby':     return `Đổi kích thước ${n(v('CHANGE'))}`
    case 'looks_setsizeto':        return `Đặt kích thước = ${n(v('SIZE'))}%`
    case 'looks_gotofrontback':    return `Đi tới lớp ${FB_VI[f('FRONT_BACK')] ?? f('FRONT_BACK') ?? '...'}`
    case 'looks_goforwardbackwardlayers': return `Đi ${FB_VI[f('FORWARD_BACKWARD')] ?? f('FORWARD_BACKWARD') ?? '...'} ${n(v('NUM'))} lớp`

    // ── Âm thanh ──
    case 'sound_play':          return `Bắt đầu âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))}`
    case 'sound_playuntildone': return `Phát âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))} đến hết`
    case 'sound_stopallsounds': return 'Ngừng mọi âm thanh'
    case 'sound_changevolumeby':return `Thay đổi âm lượng ${n(v('VOLUME'))}`
    case 'sound_setvolumeto':   return `Đặt âm lượng = ${n(v('VOLUME'))}%`
    case 'sound_changeeffectby':return `Thay đổi hiệu ứng âm thanh ${f('EFFECT') ?? '...'} ${n(v('VALUE'))}`
    case 'sound_seteffectto':   return `Đặt hiệu ứng âm thanh ${f('EFFECT') ?? '...'} = ${n(v('VALUE'))}`
    case 'sound_cleareffects':  return 'Xóa hiệu ứng âm thanh'

    // ── Điều khiển ──
    case 'control_forever':       return 'Liên tục (lặp mãi)'
    case 'control_repeat':        return `Lặp lại ${n(v('TIMES'))} lần`
    case 'control_if':            return 'Nếu ... thì'
    case 'control_if_else':       return 'Nếu ... thì ... nếu không thì'
    case 'control_wait':          return `Đợi ${n(v('DURATION'))} giây`
    case 'control_wait_until':    return 'Đợi đến khi ...'
    case 'control_repeat_until':  return 'Lặp lại cho đến khi ...'
    case 'control_while':         return 'Trong khi ...'
    case 'control_stop':          return `Dừng ${STOP_VI[f('STOP_OPTION')] ?? f('STOP_OPTION') ?? '...'}`
    case 'control_start_as_clone':   return 'Khi tôi bắt đầu là một bản sao'
    case 'control_create_clone_of':  return `Tạo bản sao của ${n(v('CLONE_OPTION') ?? f('CLONE_OPTION'))}`
    case 'control_delete_this_clone':return 'Xóa bản sao này'

    // ── Sự kiện ──
    case 'event_whenflagclicked':       return 'Khi bấm cờ xanh'
    case 'event_whenkeypressed':        return `Khi bấm phím ${q(f('KEY_OPTION'))}`
    case 'event_whenthisspriteclicked': return 'Khi bấm vào nhân vật này'
    case 'event_whenstageclicked':      return 'Khi bấm vào phông nền'
    case 'event_whenbroadcastreceived': return `Khi nhận ${q(f('BROADCAST_OPTION'))}`
    case 'event_whenbackdropswitchesto':return `Khi phông nền chuyển thành ${q(f('BACKDROP'))}`
    case 'event_whengreaterthan':       return `Khi ${f('WHENGREATERTHANMENU') ?? '...'} > ${n(v('VALUE'))}`
    case 'event_broadcast':             return `Phát tin ${q(v('BROADCAST_INPUT'))}`
    case 'event_broadcastandwait':      return `Phát tin ${q(v('BROADCAST_INPUT'))} và đợi`

    // ── Cảm biến ──
    case 'sensing_touchingobject':  return `Đang chạm ${n(v('TOUCHINGOBJECTMENU') ?? f('TOUCHINGOBJECTMENU'))}?`
    case 'sensing_touchingcolor':   return 'Đang chạm màu?'
    case 'sensing_distanceto':      return `Khoảng cách đến ${n(v('DISTANCETOMENU') ?? f('DISTANCETOMENU'))}`
    case 'sensing_askandwait':      return `Hỏi ${q(v('QUESTION'))} và đợi`
    case 'sensing_keypressed':      return `Phím ${q(f('KEY_OPTION'))} được bấm?`
    case 'sensing_mousedown':       return 'Chuột được nhấn?'
    case 'sensing_setdragmode':     return `Đặt chế độ kéo: ${f('DRAG_MODE') ?? '...'}`
    case 'sensing_resettimer':      return 'Đặt lại đồng hồ bấm giờ'

    // ── Biến số ──
    case 'data_setvariableto':    return `Đặt ${q(f('VARIABLE'))} = ${n(v('VALUE'))}`
    case 'data_changevariableby': return `Thay đổi ${q(f('VARIABLE'))} thêm ${n(v('VALUE'))}`
    case 'data_showvariable':     return `Hiện biến ${q(f('VARIABLE'))}`
    case 'data_hidevariable':     return `Ẩn biến ${q(f('VARIABLE'))}`
    case 'data_addtolist':        return `Thêm ${n(v('ITEM'))} vào ${q(f('LIST'))}`
    case 'data_deleteoflist':     return `Xóa phần tử ${n(v('INDEX'))} của ${q(f('LIST'))}`
    case 'data_deletealloflist':  return `Xóa tất cả trong ${q(f('LIST'))}`
    case 'data_insertatlist':     return `Chèn ${n(v('ITEM'))} tại vị trí ${n(v('INDEX'))} của ${q(f('LIST'))}`
    case 'data_replaceitemoflist':return `Thay phần tử ${n(v('INDEX'))} của ${q(f('LIST'))} bằng ${n(v('ITEM'))}`
    case 'data_showlist':         return `Hiện danh sách ${q(f('LIST'))}`
    case 'data_hidelist':         return `Ẩn danh sách ${q(f('LIST'))}`

    // ── Bút vẽ (pen) ──
    case 'pen_clear':            return 'Xóa bút'
    case 'pen_stamp':            return 'Đóng dấu'
    case 'pen_penDown':          return 'Hạ bút'
    case 'pen_penUp':            return 'Nâng bút'
    case 'pen_setPenColorToColor': return 'Đặt màu bút'
    case 'pen_changePenSizeBy':  return `Thay đổi kích thước bút ${n(v('SIZE'))}`
    case 'pen_setPenSizeTo':     return `Đặt kích thước bút = ${n(v('SIZE'))}`

    // ── Khối của tôi ──
    case 'procedures_definition': return 'Định nghĩa hàm'
    case 'procedures_call': {
      const procCode = block.mutation?.proccode ?? ''
      const name = procCode.replace(/%[bns]/g, '(...)').trim()
      return `Gọi: ${name || '...'}`
    }

    default: {
      // fallback: tên tiếng Anh dạng readable
      return opcode.split('_').slice(1).join(' ')
    }
  }
}

const HAT_OPCODES = new Set([
  'event_whenflagclicked', 'event_whenkeypressed', 'event_whenthisspriteclicked',
  'event_whenstageclicked', 'event_whenbroadcastreceived', 'event_whenbackdropswitchesto',
  'event_whengreaterthan', 'control_start_as_clone', 'procedures_definition',
])

const HAT_COLORS = {
  event_whenflagclicked:        'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenkeypressed:         'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenthisspriteclicked:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenstageclicked:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whenbroadcastreceived:  'bg-orange-100 text-orange-800 border-orange-200',
  event_whenbackdropswitchesto: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  event_whengreaterthan:        'bg-yellow-100 text-yellow-800 border-yellow-200',
  control_start_as_clone:       'bg-amber-100 text-amber-800 border-amber-200',
  procedures_definition:        'bg-red-100 text-red-700 border-red-200',
}

const CATEGORY_COLOR = {
  event:       'text-yellow-500',
  control:     'text-amber-500',
  motion:      'text-blue-500',
  looks:       'text-purple-500',
  sound:       'text-pink-500',
  sensing:     'text-cyan-500',
  data:        'text-orange-500',
  pen:         'text-teal-500',
  procedures:  'text-red-500',
}

function getCategoryColor(opcode) {
  return CATEGORY_COLOR[opcode.split('_')[0]] || 'text-gray-400'
}

function getChain(blocks, startId, maxLen = 12) {
  const chain = []
  let id = startId
  const visited = new Set()
  while (id && chain.length < maxLen && !visited.has(id)) {
    visited.add(id)
    const b = blocks[id]
    if (!b) break
    chain.push({ id, block: b })
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
                    const chain = getChain(target.blocks, hatId)
                    const total = chainLength(target.blocks, hatId)
                    const hatBlock = target.blocks[hatId]
                    const hatColor = HAT_COLORS[hatBlock?.opcode] || 'bg-gray-100 text-gray-700 border-gray-200'

                    return (
                      <div key={hatId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {chain.map(({ id, block }, idx) => {
                          const isHat = idx === 0 && HAT_OPCODES.has(block.opcode)
                          const label = formatBlock(target.blocks, block)
                          return (
                            <div key={id}
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-50 last:border-0
                                ${isHat ? hatColor + ' font-semibold border-b' : 'text-gray-700'}`}>
                              <span className={`shrink-0 text-[13px] ${isHat ? '' : getCategoryColor(block.opcode)}`}>
                                {isHat ? '⚑' : '└'}
                              </span>
                              <span className="flex-1">{label}</span>
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
