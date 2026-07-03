import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function MarkdownContent({ text, className = '' }) {
  if (!text) return null
  return (
    <div className={`prose prose-sm max-w-none
      prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-1.5
      prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-1.5 prose-th:bg-gray-100
      prose-headings:font-bold prose-strong:font-bold
      prose-ul:pl-5 prose-ol:pl-5 prose-li:my-0.5
      ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
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
            return <div className="overflow-x-auto my-2"><table className="min-w-full text-sm">{children}</table></div>
          },
          p({ children }) {
            return <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
