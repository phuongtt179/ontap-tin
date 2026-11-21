// Hướng dẫn định dạng từng loại câu hỏi khi dán từ Word (chữ cố định).

export default function HuongDanNhap() {
  return (
    <details className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mb-2">
      <summary className="px-4 py-2.5 text-sm font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition">
        📋 Hướng dẫn định dạng từng loại câu hỏi
      </summary>
      <div className="px-4 pb-4 pt-2 space-y-3 text-xs text-gray-600 font-mono">

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">Mã loại câu hỏi (tùy chọn, đặt ngay sau "Câu N:")</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`[TN] Trắc nghiệm    [DS] Đúng/Sai     [DT] Điền từ      [KT] Kéo thả từ
[SX] Sắp xếp        [ND] Ghép đôi     [ST] Sắp xếp từ  [TL] Tự luận

Ví dụ: Câu 1: [TN] Thiết bị nào dùng để nhập dữ liệu?
       Câu 5: [SX] Sắp xếp các bước khởi động máy tính`}</pre>
          <p className="font-sans text-gray-400 mt-1">Không dùng mã → hệ thống tự nhận dạng từ nội dung. Mã [SX] bắt buộc cho câu sắp xếp có code.</p>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">1. Trắc nghiệm</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 1: [TN] Thiết bị nào dùng để nhập dữ liệu?
A. Màn hình
B. Bàn phím
C. Loa
D. Máy in
Đáp án: B
Gợi ý: Bàn phím là thiết bị INPUT`}</pre>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">2. Đúng / Sai</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 2: CPU là bộ não của máy tính. Đúng hay sai?
Đáp án: Đúng`}</pre>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">3. Điền từ — 1 hoặc nhiều chỗ trống</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 3: [DT] ___ là thiết bị dùng để nhập văn bản.
Đáp án: Bàn phím

Câu 4: [DT] ___ là thiết bị nhập, ___ là thiết bị xuất.
Đáp án: Bàn phím, Màn hình`}</pre>
          <p className="font-sans text-gray-400 mt-1">Số đáp án = số ___ trong câu (phân cách dấu phẩy)</p>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">4. Kéo thả từ — 1 hoặc nhiều chỗ trống</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 5: [KT] ___ là ngôn ngữ lập trình, ___ là phần mềm soạn thảo.
Từ: Python, Word, Excel, Scratch
Đáp án: Python, Word`}</pre>
          <p className="font-sans text-gray-400 mt-1">Từ thừa trong "Từ:" → từ gây nhiễu. Số đáp án = số ___.</p>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">5. Sắp xếp thứ tự</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 6: [SX] Sắp xếp các bước khởi động máy tính
1. Bật màn hình
2. Bật thùng máy
3. Đăng nhập`}</pre>
          <p className="font-sans text-gray-400 mt-1">Dùng [SX] để tránh nhầm lẫn — đặc biệt khi câu hỏi có code.</p>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">6. Ghép đôi</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 7: [ND] Ghép thiết bị với chức năng
Bàn phím | Nhập văn bản
Chuột | Di chuyển con trỏ
Màn hình | Hiển thị thông tin`}</pre>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">7. Sắp xếp từ thành câu</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 8: [ST] Sắp xếp các từ thành câu đúng
Câu đúng: Bàn phím là thiết bị nhập dữ liệu`}</pre>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">8. Tự luận</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 9: [TL] Em hãy nêu tên 3 thiết bị nhập dữ liệu
Gợi ý: Bàn phím, chuột, màn hình cảm ứng`}</pre>
        </div>

        <div>
          <p className="font-sans font-semibold text-gray-700 mb-1">9. Câu hỏi có code — dùng ---python / --- (dễ gõ)</p>
          <pre className="bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">{`Câu 10: [TN] Đoạn code sau in ra kết quả gì?
---python
x = 5
print(x + 3)
---
A. 5
B. 3
C. 8
D. 53
Đáp án: C

Câu 11: [DT] Điền từ còn thiếu vào chỗ ___ để in ra "Xin chào"
---python
___("Xin chào")
---
Đáp án: print

Câu 12: [KT] Kéo thả từ đúng vào chỗ trống
---python
x = ___
y = ___
print(x + y)
---
Từ: 10, 20, 30, "hello"
Đáp án: 10, 20`}</pre>
          <p className="font-sans text-gray-400 mt-1">---python / --- dễ gõ hơn backtick. Cũng dùng được: ```python ... ```</p>
        </div>

      </div>
    </details>
  )
}
