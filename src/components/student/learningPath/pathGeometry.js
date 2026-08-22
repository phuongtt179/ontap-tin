// Hình học con đường bài học — THUẦN JS, không React, để test độc lập được.
// Con đường nằm NGANG (lò xo nằm ngang): X tăng đều theo từng bài (hướng
// cuộn ngang của trang), Y chạy theo 1 hình sin LIÊN TỤC quanh tâm dọc — chu
// kỳ sóng trải dài qua NHIỀU bài (không phải mỗi bài 1 đỉnh/đáy như bản cũ),
// nên các bài nằm rải rác dọc theo sườn sóng chứ không dồn hết vào đỉnh/đáy.
// Biên độ/chu kỳ CỐ ĐỊNH — 1 hình sin đều đặn, không random.

const NODE = 92           // đường kính node ước lượng (px)
const TOP_RESERVE = 56    // chỗ cho nhãn "🚩 Học tiếp" phía trên node current
const BOTTOM_RESERVE = 64 // chỗ cho tên bài 2 dòng phía dưới mỗi node
const PAD_RIGHT = 48
const STEP_X = 170        // khoảng cách ngang giữa 2 bài liên tiếp
const LEFT_X = 96         // vị trí bài đầu tiên
const PERIOD = STEP_X * 9 // 1 chu kỳ sóng trải qua ~9 bài — đỉnh/đáy cách xa nhau

function waveParams(containerHeight) {
  const usable = containerHeight - NODE - TOP_RESERVE - BOTTOM_RESERVE
  const amplitude = Math.max(Math.min(usable / 2, 140), 0)
  const centerY = TOP_RESERVE + NODE / 2 + amplitude
  return { amplitude, centerY }
}

/**
 * Tính toạ độ {x, y} cho `count` node trong khung CAO `containerHeight`.
 * X tăng đều theo từng bài; Y = tâm dọc + biên độ·sin(x·tần số) — 1 hình sin
 * liên tục, biên độ co theo chiều cao khung đang có (trừ chỗ dành cho
 * badge/tên bài).
 */
export function computePoints(containerHeight, count) {
  const { amplitude, centerY } = waveParams(containerHeight)
  const freq = (2 * Math.PI) / PERIOD

  return Array.from({ length: count }, (_, i) => {
    const x = LEFT_X + i * STEP_X
    return { x, y: centerY + amplitude * Math.sin((x - LEFT_X) * freq) }
  })
}

/** Chiều rộng khung path cần để chứa hết node đã tính. */
export function computeWidth(points) {
  if (!points.length) return LEFT_X + NODE + PAD_RIGHT
  const maxX = Math.max(...points.map(p => p.x))
  return maxX + NODE + PAD_RIGHT
}

/**
 * Nối các điểm bằng spline Catmull-Rom → Bezier: đi qua đúng từng điểm,
 * mượt tự nhiên theo đúng hình sin thật (khác bản cũ ép tiếp tuyến ngang tại
 * mỗi node — chỉ hợp khi node luôn nằm đúng đỉnh/đáy, nay node nằm rải rác
 * trên sườn sóng nên cần spline bám đúng đường cong hơn).
 */
export function buildPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}
