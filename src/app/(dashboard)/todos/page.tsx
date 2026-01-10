'use client'

import { useState, useEffect, useRef } from 'react'
import { useTodos } from '@/hooks/use-todos'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Loader2, Calendar, Flame, CalendarClock, Users, Archive, Pencil, LayoutGrid, List, ChevronDown, ChevronRight, Check, Sun, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo, TodoQuadrant } from '@/types/database'

type ViewMode = 'matrix' | 'quick'

const QUADRANTS = {
  do_first: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900/50',
    iconColor: 'text-red-500',
    Icon: Flame
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Not Urgent & Important', 
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/50',
    iconColor: 'text-blue-500',
    Icon: CalendarClock
  },
  delegate: {
    title: 'Delegate',
    subtitle: 'Urgent & Not Important',
    color: 'bg-yellow-500',
    lightBg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-900/50',
    iconColor: 'text-yellow-500',
    Icon: Users
  },
  eliminate: {
    title: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    color: 'bg-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-950/20',
    border: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-500',
    Icon: Archive
  }
} as const

type TimePeriod = 'today' | 'week'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getStartOfWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.setDate(diff)).toISOString().split('T')[0]
}

function getEndOfWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? 0 : 7)
  return new Date(now.setDate(diff)).toISOString().split('T')[0]
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  return dateStr.split('T')[0] === getToday()
}

function isThisWeek(dateStr: string | null) {
  if (!dateStr) return false
  const date = dateStr.split('T')[0]
  return date >= getStartOfWeek() && date <= getEndOfWeek()
}

