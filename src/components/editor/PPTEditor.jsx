import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Type, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List,
  ChevronLeft, Home, FilePlus, FolderOpen, Info, Save, Clock,
  Printer, Share2, Download, X, Play, SkipForward, ChevronRight, ChevronLeft as ChevronLeftIcon,
  Sparkles,
} from 'lucide-react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const SLIDE_W = 960
const SLIDE_H = 540
const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Verdana']
const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72]

const TRANSITIONS = [
  { value: 'none',  label: 'None',  icon: '▭' },
  { value: 'fade',  label: 'Fade',  icon: '◑' },
  { value: 'slide', label: 'Slide', icon: '▶' },
  { value: 'zoom',  label: 'Zoom',  icon: '⊕' },
]
const ANIMATIONS = [
  { value: 'none',   label: 'None',   icon: '—' },
  { value: 'appear', label: 'Appear', icon: '✦' },
  { value: 'fade',   label: 'Fade In',icon: '◎' },
  { value: 'fly',    label: 'Fly In', icon: '↗' },
]

let _id = 0
function uid() { return `el-${++_id}-${Date.now()}` }
function newSlide() { return { id: uid(), bg: '#ffffff', transition: 'none', elements: [] } }
function newTextEl() {
  return {
    id: uid(), type: 'text', x: 80, y: 80, w: 500, h: 120,
    content: 'Click to add text',
    animation: 'none',
    styles: { fontSize: 20, bold: false, italic: false, underline: false, color: '#000000', fontFamily: 'Arial', textAlign: 'left', bullet: false },
  }
}

async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  return (await res.json()).secure_url
}

