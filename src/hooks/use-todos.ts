'use client'

import useSWR, { mutate } from 'swr'
import type { Todo, TodoQuadrant } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const TODOS_KEY = '/api/todos'

export function useTodos() {
  const { data: todos = [], error, isLoading: loading } = useSWR<Todo[]>(
    TODOS_KEY,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

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
    mutate(TODOS_KEY, [newTodo, ...todos], false)
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
    mutate(TODOS_KEY, todos.map(t => t.id === id ? updated : t), false)
    return updated
  }

  const deleteTodo = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete todo')
    mutate(TODOS_KEY, todos.filter(t => t.id !== id), false)
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

  return {
    todos,
    loading,
    error: error?.message || null,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    moveTodo,
    getTodosByQuadrant,
    getCompletedCount,
    getPendingCount,
    refetch: () => mutate(TODOS_KEY),
  }
}
