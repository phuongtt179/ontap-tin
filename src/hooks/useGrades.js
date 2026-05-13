import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGrades() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    const { data } = await supabase.from('classes').select('grade').order('grade')
    const unique = [...new Set(data?.map(g => g.grade).filter(Boolean) || [])]
    setGrades(unique)
    setLoading(false)
  }

  return { grades, loading, refetch: fetch }
}
