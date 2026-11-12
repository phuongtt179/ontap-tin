import { describe, it, expect } from 'vitest'
import { docDanhSachNhap, tenDangNhapCanKiemTra, danhDauTrung, loiTaoTaiKhoan, ghepGhiDanh, locTheoKhoaLop, chiaTheoDuyet, timTheoTen, mauTheoKhoa } from './hocSinh'

describe('đọc danh sách nhập', () => {
  const ds = docDanhSachNhap('Nguyễn Văn An, nguyenvanan, matkhau123, Kĩ Năng 1, Ca 1\n\n  Bình\tbinh\tabc  \nCường, cuong\nDung, dung có dấu, 123456\n, x, 123456')
  it('bỏ dòng trống, đánh số dòng theo dòng có chữ', () => expect(ds.map(r => r._line)).toEqual([1, 2, 3, 4, 5]))
  it('dòng đủ cột: tách phẩy / tab, khoá + ca tuỳ chọn', () => {
    expect(ds[0]).toMatchObject({ full_name: 'Nguyễn Văn An', username: 'nguyenvanan', password: 'matkhau123', grade: 'Kĩ Năng 1', class_name: 'Ca 1', _errors: [] })
    expect(ds[1]).toMatchObject({ username: 'binh', grade: '', class_name: '' })
  })
  it('lỗi: mật khẩu ngắn, thiếu cột, tên đăng nhập có dấu cách, thiếu họ tên', () => {
    expect(ds[1]._errors).toEqual(['Mật khẩu ít nhất 6 ký tự'])
    expect(ds[2]._errors[0]).toMatch(/cần ít nhất 3 cột/)
    expect(ds[3]._errors).toEqual(['Tên đăng nhập chỉ gồm a-z, 0-9, _ .'])
    expect(ds[4]._errors).toEqual(['Thiếu họ tên'])
  })
  it('đánh dấu trùng chỉ ở dòng hợp lệ', () => {
    expect(tenDangNhapCanKiemTra(ds)).toEqual(['nguyenvanan', 'binh', 'dung có dấu', 'x'])
    const kq = danhDauTrung(ds, new Set(['nguyenvanan', 'binh']))
    expect(kq[0]).toMatchObject({ _duplicate: true, _errors: ['Tên đăng nhập "nguyenvanan" đã tồn tại'] })
    expect(kq[1]._duplicate).toBeUndefined()   // đã lỗi mật khẩu → giữ lỗi cũ
  })
  it('lỗi tạo tài khoản dễ hiểu', () => {
    expect(loiTaoTaiKhoan('A user with this email address has already been registered')).toBe('Tên đăng nhập đã tồn tại')
    expect(loiTaoTaiKhoan('mạng lỗi')).toBe('mạng lỗi')
  })
})

describe('danh sách học sinh', () => {
  const hoSo = [
    { id: 'a', full_name: 'An', is_approved: true },
    { id: 'b', full_name: 'Bình', is_approved: true },
    { id: 'c', full_name: 'Chi', is_approved: false },
    { id: 'd', full_name: 'Dũng', is_approved: true },
  ]
  const ghiDanh = [
    { id: 1, user_id: 'a', grade: 'K5', class_name: 'Ca 2', is_approved: true },
    { id: 2, user_id: 'a', grade: 'K3', class_name: null, is_approved: true },
    { id: 3, user_id: 'b', grade: 'K5', class_name: 'Ca 1', is_approved: false },
    { id: 4, user_id: 'c', grade: 'K5', class_name: 'Ca 1', is_approved: true },
  ]
  const ds = ghepGhiDanh(hoSo, ghiDanh)
  it('ghép: ghi danh xếp theo khoá, khoá / lớp hiển thị = ghi danh đầu', () => {
    expect(ds[0]).toMatchObject({ grade: 'K3', class_name: '' })
    expect(ds[0].enrollments.map(e => e.id)).toEqual([2, 1])
    expect(ds[3]).toMatchObject({ enrollments: [], grade: '', class_name: '' })
  })
  it('lọc khoá / lớp + xếp theo lớp rồi tên', () => {
    expect(locTheoKhoaLop(ds).map(s => s.id)).toEqual(['a', 'd', 'b', 'c'])
    expect(locTheoKhoaLop(ds, { khoa: 'K5' }).map(s => s.id)).toEqual(['a', 'b', 'c'])
    expect(locTheoKhoaLop(ds, { khoa: 'K5', lop: 'Ca 1' }).map(s => s.id)).toEqual(['b', 'c'])
  })
  it('chờ duyệt = tài khoản chưa duyệt hoặc còn ghi danh chờ', () => {
    const { choDuyet, daDuyet } = chiaTheoDuyet(ds)
    expect(choDuyet.map(s => s.id)).toEqual(['b', 'c'])
    expect(daDuyet.map(s => s.id)).toEqual(['a', 'd'])
  })
  it('tìm tên không phân biệt hoa thường', () => {
    expect(timTheoTen(ds, 'bÌ').map(s => s.id)).toEqual(['b'])
    expect(timTheoTen(ds, '')).toBe(ds)
  })
  it('màu khoá lặp lại sau 5 màu', () => {
    const m = mauTheoKhoa(['1', '2', '3', '4', '5', '6'])
    expect(m['6']).toBe(m['1'])
    expect(m['2']).not.toBe(m['1'])
  })
})
