// Trình soạn bài giảng (PowerPoint trên web): kích thước trang, phông, cỡ chữ, hiệu ứng, hàm tạo trang / ô chữ.


export const SLIDE_W = 960
export const SLIDE_H = 540
export const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Verdana']
export const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72]

export const TRANSITIONS = [
  { value: 'none',  label: 'None',  icon: '▭' },
  { value: 'fade',  label: 'Fade',  icon: '◑' },
  { value: 'slide', label: 'Slide', icon: '▶' },
  { value: 'zoom',  label: 'Zoom',  icon: '⊕' },
]
export const ANIMATIONS = [
  { value: 'none',   label: 'None',   icon: '—' },
  { value: 'appear', label: 'Appear', icon: '✦' },
  { value: 'fade',   label: 'Fade In',icon: '◎' },
  { value: 'fly',    label: 'Fly In', icon: '↗' },
]

let _id = 0
export function uid() { return `el-${++_id}-${Date.now()}` }
export function newSlide() { return { id: uid(), bg: '#ffffff', transition: 'none', elements: [] } }
export function newTextEl() {
  return {
    id: uid(), type: 'text', x: 80, y: 80, w: 500, h: 120,
    content: 'Click to add text',
    animation: 'none',
    styles: { fontSize: 20, bold: false, italic: false, underline: false, color: '#000000', fontFamily: 'Arial', textAlign: 'left', bullet: false },
  }
}
