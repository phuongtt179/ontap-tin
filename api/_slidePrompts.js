// Lời nhắc AI soạn bài giảng web: ① kịch bản chữ (giáo viên duyệt) → ② slide JSON (src/components/slides/slideModel.js).
// Chuyển từ app Lớp học số (api/_lib/soan-bai.js), đổi nguồn từ SGK sang nội dung bài học có sẵn trong app.
// File bắt đầu bằng "_" nên Vercel KHÔNG tạo route cho nó. Chỉ nội dung bài học, không dữ liệu học sinh.

const PHONG_CACH = `PHONG CÁCH SOẠN BÀI (bắt buộc theo):
- 1 tiết khoảng 35–40 phút, học sinh tiểu học (lớp 3–5) học lập trình / Tin học, phòng máy mỗi em 1 máy. Có nhân vật "Bạn Máy Tính" dẫn chuyện, đặt một tên gọi vui cho cả bài (vd "Thám tử vòng lặp", "Đầu bếp danh sách").
- Slide 1: trang bìa. Khởi động bằng tình huống gần gũi đời sống; nêu mục tiêu và một "câu hỏi lớn".
- Dạy từng ý nhỏ, mỗi ý: ví dụ cụ thể → câu hỏi kiểm tra nhanh → chốt ghi nhớ. Đáp án / ý chốt để BẤM MỚI HIỆN.
- Học sinh trả lời bằng ĐỘNG TÁC: O = đúng, X = sai; A chạm đầu, B chạm vai, C chạm tai, D chạm mũi. Có thảo luận nhóm đôi, có đồng hồ đếm giờ cho thảo luận / thực hành.
- Bài PYTHON: mỗi khái niệm có ví dụ code NGẮN (≤ 10 dòng) để giáo viên bấm ▶ Chạy trước lớp; có câu "đoán kết quả" trước khi chạy; nêu lỗi hay gặp. Bài SCRATCH: gọi đúng tên khối lệnh tiếng Việt (in đậm) và nhóm khối (Chuyển động, Hiển thị, Sự kiện, Điều khiển…), mô tả các bước kéo thả rõ ràng.
- Có phần THỰC HÀNH trên máy bám đúng bài thực hành của bài học (các bước rõ ràng, có đồng hồ).
- Kết thúc: ghi nhớ + dặn dò (làm câu hỏi và nộp bài thực hành trên app Lập Trình Sáng Tạo).
- Tiếng Việt chuẩn, câu ngắn, hợp lứa tuổi; kiến thức CHÍNH XÁC theo nội dung bài được cung cấp, KHÔNG thêm lệnh / khái niệm ngoài bài.`

export function slideScriptPrompt({ lessonTitle, grade, topic, sourceText, questions, extra }) {
  return `Bạn là giáo viên Tin học tiểu học Việt Nam giàu kinh nghiệm, dạy lập trình sáng tạo (Scratch, Python) và kĩ năng Tin học.
Hãy viết KỊCH BẢN SLIDE (dạng chữ, để giáo viên duyệt) để dạy trên lớp bài: "${lessonTitle}"${grade ? ` — khoá ${grade}` : ''}${topic ? ` — chủ đề ${topic}` : ''}.

${PHONG_CACH}

NỘI DUNG BÀI HỌC (nguồn chính để soạn — lý thuyết, bài thực hành):
${String(sourceText || '(không có — soạn theo tên bài, thận trọng, chỉ kiến thức cơ bản chắc chắn đúng)').slice(0, 14000)}

CÂU HỎI CÓ SẴN TRONG BÀI (nên dùng lại vài câu cho phần kiểm tra nhanh, giữ đúng đáp án):
${(questions || []).slice(0, 15).map((q, i) => `${i + 1}. ${q}`).join('\n') || '(không có)'}
${extra ? '\nYÊU CẦU THÊM CỦA GIÁO VIÊN: ' + String(extra).slice(0, 800) : ''}

ĐỊNH DẠNG XUẤT (văn bản thuần, không markdown đậm/nghiêng ngoài dấu #):
Dòng đầu: "Tên gọi vui của bài: …" rồi "Mục tiêu: …".
Mỗi slide: dòng "## Slide n – NHÃN – Tiêu đề" (NHÃN như KHỞI ĐỘNG, MỤC TIÊU, KIẾN THỨC, VÍ DỤ, CÂU HỎI, THỰC HÀNH, LUYỆN TẬP, KẾT THÚC), sau đó các gạch đầu dòng "- " mô tả nội dung trên slide;
"- Bấm hiện: …" cho đáp án / ý chốt; "- Đồng hồ: n phút"; "- Câu hỏi A–D: … (đáp án: B)"; "- Đúng/Sai: … (đáp án: Sai)";
với code Python viết "- Code:" rồi khối code đặt giữa hai dòng \`\`\`python và \`\`\` (nếu code có input() thì thêm dòng "- Dữ liệu nhập: …").
Khoảng 12–16 slide, tổng thời lượng vừa 1 tiết.`
}

