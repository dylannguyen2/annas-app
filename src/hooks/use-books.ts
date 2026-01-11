'use client'

import useSWR, { mutate } from 'swr'

export type BookStatus = 'want_to_read' | 'reading' | 'finished'
export type BookFormat = 'book' | 'ebook' | 'audiobook'

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
  format: BookFormat
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

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const BOOKS_KEY = '/api/books'

export function useBooks() {
  const { data: books = [], error, isLoading: loading } = useSWR<Book[]>(
    BOOKS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

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
    mutate(BOOKS_KEY, [newBook, ...books], false)
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
    mutate(BOOKS_KEY, books.map(b => b.id === id ? updated : b), false)
    return updated
  }

  const deleteBook = async (id: string) => {
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete book')
    mutate(BOOKS_KEY, books.filter(b => b.id !== id), false)
  }

  const getBooksByStatus = (status: BookStatus): Book[] => {
    return books.filter(b => b.status === status)
  }

  return {
    books,
    loading,
    error: error?.message || null,
    searchBooks,
    addBook,
    updateBook,
    deleteBook,
    getBooksByStatus,
    refetch: () => mutate(BOOKS_KEY),
  }
}
