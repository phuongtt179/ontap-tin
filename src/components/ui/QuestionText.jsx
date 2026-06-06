import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Chuyển single \n thành "  \n" (markdown line break) bên ngoài code block
function preserveLineBreaks(text) {
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g)
  return parts.map((part, i) => {
    if (i % 2 === 1) return part
    return part.replace(/(?<!\n)\n(?!\n)/g, '  \n')
  }).join('')
}

export default function QuestionText({ text, className = '' }) {
  if (!text) return null

  const hasMarkdown = text.includes('```') || text.includes('`')

  if (!hasMarkdown) {
    return <div className={`whitespace-pre-wrap ${className}`}>{text}</div>
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className: cls, children, ...props }) {
            const match = /language-(\w+)/.exec(cls || '')
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={oneLight}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: '0.5rem 0',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    border: '1px solid #e5e7eb',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }
            return (
              <code
                className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          p({ children }) {
            return <p className="mb-1 last:mb-0">{children}</p>
          },
        }}
      >
        {preserveLineBreaks(text)}
      </ReactMarkdown>
    </div>
  )
}
