import { Fragment } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

const CODE_STYLE = {
  margin: 0,
  borderRadius: '0.5rem',
  fontSize: '0.85rem',
  border: '1px solid #e5e7eb',
}

// Code block bình thường — không có chỗ trống
export function CodeBlock({ lang, code }) {
  return (
    <div className="block my-2">
      <SyntaxHighlighter style={oneLight} language={lang || 'text'} PreTag="div" customStyle={CODE_STYLE}>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

// Code block có chỗ trống — renderBlank(idx) trả về React element tương tác
export function CodeBlockWithBlanks({ lang, segs, startIdx, renderBlank }) {
  return (
    <div className="block my-2">
      <div style={{
        background: '#fafafa',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '0.75em 1em',
        fontSize: '0.85rem',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'pre',
        overflowX: 'auto',
      }}>
        {segs.map((seg, si) => {
          const idx = startIdx + si
          return (
            <Fragment key={si}>
              {seg ? (
                <SyntaxHighlighter
                  style={oneLight}
                  language={lang || 'text'}
                  PreTag="span"
                  CodeTag="span"
                  customStyle={{
                    background: 'none', padding: 0, margin: 0,
                    border: 'none', borderRadius: 0,
                    fontSize: 'inherit', fontFamily: 'inherit',
                    display: 'contents',
                  }}
                >
                  {seg}
                </SyntaxHighlighter>
              ) : null}
              {si < segs.length - 1 && renderBlank(idx)}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
