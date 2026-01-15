import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getEffectiveUser } from '@/lib/get-effective-user'
import { NextResponse } from 'next/server'

interface OpenGraphData {
  title: string
  image: string | null
  price: string | null
  currency: string | null
  siteName: string | null
}

function extractJsonLdPrice(html: string): { price: string | null; currency: string | null } {
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1])
      const products = Array.isArray(data) ? data : [data]
      
      for (const item of products) {
        if (item['@type'] === 'Product' && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
          if (offers.price) {
            return {
              price: String(offers.price),
              currency: offers.priceCurrency || null,
            }
          }
        }
      }
    } catch {
      continue
    }
  }
  
  return { price: null, currency: null }
}

function extractAmazonImage(html: string): string | null {
  const patterns = [
    /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
    /<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*a-dynamic-image[^"]*"[^>]*src="([^"]+)"/i,
    /"hiRes":"([^"]+)"/,
    /"large":"([^"]+)"/,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  
  return null
}

function extractAmazonPrice(html: string): { price: string | null; currency: string | null } {
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</i,
    /<span[^>]*id="priceblock_ourprice"[^>]*>\s*([^<]+)</i,
    /<span[^>]*id="priceblock_dealprice"[^>]*>\s*([^<]+)</i,
    /<span[^>]*class="[^"]*apexPriceToPay[^"]*"[^>]*>.*?<span[^>]*>([^<]+)</i,
  ]
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      let price = match[1].replace(/[,$\s]/g, '').trim()
      const fractionMatch = html.match(/<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>(\d+)</i)
      if (fractionMatch?.[1]) {
        price = `${price}.${fractionMatch[1]}`
      }
      
      const currencyMatch = html.match(/<span[^>]*class="[^"]*a-price-symbol[^"]*"[^>]*>([^<]+)</i)
      const currency = currencyMatch?.[1]?.trim() || 'USD'
      
      return { price, currency }
    }
  }
  
  return { price: null, currency: null }
}

async function extractMetadata(url: string): Promise<OpenGraphData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }
    
    const html = await response.text()
    const hostname = new URL(url).hostname.toLowerCase()
    
    const getMetaContent = (property: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'),
      ]
      
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match?.[1]) return match[1]
      }
      return null
    }
    
    let title = getMetaContent('og:title') || getMetaContent('twitter:title')
    
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      title = titleMatch?.[1] || hostname
    }
    
    let image = getMetaContent('og:image') || getMetaContent('twitter:image')
    const siteName = getMetaContent('og:site_name')
    
    let price = getMetaContent('product:price:amount') || getMetaContent('og:price:amount')
    let currency = getMetaContent('product:price:currency') || getMetaContent('og:price:currency')
    
    if (!price) {
      const jsonLd = extractJsonLdPrice(html)
      price = jsonLd.price
      currency = currency || jsonLd.currency
    }
    
    if (hostname.includes('amazon')) {
      if (!price) {
        const amazonPrice = extractAmazonPrice(html)
        price = amazonPrice.price
        currency = currency || amazonPrice.currency
      }
      if (!image) {
        image = extractAmazonImage(html)
      }
    }
    
    return {
      title: title.trim(),
      image,
      price,
      currency,
      siteName,
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    const hostname = new URL(url).hostname.replace('www.', '')
    return {
      title: `Product from ${hostname}`,
      image: null,
      price: null,
      currency: null,
      siteName: hostname,
    }
  }
}

export async function GET() {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', effectiveUser.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const effectiveUser = await getEffectiveUser()
  if (!effectiveUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (effectiveUser.isReadOnly) {
    return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json()
  const { url, title, image_url, price, currency, site_name, notes } = body

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let finalTitle = title
  let finalImage = image_url
  let finalPrice = price
  let finalCurrency = currency
  let finalSiteName = site_name

  if (!finalTitle) {
    const metadata = await extractMetadata(url)
    finalTitle = metadata.title
    finalImage = finalImage || metadata.image
    finalPrice = finalPrice || metadata.price
    finalCurrency = finalCurrency || metadata.currency
    finalSiteName = finalSiteName || metadata.siteName
  }

  const { data: newItem, error } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: effectiveUser.userId,
      url,
      title: finalTitle,
      image_url: finalImage,
      price: finalPrice,
      currency: finalCurrency,
      site_name: finalSiteName,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newItem)
}
