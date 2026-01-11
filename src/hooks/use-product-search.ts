'use client'

import { useState, useCallback } from 'react'
import type { SupermarketProduct } from '@/types/database'

export function useProductSearch() {
  const [results, setResults] = useState<SupermarketProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, store?: 'woolworths' | 'coles') => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: query })
      if (store) params.set('store', store)

      const res = await fetch(`/api/products/search?${params}`)
      if (!res.ok) throw new Error('Search failed')

      const data = await res.json()
      setResults(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clear,
  }
}
