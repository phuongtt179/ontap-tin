import { useState, useRef, useEffect, useCallback } from 'react'

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

function newSlide() {
  return { id: uid(), bg: '#ffffff', transition: 'none', elements: [] }
}

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

function Btn({ onClick, active, title, disabled, children, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm transition select-none
        ${active ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}`}
    >
      {children}
    </button>
  )
}

function Sep() { return <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" /> }

/* ── SlideThumb ──────────────────────────────────────────────── */
function SlideThumb({ slide, index, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg overflow-hidden border-2 transition ${active ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
    >
      <div
        className="relative w-full"
        style={{ paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%`, background: slide.bg }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div style={{ transform: `scale(${1 / 6})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H, pointerEvents: 'none' }}>
            {slide.elements.map(el => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                {el.type === 'text' ? (
                  <div style={{
                    fontFamily: el.styles.fontFamily,
                    fontSize: el.styles.fontSize,
                    fontWeight: el.styles.bold ? 'bold' : 'normal',
                    fontStyle: el.styles.italic ? 'italic' : 'normal',
                    textDecoration: el.styles.underline ? 'underline' : 'none',
                    color: el.styles.color,
                    textAlign: el.styles.textAlign,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {el.styles.bullet
                      ? el.content.split('\n').map((line, i) => <div key={i}>• {line}</div>)
                      : el.content}
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
    <div
      className="relative overflow-hidden shadow-lg"
      style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, background: slide.bg, cursor: 'default' }}
      onClick={onCanvasClick}
    >
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
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.x * scale,
              top: el.y * scale,
              width: el.w * scale,
              height: el.h * scale,
              border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: readonly ? 'default' : 'move',
              userSelect: 'none',
              boxSizing: 'border-box',
            }}
            onMouseDown={readonly ? undefined : e => { e.stopPropagation(); onElementMouseDown(e, el.id) }}
            onDoubleClick={readonly ? undefined : e => { e.stopPropagation(); onElementDblClick(el.id) }}
          >
            {el.type === 'text' ? (
              isEditing ? (
                <textarea
                  autoFocus
                  value={el.content}
                  onChange={e => onContentChange(el.id, e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  style={{ ...textStyle, width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 4 }}
                />
              ) : (
                <div style={{ ...textStyle, width: '100%', height: '100%', overflow: 'hidden', padding: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {el.styles?.bullet
                    ? el.content.split('\n').map((line, i) => <div key={i}>• {line}</div>)
                    : el.content}
                </div>
              )
            ) : (
              <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
            )}

            {/* Resize handle (bottom-right corner) */}
            {isSelected && !readonly && (
              <div
                style={{
                  position: 'absolute', right: -5, bottom: -5,
                  width: 10, height: 10,
                  background: '#3b82f6', borderRadius: 2, cursor: 'se-resize',
                }}
                onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, el.id) }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── PPTEditor ───────────────────────────────────────────────── */
export default function PPTEditor({ content, onChange, readonly = false }) {
  const initSlides = () => {
    if (content?.slides?.length) return content.slides
    return [newSlide()]
  }

  const [slides, setSlides] = useState(initSlides)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const containerRef = useRef()
  const [scale, setScale] = useState(0.7)
  const dragRef = useRef(null)   // { mode: 'move'|'resize', id, startX, startY, origX, origY, origW, origH }
  const imgRef = useRef()

  useEffect(() => {
    if (content?.slides?.length) {
      setSlides(content.slides)
      setCurrentIdx(0)
    }
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

  const emit = useCallback((newSlides) => {
    onChange?.({ slides: newSlides })
  }, [onChange])

  function updateSlides(fn) {
    setSlides(prev => {
      const next = fn(prev)
      emit(next)
      return next
    })
  }

  function updateElement(slideIdx, id, patch) {
    updateSlides(prev => prev.map((s, i) =>
      i !== slideIdx ? s : {
        ...s, elements: s.elements.map(el => el.id !== id ? el : { ...el, ...patch })
      }
    ))
  }

  function getCurrentSlide() { return slides[currentIdx] }
  function getEl(id) { return getCurrentSlide()?.elements.find(e => e.id === id) }

  // Drag / resize handlers
  function handleElementMouseDown(e, id) {
    if (editingId) return
    setSelectedId(id)
    const el = getEl(id)
    if (!el) return
    dragRef.current = {
      mode: 'move', id,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, origW: el.w, origH: el.h,
    }
  }

  function handleResizeMouseDown(e, id) {
    const el = getEl(id)
    if (!el) return
    dragRef.current = {
      mode: 'resize', id,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, origW: el.w, origH: el.h,
    }
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current) return
      const { mode, id, startX, startY, origX, origY, origW, origH } = dragRef.current
      const dx = (e.clientX - startX) / scale
      const dy = (e.clientY - startY) / scale
      if (mode === 'move') {
        updateElement(currentIdx, id, {
          x: Math.max(0, Math.min(SLIDE_W - origW, origX + dx)),
          y: Math.max(0, Math.min(SLIDE_H - origH, origY + dy)),
        })
      } else {
        updateElement(currentIdx, id, {
          w: Math.max(80, origW + dx),
          h: Math.max(40, origH + dy),
        })
      }
    }
    function onUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scale, currentIdx])

  function handleDblClick(id) {
    const el = getEl(id)
    if (el?.type === 'text') setEditingId(id)
  }

  function handleCanvasClick() {
    setSelectedId(null)
    setEditingId(null)
  }

  function handleContentChange(id, value) {
    updateElement(currentIdx, id, { content: value })
  }

  // Slide actions
  function addSlide() {
    const s = newSlide()
    updateSlides(prev => {
      const next = [...prev]
      next.splice(currentIdx + 1, 0, s)
      return next
    })
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
    setSelectedId(el.id)
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const src = await uploadImage(file)
      const el = { id: uid(), type: 'image', x: 100, y: 100, w: 300, h: 200, src }
      updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, elements: [...s.elements, el] }))
      setSelectedId(el.id)
    } catch { }
    e.target.value = ''
  }

  function deleteSelected() {
    if (!selectedId) return
    updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, elements: s.elements.filter(el => el.id !== selectedId) }))
    setSelectedId(null)
  }

  function updateStyle(key, value) {
    if (!selectedId) return
    const el = getEl(selectedId)
    if (el?.type !== 'text') return
    updateElement(currentIdx, selectedId, { styles: { ...el.styles, [key]: value } })
  }

  function updateSlideProps(patch) {
    updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, ...patch }))
  }

  const selectedEl = selectedId ? getEl(selectedId) : null
  const currentSlide = getCurrentSlide()

  if (readonly) {
    return (
      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div key={slide.id}>
            <p className="text-xs text-gray-400 mb-1">Slide {i + 1}</p>
            <div className="relative overflow-hidden shadow rounded-lg border border-gray-200" style={{ width: '100%', paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%`, background: slide.bg }}>
              <div className="absolute inset-0">
                <div style={{ transform: `scale(${1})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H, position: 'relative' }}>
                  {slide.elements.map(el => (
                    <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                      {el.type === 'text' ? (
                        <div style={{
                          fontFamily: el.styles.fontFamily, fontSize: el.styles.fontSize,
                          fontWeight: el.styles.bold ? 'bold' : 'normal',
                          fontStyle: el.styles.italic ? 'italic' : 'normal',
                          textDecoration: el.styles.underline ? 'underline' : 'none',
                          color: el.styles.color, textAlign: el.styles.textAlign,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 4,
                        }}>
                          {el.styles.bullet ? el.content.split('\n').map((l, j) => <div key={j}>• {l}</div>) : el.content}
                        </div>
                      ) : (
                        <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )}
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

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Top toolbar */}
      <div className="flex flex-wrap gap-0.5 items-center px-2 py-1.5 bg-gray-50 border-b border-gray-200 select-none">
        {/* Slide actions */}
        <Btn onClick={addSlide} title="Thêm slide mới">+ Slide</Btn>
        <Btn onClick={deleteSlide} disabled={slides.length <= 1} title="Xóa slide này" className="text-red-600 hover:bg-red-50">🗑 Slide</Btn>
        <Sep />

        {/* Add elements */}
        <Btn onClick={addText} title="Thêm hộp văn bản">T Thêm text</Btn>
        <button type="button" onClick={() => imgRef.current?.click()}
          className="px-2 py-1 rounded text-sm text-gray-700 hover:bg-gray-100 transition"
          title="Chèn ảnh vào slide">
          🖼 Ảnh
        </button>
        <input ref={imgRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
        <Sep />

        {/* Slide background */}
        <label className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-sm text-gray-700" title="Màu nền slide">
          Nền:
          <span className="w-5 h-4 rounded border border-gray-300 inline-block" style={{ background: currentSlide?.bg }} />
          <input type="color" value={currentSlide?.bg || '#ffffff'} onChange={e => updateSlideProps({ bg: e.target.value })} className="sr-only" />
        </label>

        {/* Slide transition */}
        <select
          value={currentSlide?.transition || 'none'}
          onChange={e => updateSlideProps({ transition: e.target.value })}
          className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none ml-1"
          title="Hiệu ứng chuyển slide"
        >
          {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Delete selected element */}
        {selectedId && (
          <>
            <Sep />
            <Btn onClick={deleteSelected} title="Xóa đối tượng đã chọn" className="text-red-500 hover:bg-red-50">✕ Xóa</Btn>
          </>
        )}
      </div>

      {/* Text formatting toolbar (only when text element selected) */}
      {selectedEl?.type === 'text' && (
        <div className="flex flex-wrap gap-0.5 items-center px-2 py-1 bg-blue-50 border-b border-blue-100 select-none">
          <select value={selectedEl.styles.fontFamily} onChange={e => updateStyle('fontFamily', e.target.value)}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none max-w-[120px]">
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select value={selectedEl.styles.fontSize} onChange={e => updateStyle('fontSize', Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 w-14 bg-white focus:outline-none ml-1">
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Sep />

          <Btn active={selectedEl.styles.bold} onClick={() => updateStyle('bold', !selectedEl.styles.bold)} title="Đậm"><b>B</b></Btn>
          <Btn active={selectedEl.styles.italic} onClick={() => updateStyle('italic', !selectedEl.styles.italic)} title="Nghiêng"><i>I</i></Btn>
          <Btn active={selectedEl.styles.underline} onClick={() => updateStyle('underline', !selectedEl.styles.underline)} title="Gạch chân"><u>U</u></Btn>

          <label className="px-1.5 py-1 rounded hover:bg-blue-100 cursor-pointer flex items-center gap-0.5" title="Màu chữ">
            <span className="text-sm font-bold" style={{ color: selectedEl.styles.color }}>A</span>
            <span className="w-3.5 h-1 rounded-sm" style={{ background: selectedEl.styles.color }} />
            <input type="color" value={selectedEl.styles.color} onChange={e => updateStyle('color', e.target.value)} className="sr-only" />
          </label>
          <Sep />

          <Btn active={selectedEl.styles.textAlign === 'left'} onClick={() => updateStyle('textAlign', 'left')} title="Căn trái">⬅</Btn>
          <Btn active={selectedEl.styles.textAlign === 'center'} onClick={() => updateStyle('textAlign', 'center')} title="Căn giữa">↔</Btn>
          <Btn active={selectedEl.styles.textAlign === 'right'} onClick={() => updateStyle('textAlign', 'right')} title="Căn phải">➡</Btn>
          <Sep />

          <Btn active={selectedEl.styles.bullet} onClick={() => updateStyle('bullet', !selectedEl.styles.bullet)} title="Gạch đầu dòng">≡•</Btn>
          <span className="text-xs text-blue-400 ml-1">(Nhấn đúp để sửa văn bản)</span>
        </div>
      )}

      {/* Main area */}
      <div className="flex" style={{ height: 560 }}>
        {/* Slide panel */}
        <div className="w-36 shrink-0 bg-gray-100 border-r border-gray-200 overflow-y-auto p-2 space-y-2">
          {slides.map((s, i) => (
            <SlideThumb
              key={s.id}
              slide={s}
              index={i}
              active={i === currentIdx}
              onClick={() => { setCurrentIdx(i); setSelectedId(null); setEditingId(null) }}
            />
          ))}
        </div>

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 flex items-start justify-center p-4">
          {currentSlide && (
            <SlideCanvas
              slide={currentSlide}
              selectedId={selectedId}
              editingId={editingId}
              scale={scale}
              onCanvasClick={handleCanvasClick}
              onElementMouseDown={handleElementMouseDown}
              onResizeMouseDown={handleResizeMouseDown}
              onElementDblClick={handleDblClick}
              onContentChange={handleContentChange}
              readonly={readonly}
            />
          )}
        </div>
      </div>

      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
        Slide {currentIdx + 1}/{slides.length} · Nhấn đúp vào text để chỉnh sửa · Kéo để di chuyển · Kéo góc dưới phải để thay đổi kích thước
      </div>
    </div>
  )
}
