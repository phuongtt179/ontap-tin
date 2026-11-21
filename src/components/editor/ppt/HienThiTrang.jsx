// Trình soạn bài giảng: ảnh thu nhỏ trang, khung vẽ trang (kéo / đổi cỡ / sửa chữ), chế độ trình chiếu.
import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft as ChevronLeftIcon } from 'lucide-react'
import { SLIDE_W, SLIDE_H } from './hangSo'

export function SlideThumb({ slide, index, active, onClick }) {
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
export function SlideCanvas({ slide, selectedId, editingId, scale, onCanvasClick, onElementMouseDown, onResizeMouseDown, onElementDblClick, onContentChange, readonly }) {
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
export function SlideShowMode({ slides, startIdx, onExit }) {
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
