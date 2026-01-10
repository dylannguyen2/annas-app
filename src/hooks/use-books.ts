'use client'

import { useState, useEffect, useCallback } from 'react'

export type BookStatus = 'want_to_read' | 'reading' | 'finished'

export interface Book {
  id: string
  user_id: string
  open_library_key: string | null
  title: string
  author: string | null
  cover_url: string | null
  isbn: string | null
  page_count: number | null
  status: BookStatus
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface SearchResult {
  open_library_key: string
  title: string
  author: string | null
  cover_url: string | null
  isbn: string | null
  page_count: number | null
  year: number | null
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = useCallback(async (status?: BookStatus) => {
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      
      const res = await fetch(`/api/books?${params}`)
      if (!res.ok) throw new Error('Failed to fetch books')
      const data = await res.json()
      setBooks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const searchBooks = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []
    
    const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed to search books')
    return res.json()
  }

  const addBook = async (data: {
    title: string
    author?: string | null
    cover_url?: string | null
    isbn?: string | null
    page_count?: number | null
    open_library_key?: string | null
    status?: BookStatus
    rating?: number | null
    started_at?: string | null
    finished_at?: string | null
  }) => {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to add book')
    }
    
    const newBook = await res.json()
    setBooks(prev => [newBook, ...prev])
    return newBook
  }

  const updateBook = async (id: string, data: Partial<Omit<Book, 'id' | 'user_id' | 'created_at'>>) => {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update book')
    }
    
    const updated = await res.json()
    setBooks(prev => prev.map(b => b.id === id ? updated : b))
    return updated
  }

  const deleteBook = async (id: string) => {
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete book')
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const getBooksByStatus = (status: BookStatus): Book[] => {
    return books.filter(b => b.status === status)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchBooks()
      setLoading(false)
    }
    init()
  }, [fetchBooks])

  return {
    books,
    loading,
    error,
    searchBooks,
    addBook,
    updateBook,
    deleteBook,
    getBooksByStatus,
    refetch: fetchBooks,
  }
}
