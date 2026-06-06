import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnits(grade, topic) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (grade && topic) fetch()
    else setUnits([])
  }, [grade, topic])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('grade', grade)
      .eq('topic', topic)
      .order('sort_order')
      .order('name')
    setUnits(data || [])
    setLoading(false)
  }

  return { units, loading, refetch: fetch }
}

// Fetch all units for a grade (all topics)
export function useUnitsByGrade(grade) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (grade) fetch()
    else setUnits([])
  }, [grade])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('grade', grade)
      .order('topic')
      .order('sort_order')
      .order('name')
    setUnits(data || [])
    setLoading(false)
  }

  return { units, loading, refetch: fetch }
}
