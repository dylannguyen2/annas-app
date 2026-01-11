'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GroceryItem, GroceryList } from '@/types/database'

export function useGroceryLists() {
  const [lists, setLists] = useState<GroceryList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/grocery/lists')
      if (!res.ok) throw new Error('Failed to fetch lists')
      const data = await res.json()
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const createList = async (name: string) => {
    const res = await fetch('/api/grocery/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create list')
    }

    const newList = await res.json()
    setLists(prev => [...prev, newList])
    return newList
  }

  const updateList = async (id: string, name: string) => {
    setLists(prev => prev.map(list => 
      list.id === id ? { ...list, name } : list
    ))

    const res = await fetch(`/api/grocery/lists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      await fetchLists()
      throw new Error('Failed to update list')
    }

    return res.json()
  }

  const deleteList = async (id: string) => {
    setLists(prev => prev.filter(list => list.id !== id))

    const res = await fetch(`/api/grocery/lists/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      await fetchLists()
      throw new Error('Failed to delete list')
    }
  }

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    refetch: fetchLists,
  }
}

export function useGroceryList(listId?: string | null) {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const url = listId ? `/api/grocery?listId=${listId}` : '/api/grocery'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch grocery items')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = async (item: {
    name: string
    quantity?: number
    unit?: string
    category?: string
    woolworths_id?: string
    woolworths_price?: number
    coles_id?: string
    coles_price?: number
    image_url?: string
    notes?: string
  }) => {
    const res = await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, list_id: listId }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to add item')
    }

    const newItem = await res.json()
    setItems(prev => [newItem, ...prev])
    return newItem
  }

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))

    const res = await fetch(`/api/grocery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      await fetchItems()
      throw new Error('Failed to update item')
    }

    return res.json()
  }

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    await updateItem(id, { checked: !item.checked })
  }

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))

    const res = await fetch(`/api/grocery/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      await fetchItems()
      throw new Error('Failed to delete item')
    }
  }

  const clearChecked = async () => {
    setItems(prev => prev.filter(item => !item.checked))

    const url = listId 
      ? `/api/grocery?clearChecked=true&listId=${listId}`
      : '/api/grocery?clearChecked=true'
    
    const res = await fetch(url, {
      method: 'DELETE',
    })

    if (!res.ok) {
      await fetchItems()
      throw new Error('Failed to clear checked items')
    }
  }

  const uncheckedItems = items.filter(i => !i.checked)
  const checkedItems = items.filter(i => i.checked)

  const totalEstimate = items.reduce((sum, item) => {
    const price = item.woolworths_price || item.coles_price || 0
    return sum + (price * (item.quantity || 1))
  }, 0)

  return {
    items,
    uncheckedItems,
    checkedItems,
    loading,
    error,
    totalEstimate,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    clearChecked,
    refetch: fetchItems,
  }
}
