import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  genre_ids: number[]
}

interface TMDBTVShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  first_air_date: string
  vote_average: number
  genre_ids: number[]
}

interface TMDBSearchResponse {
  results: (TMDBMovie | TMDBTVShow)[]
  total_results: number
}

const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western'
}

const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western'
}

export async function GET(request: Request) {
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const results = []

    if (!type || type === 'movie') {
      const movieRes = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
      )
      if (movieRes.ok) {
        const movieData: TMDBSearchResponse = await movieRes.json()
        results.push(...movieData.results.slice(0, 10).map((movie) => {
          const m = movie as TMDBMovie
          return {
            tmdb_id: m.id,
            media_type: 'movie' as const,
            title: m.title,
            poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/w342${m.poster_path}` : null,
            backdrop_url: m.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${m.backdrop_path}` : null,
            overview: m.overview || null,
            release_date: m.release_date || null,
            vote_average: m.vote_average || null,
            genres: m.genre_ids.map(id => MOVIE_GENRES[id]).filter(Boolean),
          }
        }))
      }
    }

    if (!type || type === 'tv') {
      const tvRes = await fetch(
        `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
      )
      if (tvRes.ok) {
        const tvData: TMDBSearchResponse = await tvRes.json()
        results.push(...tvData.results.slice(0, 10).map((show) => {
          const s = show as TMDBTVShow
          return {
            tmdb_id: s.id,
            media_type: 'tv' as const,
            title: s.name,
            poster_url: s.poster_path ? `${TMDB_IMAGE_BASE}/w342${s.poster_path}` : null,
            backdrop_url: s.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${s.backdrop_path}` : null,
            overview: s.overview || null,
            release_date: s.first_air_date || null,
            vote_average: s.vote_average || null,
            genres: s.genre_ids.map(id => TV_GENRES[id]).filter(Boolean),
          }
        }))
      }
    }

    results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))

    return NextResponse.json(results.slice(0, 15))
  } catch (error) {
    console.error('TMDB search error:', error)
    return NextResponse.json({ error: 'Failed to search media' }, { status: 500 })
  }
}
