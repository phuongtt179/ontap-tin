// Xuất giáo trình 5 khoá (chưa có học sinh) ra PDF: lý thuyết + đề bài tập thực hành (không kèm đáp án / test). Không đưa PDF lên Git.
// Chạy: node scripts/xuat-giao-trinh-pdf.mjs [thư mục ra, mặc định GiaoTrinh_PDF] — cần Chrome; sửa danh sách KHOA nếu muốn khoá khác.
import pg from 'pg'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execFileSync } from 'child_process'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseTasks } from '../src/domain/baiThucHanh.js'

const RA = resolve(process.argv[2] || 'GiaoTrinh_PDF')
mkdirSync(RA, { recursive: true })
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const KHOA = ['PYTHON A CƠ BẢN', 'PYTHON A NÂNG CAO', 'PYTHON A LUYỆN THI', 'SCRATCH NÂNG CAO', 'SCRATCH LUYỆN THI D1']

const env = readFileSync('.env', 'utf8')
const url = env.match(/^\s*NEON_DATABASE_URL\s*=\s*['"]?([^'"\s]+)/m)[1]
const c = new pg.Client({ connectionString: url.replace('sslmode=require', 'sslmode=verify-full') })
await c.connect()

const md = text => text ? renderToStaticMarkup(h(Markdown, { remarkPlugins: [remarkGfm] }, text)) : ''
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])
const soDau = s => { const m = String(s || '').match(/^(\d+)/); return m ? +m[1] : 999 }
const soBai = t => { const m = String(t).match(/^(?:Bài|Đề)\s*(\d+)/); return m ? +m[1] : 999 }

const CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; }
h1.bia { font-size: 30pt; margin: 0 0 8px; color: #312e81; }
.bia-trang { height: 250mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.bia-trang .phu { font-size: 14pt; color: #4b5563; }
.bia-trang .mota { margin-top: 24px; font-size: 11pt; color: #374151; border-left: 4px solid #6366f1; padding-left: 12px; white-space: pre-wrap; }
.muc-luc { page-break-after: always; }
.muc-luc h2 { color: #312e81; }
.muc-luc .cd { font-weight: 700; margin-top: 10px; color: #3730a3; }
.muc-luc .bl { margin-left: 18px; }
h2.chu-de { page-break-before: always; color: #fff; background: #4338ca; padding: 10px 14px; border-radius: 6px; font-size: 17pt; }
.bai { page-break-before: always; }
.chu-de + .bai { page-break-before: avoid; }
.bai > h3 { font-size: 16pt; color: #312e81; border-bottom: 2px solid #c7d2fe; padding-bottom: 4px; margin-bottom: 4px; }
.mo-ta { color: #4b5563; font-style: italic; margin: 0 0 10px; }
.nhan { display: inline-block; font-size: 9pt; font-weight: 700; letter-spacing: .5px; color: #4338ca; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; margin: 12px 0 4px; }
.bt { border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 12px; margin: 10px 0; page-break-inside: auto; }
h1, h2, h3, h4 { page-break-after: avoid; }
.noi-dung h2 { font-size: 13.5pt; color: #1e3a8a; } .noi-dung h3 { font-size: 12pt; color: #1e40af; }
pre { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; font-size: 9.5pt; white-space: pre-wrap; page-break-inside: avoid; }
code { font-family: Consolas, 'Courier New', monospace; background: #f3f4f6; padding: 0 3px; border-radius: 3px; font-size: 9.5pt; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; margin: 6px 0; font-size: 10pt; page-break-inside: avoid; }
th, td { border: 1px solid #9ca3af; padding: 3px 8px; vertical-align: top; } th { background: #eef2ff; }
img { max-width: 100%; }
`

for (const khoa of KHOA) {
  const g = (await c.query(`select ai_scope from grades where value = $1`, [khoa])).rows[0]
  const ls = (await c.query(`select title, topic, description, ai_context, practice_instructions, "order" from lessons
    where grade = $1 and is_published order by "order"`, [khoa])).rows
  const theoChuDe = new Map()
  for (const l of ls) { const k = l.topic || 'Khác'; if (!theoChuDe.has(k)) theoChuDe.set(k, []); theoChuDe.get(k).push(l) }
  const chuDe = [...theoChuDe.keys()].sort((a, b) => soDau(a) - soDau(b) || a.localeCompare(b, 'vi'))
  for (const k of chuDe) theoChuDe.get(k).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || soBai(a.title) - soBai(b.title))

  let soBt = 0
  const phan = []
  for (const k of chuDe) {
    phan.push(`<h2 class="chu-de">${esc(k)}</h2>`)
    for (const l of theoChuDe.get(k)) {
      const tasks = parseTasks(l.practice_instructions).filter(t => t.instructions?.trim())
      soBt += tasks.length
      phan.push(`<section class="bai"><h3>${esc(l.title)}</h3>
        ${l.description ? `<p class="mo-ta">${esc(l.description)}</p>` : ''}
        ${l.ai_context ? `<div class="nhan">LÝ THUYẾT</div><div class="noi-dung">${md(l.ai_context)}</div>` : ''}
        ${tasks.length ? `<div class="nhan">BÀI TẬP THỰC HÀNH (${tasks.length})</div>` + tasks.map(t => `<div class="bt noi-dung">${md(t.instructions)}</div>`).join('') : ''}
      </section>`)
    }
  }
  const mucLuc = chuDe.map(k => `<div class="cd">${esc(k)}</div>` + theoChuDe.get(k).map(l => `<div class="bl">${esc(l.title)}</div>`).join('')).join('')
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(khoa)}</title><style>${CSS}</style></head><body>
    <div class="bia-trang"><div class="phu">Lập Trình Sáng Tạo BNP · Giáo trình</div><h1 class="bia">${esc(khoa)}</h1>
      <div class="phu">${ls.length} bài · ${soBt} bài tập thực hành</div>
      ${g?.ai_scope ? `<div class="mota">${esc(g.ai_scope)}</div>` : ''}</div>
    <div class="muc-luc"><h2>Mục lục</h2>${mucLuc}</div>
    ${phan.join('\n')}</body></html>`
  const ten = khoa.replace(/\s+/g, '_')
  const tepHtml = resolve(RA, `${ten}.html`), tepPdf = resolve(RA, `${ten}.pdf`)
  writeFileSync(tepHtml, html)
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${tepPdf}`, pathToFileURL(tepHtml).href], { stdio: 'ignore', timeout: 180000 })
  console.log(khoa, '|', ls.length, 'bài |', soBt, 'bài tập →', tepPdf)
}
await c.end()
