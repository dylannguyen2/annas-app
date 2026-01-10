'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Todo, TodoQuadrant } from '@/types/database'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error('Failed to fetch todos')
      const data = await res.json()
      setTodos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const createTodo = async (data: {
    title: string
    description?: string
    quadrant: TodoQuadrant
    due_date?: string
  }) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create todo')
    const newTodo = await res.json()
    setTodos(prev => [newTodo, ...prev])
    return newTodo
  }

  const updateTodo = async (id: string, data: Partial<Todo>) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update todo')
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  const deleteTodo = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete todo')
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const toggleComplete = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    return updateTodo(id, { completed: !todo.completed })
  }

  const moveTodo = async (id: string, newQuadrant: TodoQuadrant) => {
    return updateTodo(id, { quadrant: newQuadrant })
  }

  const getTodosByQuadrant = (quadrant: TodoQuadrant) => {
    return todos.filter(t => t.quadrant === quadrant)
  }

  const getCompletedCount = () => todos.filter(t => t.completed).length
  const getPendingCount = () => todos.filter(t => !t.completed).length

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchTodos()
      setLoading(false)
    }
    init()
  }, [fetchTodos])

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    moveTodo,
    getTodosByQuadrant,
    getCompletedCount,
    getPendingCount,
    refetch: fetchTodos,
  }
}
