// Link video giáo viên dán → link nhúng YouTube (null nếu không nhận ra — khi đó hiện link thường).
export function getEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (url.includes('/embed/')) return url
  return null
}
