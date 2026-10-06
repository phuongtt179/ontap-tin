// Gom nội dung một bài học để AI dựa vào (soạn câu hỏi...): lý thuyết + ghi chú gia sư,
// thiếu thì đọc thêm chữ trong slide; slide PDF dạng ảnh thì trả pdfUrl để máy chủ gửi file cho AI đọc.
import { extractSlideText } from './slideText'

export async function getLessonSource(lesson) {
  let text = [lesson.ai_context, lesson.ai_tutor_notes].filter(s => s?.trim()).join('\n\n')
  let pdfUrl = null
  if (text.length < 300 && lesson.pptx_url) {
    const slides = await extractSlideText(lesson.pptx_url).catch(() => '')
    text = [text, slides].filter(s => s?.trim()).join('\n\n')
    if (text.trim().length < 40 && lesson.pptx_url.split('?')[0].toLowerCase().endsWith('.pdf')) pdfUrl = lesson.pptx_url
  }
  return { text, pdfUrl }
}