function QuickEntryView({ 
  todos, 
  createTodo, 
  toggleComplete, 
  deleteTodo,
  updateTodo
}: {
  todos: Todo[]
  createTodo: (data: { title: string; quadrant: TodoQuadrant; due_date?: string }) => Promise<Todo>
  toggleComplete: (id: string) => Promise<Todo | undefined>
  deleteTodo: (id: string) => Promise<void>
  updateTodo: (id: string, data: Partial<Todo>) => Promise<Todo>
}) {
  const [input, setInput] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [optimisticTodos, setOptimisticTodos] = useState(todos)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setOptimisticTodos(todos)
  }, [todos])

  const filterByPeriod = (todo: Todo) => {
    if (timePeriod === 'today') {
      return isToday(todo.due_date) || (!todo.due_date && isToday(todo.created_at))
    }
    return isThisWeek(todo.due_date) || isThisWeek(todo.created_at)
  }

  const filteredTodos = optimisticTodos.filter(filterByPeriod)
  const pendingTodos = filteredTodos.filter(t => !t.completed).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const completedTodos = filteredTodos.filter(t => t.completed).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    const finalDueDate = dueDate || (timePeriod === 'today' ? getToday() : getEndOfWeek())
    const tempId = `temp-${Date.now()}`
    const newTodo: Todo = {
      id: tempId,
      title: trimmed,
      completed: false,
      quadrant: 'do_first',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'optimistic',
      description: null,
      due_date: finalDueDate,
      completed_at: null,
      position: 0
    }

    setOptimisticTodos(prev => [newTodo, ...prev])
    setInput('')
    setDueDate('')
    setShowDatePicker(false)
    inputRef.current?.focus()

    try {
      await createTodo({ title: trimmed, quadrant: 'do_first', due_date: finalDueDate })
    } catch (error) {
      console.error('Failed to create todo:', error)
      setOptimisticTodos(prev => prev.filter(t => t.id !== tempId))
      setInput(trimmed)
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditDueDate(todo.due_date?.split('T')[0] || '')
  }

  const handleSaveEdit = async () => {
    if (!editingTodo || !editTitle.trim()) return

    const updatedTodo = {
      ...editingTodo,
      title: editTitle.trim(),
      due_date: editDueDate || null
    }

    setOptimisticTodos(prev => prev.map(t => 
      t.id === editingTodo.id ? updatedTodo : t
    ))
    setEditingTodo(null)

    try {
      await updateTodo(editingTodo.id, { 
        title: editTitle.trim(), 
        due_date: editDueDate || null 
      })
    } catch (error) {
      console.error('Failed to update todo:', error)
      setOptimisticTodos(prev => prev.map(t => 
        t.id === editingTodo.id ? editingTodo : t
      ))
    }
  }

  const handleCancelEdit = () => {
    setEditingTodo(null)
    setEditTitle('')
    setEditDueDate('')
  }

  const handleToggle = async (id: string) => {
    setOptimisticTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ))

    try {
      await toggleComplete(id)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
      setOptimisticTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ))
    }
  }

  const handleDelete = async (id: string) => {
    const todoBackup = optimisticTodos.find(t => t.id === id)
    if (!todoBackup) return

    setOptimisticTodos(prev => prev.filter(t => t.id !== id))

    try {
      await deleteTodo(id)
    } catch (error) {
      console.error('Failed to delete todo:', error)
      if (todoBackup) {
        setOptimisticTodos(prev => [...prev, todoBackup])
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          <Button
            variant={timePeriod === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimePeriod('today')}
            className="gap-2 rounded-lg cursor-pointer h-10 px-4"
          >
            <Sun className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={timePeriod === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimePeriod('week')}
            className="gap-2 rounded-lg cursor-pointer h-10 px-4"
          >
            <CalendarDays className="h-4 w-4" />
            This Week
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          {timePeriod === 'today' 
            ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : `${new Date(getStartOfWeek()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(getEndOfWeek()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          }
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="flex items-center gap-4">
            <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <Input
                ref={inputRef}
                placeholder={`Add a task for ${timePeriod === 'today' ? 'today' : 'this week'}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-14 flex-1 text-xl border-none bg-transparent px-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
                autoFocus
              />
              {showDatePicker ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 w-40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowDatePicker(false)
                      setDueDate('')
                    }}
                    className="h-10 w-10 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDatePicker(true)}
                  className="h-10 w-10 text-muted-foreground hover:text-primary cursor-pointer"
                  title="Add due date"
                >
                  <Calendar className="h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader className="pb-4 border-b bg-orange-50/50 dark:bg-orange-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-orange-500" />
                <h3 className="text-xl font-semibold">To Do</h3>
              </div>
              <span className="text-base text-muted-foreground font-medium px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                {pendingTodos.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 min-h-[400px] max-h-[550px] overflow-y-auto">
            {pendingTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Check className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-lg text-muted-foreground font-medium">
                  {timePeriod === 'today' ? "Nothing for today!" : "Clear for the week!"}
                </p>
                <p className="text-muted-foreground/60 mt-1">Add a task above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTodos.map((todo) => {
                  const isTodayTask = isToday(todo.due_date)
                  const isEditing = editingTodo?.id === todo.id
                  const hasDueDate = todo.due_date && !isToday(todo.due_date) && !isThisWeek(todo.due_date)
                  
                  if (isEditing) {
                    return (
                      <div
                        key={todo.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border-2 border-primary/20"
                      >
                        <div className="flex-shrink-0 h-7 w-7 rounded-full border-2 border-muted-foreground/30" />
                        <div className="flex-1 flex flex-col gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-10 text-lg font-medium"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="h-8 w-40 text-sm"
                            />
                            {editDueDate && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditDueDate('')}
                                className="h-8 px-2 text-muted-foreground cursor-pointer"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-9 cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-9 cursor-pointer"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={todo.id}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 border border-border hover:border-primary/20 transition-all duration-200 animate-in slide-in-from-top-2 fade-in"
                    >
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="flex-shrink-0 h-7 w-7 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer"
                      />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium">
                            {todo.title}
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                            isTodayTask 
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {isTodayTask ? 'Today' : 'Week'}
                          </span>
                        </div>
                        {hasDueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(todo.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                          onClick={() => handleEdit(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-4 border-b bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <h3 className="text-xl font-semibold">Completed</h3>
              </div>
              <span className="text-base text-muted-foreground font-medium px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                {completedTodos.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 min-h-[400px] max-h-[550px] overflow-y-auto">
            {completedTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Archive className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-lg text-muted-foreground font-medium">No completed tasks</p>
                <p className="text-muted-foreground/60 mt-1">Finished tasks appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTodos.map((todo) => {
                  const isTodayTask = isToday(todo.due_date)
                  const hasDueDate = todo.due_date && !isToday(todo.due_date) && !isThisWeek(todo.due_date)
                  return (
                    <div
                      key={todo.id}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-950/30 transition-all duration-200"
                    >
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="flex-shrink-0 h-7 w-7 rounded-full bg-green-500 text-white flex items-center justify-center transition-all cursor-pointer hover:bg-green-600 hover:scale-110"
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-muted-foreground line-through">
                            {todo.title}
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full opacity-60",
                            isTodayTask 
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {isTodayTask ? 'Today' : 'Week'}
                          </span>
                        </div>
                        {hasDueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-60">
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(todo.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                          onClick={() => handleEdit(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MatrixView({
  todos,
  getTodosByQuadrant,
  toggleComplete,
  deleteTodo,
  onAddClick,
  onEditClick
}: {
  todos: Todo[]
  getTodosByQuadrant: (quadrant: TodoQuadrant) => Todo[]
  toggleComplete: (id: string) => Promise<Todo | undefined>
  deleteTodo: (id: string) => Promise<void>
  onAddClick: (quadrant: TodoQuadrant) => void
  onEditClick: (todo: Todo) => void
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(Object.entries(QUADRANTS) as [TodoQuadrant, typeof QUADRANTS[TodoQuadrant]][]).map(([key, config]) => {
        const quadrantTodos = getTodosByQuadrant(key)
        
        return (
          <Card key={key} className={cn("flex flex-col overflow-hidden min-h-[300px] border-2 !p-0", config.border)}>
            <div className={cn("px-4 py-3 flex items-center justify-between", config.lightBg)}>
              <div className="flex items-center gap-3">
                <config.Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
                <div>
                  <h3 className="font-semibold leading-none text-foreground">{config.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{config.subtitle}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                onClick={() => onAddClick(key)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add task to {config.title}</span>
              </Button>
            </div>
            
            <CardContent className="flex-1 p-0 overflow-hidden">
              {quadrantTodos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground/50">
                  <p className="text-sm">No tasks yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                  {quadrantTodos.map((todo) => (
                    <li 
                      key={todo.id} 
                      className="group flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors duration-200"
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleComplete(todo.id)}
                        className="cursor-pointer"
                      />
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onEditClick(todo)}
                      >
                        <p className={cn(
                          "text-sm font-medium leading-normal transition-all duration-200",
                          todo.completed && "text-muted-foreground line-through opacity-60"
                        )}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className={cn(
                            "text-xs text-muted-foreground line-clamp-2 mt-1",
                            todo.completed && "opacity-60"
                          )}>
                            {todo.description}
                          </p>
                        )}
                        {todo.due_date && (
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] text-muted-foreground mt-1",
                            todo.completed && "opacity-60"
                          )}>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(todo.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                          onClick={() => onEditClick(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit task</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete task</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function TodosPage() {
  const { 
    todos, 
    loading, 
    createTodo, 
    updateTodo,
    deleteTodo, 
    toggleComplete, 
    getTodosByQuadrant,
    getCompletedCount,
    getPendingCount
  } = useTodos()

  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedQuadrant, setSelectedQuadrant] = useState<TodoQuadrant>('do_first')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('todos-view-mode') as ViewMode | null
    if (saved) setViewMode(saved)
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('todos-view-mode', mode)
  }

  const handleOpenDialog = (quadrant: TodoQuadrant) => {
    setSelectedQuadrant(quadrant)
    setNewTodoTitle('')
    setNewTodoDescription('')
    setNewTodoDueDate('')
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (todo: Todo) => {
    setEditingTodo(todo)
    setNewTodoTitle(todo.title)
    setNewTodoDescription(todo.description || '')
    setNewTodoDueDate(todo.due_date || '')
    setSelectedQuadrant(todo.quadrant)
    setIsEditDialogOpen(true)
  }

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    setIsSubmitting(true)
    try {
      await createTodo({
        title: newTodoTitle,
        description: newTodoDescription,
        quadrant: selectedQuadrant,
        due_date: newTodoDueDate || undefined
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to create todo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTodo || !newTodoTitle.trim()) return

    setIsSubmitting(true)
    try {
      await updateTodo(editingTodo.id, {
        title: newTodoTitle,
        description: newTodoDescription || null,
        quadrant: selectedQuadrant,
        due_date: newTodoDueDate || null
      })
      setIsEditDialogOpen(false)
      setEditingTodo(null)
    } catch (error) {
      console.error('Failed to update todo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {viewMode === 'matrix' 
              ? 'Manage your tasks using the Eisenhower Matrix.' 
              : 'Quick task entry mode.'}
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'matrix' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('matrix')}
            className="gap-2 cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Matrix</span>
          </Button>
          <Button
            variant={viewMode === 'quick' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('quick')}
            className="gap-2 cursor-pointer"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Quick</span>
          </Button>
        </div>
      </div>

      {viewMode === 'matrix' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-muted-foreground">Pending</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {getPendingCount()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-muted-foreground">Completed</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {getCompletedCount()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'matrix' ? (
        <MatrixView
          todos={todos}
          getTodosByQuadrant={getTodosByQuadrant}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          onAddClick={handleOpenDialog}
          onEditClick={handleOpenEditDialog}
        />
      ) : (
        <QuickEntryView
          todos={todos}
          createTodo={createTodo}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          updateTodo={updateTodo}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to {QUADRANTS[selectedQuadrant].title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add some details..."
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={!newTodoTitle.trim() || isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Task'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTodo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="What needs to be done?"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add some details..."
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quadrant">Quadrant</Label>
              <select
                id="edit-quadrant"
                value={selectedQuadrant}
                onChange={(e) => setSelectedQuadrant(e.target.value as TodoQuadrant)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {(Object.entries(QUADRANTS) as [TodoQuadrant, typeof QUADRANTS[TodoQuadrant]][]).map(([key, config]) => (
                  <option key={key} value={key}>{config.title} - {config.subtitle}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date (optional)</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={!newTodoTitle.trim() || isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
