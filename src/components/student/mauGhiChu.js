// Bảng màu ghi chú của học sinh (nền, viền, chấm màu).
export const COLORS = [
  { key: 'yellow',  bg: 'bg-yellow-100',  border: 'border-yellow-300',  ring: 'ring-yellow-400',  label: 'Vàng' },
  { key: 'green',   bg: 'bg-green-100',   border: 'border-green-300',   ring: 'ring-green-400',   label: 'Xanh lá' },
  { key: 'blue',    bg: 'bg-blue-100',    border: 'border-blue-300',    ring: 'ring-blue-400',    label: 'Xanh dương' },
  { key: 'pink',    bg: 'bg-pink-100',    border: 'border-pink-300',    ring: 'ring-pink-400',    label: 'Hồng' },
  { key: 'purple',  bg: 'bg-purple-100',  border: 'border-purple-300',  ring: 'ring-purple-400',  label: 'Tím' },
  { key: 'white',   bg: 'bg-white',       border: 'border-gray-300',    ring: 'ring-gray-400',    label: 'Trắng' },
]

export function colorOf(key) { return COLORS.find(c => c.key === key) || COLORS[0] }

// ── NoteModal ────────────────────────────────────────────────
