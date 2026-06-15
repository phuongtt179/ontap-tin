import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLessonTitles(unitId) {
  const [lessonTitles, setLessonTitles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (unitId) fetch()
    else setLessonTitles([])
  }, [unitId])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('lesson_titles')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order')
      .order('name')
    setLessonTitles(data || [])
    setLoading(false)
  }

  return { lessonTitles, loading, refetch: fetch }
}
