'use client'

import useSWR, { mutate } from 'swr'

export interface WishlistItem {
  id: string
  user_id: string
  url: string
  title: string
  image_url: string | null
  price: string | null
  currency: string | null
  site_name: string | null
  notes: string | null
  purchased: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const WISHLIST_KEY = '/api/wishlist'

export function useWishlist() {
  const { data: items = [], error, isLoading: loading } = useSWR<WishlistItem[]>(
    WISHLIST_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const addItem = async (data: {
    url: string
    title?: string
    image_url?: string | null
    price?: string | null
    currency?: string | null
    site_name?: string | null
    notes?: string | null
  }) => {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to add item')
    }
    
    const newItem = await res.json()
    mutate(WISHLIST_KEY, [newItem, ...items], false)
    return newItem
  }

  const updateItem = async (id: string, data: Partial<Omit<WishlistItem, 'id' | 'user_id' | 'created_at'>>) => {
    const res = await fetch(`/api/wishlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update item')
    }
    
    const updated = await res.json()
    mutate(WISHLIST_KEY, items.map(i => i.id === id ? updated : i), false)
    return updated
  }

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete item')
    mutate(WISHLIST_KEY, items.filter(i => i.id !== id), false)
  }

  const togglePurchased = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    return updateItem(id, { purchased: !item.purchased })
  }

  const unpurchasedItems = items.filter(i => !i.purchased)
  const purchasedItems = items.filter(i => i.purchased)

  return {
    items,
    unpurchasedItems,
    purchasedItems,
    loading,
    error: error?.message || null,
    addItem,
    updateItem,
    deleteItem,
    togglePurchased,
    refetch: () => mutate(WISHLIST_KEY),
  }
}
