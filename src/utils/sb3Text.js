// Extracted from Sb3Viewer.jsx — generate plain text summary of a Scratch project for AI grading

// Dịch giá trị menu tiếng Anh → tiếng Việt
const MENU_VI = {
  '_mouse_': 'con trỏ chuột', '_edge_': 'cạnh', '_random_': 'vị trí ngẫu nhiên',
  '_stage_': 'Sân khấu', '_myself_': 'chính mình',
}
// Dịch tên phím
const KEY_VI = {
  'right arrow': 'mũi tên phải', 'left arrow': 'mũi tên trái',
  'up arrow': 'mũi tên lên', 'down arrow': 'mũi tên xuống',
  'space': 'phím cách', 'any': 'bất kỳ', 'enter': 'enter',
}
// Dịch thuộc tính của block "... của ..." (sensing_of)
const PROP_VI = {
  'backdrop name': 'tên phông nền', 'backdrop #': 'số phông nền',
  'x position': 'tọa độ x', 'y position': 'tọa độ y', 'direction': 'hướng',
  'costume name': 'tên trang phục', 'costume #': 'số trang phục',
  'size': 'kích thước', 'volume': 'âm lượng',
}
const tr = v => (v == null ? v : (MENU_VI[v] ?? KEY_VI[v] ?? v))

// Đọc 1 input → chuỗi mô tả. Xử lý cả literal, menu, và reporter lồng nhau.
function describeInput(blocks, input) {
  if (!input) return null
  const inner = input[1]
  // shadow literal: [1, [type, value]]
  if (Array.isArray(inner)) return String(inner[1] ?? '')
  // tham chiếu block khác
  if (typeof inner === 'string') {
    const sub = blocks[inner]
    if (!sub) return null
    const rep = formatReporter(blocks, sub)
    if (rep != null) return rep
    // menu block → lấy field đầu tiên (đã dịch)
    const ff = Object.values(sub.fields || {})[0]
    return ff ? tr(ff[0]) : null
  }
  // fallback literal ở input[2]
  const fb = input[2]
  if (Array.isArray(fb)) return String(fb[1] ?? '')
  return null
}

// Định dạng block dạng reporter / boolean (điều kiện, phép toán, cảm biến...)
function formatReporter(blocks, block) {
  const { opcode, inputs = {}, fields = {} } = block
  const v = k => describeInput(blocks, inputs[k])
  const f = k => fields[k]?.[0] ?? null
  const x = s => s ?? '...'

  switch (opcode) {
    // ── Cảm biến ──
    case 'sensing_touchingobject':     return `đang chạm ${x(v('TOUCHINGOBJECTMENU'))}`
    case 'sensing_touchingcolor':      return 'đang chạm màu'
    case 'sensing_coloristouchingcolor': return 'màu đang chạm màu'
    case 'sensing_distanceto':         return `khoảng cách tới ${x(v('DISTANCETOMENU'))}`
    case 'sensing_mousedown':          return 'chuột được nhấn'
    case 'sensing_mousex':             return 'tọa độ x con trỏ chuột'
    case 'sensing_mousey':             return 'tọa độ y con trỏ chuột'
    case 'sensing_keypressed':         return `phím ${x(v('KEY_OPTION'))} được nhấn`
    case 'sensing_timer':              return 'đồng hồ bấm giờ'
    case 'sensing_of':                 return `${PROP_VI[f('PROPERTY')] ?? x(f('PROPERTY'))} của ${x(v('OBJECT'))}`
    case 'sensing_answer':             return 'câu trả lời'
    case 'sensing_username':           return 'tên đăng nhập'
    case 'sensing_loudness':           return 'độ ồn'
    case 'sensing_current':            return `${x(f('CURRENTMENU'))} hiện tại`
    // ── Phép toán ──
    case 'operator_and':    return `(${x(v('OPERAND1'))} và ${x(v('OPERAND2'))})`
    case 'operator_or':     return `(${x(v('OPERAND1'))} hoặc ${x(v('OPERAND2'))})`
    case 'operator_not':    return `không (${x(v('OPERAND'))})`
    case 'operator_gt':     return `${x(v('OPERAND1'))} > ${x(v('OPERAND2'))}`
    case 'operator_lt':     return `${x(v('OPERAND1'))} < ${x(v('OPERAND2'))}`
    case 'operator_equals': return `${x(v('OPERAND1'))} = ${x(v('OPERAND2'))}`
    case 'operator_add':      return `(${x(v('NUM1'))} + ${x(v('NUM2'))})`
    case 'operator_subtract': return `(${x(v('NUM1'))} - ${x(v('NUM2'))})`
    case 'operator_multiply': return `(${x(v('NUM1'))} × ${x(v('NUM2'))})`
    case 'operator_divide':   return `(${x(v('NUM1'))} / ${x(v('NUM2'))})`
    case 'operator_mod':      return `${x(v('NUM1'))} mod ${x(v('NUM2'))}`
    case 'operator_random':   return `số ngẫu nhiên từ ${x(v('FROM'))} đến ${x(v('TO'))}`
    case 'operator_join':     return `nối ${x(v('STRING1'))} và ${x(v('STRING2'))}`
    case 'operator_length':   return `độ dài của ${x(v('STRING'))}`
    // ── Chuyển động / hiển thị (reporter) ──
    case 'motion_xposition':  return 'tọa độ x'
    case 'motion_yposition':  return 'tọa độ y'
    case 'motion_direction':  return 'hướng'
    case 'looks_costumenumbername':  return `${f('NUMBER_NAME') === 'name' ? 'tên' : 'số'} trang phục`
    case 'looks_backdropnumbername': return `${f('NUMBER_NAME') === 'name' ? 'tên' : 'số'} phông nền`
    case 'looks_size':        return 'kích thước'
    // ── Biến / danh sách ──
    case 'data_variable':     return f('VARIABLE')
    case 'data_listcontents': return f('LIST')
    case 'data_itemoflist':   return `phần tử ${x(v('INDEX'))} của ${x(f('LIST'))}`
    case 'data_lengthoflist': return `độ dài của ${x(f('LIST'))}`
    default:
      return null   // không phải reporter đã biết → để describeInput fallback về field
  }
}

