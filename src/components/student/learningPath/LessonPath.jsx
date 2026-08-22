import { useMemo } from 'react'
import { computePoints, computeWidth, buildPath } from './pathGeometry'
import LessonNode from './LessonNode'

/**
 * Con đường bài học — 1 con đường uốn lượn nằm NGANG (lò xo nằm ngang) nối
 * hết bài đầu tới bài cuối, cuộn sang phải. Mỗi bài học = đúng 1 node.
 * `lessons` mỗi phần tử cần {id, title, state, stars} đã được caller tính
 * sẵn (xem lessonSteps.js). `height` đo từ khung cuộn ngoài qua
 * useContainerHeight — height=0 (chưa đo xong) thì không render.
 */
export default function LessonPath({ lessons, height, onNavigate }) {
  const points = useMemo(() => computePoints(height, lessons.length), [height, lessons.length])
  const width = useMemo(() => computeWidth(points), [points])
  const bgPath = useMemo(() => buildPath(points), [points])

  const progressEndIdx = useMemo(() => {
    const currentIdx = lessons.findIndex(l => l.state === 'current')
    if (currentIdx >= 0) return currentIdx
    let lastDone = -1
    lessons.forEach((l, i) => { if (l.state === 'done') lastDone = i })
    return lastDone
  }, [lessons])

  const progressPath = useMemo(
    () => (progressEndIdx >= 0 ? buildPath(points.slice(0, progressEndIdx + 1)) : ''),
    [points, progressEndIdx]
  )

  if (!height || lessons.length === 0) return <div style={{ width: 160 }} />

  return (
    <div className="relative shrink-0" style={{ width, height }}>
      <svg width={width} height="100%" viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 pointer-events-none" preserveAspectRatio="none">
        {/* Nét nối mảnh, chấm nhạt — kiểu tối giản, dễ nhìn */}
        <path d={bgPath} fill="none" stroke="var(--stone)" strokeWidth={6} strokeLinecap="round" strokeDasharray="1 16" opacity={0.8} />
        {progressPath && (
          <path d={progressPath} fill="none" stroke="var(--leaf)" strokeWidth={6} strokeLinecap="round" strokeDasharray="1 16" opacity={0.95} />
        )}
      </svg>

      {lessons.map((lesson, i) => (
        <LessonNode
          key={lesson.id}
          lesson={lesson}
          number={i + 1}
          state={lesson.state}
          stars={lesson.stars}
          isNewest={lesson.isNewest}
          point={points[i]}
          onNavigate={() => onNavigate(lesson.id)}
        />
      ))}
    </div>
  )
}