/* ── Ribbon primitives ─────────────────────────────────────────── */
function RibbonBigBtn({ onClick, disabled, title, icon: Icon, label, danger, active }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded min-w-[52px] h-14 text-[11px] font-medium border transition select-none
        ${active ? 'bg-blue-100 border-blue-400 text-blue-700'
          : danger ? 'border-transparent text-red-600 hover:bg-red-50 hover:border-red-200'
          : 'border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
      <Icon size={20} /><span>{label}</span>
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
function TransCard({ trans, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded border transition w-14
        ${active ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
      <span className="text-xl leading-none">{trans.icon}</span>
      <span className="text-[10px] font-medium">{trans.label}</span>
    </button>
  )
}
function AnimCard({ anim, active, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-1 px-2 py-1 rounded border transition w-14
        ${active ? 'border-blue-400 bg-blue-50 text-blue-700'
          : disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
      <span className="text-xl leading-none">{anim.icon}</span>
      <span className="text-[10px] font-medium">{anim.label}</span>
    </button>
  )
}

/* ── SlideThumb ──────────────────────────────────────────────── */
function SlideThumb({ slide, index, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full rounded-lg overflow-hidden border-2 transition ${active ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
      <div className="relative w-full" style={{ paddingBottom: `${(SLIDE_H / SLIDE_W) * 100}%`, background: slide.bg }}>
        <div className="absolute inset-0 overflow-hidden">
          <div style={{ transform: `scale(${1/6})`, transformOrigin: 'top left', width: SLIDE_W, height: SLIDE_H, pointerEvents: 'none' }}>
            {slide.elements.map(el => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h }}>
                {el.type === 'text' ? (
                  <div style={{ fontFamily: el.styles.fontFamily, fontSize: el.styles.fontSize, fontWeight: el.styles.bold ? 'bold' : 'normal', fontStyle: el.styles.italic ? 'italic' : 'normal', textDecoration: el.styles.underline ? 'underline' : 'none', color: el.styles.color, textAlign: el.styles.textAlign, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {el.styles.bullet ? el.content.split('\n').map((l, i) => <div key={i}>• {l}</div>) : el.content}
                  </div>
                ) : <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
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
      style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, background: slide.bg }}
      onClick={onCanvasClick}>
      {slide.elements.map(el => {
        const isSel = selectedId === el.id, isEdit = editingId === el.id
        const ts = { fontFamily: el.styles?.fontFamily || 'Arial', fontSize: (el.styles?.fontSize || 20) * scale, fontWeight: el.styles?.bold ? 'bold' : 'normal', fontStyle: el.styles?.italic ? 'italic' : 'normal', textDecoration: el.styles?.underline ? 'underline' : 'none', color: el.styles?.color || '#000', textAlign: el.styles?.textAlign || 'left' }
        return (
          <div key={el.id}
            style={{ position: 'absolute', left: el.x*scale, top: el.y*scale, width: el.w*scale, height: el.h*scale, border: isSel ? '2px solid #3b82f6' : '2px solid transparent', cursor: readonly ? 'default' : 'move', userSelect: 'none', boxSizing: 'border-box' }}
            onMouseDown={readonly ? undefined : e => { e.stopPropagation(); onElementMouseDown(e, el.id) }}
            onDoubleClick={readonly ? undefined : e => { e.stopPropagation(); onElementDblClick(el.id) }}>
            {el.type === 'text' ? (
              isEdit
                ? <textarea autoFocus value={el.content} onChange={e => onContentChange(el.id, e.target.value)} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ ...ts, width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 4 }} />
                : <div style={{ ...ts, width: '100%', height: '100%', overflow: 'hidden', padding: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {el.styles?.bullet ? el.content.split('\n').map((l, i) => <div key={i}>• {l}</div>) : el.content}
                  </div>
            ) : <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />}
            {isSel && !readonly && (
              <div style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'se-resize' }}
                onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, el.id) }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Slide Show Mode ─────────────────────────────────────────── */
function SlideShowMode({ slides, startIdx, onExit }) {
  const [idx, setIdx] = useState(startIdx)
  const [entering, setEntering] = useState(false)

  function goTo(next) {
    if (next < 0 || next >= slides.length) return
    setEntering(true)
    setTimeout(() => { setIdx(next); setEntering(false) }, 300)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onExit()
      if (e.key === 'ArrowRight' || e.key === ' ') goTo(idx + 1)
      if (e.key === 'ArrowLeft') goTo(idx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, slides.length])

  const slide = slides[idx]
  const vw = window.innerWidth, vh = window.innerHeight
  const scale = Math.min(vw / SLIDE_W, vh / SLIDE_H)
  const trans = slide.transition

  const transStyle = entering
    ? trans === 'fade'  ? { opacity: 0, transition: 'opacity .3s' }
    : trans === 'slide' ? { transform: 'translateX(100%)', transition: 'transform .3s' }
    : trans === 'zoom'  ? { transform: 'scale(0.7)', opacity: 0, transition: 'all .3s' }
    : {}
    : { opacity: 1, transform: 'none', transition: 'all .3s' }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={() => goTo(idx + 1)}>
      <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale, background: slide.bg, position: 'relative', overflow: 'hidden', ...transStyle }}>
        {slide.elements.map(el => {
          const animClass = el.animation === 'appear' ? 'animate-bounce-in'
            : el.animation === 'fade' ? 'animate-fade-in'
            : el.animation === 'fly' ? 'animate-fly-in'
            : ''
          const ts = { fontFamily: el.styles?.fontFamily, fontSize: (el.styles?.fontSize || 20) * scale, fontWeight: el.styles?.bold ? 'bold' : 'normal', fontStyle: el.styles?.italic ? 'italic' : 'normal', textDecoration: el.styles?.underline ? 'underline' : 'none', color: el.styles?.color, textAlign: el.styles?.textAlign }
          return (
            <div key={el.id} className={animClass} style={{ position: 'absolute', left: el.x*scale, top: el.y*scale, width: el.w*scale, height: el.h*scale }}>
              {el.type === 'text'
                ? <div style={{ ...ts, padding: 4*scale, whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', height: '100%', overflow: 'hidden' }}>
                    {el.styles?.bullet ? el.content.split('\n').map((l, i) => <div key={i}>• {l}</div>) : el.content}
                  </div>
                : <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </div>
          )
        })}
      </div>
      {/* Controls */}
      <div className="absolute bottom-4 flex items-center gap-4 text-white" onClick={e => e.stopPropagation()}>
        <button onClick={() => goTo(idx-1)} disabled={idx===0} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"><ChevronLeftIcon size={20}/></button>
        <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full">{idx+1} / {slides.length}</span>
        <button onClick={() => goTo(idx+1)} disabled={idx===slides.length-1} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"><ChevronRight size={20}/></button>
        <button onClick={onExit} className="ml-4 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">ESC</button>
      </div>
    </div>
  )
}

/* ── File Backstage ──────────────────────────────────────────── */
const LEFT_ITEMS = [
  { id: 'home',    label: 'Home',     icon: Home },
  { id: 'new',     label: 'New',      icon: FilePlus },
  { id: 'open',    label: 'Open',     icon: FolderOpen },
  null,
  { id: 'info',    label: 'Info',     icon: Info },
  { id: 'save',    label: 'Save',     icon: Save },
  { id: 'saveas',  label: 'Save As',  icon: Download },
  { id: 'history', label: 'History',  icon: Clock, disabled: true },
  { id: 'print',   label: 'Print',    icon: Printer, disabled: true },
  { id: 'share',   label: 'Share',    icon: Share2, disabled: true },
  null,
  { id: 'close',   label: 'Close',    icon: X },
]

function FileBackstage({ slides, presentationName, onClose, onNew, onSave, onSaveAs, onOpen }) {
  const [section, setSection] = useState('home')
  const [saveName, setSaveName] = useState(presentationName)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'err'
  const openRef = useRef()

  function handleSelect(item) {
    if (item.disabled) return
    if (item.id === 'close') { onClose(); return }
    setSection(item.id)
  }

  function doSave() {
    try {
      const key = `ppt_${saveName || 'untitled'}`
      localStorage.setItem(key, JSON.stringify({ name: saveName, slides }))
      const index = JSON.parse(localStorage.getItem('ppt_index') || '[]')
      if (!index.includes(saveName)) { index.push(saveName); localStorage.setItem('ppt_index', JSON.stringify(index)) }
      setSaveStatus('ok')
      onSave(saveName)
    } catch { setSaveStatus('err') }
  }

  function doSaveAs() {
    const name = saveName.trim() || 'presentation'
    const json = JSON.stringify({ name, slides }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${name}.json`; a.click()
    URL.revokeObjectURL(url)
    onSave(name)
  }

  function doOpen(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data.slides)) { onOpen(data.slides, data.name || 'Untitled'); onClose() }
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function loadFromStorage(name) {
    try {
      const data = JSON.parse(localStorage.getItem(`ppt_${name}`) || 'null')
      if (data?.slides) { onOpen(data.slides, data.name); onClose() }
    } catch {}
  }

  const savedList = (() => {
    try { return JSON.parse(localStorage.getItem('ppt_index') || '[]') } catch { return [] }
  })()

  return (
    <div className="absolute inset-0 z-30 flex" style={{ background: '#fff' }}>
      {/* Left panel */}
      <div className="flex flex-col shrink-0" style={{ width: 200, background: '#822016' }}>
        <button type="button" onClick={onClose}
          className="flex items-center justify-center w-10 h-10 mt-2 ml-2 rounded-full text-white hover:bg-white/20 transition shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col mt-2">
          {LEFT_ITEMS.map((item, i) => {
            if (!item) return <div key={i} className="my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />
            const isAct = section === item.id
            return (
              <button key={item.id} type="button" onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm text-left transition
                  ${item.disabled ? 'text-white/35 cursor-default'
                    : isAct ? 'bg-white/20 text-white font-medium'
                    : 'text-white/85 hover:bg-white/10'}`}>
                <item.icon size={15} /><span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-10">
        {section === 'home' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Home</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl max-w-sm mb-6">
              <div className="w-16 h-11 rounded border border-gray-300 bg-white flex items-center justify-center shrink-0">
                <ImageIcon size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{presentationName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{slides.length} slide{slides.length !== 1 ? 's' : ''} · {slides.reduce((s, sl) => s + sl.elements.length, 0)} elements</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Use <strong>Save</strong> to keep your work or <strong>Save As</strong> to download a file.</p>
          </div>
        )}

        {section === 'new' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">New</h2>
            <button type="button" onClick={() => { onNew(); onClose() }}
              className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition w-44 group">
              <div className="w-24 h-16 bg-white border border-gray-300 rounded flex items-center justify-center group-hover:border-blue-300">
                <FilePlus size={26} className="text-gray-300 group-hover:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Blank Presentation</span>
            </button>
            <p className="text-xs text-orange-500 mt-4">⚠ Current presentation will be cleared.</p>
          </div>
        )}

        {section === 'open' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Open</h2>
            <div className="space-y-6 max-w-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Browse from computer</p>
                <button type="button" onClick={() => openRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                  <FolderOpen size={16} /> Browse Files (.json)
                </button>
                <input ref={openRef} type="file" accept=".json,application/json" className="hidden" onChange={doOpen} />
              </div>
              {savedList.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Saved in this browser</p>
                  <div className="space-y-1.5">
                    {savedList.map(name => (
                      <button key={name} type="button" onClick={() => loadFromStorage(name)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-left">
                        <Save size={15} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">{name}</span>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {savedList.length === 0 && (
                <p className="text-sm text-gray-400 italic">No recent presentations saved in this browser.</p>
              )}
            </div>
          </div>
        )}

        {section === 'info' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Info</h2>
            <div className="max-w-md space-y-0 border border-gray-200 rounded-xl overflow-hidden text-sm">
              {[
                ['Name', presentationName],
                ['Slides', String(slides.length)],
                ['Total elements', String(slides.reduce((s, sl) => s + sl.elements.length, 0))],
                ['Slide size', '960 × 540 px (16:9)'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(section === 'save' || section === 'saveas') && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">{section === 'save' ? 'Save' : 'Save As'}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {section === 'save' ? 'Save to this browser (localStorage).' : 'Download a .json file to your computer.'}
            </p>
            <div className="max-w-sm space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">File name</label>
                <input value={saveName} onChange={e => { setSaveName(e.target.value); setSaveStatus(null) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. My Presentation" />
              </div>
              <button type="button" onClick={section === 'save' ? doSave : doSaveAs} disabled={!saveName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {section === 'save' ? <Save size={16} /> : <Download size={16} />}
                {section === 'save' ? 'Save to Browser' : 'Download File'}
              </button>
              {saveStatus === 'ok' && <p className="text-sm text-green-600">✓ {section === 'save' ? 'Saved successfully.' : 'File downloaded.'}</p>}
              {saveStatus === 'err' && <p className="text-sm text-red-500">✗ Failed. Storage may be full.</p>}
              {section === 'saveas' && (
                <p className="text-xs text-gray-400 leading-relaxed">The file will be saved as <code className="bg-gray-100 px-1 rounded">{(saveName || 'presentation').replace(/\.json$/, '')}.json</code>. Use <strong>Open</strong> to load it back later.</p>
              )}
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