const LUOC_DO = `MỖI SLIDE là một đối tượng JSON có "loai" thuộc:
1) {"loai":"bia","nhan":"Python A · Bài 5","tieu":"TÊN BÀI IN HOA","phu":"Tên gọi vui!","khau_hieu":"…"}
2) {"loai":"noi_dung","tieu":"…","tem":"KHỞI ĐỘNG","mau":"ngoc|dat|mutat|thep|reu","khoi":[ KHỐI… ],"ghi_chu":"hướng dẫn tổ chức cho giáo viên"}
3) {"loai":"trac_nghiem","tieu":"…","tem":"CÂU HỎI","mau":"mutat","cau":"câu hỏi","lua_chon":["2–4 lựa chọn"],"dung":0,"giai_thich":"…"}
4) {"loai":"dung_sai","tieu":"…","tem":"O / X","mau":"reu","cau":"nhận định","dung":true,"giai_thich":"…"}
KHỐI trong slide noi_dung (thêm "an":true để bấm mới hiện; với the/buoc/danh_sach thêm "tung":true để hiện từng mục):
{"loai":"loi","ai":"may","chu":"lời Bạn Máy Tính"} · {"loai":"hoi_thoai","cac":[{"ai":"Khoa","chu":"…"}]} · {"loai":"cau","chu":"câu hỏi"}
{"loai":"the","cac":[{"icon":"bong_den|may|ban_phim|chuot|web|tep|thu_muc|khoa|tim|ngoi_sao|khien","tieu":"…","chu":"…","vd":"ví dụ"}]} (1–3 thẻ)
{"loai":"buoc","cac":["bước…"],"ngang":false} · {"loai":"danh_sach","cac":["ý…"]} · {"loai":"ghi_nho","chu":"…"} · {"loai":"dap_an","an":true,"chu":"…"}
{"loai":"code","chu":"code Python, xuống dòng bằng \\n, thụt lề 4 dấu cách","chay":true,"stdin":"dữ liệu nhập cho input(), mỗi dòng 1 lần"} · {"loai":"dong_ho","giay":120}
{"loai":"hai_cot","ti_le":"3fr 2fr","trai":[KHỐI…],"phai":[KHỐI…]} (vd code bên trái, giải thích / đáp án bên phải)
Câu hỏi (cau) của trac_nghiem / dung_sai có thể chứa code đặt giữa \`\`\`python\\n … \`\`\`.
Chữ có thể dùng **đậm**, ==tô vàng== và \`tên lệnh\`.`

export function slideBuildPrompt({ kichBan }) {
  return `Chuyển KỊCH BẢN dưới đây thành bài giảng web dạng JSON. Giữ đúng thứ tự, nội dung, đáp án, code của kịch bản; câu hỏi A–D dùng slide trac_nghiem; câu Đúng/Sai dùng dung_sai; code dùng khối code.
Mỗi slide noi_dung tối đa 4–5 khối, chữ ngắn gọn (slide chiếu cho học sinh, không dài dòng); đáp án / ý chốt đặt "an":true; ghi hướng dẫn tổ chức vào "ghi_chu".

${LUOC_DO}

KỊCH BẢN:
${String(kichBan || '').slice(0, 14000)}

CHỈ XUẤT MỘT MẢNG JSON các slide, không thêm chữ nào khác.`
}
