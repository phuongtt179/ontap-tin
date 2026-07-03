// Extracted from Sb3Viewer.jsx — generate plain text summary of a Scratch project for AI grading

function resolveInput(blocks, input) {
  if (!input) return null
  const mode = input[0]
  const inner = input[1]
  if (mode === 1) {
    if (Array.isArray(inner)) return String(inner[1] ?? '')
    if (typeof inner === 'string') {
      const sub = blocks[inner]
      if (sub) return Object.values(sub.fields || {})[0]?.[0] ?? null
    }
  } else if (mode === 3) {
    if (typeof inner === 'string') {
      const sub = blocks[inner]
      if (sub) { const f = Object.values(sub.fields || {})[0]; if (f?.[0]) return f[0] }
    }
    const fallback = input[2]
    if (Array.isArray(fallback)) return String(fallback[1] ?? '')
  } else if (mode === 2) {
    if (typeof inner === 'string') {
      const sub = blocks[inner]
      if (sub) return Object.values(sub.fields || {})[0]?.[0] ?? null
    }
  }
  return null
}

function formatBlock(blocks, block) {
  const { opcode, inputs = {}, fields = {} } = block
  const v = k => resolveInput(blocks, inputs[k])
  const f = k => fields[k]?.[0] ?? null
  const q = s => s ? `"${s}"` : '...'
  const n = s => s ?? '...'

  switch (opcode) {
    case 'motion_movesteps':        return `Di chuyển ${n(v('STEPS'))} bước`
    case 'motion_turnright':        return `Xoay phải ${n(v('DEGREES'))} độ`
    case 'motion_turnleft':         return `Xoay trái ${n(v('DEGREES'))} độ`
    case 'motion_gotoxy':           return `Đi tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_glidesecstoxy':    return `Lướt ${n(v('SECS'))} giây tới x:${n(v('X'))} y:${n(v('Y'))}`
    case 'motion_setx':             return `Đặt x = ${n(v('X'))}`
    case 'motion_sety':             return `Đặt y = ${n(v('Y'))}`
    case 'motion_changexby':        return `Thay đổi x ${n(v('DX'))}`
    case 'motion_changeyby':        return `Thay đổi y ${n(v('DY'))}`
    case 'motion_ifonedgebounce':   return 'Bật lại nếu chạm cạnh'
    case 'motion_pointindirection': return `Đặt hướng bằng ${n(v('DIRECTION'))}`
    case 'looks_say':               return `Nói ${q(v('MESSAGE'))}`
    case 'looks_sayforsecs':        return `Nói ${q(v('MESSAGE'))} trong ${n(v('SECS'))} giây`
    case 'looks_think':             return `Nghĩ ${q(v('MESSAGE'))}`
    case 'looks_show':              return 'Hiện nhân vật'
    case 'looks_hide':              return 'Ẩn nhân vật'
    case 'looks_switchcostumeto':   return `Chuyển trang phục: ${q(v('COSTUME') ?? f('COSTUME'))}`
    case 'looks_nextcostume':       return 'Trang phục kế tiếp'
    case 'looks_switchbackdropto':  return `Đổi phông nền: ${q(v('BACKDROP') ?? f('BACKDROP'))}`
    case 'looks_setsizeto':         return `Đặt kích thước = ${n(v('SIZE'))}%`
    case 'looks_changesizeby':      return `Đổi kích thước ${n(v('CHANGE'))}`
    case 'sound_play':              return `Bắt đầu âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))}`
    case 'sound_playuntildone':     return `Phát âm thanh ${q(v('SOUND_MENU') ?? f('SOUND_MENU'))} đến hết`
    case 'sound_stopallsounds':     return 'Ngừng mọi âm thanh'
    case 'control_forever':         return 'Lặp mãi'
    case 'control_repeat':          return `Lặp lại ${n(v('TIMES'))} lần`
    case 'control_if':              return `Nếu [${n(v('CONDITION'))}] thì`
    case 'control_if_else':         return `Nếu [${n(v('CONDITION'))}] thì ... nếu không thì`
    case 'control_wait':            return `Đợi ${n(v('DURATION'))} giây`
    case 'control_wait_until':      return `Đợi đến khi [${n(v('CONDITION'))}]`
    case 'control_repeat_until':    return `Lặp lại cho đến khi [${n(v('CONDITION'))}]`
    case 'control_stop':            return `Dừng ${f('STOP_OPTION') ?? '...'}`
    case 'control_create_clone_of': return `Tạo bản sao của ${n(v('CLONE_OPTION') ?? f('CLONE_OPTION'))}`
    case 'control_delete_this_clone': return 'Xóa bản sao này'
    case 'event_whenflagclicked':   return 'Khi bấm cờ xanh'
    case 'event_whenkeypressed':    return `Khi bấm phím ${q(f('KEY_OPTION'))}`
    case 'event_whenthisspriteclicked': return 'Khi bấm vào nhân vật này'
    case 'event_whenbroadcastreceived': return `Khi nhận ${q(f('BROADCAST_OPTION'))}`
    case 'event_broadcast':         return `Phát tin ${q(v('BROADCAST_INPUT'))}`
    case 'event_broadcastandwait':  return `Phát tin ${q(v('BROADCAST_INPUT'))} và đợi`
    case 'sensing_touchingobject':  return `chạm ${n(v('TOUCHINGOBJECTMENU') ?? f('TOUCHINGOBJECTMENU'))}`
    case 'sensing_touchingcolor':   return `chạm màu`
    case 'sensing_askandwait':      return `Hỏi ${q(v('QUESTION'))} và đợi`
    case 'sensing_keypressed':      return `phím ${f('KEY_OPTION') ?? '...'} được nhấn`
    case 'sensing_mousedown':       return `chuột được nhấn`
    case 'operator_and':            return `... và ...`
    case 'operator_or':             return `... hoặc ...`
    case 'operator_not':            return `không ...`
    case 'operator_gt':             return `${n(v('OPERAND1'))} > ${n(v('OPERAND2'))}`
    case 'operator_lt':             return `${n(v('OPERAND1'))} < ${n(v('OPERAND2'))}`
    case 'operator_equals':         return `${n(v('OPERAND1'))} = ${n(v('OPERAND2'))}`
    case 'data_setvariableto':      return `Đặt ${q(f('VARIABLE'))} = ${n(v('VALUE'))}`
    case 'data_changevariableby':   return `Thay đổi ${q(f('VARIABLE'))} thêm ${n(v('VALUE'))}`
    case 'data_showvariable':       return `Hiện biến ${q(f('VARIABLE'))}`
    case 'data_hidevariable':       return `Ẩn biến ${q(f('VARIABLE'))}`
    case 'pen_clear':               return 'Xóa bút'
    case 'pen_penDown':             return 'Hạ bút'
    case 'pen_penUp':               return 'Nâng bút'
    case 'pen_setPenSizeTo':        return `Đặt kích thước bút = ${n(v('SIZE'))}`
    case 'procedures_definition':   return 'Định nghĩa hàm'
    case 'procedures_call': {
      const name = (block.mutation?.proccode ?? '').replace(/%[bns]/g, '(...)').trim()
      return `Gọi hàm: ${name || '...'}`
    }
    default: return opcode.split('_').slice(1).join(' ')
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
        const label = block.opcode === '__else__' ? '[Nếu không thì]' : formatBlock(target.blocks, block)
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
