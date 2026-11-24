import { describe, it, expect } from 'vitest'
import { loiBaiLuyen, chonNgauNhien, locBai, DANG_PYTHON } from './nganHang'

describe('loiBaiLuyen — kiểm tra bài ngân hàng trước khi lưu', () => {
  const bai = { ten: 'Tổng', ung_dung: 'python', cach_cham: 'test', do_kho: 'de' }
  it('hợp lệ', () => expect(loiBaiLuyen(bai, [{ expected: '3' }])).toBeNull())
  it('thiếu tên', () => expect(loiBaiLuyen({ ...bai, ten: '  ' }, [{ expected: '3' }])).toMatch(/tên/))
  it('chấm bằng test mà không có test có output', () => expect(loiBaiLuyen(bai, [{ expected: ' ' }])).toMatch(/test/))
  it('chấm theo tiêu chí không cần test', () => expect(loiBaiLuyen({ ...bai, ung_dung: 'scratch', cach_cham: 'tieu_chi' })).toBeNull())
  it('ứng dụng / độ khó lạ bị chặn', () => {
    expect(loiBaiLuyen({ ...bai, ung_dung: 'excel' }, [{ expected: '1' }])).toMatch(/ứng dụng/)
    expect(loiBaiLuyen({ ...bai, do_kho: 'sieu_kho' }, [{ expected: '1' }])).toMatch(/Độ khó/)
  })
})

describe('chonNgauNhien — tạo đề ngẫu nhiên', () => {
  const ds = [
    { id: 'a', dang: 'Xâu', do_kho: 'de' }, { id: 'b', dang: 'Xâu', do_kho: 'kho' },
    { id: 'c', dang: 'Dãy số quy luật', do_kho: 'de' }, { id: 'd', dang: 'Dãy số quy luật', do_kho: 'kho', tu_khoa_hoc: true },
    { id: 'e', dang: 'Dãy số quy luật', do_kho: 'kho' },
  ]
  const rand = () => 0   // cố định để kiểm tra
  it('lấy đúng số bài theo từng yêu cầu, không trùng', () => {
    const { ids } = chonNgauNhien(ds, [{ so: 2, do_kho: 'de' }, { so: 2, do_kho: 'kho' }], { rand })
    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
    expect(ids.slice(0, 2).sort()).toEqual(['a', 'c'])
  })
  it('lọc theo dạng', () => expect(chonNgauNhien(ds, [{ so: 1, dang: 'Xâu', do_kho: 'kho' }], { rand }).ids).toEqual(['b']))
  it('bỏ qua bài đã dùng và bài từ khoá học', () => {
    expect(chonNgauNhien(ds, [{ so: 1, dang: 'Dãy số quy luật', do_kho: 'kho' }], { boQua: new Set(['e']), tranhKhoaHoc: true, rand }))
      .toEqual({ loi: expect.stringMatching(/Không đủ bài/) })
  })
  it('không đủ bài → báo, không trả đề thiếu', () => expect(chonNgauNhien(ds, [{ so: 9 }]).loi).toMatch(/cần 9, chỉ còn 5/))
  it('yêu cầu sau không lấy lại bài yêu cầu trước đã chọn', () => {
    const { ids } = chonNgauNhien(ds, [{ so: 3, dang: 'Dãy số quy luật' }, { so: 2 }], { rand })
    expect(new Set(ids).size).toBe(5)
  })
  it('danh sách dạng có "Tổng hợp" và không trùng', () => {
    expect(DANG_PYTHON).toContain('Tổng hợp')
    expect(new Set(DANG_PYTHON).size).toBe(DANG_PYTHON.length)
  })
})

describe('locBai — lọc ngân hàng', () => {
  const ds = [
    { id: 1, ten: 'Đếm số', nguon: 'THTA 2025 Đà Nẵng', dang: 'Xâu', do_kho: 'de', khoa: ['K1'] },
    { id: 2, ten: 'Tổng dãy', nguon: 'Khoá Nâng cao', dang: 'Dãy số quy luật', do_kho: 'kho', tu_khoa_hoc: true },
  ]
  it('tìm không dấu theo tên hoặc nguồn', () => {
    expect(locBai(ds, { tim: 'dem so' }).map(b => b.id)).toEqual([1])
    expect(locBai(ds, { tim: 'da nang' }).map(b => b.id)).toEqual([1])
  })
  it('lọc dạng, độ khó, khoá, bỏ bài khoá học', () => {
    expect(locBai(ds, { dang: 'Xâu' }).map(b => b.id)).toEqual([1])
    expect(locBai(ds, { do_kho: 'kho' }).map(b => b.id)).toEqual([2])
    expect(locBai(ds, { khoa: 'K1' }).map(b => b.id)).toEqual([1])
    expect(locBai(ds, { boKhoaHoc: true }).map(b => b.id)).toEqual([1])
  })
})
