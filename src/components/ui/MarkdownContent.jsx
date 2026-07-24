import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

// Cho phép dùng <br> để xuống dòng (kể cả TRONG ô bảng, nơi Enter không xuống dòng được)
// mà không phải bật render HTML thô. Thay <br> bằng 1 ký tự Private Use rồi tự chèn <br/> khi render.
const BR = ''  // ky tu Private Use - khong xuat hien trong noi dung that
function withBreaks(children) {
  const out = []
  ;(Array.isArray(children) ? children : [children]).forEach(node => {
    if (typeof node === 'string' && node.includes(BR)) {
      const parts = node.split(BR)
      parts.forEach((p, j) => {
        if (p) out.push(p)
        if (j < parts.length - 1) out.push(<br key={`br-${out.length}`} />)
      })
    } else {
      out.push(node)
    }
  })
  return out
}

export default function MarkdownContent({ text, className = '' }) {
  if (!text) return null
  const src = text.replace(/<br\s*\/?>/gi, BR)
  return (
    <div className={`prose prose-sm max-w-none
      prose-headings:font-bold prose-strong:font-bold
      prose-ul:pl-5 prose-ol:pl-5 prose-li:my-0.5
      ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className: cls, children, ...props }) {
            const match = /language-(\w+)/.exec(cls || '')
            if (!inline && match) {
              return (
                <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div"
                  customStyle={{ margin: '0.5rem 0', borderRadius: '0.5rem', fontSize: '0.85rem', border: '1px solid #e5e7eb' }}
                  {...props}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }
            return (
              <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return <div className="overflow-x-auto my-2"><table className="min-w-full text-sm border-collapse border border-gray-300">{children}</table></div>
          },
          th({ children }) {
            return <th className="border border-gray-300 px-3 py-1.5 bg-gray-100 font-bold text-left align-top">{withBreaks(children)}</th>
          },
          td({ children }) {
            return <td className="border border-gray-300 px-3 py-1.5 align-top">{withBreaks(children)}</td>
          },
          p({ children }) {
            return <p className="mb-1.5 last:mb-0 leading-relaxed">{withBreaks(children)}</p>
          },
          li({ children }) {
            return <li>{withBreaks(children)}</li>
          },
        }}
      >
        {src}
      </ReactMarkdown>
    </div>
  )
}
