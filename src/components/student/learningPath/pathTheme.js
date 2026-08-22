// Map trạng thái node → màu sắc, dùng chung giữa LessonNode và LessonPath (đường nối).
// Token màu định nghĩa trong src/index.css (:root).

export const STATE_COLOR = {
  done: { from: 'var(--leaf)', to: '#059669', ring: 'var(--leaf)' },
  current: { from: 'var(--sun)', to: '#ea580c', ring: 'var(--sun)' },
  todo: { from: 'var(--grape)', to: '#5b3fe0', ring: 'var(--grape)' },
  locked: { from: 'var(--stone)', to: '#9aa7c7', ring: 'var(--stone)' },
}

export function stateLabel(state) {
  switch (state) {
    case 'done': return 'Đã hoàn thành'
    case 'current': return 'Học tiếp'
    case 'locked': return 'Chưa mở khoá'
    default: return 'Chưa hoàn thành'
  }
}
