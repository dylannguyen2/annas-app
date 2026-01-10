import { NextResponse } from 'next/server'

interface OpenLibraryDoc {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  isbn?: string[]
  number_of_pages_median?: number
  first_publish_year?: number
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[]
  numFound: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,cover_i,isbn,number_of_pages_median,first_publish_year`
  )

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to search books' }, { status: 500 })
  }

  const data: OpenLibraryResponse = await response.json()

  const books = data.docs.map((doc) => ({
    open_library_key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] || null,
    cover_url: doc.cover_i 
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    isbn: doc.isbn?.[0] || null,
    page_count: doc.number_of_pages_median || null,
    year: doc.first_publish_year || null,
  }))

  return NextResponse.json(books)
}
