import { useState, useEffect } from 'react'
import { layCacKhoa } from '../data/khoaHoc'

export function useGrades() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    const { data } = await layCacKhoa()
    setGrades(data?.map(g => g.value) || [])
    setLoading(false)
  }

  return { grades, loading, refetch: fetch }
}
