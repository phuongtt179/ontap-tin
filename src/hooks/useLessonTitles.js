import { useState, useEffect } from 'react'
import { layTieuDe } from '../data/chuDe'

export function useLessonTitles(unitId) {
  const [lessonTitles, setLessonTitles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (unitId) fetch()
    else setLessonTitles([])
  }, [unitId])

  async function fetch() {
    setLoading(true)
    const { data } = await layTieuDe(unitId)
    setLessonTitles(data || [])
    setLoading(false)
  }

  return { lessonTitles, loading, refetch: fetch }
}
