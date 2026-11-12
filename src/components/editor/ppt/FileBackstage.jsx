// Trình soạn bài giảng: màn hình "Tệp" (mới, mở, lưu, lưu thành, thông tin).
import { useState, useRef } from 'react'
import { ChevronLeft, Home, FilePlus, FolderOpen, Info, Save, Clock, Printer, Share2, Download, X, ChevronRight, Image as ImageIcon } from 'lucide-react'

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

export default function FileBackstage({ slides, presentationName, onClose, onNew, onSave, onSaveAs, onOpen }) {
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
