// Trình soạn bài giảng kiểu PowerPoint trên web. Phần con: components/editor/ppt/ (hằng số, nút, hiển thị trang, màn hình Tệp).
import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Trash2, Type, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Home, Play, SkipForward, Sparkles } from 'lucide-react'
import { SLIDE_W, SLIDE_H, FONTS, SIZES, TRANSITIONS, ANIMATIONS, uid, newSlide, newTextEl } from './ppt/hangSo'
import { uploadImage } from '../../lib/cloudinary'
import { RibbonBigBtn, RibbonSmBtn, RibbonGroup, TransCard, AnimCard } from './ppt/NutRibbon'
import { SlideThumb, SlideCanvas, SlideShowMode } from './ppt/HienThiTrang'
import FileBackstage from './ppt/FileBackstage'

export default function PPTEditor({ content, onChange, readonly = false }) {
  const initSlides = () => content?.slides?.length ? content.slides : [newSlide()]

  const [slides, setSlides] = useState(initSlides)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('Home')
  const [showBackstage, setShowBackstage] = useState(false)
  const [showSlideShow, setShowSlideShow] = useState(false)
  const [slideShowIdx, setSlideShowIdx] = useState(0)
  const [presentationName, setPresentationName] = useState(content?.name || 'Untitled Presentation')

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

  const emit = useCallback((ns) => { onChange?.({ slides: ns, name: presentationName }) }, [onChange, presentationName])

  function updateSlides(fn) { setSlides(prev => { const next = fn(prev); emit(next); return next }) }
  function updateElement(si, id, patch) {
    updateSlides(prev => prev.map((s, i) => i !== si ? s : { ...s, elements: s.elements.map(el => el.id !== id ? el : { ...el, ...patch }) }))
  }
  const cur = () => slides[currentIdx]
  const getEl = (id) => cur()?.elements.find(e => e.id === id)

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
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scale, currentIdx])

  const handleDblClick = (id) => { const el = getEl(id); if (el?.type === 'text') setEditingId(id) }
  const handleCanvasClick = () => { setSelectedId(null); setEditingId(null) }
  const handleContentChange = (id, value) => updateElement(currentIdx, id, { content: value })

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
    setSelectedId(el.id); setActiveTab('Home')
  }
  async function handleImageFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const src = await uploadImage(file)
      const el = { id: uid(), type: 'image', x: 100, y: 100, w: 300, h: 200, src, animation: 'none' }
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
  function setTransition(val, all = false) {
    if (all) updateSlides(prev => prev.map(s => ({ ...s, transition: val })))
    else updateSlides(prev => prev.map((s, i) => i !== currentIdx ? s : { ...s, transition: val }))
  }
  function setAnimation(val) {
    if (!selectedId) return
    updateElement(currentIdx, selectedId, { animation: val })
  }
  function handleNew() {
    const s = [newSlide()]; setSlides(s); emit(s); setCurrentIdx(0); setSelectedId(null); setEditingId(null)
  }
  function handleSaveName(name) { setPresentationName(name) }
  function handleOpenLoaded(newSlides, name) {
    setSlides(newSlides); emit(newSlides); setPresentationName(name || 'Untitled')
    setCurrentIdx(0); setSelectedId(null); setEditingId(null)
  }

  const selectedEl = selectedId ? getEl(selectedId) : null
  const currentSlide = cur()
  const isText = selectedEl?.type === 'text'

  /* ── Readonly ── */
  if (readonly) {
    return (
      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div key={slide.id}>
            <p className="text-xs text-gray-400 mb-1">Slide {i + 1}</p>
            <div className="relative overflow-hidden shadow rounded-lg border border-gray-200" style={{ width: '100%', paddingBottom: `${(SLIDE_H/SLIDE_W)*100}%`, background: slide.bg }}>
              <div className="absolute inset-0">
                <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative' }}>
                  {slide.elements.map(el => (
                    <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                      {el.type === 'text'
                        ? <div style={{ fontFamily: el.styles.fontFamily, fontSize: el.styles.fontSize, fontWeight: el.styles.bold ? 'bold' : 'normal', fontStyle: el.styles.italic ? 'italic' : 'normal', textDecoration: el.styles.underline ? 'underline' : 'none', color: el.styles.color, textAlign: el.styles.textAlign, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 4 }}>
                            {el.styles.bullet ? el.content.split('\n').map((l, j) => <div key={j}>• {l}</div>) : el.content}
                          </div>
                        : <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
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

  const TABS = ['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Slide Show']

  /* ── Ribbon content per tab ── */
  function renderRibbon() {
    switch (activeTab) {
      case 'Home': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Slides">
            <RibbonBigBtn icon={Plus} label="New Slide" onClick={addSlide} title="Add a new slide" />
            <RibbonBigBtn icon={Trash2} label="Delete" onClick={deleteSlide} disabled={slides.length <= 1} title="Delete current slide" danger />
          </RibbonGroup>
          <RibbonGroup label="Font">
            <div className="flex flex-col gap-1.5 py-1">
              <div className="flex gap-1">
                <select value={isText ? selectedEl.styles.fontFamily : 'Arial'} onChange={e => updateStyle('fontFamily', e.target.value)} disabled={!isText}
                  className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[118px] disabled:opacity-50">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={isText ? selectedEl.styles.fontSize : 20} onChange={e => updateStyle('fontSize', Number(e.target.value))} disabled={!isText}
                  className="text-xs border border-gray-400 rounded px-1 py-0.5 bg-white focus:outline-none w-14 disabled:opacity-50">
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-0.5 items-center">
                <RibbonSmBtn active={isText && selectedEl.styles.bold} onClick={() => updateStyle('bold', !selectedEl?.styles.bold)} disabled={!isText} title="Bold"><Bold size={13}/></RibbonSmBtn>
                <RibbonSmBtn active={isText && selectedEl.styles.italic} onClick={() => updateStyle('italic', !selectedEl?.styles.italic)} disabled={!isText} title="Italic"><Italic size={13}/></RibbonSmBtn>
                <RibbonSmBtn active={isText && selectedEl.styles.underline} onClick={() => updateStyle('underline', !selectedEl?.styles.underline)} disabled={!isText} title="Underline"><Underline size={13}/></RibbonSmBtn>
                <label className={`w-7 h-7 flex flex-col items-center justify-center rounded border border-transparent hover:bg-gray-100 hover:border-gray-300 cursor-pointer ${!isText ? 'opacity-40 pointer-events-none' : ''}`} title="Font Color">
                  <span className="text-sm font-bold leading-none" style={{ color: selectedEl?.styles?.color || '#000' }}>A</span>
                  <span className="w-4 h-1 rounded-sm mt-0.5" style={{ background: selectedEl?.styles?.color || '#000' }} />
                  <input type="color" value={selectedEl?.styles?.color || '#000000'} onChange={e => updateStyle('color', e.target.value)} className="sr-only" />
                </label>
              </div>
            </div>
          </RibbonGroup>
          <RibbonGroup label="Paragraph">
            <div className="flex flex-col gap-1.5 py-1">
              <div className="flex gap-0.5">
                <RibbonSmBtn active={isText && selectedEl.styles.textAlign==='left'} onClick={() => updateStyle('textAlign','left')} disabled={!isText} title="Align Left"><AlignLeft size={13}/></RibbonSmBtn>
                <RibbonSmBtn active={isText && selectedEl.styles.textAlign==='center'} onClick={() => updateStyle('textAlign','center')} disabled={!isText} title="Center"><AlignCenter size={13}/></RibbonSmBtn>
                <RibbonSmBtn active={isText && selectedEl.styles.textAlign==='right'} onClick={() => updateStyle('textAlign','right')} disabled={!isText} title="Align Right"><AlignRight size={13}/></RibbonSmBtn>
              </div>
              <div className="flex gap-0.5 items-center">
                <RibbonSmBtn active={isText && selectedEl.styles.bullet} onClick={() => updateStyle('bullet', !selectedEl?.styles.bullet)} disabled={!isText} title="Bullets"><List size={13}/></RibbonSmBtn>
                <span className="text-[10px] text-gray-400 ml-1">Bullets</span>
              </div>
            </div>
          </RibbonGroup>
          {selectedId && (
            <RibbonGroup label="Editing">
              <RibbonBigBtn icon={Trash2} label="Delete" onClick={deleteSelected} title="Delete selected object" danger />
            </RibbonGroup>
          )}
        </div>
      )

      case 'Insert': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Text">
            <RibbonBigBtn icon={Type} label="Text Box" onClick={addText} title="Insert a text box" />
          </RibbonGroup>
          <RibbonGroup label="Images">
            <RibbonBigBtn icon={ImageIcon} label="Picture" onClick={() => imgRef.current?.click()} title="Insert picture from computer" />
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
          </RibbonGroup>
        </div>
      )

      case 'Design': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Customize">
            <label className="flex flex-col items-center gap-1 px-3 py-1 h-14 justify-center rounded border border-transparent hover:bg-gray-100 hover:border-gray-300 cursor-pointer" title="Slide Background">
              <div className="w-8 h-8 rounded border border-gray-400 shadow-sm" style={{ background: currentSlide?.bg }} />
              <span className="text-[11px] text-gray-600">Background</span>
              <input type="color" value={currentSlide?.bg || '#ffffff'} onChange={e => updateSlides(prev => prev.map((s,i) => i !== currentIdx ? s : { ...s, bg: e.target.value }))} className="sr-only" />
            </label>
            <RibbonBigBtn icon={ImageIcon} label="Apply All" title="Apply background to all slides"
              onClick={() => { const bg = currentSlide?.bg || '#fff'; updateSlides(prev => prev.map(s => ({ ...s, bg }))) }} />
          </RibbonGroup>
        </div>
      )

      case 'Transitions': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Transition to This Slide">
            <div className="flex gap-1.5 items-center py-1">
              {TRANSITIONS.map(t => (
                <TransCard key={t.value} trans={t} active={currentSlide?.transition === t.value} onClick={() => setTransition(t.value)} />
              ))}
            </div>
          </RibbonGroup>
          <RibbonGroup label="Timing">
            <RibbonBigBtn icon={SkipForward} label="Apply All" onClick={() => setTransition(currentSlide?.transition || 'none', true)} title="Apply this transition to all slides" />
          </RibbonGroup>
        </div>
      )

      case 'Animations': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Animation">
            <div className="flex flex-col gap-1 py-1">
              <span className="text-[10px] text-gray-500 mb-0.5">{selectedEl ? `Selected: ${selectedEl.type}` : 'Select an element first'}</span>
              <div className="flex gap-1.5">
                {ANIMATIONS.map(a => (
                  <AnimCard key={a.value} anim={a}
                    active={selectedEl?.animation === a.value}
                    disabled={!selectedEl}
                    onClick={() => setAnimation(a.value)} />
                ))}
              </div>
            </div>
          </RibbonGroup>
          <RibbonGroup label="Advanced Animation">
            <div className="flex flex-col items-center justify-center h-14 px-2 text-center">
              <Sparkles size={18} className="text-gray-300 mb-0.5" />
              <span className="text-[10px] text-gray-400">More effects<br/>coming soon</span>
            </div>
          </RibbonGroup>
        </div>
      )

      case 'Slide Show': return (
        <div className="flex items-stretch px-1 py-1 gap-0">
          <RibbonGroup label="Start Slide Show">
            <RibbonBigBtn icon={Play} label="From Beginning" onClick={() => { setSlideShowIdx(0); setShowSlideShow(true) }} title="Start slide show from the beginning" />
            <RibbonBigBtn icon={SkipForward} label="From Current" onClick={() => { setSlideShowIdx(currentIdx); setShowSlideShow(true) }} title="Start from current slide" />
          </RibbonGroup>
          <RibbonGroup label="Tips">
            <div className="flex flex-col justify-center h-14 px-2 text-[10px] text-gray-400 leading-relaxed">
              <div>↑↓ or Click → next</div>
              <div>← → to navigate</div>
              <div>ESC to exit</div>
            </div>
          </RibbonGroup>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm select-none" style={{ position: 'relative' }}>

      {/* ── Tab bar ── */}
      <div className="flex items-stretch" style={{ background: '#b83b2a' }}>
        <button type="button" onClick={() => setShowBackstage(true)}
          className={`px-5 py-1.5 text-xs font-semibold tracking-wide transition
            ${showBackstage ? 'bg-[#832019] text-white' : 'text-white hover:bg-[#9e3122]'}`}>
          File
        </button>
        <div className="w-px my-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
        {TABS.map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium transition relative
              ${activeTab === tab ? 'bg-[#f3f3f3] text-[#b83b2a]' : 'text-white/85 hover:text-white hover:bg-white/10'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Ribbon ── */}
      <div className="bg-[#f3f3f3] border-b-2 border-gray-300" style={{ minHeight: 82 }}>
        {renderRibbon()}
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
        <span>Slide {currentIdx + 1} / {slides.length} · {presentationName}</span>
        <span>Double-click text to edit · Drag to move · Drag corner to resize</span>
      </div>

      {/* ── Overlays ── */}
      {showBackstage && (
        <FileBackstage
          slides={slides}
          presentationName={presentationName}
          onClose={() => setShowBackstage(false)}
          onNew={handleNew}
          onSave={handleSaveName}
          onSaveAs={handleSaveName}
          onOpen={handleOpenLoaded}
        />
      )}
      {showSlideShow && (
        <SlideShowMode slides={slides} startIdx={slideShowIdx} onExit={() => setShowSlideShow(false)} />
      )}
    </div>
  )
}
