import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import { chuanHoaKetQua, trangThaiTest, chamLanNop, loiKhongDuocNop, TOI_DA_LAN } from './chamPython'
import { chuongTrinhChay } from '../../api/thi-python.js'

describe('chuanHoaKetQua — bỏ khoảng trắng cuối dòng, dòng trống cuối bài', () => {
  it.each([
    ['5\n', '5'], ['5   \n\n\n', '5'], ['a \r\nb\t\r\n', 'a\nb'], [null, ''], [12, '12'],
  ])('%j → %j', (vao, ra) => expect(chuanHoaKetQua(vao)).toBe(ra))
  it('KHÔNG bỏ khoảng trắng đầu dòng, không gộp dòng trống giữa bài', () => {
    expect(chuanHoaKetQua(' 5')).not.toBe('5')
    expect(chuanHoaKetQua('a\n\nb')).toBe('a\n\nb')
  })
})

describe('trangThaiTest', () => {
  it('quá giờ / lỗi / đúng / sai', () => {
    expect(trangThaiTest({ tle: true }, '5')).toBe('qua_gio')
    expect(trangThaiTest({ rc: 1, out: '5' }, '5')).toBe('loi')       // lỗi dù in đúng
    expect(trangThaiTest({ rc: 0, out: '5 \n' }, '5')).toBe('dung')
    expect(trangThaiTest({ rc: 0, out: '6' }, '5')).toBe('sai')
    expect(trangThaiTest(undefined, '5')).toBe('loi')
  })
})

describe('chamLanNop — thang 10 theo trọng số test', () => {
  const tests = [{ expected: '1', diem: 1 }, { expected: '2', diem: 1 }, { expected: '3', diem: 2 }]
  it('đúng test 1 và 3 → 3/4 → 7,5 điểm', () => {
    const r = chamLanNop(tests, [{ rc: 0, out: '1' }, { rc: 0, out: 'x' }, { rc: 0, out: '3' }])
    expect(r.diem).toBe(7.5)
    expect(r.ket_qua).toEqual([{ stt: 1, trang_thai: 'dung' }, { stt: 2, trang_thai: 'sai' }, { stt: 3, trang_thai: 'dung' }])
  })
  it('kết quả trả học sinh KHÔNG chứa input / output', () => {
    const r = chamLanNop(tests, [{ rc: 0, out: '1' }, { tle: true }, { rc: 1, out: '' }])
    expect(JSON.stringify(r.ket_qua)).not.toMatch(/expected|input|out/)
  })
  it('điểm dạng chuỗi (từ cơ sở dữ liệu) vẫn cộng đúng; 1/3 → 3,33', () => {
    const r = chamLanNop([{ expected: 'a', diem: '1' }, { expected: 'b', diem: '1' }, { expected: 'c', diem: '1' }],
      [{ rc: 0, out: 'a' }, { rc: 0, out: '' }, { rc: 0, out: '' }])
    expect(r.diem).toBe(3.33)
  })
  it('đề không có điểm → 0 (không ra NaN)', () => {
    expect(chamLanNop([{ expected: 'a', diem: 0 }], [{ rc: 0, out: 'a' }]).diem).toBe(0)
  })
})

describe('loiKhongDuocNop — điều kiện nộp thêm 1 lần', () => {
  const bayGio = new Date('2026-11-12T08:30:00Z').getTime()
  const bt = { user_id: 'em', practical_type: 'python', submitted_at: null,
    started_at: '2026-11-12T08:00:00Z', time_limit: 30, practical_lan: 0 }
  it('hợp lệ → null', () => expect(loiKhongDuocNop(bt, 'em', bayGio)).toBeNull())
  it('bài của người khác / không có bài → forbidden', () => {
    expect(loiKhongDuocNop(bt, 'ban_khac', bayGio)).toBe('forbidden')
    expect(loiKhongDuocNop(null, 'em', bayGio)).toBe('forbidden')
  })
  it('không phải đề Python', () => expect(loiKhongDuocNop({ ...bt, practical_type: 'scratch' }, 'em', bayGio)).toBe('khong_phai_de_python'))
  it('đã nộp bài', () => expect(loiKhongDuocNop({ ...bt, submitted_at: '2026-11-12T08:20:00Z' }, 'em', bayGio)).toBe('da_nop_bai'))
  it('gia hạn 2 phút: trễ 1 phút vẫn được, trễ 3 phút thì hết giờ', () => {
    expect(loiKhongDuocNop(bt, 'em', bayGio + 60000)).toBeNull()
    expect(loiKhongDuocNop(bt, 'em', bayGio + 3 * 60000)).toBe('het_gio')
  })
  it('đề không giới hạn giờ → không bao giờ hết giờ', () =>
    expect(loiKhongDuocNop({ ...bt, time_limit: null }, 'em', bayGio + 10 * 3600000)).toBeNull())
  it(`hết ${TOI_DA_LAN} lượt`, () => {
    expect(loiKhongDuocNop({ ...bt, practical_lan: TOI_DA_LAN - 1 }, 'em', bayGio)).toBeNull()
    expect(loiKhongDuocNop({ ...bt, practical_lan: TOI_DA_LAN }, 'em', bayGio)).toBe('het_luot')
  })
})

// Chạy THẬT chương trình chấm (cái máy chủ gửi sang Wandbox) bằng Python trên máy — bỏ qua nếu máy không có Python
let coPython = false
try { execFileSync('python', ['--version']); coPython = true } catch { /* không có python */ }

describe.skipIf(!coPython)('chương trình chấm chạy thật bằng Python', () => {
  const chay = (code, inputs) => {
    const out = execFileSync('python', ['-'], { input: chuongTrinhChay(code, inputs), encoding: 'utf8', timeout: 20000 })
    return JSON.parse(out.split('\n').find(l => l.startsWith('@@KQ@@')).slice(6))
  }
  const tests = [{ input: '2 3\n', expected: '5', diem: 1 }, { input: '10 -4\n', expected: '6', diem: 1 }]

  it('bài đúng (có tiếng Việt trong mã) → 10 điểm', () => {
    const ma = '# tính tổng\na, b = map(int, input().split())\nprint(a + b)'
    expect(chamLanNop(tests, chay(ma, tests.map(t => t.input))).diem).toBe(10)
  })
  it('bài sai một test → 5 điểm', () => {
    const ma = 'a, b = map(int, input().split())\nprint(abs(a) + abs(b))'
    const r = chamLanNop(tests, chay(ma, tests.map(t => t.input)))
    expect(r.diem).toBe(5)
    expect(r.ket_qua.map(k => k.trang_thai)).toEqual(['dung', 'sai'])
  })
  it('bài lỗi cú pháp → lỗi, 0 điểm', () => {
    const r = chamLanNop(tests, chay('print(', tests.map(t => t.input)))
    expect(r.ket_qua.map(k => k.trang_thai)).toEqual(['loi', 'loi'])
    expect(r.diem).toBe(0)
  })
  it('vòng lặp vô hạn → quá giờ sau 2 giây, không treo máy chấm', () => {
    const r = chamLanNop(tests, chay('while True:\n    pass', tests.map(t => t.input)))
    expect(r.ket_qua.map(k => k.trang_thai)).toEqual(['qua_gio', 'qua_gio'])
  }, 15000)
  it('mã có dấu nháy, \\ và ${} không làm vỡ chương trình chấm', () => {
    const ma = 'x = input()\nprint("\\"${x}\\"" if False else \'5\')'
    expect(chay(ma, ['a\n'])).toEqual([{ rc: 0, out: '5\n' }])
  })
})
