import { it, expect } from 'vitest'
import { getEmbedUrl } from './video'

it.each([
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
  ['https://youtu.be/dQw4w9WgXcQ?t=10', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
  ['https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
  ['https://www.youtube.com/embed/abc', 'https://www.youtube.com/embed/abc'],
  ['https://drive.google.com/file/d/1/view', null],
  ['', null], [null, null],
])('%s', (vao, ra) => expect(getEmbedUrl(vao)).toBe(ra))