function formatBlock(blocks, block) {
  const { opcode, inputs = {}, fields = {} } = block
  const v = k => describeInput(blocks, inputs[k])
  const f = k => fields[k]?.[0] ?? null
  const q = s => s ? `"${s}"` : '...'
  const n = s => s ?? '...'
  const x = s => s ?? '...'

  switch (opcode) {
    case 'motion_movesteps':        return `Di chuyển ${n(v('STEPS'))} bước`
    case 'motion_turnright':        return `Xoay phải ${n(v('DEGREES'))} độ`
    case 'motion_turnleft':         return `Xoay trái ${n(v('DEGREES'))} độ`
    case 'motion_gotoxy':           return `Đi tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_goto':             return `Đi tới ${x(v('TO'))}`
    case 'motion_glidesecstoxy':    return `Lướt ${n(v('SECS'))} giây tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_glideto':          return `Lướt trong ${n(v('SECS'))} giây tới ${x(v('TO'))}`
    case 'motion_pointtowards':     return `Hướng về phía ${x(v('TOWARDS'))}`
    case 'motion_setx':             return `Đặt x = ${n(v('X'))}`
    case 'motion_sety':             return `Đặt y = ${n(v('Y'))}`
    case 'motion_changexby':        return `Thay đổi x ${n(v('DX'))}`
    case 'motion_changeyby':        return `Thay đổi y ${n(v('DY'))}`
    case 'motion_ifonedgebounce':   return 'Bật lại nếu chạm cạnh'
    case 'motion_pointindirection': return `Đặt hướng bằng ${n(v('DIRECTION'))}`
    case 'looks_say':               return `Nói ${q(v('MESSAGE'))}`
    case 'looks_sayforsecs':        return `Nói ${q(v('MESSAGE'))} trong ${n(v('SECS'))} giây`
    case 'looks_think':             return `Nghĩ ${q(v('MESSAGE'))}`
    case 'looks_thinkforsecs':      return `Nghĩ ${q(v('MESSAGE'))} trong ${n(v('SECS'))} giây`
    case 'looks_show':              return 'Hiện nhân vật'
    case 'looks_hide':              return 'Ẩn nhân vật'
    case 'looks_switchcostumeto':   return `Chuyển trang phục: ${q(v('COSTUME') ?? f('COSTUME'))}`
    case 'looks_nextcostume':       return 'Trang phục kế tiếp'
    case 'looks_switchbackdropto':  return `Đổi phông nền: ${q(v('BACKDROP') ?? f('BACKDROP'))}`
    case 'looks_nextbackdrop':      return 'Phông nền kế tiếp'
    case 'looks_setsizeto':         return `Đặt kích thước = ${n(v('SIZE'))}%`
    case 'looks_changesizeby':      return `Đổi kích thước ${n(v('CHANGE'))}`
    case 'sound_play':              return `Bắt đầu âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))}`
    case 'sound_playuntildone':     return `Phát âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))} đến hết`
    case 'sound_stopallsounds':     return 'Ngừng mọi âm thanh'
    case 'control_forever':         return 'Lặp mãi'
    case 'control_repeat':          return `Lặp lại ${n(v('TIMES'))} lần`
    case 'control_if':              return `Nếu <${x(v('CONDITION'))}> thì`
    case 'control_if_else':         return `Nếu <${x(v('CONDITION'))}> thì ... nếu không thì`
    case 'control_wait':            return `Đợi ${n(v('DURATION'))} giây`
    case 'control_wait_until':      return `Đợi đến khi <${x(v('CONDITION'))}>`
    case 'control_repeat_until':    return `Lặp lại cho đến khi <${x(v('CONDITION'))}>`
    case 'control_stop':            return `Dừng ${f('STOP_OPTION') ?? '...'}`
    case 'control_create_clone_of': return `Tạo bản sao của ${x(v('CLONE_OPTION') ?? f('CLONE_OPTION'))}`
    case 'control_delete_this_clone': return 'Xóa bản sao này'
    case 'event_whenflagclicked':   return 'Khi bấm cờ xanh'
    case 'event_whenkeypressed':    return `Khi bấm phím ${q(tr(f('KEY_OPTION')))}`
    case 'event_whenthisspriteclicked': return 'Khi bấm vào nhân vật này'
    case 'event_whenbackdropswitchesto': return `Khi phông nền chuyển sang ${q(f('BACKDROP'))}`
    case 'event_whenbroadcastreceived': return `Khi nhận ${q(f('BROADCAST_OPTION'))}`
    case 'event_broadcast':         return `Phát tin ${q(v('BROADCAST_INPUT'))}`
    case 'event_broadcastandwait':  return `Phát tin ${q(v('BROADCAST_INPUT'))} và đợi`
    case 'sensing_askandwait':      return `Hỏi ${q(v('QUESTION'))} và đợi`
    case 'sensing_resettimer':      return 'Đặt lại đồng hồ bấm giờ'
    case 'data_setvariableto':      return `Đặt ${q(f('VARIABLE'))} = ${n(v('VALUE'))}`
    case 'data_changevariableby':   return `Thay đổi ${q(f('VARIABLE'))} thêm ${n(v('VALUE'))}`
    case 'data_showvariable':       return `Hiện biến ${q(f('VARIABLE'))}`
    case 'data_hidevariable':       return `Ẩn biến ${q(f('VARIABLE'))}`
    case 'data_addtolist':          return `Thêm ${q(v('ITEM'))} vào ${q(f('LIST'))}`
    case 'pen_clear':               return 'Xóa bút'
    case 'pen_penDown':             return 'Hạ bút'
    case 'pen_penUp':               return 'Nâng bút'
    case 'pen_stamp':               return 'In hình'
    case 'pen_setPenSizeTo':        return `Đặt kích thước bút = ${n(v('SIZE'))}`
    case 'pen_setPenColorToColor':  return 'Đặt màu bút'
    case 'procedures_definition':   return 'Định nghĩa hàm'
    case 'procedures_call': {
      const name = (block.mutation?.proccode ?? '').replace(/%[bns]/g, '(...)').trim()
      return `Gọi hàm: ${name || '...'}`
    }
    default: {
      // reporter đứng riêng (hiếm) hoặc opcode chưa map → thử reporter, cuối cùng in tên gọn
      const rep = formatReporter(blocks, block)
      return rep ?? opcode.split('_').slice(1).join(' ')
    }
  }
}

