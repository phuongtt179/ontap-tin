// Dựng thử trình soạn bài giảng (PowerPoint trên web): trống, có trang + ô chữ + ảnh, chỉ xem; màn hình Tệp; chế độ trình chiếu.
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import PPTEditor from '../PPTEditor'
import FileBackstage from './FileBackstage'
import { SlideThumb } from './HienThiTrang'
import { newSlide, newTextEl } from './hangSo'

const khong = () => {}
const trang = { ...newSlide(), elements: [{ ...newTextEl(), content: 'Xin chào' }, { id: 'a', type: 'image', x: 1, y: 1, w: 10, h: 10, src: 'https://x.test/a.png' }] }

describe('trình soạn bài giảng', () => {
  it('trống', () => expect(renderToString(<PPTEditor onChange={khong} />).length).toBeGreaterThan(500))
  it('có trang', () => expect(renderToString(<PPTEditor content={{ slides: [trang] }} onChange={khong} />)).toContain('Xin chào'))
  it('chỉ xem', () => expect(renderToString(<PPTEditor content={{ slides: [trang] }} readonly />).length).toBeGreaterThan(100))
  it('màn hình Tệp', () => expect(renderToString(<FileBackstage slides={[trang]} presentationName="Bài 1" onClose={khong} onNew={khong} onSave={khong} onSaveAs={khong} onOpen={khong} />)).toContain('Bài 1'))
  // trình chiếu đọc kích thước cửa sổ ngay khi vẽ → chỉ chạy trong trình duyệt, không dựng thử ở đây
  it('ảnh thu nhỏ', () => expect(renderToString(<SlideThumb slide={trang} index={0} active onClick={khong} />).length).toBeGreaterThan(50))
})
