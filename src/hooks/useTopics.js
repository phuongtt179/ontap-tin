import { useState, useEffect } from 'react'
import { layChuDe } from '../data/chuDe'

export function useTopics() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    const { data } = await layChuDe()   // đã xếp theo tên
    setTopics(data || [])
    setLoading(false)
  }

  return { topics, loading, refetch: fetch }
}