const HAT_OPCODES = new Set([
  'event_whenflagclicked','event_whenkeypressed','event_whenthisspriteclicked',
  'event_whenstageclicked','event_whenbroadcastreceived','event_whenbackdropswitchesto',
  'event_whengreaterthan','control_start_as_clone','procedures_definition',
])

function collectChain(blocks, startId, depth = 0, visited = new Set(), result = [], maxLen = 30) {
  let id = startId
  while (id && result.length < maxLen && !visited.has(id)) {
    visited.add(id)
    const block = blocks[id]
    if (!block) break
    result.push({ block, depth })
    const substackId = block.inputs?.SUBSTACK?.[1]
    if (substackId && typeof substackId === 'string') collectChain(blocks, substackId, depth + 1, visited, result, maxLen)
    const substack2Id = block.inputs?.SUBSTACK2?.[1]
    if (substack2Id && typeof substack2Id === 'string') {
      result.push({ block: { opcode: '__else__' }, depth: depth + 1 })
      collectChain(blocks, substack2Id, depth + 1, visited, result, maxLen)
    }
    id = block.next
  }
  return result
}

export function generateSb3Text(project) {
  const stage = project.targets?.find(t => t.isStage)
  const sprites = (project.targets || []).filter(t => !t.isStage)
  const allTargets = [stage, ...sprites].filter(Boolean)

  const totalScripts = allTargets.reduce((s, t) =>
    s + Object.values(t.blocks || {}).filter(b => b.topLevel).length, 0)

  let text = `Nhân vật: ${sprites.map(s => s.name).join(', ') || 'không có'}\n`
  text += `Tổng scripts: ${totalScripts}\n\n`

  for (const target of allTargets) {
    const entries = Object.entries(target.blocks || {}).filter(([, b]) => b.topLevel)
    if (entries.length === 0) continue
    const hatEntries = entries.filter(([, b]) => HAT_OPCODES.has(b.opcode))
    const orphans = entries.filter(([, b]) => !HAT_OPCODES.has(b.opcode))

    text += `--- ${target.isStage ? 'Sân khấu' : target.name} (${entries.length} script) ---\n`

    for (const [id] of hatEntries) {
      const chain = collectChain(target.blocks, id)
      for (const { block, depth } of chain) {
        const indent = '  '.repeat(depth)
        const label = block.opcode === '__else__' ? 'Nếu không thì' : formatBlock(target.blocks, block)
        text += `${indent}${depth === 0 ? '▶' : '└'} ${label}\n`
      }
      text += '\n'
    }

    if (orphans.length > 0) {
      text += `⚠ ${orphans.length} block chưa gắn sự kiện\n\n`
    }
  }

  return text.trim()
}
