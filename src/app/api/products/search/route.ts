import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WOOLWORTHS_API = 'https://www.woolworths.com.au/apis/ui/v2/Search/products'
const COLES_API = 'https://www.coles.com.au/api/bff/products/search'

interface WoolworthsProduct {
  Stockcode: number
  Name: string
  Brand: string | null
  Price: number | null
  CupString: string | null
  SmallImageFile: string | null
  MediumImageFile: string | null
  IsAvailable: boolean
}

interface ColesProduct {
  id: string | number
  name: string
  brand: string | null
  pricing?: {
    now: number | null
    unit?: { 
      quantity: number
      ofMeasureUnits: string
      price?: number
    } | null
    comparable?: string
  } | null
  imageUris?: Array<{ uri: string }> | null
  onlineHeirs?: Array<{ name: string }> | null
  availability?: boolean
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function searchWoolworths(query: string): Promise<WoolworthsProduct[]> {
  try {
    const response = await fetchWithTimeout(WOOLWORTHS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Origin': 'https://www.woolworths.com.au',
        'Referer': 'https://www.woolworths.com.au/',
      },
      body: JSON.stringify({
        SearchTerm: query,
        PageSize: 20,
        PageNumber: 1,
      }),
    }, 10000)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const groups = data.Products || []
    const products = groups.flatMap((group: { Products?: WoolworthsProduct[] }) => group.Products || [])
    return Array.isArray(products) ? products : []
  } catch {
    return []
  }
}

async function searchColes(query: string): Promise<ColesProduct[]> {
  try {
    const searchUrl = `https://www.coles.com.au/search?q=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }, 12000)

    if (!response.ok) {
      console.error('Coles error:', response.status)
      return []
    }

    const html = await response.text()
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/)
    
    if (!scriptMatch) {
      console.error('Coles: Could not find __NEXT_DATA__')
      return []
    }

    const nextData = JSON.parse(scriptMatch[1])
    const searchResults = nextData?.props?.pageProps?.searchResults?.results || 
                          nextData?.props?.pageProps?.products || 
                          []
    return Array.isArray(searchResults) ? searchResults : []
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Coles search timeout')
    } else {
      console.error('Coles search error:', error)
    }
    return []
  }
}

function normalizeWoolworthsProduct(product: WoolworthsProduct) {
  return {
    id: String(product.Stockcode),
    store: 'woolworths' as const,
    name: product.Name || '',
    brand: product.Brand || null,
    price: product.Price ?? null,
    unitPrice: product.CupString || null,
    imageUrl: product.MediumImageFile || product.SmallImageFile || null,
    category: null,
    inStock: product.IsAvailable ?? true,
  }
}

function normalizeColesProduct(product: ColesProduct) {
  const unitPrice = product.pricing?.comparable || null

  let imageUrl: string | null = null
  const imgPath = product.imageUris?.[0]?.uri
  if (imgPath) {
    imageUrl = imgPath.startsWith('http') 
      ? imgPath 
      : `https://productimages.coles.com.au/productimages${imgPath}`
  }

  return {
    id: String(product.id),
    store: 'coles' as const,
    name: product.name || '',
    brand: product.brand || null,
    price: product.pricing?.now ?? null,
    unitPrice,
    imageUrl,
    category: product.onlineHeirs?.[0]?.name || null,
    inStock: product.availability ?? true,
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const store = searchParams.get('store')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  const results: Array<ReturnType<typeof normalizeWoolworthsProduct> | ReturnType<typeof normalizeColesProduct>> = []

  const searchPromises: Promise<void>[] = []

  if (!store || store === 'woolworths') {
    searchPromises.push(
      searchWoolworths(query).then(products => {
        results.push(...products.map(normalizeWoolworthsProduct))
      })
    )
  }

  if (!store || store === 'coles') {
    searchPromises.push(
      searchColes(query).then(products => {
        results.push(...products.map(normalizeColesProduct))
      })
    )
  }

  await Promise.allSettled(searchPromises)

  results.sort((a, b) => {
    if (a.price === null) return 1
    if (b.price === null) return -1
    return a.price - b.price
  })

  return NextResponse.json({ products: results })
}
