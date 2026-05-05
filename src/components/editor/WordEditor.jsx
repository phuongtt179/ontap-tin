import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image as TipTapImage } from '@tiptap/extension-image'
import { useEffect, useRef } from 'react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Verdana']
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  return (await res.json()).secure_url
}

function Btn({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick?.() }}
      className={`px-1.5 py-1 rounded text-sm select-none transition
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />
}

function WordToolbar({ editor }) {
  const imgRef = useRef()
  if (!editor) return null

  const attrs = editor.getAttributes('textStyle')
  const color = attrs.color || '#000000'
  const rawSize = attrs.fontSize || '14px'
  const size = rawSize.replace('px', '')
  const font = attrs.fontFamily || 'Arial'

  async function onImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch { }
    e.target.value = ''
  }

  return (
    <div className="flex flex-wrap gap-0.5 items-center px-2 py-1.5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 select-none">
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)" disabled={!editor.can().undo()}>↩</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)" disabled={!editor.can().redo()}>↪</Btn>
      <Sep />

      <select
        value={font}
        onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
        style={{ fontFamily: font }}
        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[130px]"
      >
        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      <select
        value={size}
        onChange={e => editor.chain().focus().setFontSize(e.target.value + 'px').run()}
        className="text-xs border border-gray-300 rounded px-1 py-0.5 w-14 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ml-1"
      >
        {SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
      </select>
      <Sep />

      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Đậm (Ctrl+B)">
        <b>B</b>
      </Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Nghiêng (Ctrl+I)">
        <i>I</i>
      </Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân (Ctrl+U)">
        <u>U</u>
      </Btn>

      <label className="px-1.5 py-1 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-0.5 select-none" title="Màu chữ">
        <span className="text-sm font-bold leading-none" style={{ color }}>A</span>
        <span className="w-3.5 h-1 rounded-sm mt-0.5" style={{ background: color }} />
        <input
          type="color"
          value={color}
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          className="sr-only"
        />
      </label>
      <Sep />

      <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Căn trái">⬅</Btn>
      <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Căn giữa">↔</Btn>
      <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Căn phải">➡</Btn>
      <Sep />

      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách (•)">
        <span className="text-xs">≡•</span>
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Danh sách số">
        <span className="text-xs">1.</span>
      </Btn>
      <Sep />

      <button
        type="button"
        onClick={() => imgRef.current?.click()}
        className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-1 transition"
        title="Chèn ảnh vào văn bản"
      >
        🖼 Chèn ảnh
      </button>
      <input ref={imgRef} type="file" accept="image/*" onChange={onImage} className="hidden" />
    </div>
  )
}

export default function WordEditor({ content, onChange, readonly = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TipTapImage.configure({ inline: false, allowBase64: false }),
    ],
    content: content || '<p></p>',
    editable: !readonly,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  })

  useEffect(() => {
    if (!editor || !content) return
    const current = JSON.stringify(editor.getJSON())
    const incoming = JSON.stringify(typeof content === 'string' ? content : content)
    if (current !== incoming) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  if (readonly) {
    return (
      <div className="word-editor-view px-6 py-4 bg-white">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="word-editor border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <WordToolbar editor={editor} />
      <div className="px-10 py-8 min-h-64 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
