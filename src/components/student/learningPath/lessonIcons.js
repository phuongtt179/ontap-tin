// Suy ra emoji minh hoạ cho 1 bài học / 1 chủ đề dựa trên từ khoá trong tên.
// Tách từ LearnPage.jsx để dùng chung khi ghép node/thẻ chủ đề.

export function getLessonEmoji(lesson) {
  const t = (lesson.title + ' ' + (lesson.topic || '')).toLowerCase()
  if (t.includes('làm quen') || t.includes('giới thiệu')) return '👋'
  if (t.includes('chuyển động') || t.includes('motion')) return '🚀'
  if (t.includes('ngoại hình') || t.includes('looks') || t.includes('trang phục')) return '🎨'
  if (t.includes('âm thanh') || t.includes('sound') || t.includes('nhạc')) return '🎵'
  if (t.includes('broadcast') || t.includes('tin nhắn')) return '📣'
  if (t.includes('sự kiện') || t.includes('event')) return '⚡'
  if (t.includes('vòng lặp') || t.includes('loop') || t.includes('lặp lại')) return '🔁'
  if (t.includes('điều kiện') || t.includes('if') || t.includes('rẽ nhánh')) return '🔀'
  if (t.includes('biến') || t.includes('variable')) return '📦'
  if (t.includes('toán tử') || t.includes('phép tính') || t.includes('operator')) return '🔢'
  if (t.includes('danh sách') || t.includes('list')) return '📋'
  if (t.includes('bút') || t.includes('pen') || t.includes('vẽ đường')) return '🖊️'
  if (t.includes('nhân vật') || t.includes('sprite')) return '🦸'
  if (t.includes('backdrop') || t.includes('cảnh nền') || t.includes('sân khấu')) return '🌄'
  if (t.includes('game') || t.includes('trò chơi')) return '🎮'
  if (t.includes('animation') || t.includes('hoạt hình')) return '🎬'
  if (t.includes('cảm biến') || t.includes('sensing')) return '📡'
  if (t.includes('clone') || t.includes('nhân bản')) return '🪞'
  if (t.includes('project') || t.includes('dự án') || t.includes('sản phẩm')) return '🏆'
  if (t.includes('ôn tập') || t.includes('tổng hợp') || t.includes('tổng kết')) return '📚'
  if (t.includes('bài tập') || t.includes('luyện tập')) return '✏️'
  if (t.includes('kiểm tra') || t.includes('test')) return '📝'
  if (t.includes('gõ phím') || t.includes('typing')) return '⌨️'
  if (t.includes('chuột') || t.includes('mouse')) return '🖱️'
  if (t.includes('paint') || t.includes('vẽ')) return '🎨'
  if (t.includes('internet') || t.includes('web')) return '🌐'
  if (t.includes('an toàn')) return '🛡️'
  if (t.includes('word') || t.includes('văn bản')) return '📝'
  if (t.includes('excel') || t.includes('bảng tính')) return '📊'
  if (t.includes('glide') || t.includes('trượt')) return '⛷️'
  if (t.includes('python')) return '🐍'
  if (t.includes('scratch')) return '🐱'
  // Deterministic fallback per lesson title
  const hash = lesson.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ['💡', '🔧', '⚙️', '🎯', '🌟', '🧩', '🔬', '🎪', '🖥️', '🏅', '🎁', '🌈'][hash % 12]
}

export function getTopicEmoji(topic) {
  const t = topic.toLowerCase()
  if (t.includes('scratch')) return '🐱'
  if (t.includes('gõ phím') || t.includes('bàn phím') || t.includes('typing')) return '⌨️'
  if (t.includes('paint') || t.includes('vẽ')) return '🎨'
  if (t.includes('python')) return '🐍'
  if (t.includes('máy tính') || t.includes('computer')) return '🖥️'
  if (t.includes('internet') || t.includes('mạng') || t.includes('web')) return '🌐'
  if (t.includes('word') || t.includes('văn bản')) return '📝'
  if (t.includes('excel') || t.includes('bảng tính')) return '📊'
  if (t.includes('game')) return '🎮'
  if (t.includes('an toàn')) return '🛡️'
  if (t.includes('nền tảng')) return '🏗️'
  if (t.includes('sự kiện') || t.includes('event')) return '⚡'
  if (t.includes('chuyển động') || t.includes('motion')) return '🚀'
  if (t.includes('animation') || t.includes('hoạt hình')) return '🎬'
  if (t.includes('âm thanh') || t.includes('sound')) return '🎵'
  const hash = topic.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ['📚', '💡', '🎯', '🏆', '🧩', '🌟', '🔬', '🎪'][hash % 8]
}
