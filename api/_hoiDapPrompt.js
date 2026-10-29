// Lời nhắc AI soạn HỎI ĐÁP MẪU cho 1 bài học (giáo viên duyệt trước khi học sinh thấy).
// File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó. Chỉ nội dung bài học, không dữ liệu học sinh.
export function hoiDapPrompt({ lessonTitle, grade, sourceText, questions, daCo, soCau }) {
  return `Bạn là giáo viên Tin học tiểu học, dạy lập trình sáng tạo (Scratch, Python) và kĩ năng Tin học.
Hãy soạn ${soCau} cặp HỎI – ĐÁP cho bài "${lessonTitle}"${grade ? ` (khoá ${grade})` : ''}: những câu học sinh tiểu học HAY HỎI khi học bài này
(chưa hiểu khái niệm, không biết làm bước nào, khối lệnh / lệnh nằm ở đâu, lỗi hay gặp, chương trình chạy sai, cách lưu và nộp bài…).

YÊU CẦU:
- Câu hỏi viết như học sinh lớp 3–5 hay hỏi: ngắn, tự nhiên (vd "Khối lặp lại nằm ở đâu ạ?", "Sao chương trình em không chạy?").
- Câu trả lời 2–4 câu, xưng "thầy/cô", gọi "em", giọng ấm áp. GỢI MỞ để em tự làm: KHÔNG đưa đáp án câu hỏi trắc nghiệm,
  KHÔNG viết sẵn chương trình / lời giải bài thực hành, KHÔNG dạy kiến thức ngoài bài.
- Kiến thức CHÍNH XÁC theo nội dung bài bên dưới; gọi đúng tên khối lệnh / lệnh / menu như trong bài.
- Không trùng ý với các câu đã có.

NỘI DUNG BÀI HỌC:
${String(sourceText || '(chỉ có tên bài — soạn câu hỏi cơ bản, chắc chắn đúng)').slice(0, 14000)}

CÂU HỎI TRẮC NGHIỆM CỦA BÀI (để biết em hay vướng gì — tuyệt đối không nêu đáp án):
${(questions || []).slice(0, 15).map((q, i) => `${i + 1}. ${q}`).join('\n') || '(không có)'}

CÁC CÂU ĐÃ CÓ (không lặp lại):
${(daCo || []).slice(0, 60).map(q => `- ${q}`).join('\n') || '(chưa có)'}

CHỈ trả về một mảng JSON: [{"hoi": "...", "dap": "..."}]`
}
