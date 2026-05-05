import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Type, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List,
  ChevronLeft, Home, FilePlus, FolderOpen, Info, Save, Clock,
  Printer, Share2, Download, X,
} from 'lucide-react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const SLIDE_W = 960
const SLIDE_H = 540
const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Verdana']
const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72]
const TRANSITIONS = [
  { value: 'none', label: 'Không' },
  { value: 'fade', label: 'Mờ dần' },
  { value: 'slide', label: 'Trượt' },
  { value: 'zoom', label: 'Phóng to' },
]

let _id = 0
function uid() { return `el-${++_id}-${Date.now()}` }
function newSlide() { return { id: uid(), bg: '#ffffff', transition: 'none', elements: [] } }
function newTextEl() {
  return {
    id: uid(), type: 'text',
    x: 80, y: 80, w: 500, h: 120,
    content: 'Nhập văn bản ở đây',
    styles: { fontSize: 20, bold: false, italic: false, underline: false, color: '#000000', fontFamily: 'Arial', textAlign: 'left', bullet: false },
  }
}

async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  return (await res.json()).secure_url
}

/* ── Ribbon UI primitives ──────────────────────────────────────── */
function RibbonBigBtn({ onClick, disabled, title, icon: Icon, label, danger }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded min-w-[52px] h-14 text-[11px] font-medium border border-transparent transition select-none
        ${danger ? 'text-red-600 hover:bg-red-50 hover:border-red-200' : 'text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  )
}

function RibbonSmBtn({ onClick, active, disabled, title, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`w-7 h-7 flex items-center justify-center rounded border transition select-none
        ${active ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
      {children}
    </button>
  )
}

function RibbonGroup({ label, children }) {
  return (
    <div className="flex flex-col border-r border-gray-200 last:border-r-0 px-2 pb-0.5">
      <div className="flex items-center gap-1 flex-1">{children}</div>
      <div className="text-[10px] text-gray-400 text-center mt-1 leading-none">{label}</div>
    </div>
  )
}

/* ── SlideThumb ──────────────────────────────────────────────── */
function SlideThumb({ slide, index, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full rounded-lg overflow-hidden border-2 transition ${active ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
      <div className="relative w-full" style={{ paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%`, background: slide.bg }}>
        <div className="absolute inset-0 overflow-hidden">
          <div style={{ transform: `scale(${1 / 6})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H, pointerEvents: 'none' }}>
            {slide.elements.map(el => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                {el.type === 'text' ? (
                  <div style={{ fontFamily: el.styles.fontFamily, fontSize: el.styles.fontSize, fontWeight: el.styles.bold ? 'bold' : 'normal', fontStyle: el.styles.italic ? 'italic' : 'normal', textDecoration: el.styles.underline ? 'underline' : 'none', color: el.styles.color, textAlign: el.styles.textAlign, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {el.styles.bullet ? el.content.split('\n').map((l, i) => <div key={i}>• {l}</div>) : el.content}
                  </div>
                ) : (
                  <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-center text-xs py-0.5 bg-gray-100 text-gray-500">{index + 1}</div>
    </button>
  )
}

/* ── SlideCanvas ─────────────────────────────────────────────── */
function SlideCanvas({ slide, selectedId, editingId, scale, onCanvasClick, onElementMouseDown, onResizeMouseDown, onElementDblClick, onContentChange, readonly }) {
  return (
    <div className="relative overflow-hidden shadow-lg"
      style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, background: slide.bg, cursor: 'default' }}
      onClick={onCanvasClick}>
      {slide.elements.map(el => {
        const isSelected = selectedId === el.id
        const isEditing = editingId === el.id
        const textStyle = {
          fontFamily: el.styles?.fontFamily || 'Arial',
          fontSize: (el.styles?.fontSize || 20) * scale,
          fontWeight: el.styles?.bold ? 'bold' : 'normal',
          fontStyle: el.styles?.italic ? 'italic' : 'normal',
          textDecoration: el.styles?.underline ? 'underline' : 'none',
          color: el.styles?.color || '#000000',
          textAlign: el.styles?.textAlign || 'left',
        }
        return (
          <div key={el.id}
            style={{ position: 'absolute', left: el.x * scale, top: el.y * scale, width: el.w * scale, height: el.h * scale, border: isSelected ? '2px solid #3b82f6' : '2px solid transparent', cursor: readonly ? 'default' : 'move', userSelect: 'none', boxSizing: 'border-box' }}
            onMouseDown={readonly ? undefined : e => { e.stopPropagation(); onElementMouseDown(e, el.id) }}
            onDoubleClick={readonly ? undefined : e => { e.stopPropagation(); onElementDblClick(el.id) }}>
            {el.type === 'text' ? (
              isEditing ? (
                <textarea autoFocus value={el.content} onChange={e => onContentChange(el.id, e.target.value)}
                  onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                  style={{ ...textStyle, width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 4 }} />
              ) : (
                <div style={{ ...textStyle, width: '100%', height: '100%', overflow: 'hidden', padding: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {el.styles?.bullet ? el.content.split('\n').map((l, i) => <div key={i}>• {l}</div>) : el.content}
                </div>
              )
            ) : (
              <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
            )}
            {isSelected && !readonly && (
              <div style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'se-resize' }}
                onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, el.id) }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Backstage ───────────────────────────────────────────────── */
const BACKSTAGE_ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'new', label: 'Mới', icon: FilePlus },
  { id: 'open', label: 'Mở', icon: FolderOpen, disabled: true },
  null,
  { id: 'info', label: 'Thông tin', icon: Info },
  { id: 'save', label: 'Lưu', icon: Save, disabled: true },
  { id: 'saveas', label: 'Lưu thành', icon: Save, disabled: true },
  { id: 'history', label: 'Lịch sử', icon: Clock, disabled: true },
  { id: 'print', label: 'In', icon: Printer, disabled: true },
  { id: 'share', label: 'Chia sẻ', icon: Share2, disabled: true },
  { id: 'export', label: 'Xuất', icon: Download, disabled: true },
  null,
  { id: 'close', label: 'Đóng', icon: X },
]

function Backstage({ slides, onClose, onNew }) {
  const [activeItem, setActiveItem] = useState('home')

  function handleSelect(item) {
    if (item.disabled) return
    if (item.id === 'close') { onClose(); return }
    setActiveItem(item.id)
  }

  return (
    <div className="absolute inset-0 z-30 flex" style={{ background: '#fff' }}>
      {/* Left panel */}
      <div className="flex flex-col shrink-0" style={{ width: 200, background: '#832019' }}>
        {/* Back button */}
        <button type="button" onClick={onClose}
          className="flex items-center justify-center w-10 h-10 mt-1 ml-1 rounded-full text-white hover:bg-white/20 transition shrink-0">
          <ChevronLeft size={20} />
        </button>

        {/* Menu items */}
        <div className="flex flex-col mt-1">
          {BACKSTAGE_ITEMS.map((item, i) => {
            if (!item) return <div key={i} className="mx-0 my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />
            const isActive = activeItem === item.id
            return (
              <button key={item.id} type="button"
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm text-left transition
                  ${item.disabled
                    ? 'text-white/35 cursor-default'
                    : isActive
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/85 hover:bg-white/10'}`}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-10">
        {activeItem === 'home' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Trang chủ</h2>
            <p className="text-sm text-gray-500 mb-8">Bài trình chiếu của bạn</p>
            <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl max-w-sm">
              <div className="w-16 h-11 rounded border border-gray-300 bg-white flex items-center justify-center shrink-0">
                <ImageIcon size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Bài trình chiếu</p>
                <p className="text-xs text-gray-400 mt-0.5">{slides.length} slide{slides.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {activeItem === 'new' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Mới</h2>
            <p className="text-sm text-gray-500 mb-8">Tạo bài trình chiếu mới</p>
            <button type="button" onClick={() => { onNew(); onClose() }}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition w-40 group">
              <div className="w-24 h-16 bg-white border border-gray-300 rounded flex items-center justify-center group-hover:border-indigo-300">
                <FilePlus size={24} className="text-gray-400 group-hover:text-indigo-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Trình chiếu trống</span>
            </button>
            <p className="text-xs text-orange-600 mt-4">⚠ Bài trình chiếu hiện tại sẽ bị xóa</p>
          </div>
        )}

        {activeItem === 'info' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">Thông tin</h2>
            <p className="text-sm text-gray-500 mb-8">Chi tiết bài trình chiếu</p>
            <div className="space-y-3 max-w-md text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Số slide</span>
                <span className="font-medium">{slides.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tổng đối tượng</span>
                <span className="font-medium">{slides.reduce((s, sl) => s + sl.elements.length, 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kích thước slide</span>
                <span className="font-medium">960 × 540 px (16:9)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── PPTEditor ───────────────────────────────────────────────── */
export default function PPTEditor({ content, onChange, readonly = false }) {
  const initSlides = () => content?.slides?.length ? content.slides : [newSlide()]

  const [slides, setSlides] = useState(initSlides)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [showBackstage, setShowBackstage] = useState(false)

  const containerRef = useRef()
  const [scale, setScale] = useState(0.7)
  const dragRef = useRef(null)
  const imgRef = useRef()

  useEffect(() => {
    if (content?.slides?.length) { setSlides(content.slides); setCurrentIdx(0) }
  }, [])

  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const available = containerRef.current.offsetWidth - 16
        setScale(Math.min(available / SLIDE_W, 1))
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const emit = useCallback((ns) => { onChange?.({ slides: ns }) }, [onChange])

  function updateSlides(fn) {
    setSlides(prev => { const next = fn(prev); emit(next); return next })
  }
  function updateElement(slideIdx, id, patch) {
    updateSlides(prev => prev.map((s, i) =>
      i !== slideIdx ? s : { ...s, elements: s.elements.map(el => el.id !== id ? el : { ...el, ...patch }) }
    ))
  }
  function getCurrentSlide() { return slides[currentIdx] }
  function getEl(id) { return getCurrentSlide()?.elements.find(e => e.id === id) }

  function handleElementMouseDown(e, id) {
    if (editingId) return
    setSelectedId(id)
    const el = getEl(id); if (!el) return
    dragRef.current = { mode: 'move', id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.w, origH: el.h }
  }
  function handleResizeMouseDown(e, id) {
    const el = getEl(id); if (!el) return
    dragRef.current = { mode: 'resize', id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.w, origH: el.h }
  }
  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current) return
      const { mode, id, startX, startY, origX, origY, origW, origH } = dragRef.current
      const dx = (e.clientX - startX) / scale, dy = (e.clientY - startY) / scale
      if (mode === 'move') updateElement(currentIdx, id, { x: Math.max(0, Math.min(SLIDE_W - origW, origX + dx)), y: Math.max(0, Math.min(SLIDE_H - origH, origY + dy)) })
      else updateElement(currentIdx, id, { w: Math.max(80, origW + dx), h: Math.max(40, origH + dy) })
    }
    function onUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scale, currentIdx])

  function handleDblClick(id) { const el = getEl(id); if (el?.type === 'text') setEditingId(id) }
  function handleCanvasClick() { setSelectedId(null); setEditingId(null) }
  function handleContentChange(id, value) { updateElement(currentIdx, id, { content: value }) }

  function addSlide() {
    const s = newSlide()
    updateSlides(prev => { const next = [...prev]; next.splice(currentIdx + 1, 0, s); return next })
    setCurrentIdx(currentIdx + 1)
  }
  function deleteSlide() {
    if (slides.length <= 1) return
    updateSlides(prev => prev.filter((_, i) => i !== currentIdx))
    setCurrentIdx(Math.max(0, currentIdx - 1))
  }
  function addText() {
    const el = newTextEl()
    updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, elements: [...s.elements, el] }))
    setSelectedId(el.id); setActiveTab('home')
  }
  async function handleImageFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const src = await uploadImage(file)
      const el = { id: uid(), type: 'image', x: 100, y: 100, w: 300, h: 200, src }
      updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, elements: [...s.elements, el] }))
      setSelectedId(el.id)
    } catch {}
    e.target.value = ''
  }
  function deleteSelected() {
    if (!selectedId) return
    updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, elements: s.elements.filter(el => el.id !== selectedId) }))
    setSelectedId(null)
  }
  function updateStyle(key, value) {
    if (!selectedId) return
    const el = getEl(selectedId); if (el?.type !== 'text') return
    updateElement(currentIdx, selectedId, { styles: { ...el.styles, [key]: value } })
  }
  function updateSlideProps(patch) {
    updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, ...patch }))
  }
  function handleNew() {
    const s = [newSlide()]
    setSlides(s); emit(s); setCurrentIdx(0); setSelectedId(null); setEditingId(null)
  }

  const selectedEl = selectedId ? getEl(selectedId) : null
  const currentSlide = getCurrentSlide()
  const isText = selectedEl?.type === 'text'

  /* ── Readonly ── */
  if (readonly) {
    return (
      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div key={slide.id}>
            <p className="text-xs text-gray-400 mb-1">Slide {i + 1}</p>
            <div className="relative overflow-hidden shadow rounded-lg border border-gray-200" style={{ width: '100%', paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%`, background: slide.bg }}>
              <div className="absolute inset-0">
                <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative' }}>
                  {slide.elements.map(el => (
                    <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                      {el.type === 'text' ? (
                        <div style={{ fontFamily: el.styles.fontFamily, fontSize: el.styles.fontSize, fontWeight: el.styles.bold ? 'bold' : 'normal', fontStyle: el.styles.italic ? 'italic' : 'normal', textDecoration: el.styles.underline ? 'underline' : 'none', color: el.styles.color, textAlign: el.styles.textAlign, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 4 }}>
                          {el.styles.bullet ? el.content.split('\n').map((l, j) => <div key={j}>• {l}</div>) : el.content}
                        </div>
                      ) : <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ── Editor ── */
  const TABS = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'insert', label: 'Chèn' },
    { id: 'design', label: 'Thiết kế' },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm select-none" style={{ position: 'relative' }}>

      {/* ── Tab bar ── */}
      <div className="flex items-stretch" style={{ background: '#b83b2a' }}>
        {/* File button */}
        <button type="button"
          onClick={() => setShowBackstage(true)}
          className={`px-5 py-1.5 text-xs font-semibold transition
            ${showBackstage ? 'bg-[#832019] text-white' : 'text-white hover:bg-[#9e3122]'}`}
          style={{ letterSpacing: '0.02em' }}>
          Tệp
        </button>

        {/* Divider */}
        <div className="w-px my-1" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Other tabs */}
        {TABS.map(tab => (
          <button key={tab.id} type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-1.5 text-xs font-medium transition relative
              ${activeTab === tab.id
                ? 'bg-[#f3f3f3] text-[#b83b2a]'
                : 'text-white/85 hover:text-white hover:bg-white/10'}`}>
            {tab.label}
            {/* Active underline-like indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b83b2a]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Ribbon ── */}
      <div className="bg-[#f3f3f3] border-b-2 border-gray-300" style={{ minHeight: 82 }}>
        {activeTab === 'home' && (
          <div className="flex items-stretch px-1 py-1 gap-0">
            <RibbonGroup label="Slide">
              <RibbonBigBtn icon={Plus} label="Slide mới" onClick={addSlide} title="Thêm slide" />
              <RibbonBigBtn icon={Trash2} label="Xóa slide" onClick={deleteSlide} disabled={slides.length <= 1} title="Xóa slide hiện tại" danger />
            </RibbonGroup>

            <RibbonGroup label="Phông chữ">
              <div className="flex flex-col gap-1.5 py-1">
                <div className="flex gap-1 items-center">
                  <select value={isText ? selectedEl.styles.fontFamily : 'Arial'} onChange={e => updateStyle('fontFamily', e.target.value)} disabled={!isText}
                    className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[118px] disabled:opacity-50">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={isText ? selectedEl.styles.fontSize : 20} onChange={e => updateStyle('fontSize', Number(e.target.value))} disabled={!isText}
                    className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-14 disabled:opacity-50">
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-0.5 items-center">
                  <RibbonSmBtn active={isText && selectedEl.styles.bold} onClick={() => updateStyle('bold', !selectedEl?.styles.bold)} disabled={!isText} title="Đậm"><Bold size={13} /></RibbonSmBtn>
                  <RibbonSmBtn active={isText && selectedEl.styles.italic} onClick={() => updateStyle('italic', !selectedEl?.styles.italic)} disabled={!isText} title="Nghiêng"><Italic size={13} /></RibbonSmBtn>
                  <RibbonSmBtn active={isText && selectedEl.styles.underline} onClick={() => updateStyle('underline', !selectedEl?.styles.underline)} disabled={!isText} title="Gạch chân"><Underline size={13} /></RibbonSmBtn>
                  <label className={`w-7 h-7 flex flex-col items-center justify-center rounded border border-transparent hover:bg-gray-100 hover:border-gray-300 cursor-pointer ${!isText ? 'opacity-40 pointer-events-none' : ''}`} title="Màu chữ">
                    <span className="text-sm font-bold leading-none" style={{ color: selectedEl?.styles?.color || '#000' }}>A</span>
                    <span className="w-4 h-1 rounded-sm mt-0.5" style={{ background: selectedEl?.styles?.color || '#000' }} />
                    <input type="color" value={selectedEl?.styles?.color || '#000000'} onChange={e => updateStyle('color', e.target.value)} className="sr-only" />
                  </label>
                </div>
              </div>
            </RibbonGroup>

            <RibbonGroup label="Đoạn văn">
              <div className="flex flex-col gap-1.5 py-1">
                <div className="flex gap-0.5">
                  <RibbonSmBtn active={isText && selectedEl.styles.textAlign === 'left'} onClick={() => updateStyle('textAlign', 'left')} disabled={!isText} title="Căn trái"><AlignLeft size={13} /></RibbonSmBtn>
                  <RibbonSmBtn active={isText && selectedEl.styles.textAlign === 'center'} onClick={() => updateStyle('textAlign', 'center')} disabled={!isText} title="Căn giữa"><AlignCenter size={13} /></RibbonSmBtn>
                  <RibbonSmBtn active={isText && selectedEl.styles.textAlign === 'right'} onClick={() => updateStyle('textAlign', 'right')} disabled={!isText} title="Căn phải"><AlignRight size={13} /></RibbonSmBtn>
                </div>
                <div className="flex gap-0.5 items-center">
                  <RibbonSmBtn active={isText && selectedEl.styles.bullet} onClick={() => updateStyle('bullet', !selectedEl?.styles.bullet)} disabled={!isText} title="Gạch đầu dòng"><List size={13} /></RibbonSmBtn>
                  <span className="text-[10px] text-gray-400 ml-1">Danh sách</span>
                </div>
              </div>
            </RibbonGroup>

            {selectedId && (
              <RibbonGroup label="Chỉnh sửa">
                <RibbonBigBtn icon={Trash2} label="Xóa" onClick={deleteSelected} title="Xóa đối tượng đã chọn" danger />
              </RibbonGroup>
            )}
          </div>
        )}

        {activeTab === 'insert' && (
          <div className="flex items-stretch px-1 py-1 gap-0">
            <RibbonGroup label="Văn bản">
              <RibbonBigBtn icon={Type} label="Hộp text" onClick={addText} title="Thêm hộp văn bản" />
            </RibbonGroup>
            <RibbonGroup label="Hình ảnh">
              <RibbonBigBtn icon={ImageIcon} label="Ảnh" onClick={() => imgRef.current?.click()} title="Chèn ảnh từ máy tính" />
              <input ref={imgRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </RibbonGroup>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="flex items-stretch px-1 py-1 gap-0">
            <RibbonGroup label="Nền slide">
              <label className="flex flex-col items-center gap-1 px-3 py-1 h-14 justify-center rounded border border-transparent hover:bg-gray-100 hover:border-gray-300 cursor-pointer" title="Chọn màu nền slide">
                <div className="w-8 h-8 rounded border border-gray-400 shadow-sm" style={{ background: currentSlide?.bg }} />
                <span className="text-[11px] text-gray-600">Màu nền</span>
                <input type="color" value={currentSlide?.bg || '#ffffff'} onChange={e => updateSlideProps({ bg: e.target.value })} className="sr-only" />
              </label>
            </RibbonGroup>
            <RibbonGroup label="Chuyển slide">
              <div className="flex flex-col justify-center gap-1 py-1 h-14 px-1">
                <span className="text-[10px] text-gray-500">Hiệu ứng:</span>
                <select value={currentSlide?.transition || 'none'} onChange={e => updateSlideProps({ transition: e.target.value })}
                  className="text-sm border border-gray-400 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </RibbonGroup>
          </div>
        )}
      </div>

      {/* ── Main area ── */}
      <div className="flex" style={{ height: 560 }}>
        <div className="w-36 shrink-0 bg-gray-100 border-r border-gray-200 overflow-y-auto p-2 space-y-2">
          {slides.map((s, i) => (
            <SlideThumb key={s.id} slide={s} index={i} active={i === currentIdx}
              onClick={() => { setCurrentIdx(i); setSelectedId(null); setEditingId(null) }} />
          ))}
        </div>
        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-300 flex items-start justify-center p-4">
          {currentSlide && (
            <SlideCanvas slide={currentSlide} selectedId={selectedId} editingId={editingId} scale={scale}
              onCanvasClick={handleCanvasClick} onElementMouseDown={handleElementMouseDown}
              onResizeMouseDown={handleResizeMouseDown} onElementDblClick={handleDblClick}
              onContentChange={handleContentChange} readonly={readonly} />
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="px-3 py-1 bg-[#f3f3f3] border-t border-gray-300 text-[11px] text-gray-400 flex items-center justify-between">
        <span>Slide {currentIdx + 1}/{slides.length}</span>
        <span>Nhấn đúp vào text để chỉnh sửa · Kéo để di chuyển · Kéo góc dưới phải để thay đổi kích thước</span>
      </div>

      {/* ── Backstage overlay ── */}
      {showBackstage && (
        <Backstage slides={slides} onClose={() => setShowBackstage(false)} onNew={handleNew} />
      )}
    </div>
  )
}
