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
import { Plus, Trash2, Loader2, Calendar, Flame, CalendarClock, Users, Archive, Pencil, LayoutGrid, List, ChevronDown, ChevronRight, Check, Sun, CalendarDays, ListTodo } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { cn } from '@/lib/utils'
import { useShareView } from '@/lib/share-view/context'
import type { Todo, TodoQuadrant } from '@/types/database'

type ViewMode = 'matrix' | 'quick'

function TodoItemRow({
  todo,
  isTodayTask,
  hasDueDate,
  onToggle,
  onUpdate,
  onEdit,
  onDelete,
  completed = false,
  isReadOnly = false,
}: {
  todo: Todo
  isTodayTask: boolean
  hasDueDate: boolean
  onToggle: (id: string) => void
  onUpdate: (title: string) => void
  onEdit: () => void
  onDelete: () => void
  completed?: boolean
  isReadOnly?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(todo.title)

  const handleTitleClick = () => {
    if (isReadOnly) return
    setEditedTitle(todo.title)
    setIsEditing(true)
  }

  const handleSave = () => {
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== todo.title) {
      onUpdate(trimmed)
    } else {
      setEditedTitle(todo.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(todo.title)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent",
        completed 
          ? "bg-muted/30 opacity-60"
          : "bg-card hover:bg-primary/5 hover:border-primary/10 shadow-sm"
      )}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex-shrink-0 h-6 w-6 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center border-2",
          completed
            ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
            : "border-muted-foreground/30 hover:border-primary bg-transparent text-transparent hover:bg-primary/5"
        )}
      >
        <Check className={cn("h-3.5 w-3.5 transition-transform duration-300", completed ? "scale-100" : "scale-0")} strokeWidth={3} />
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className={cn(
                "text-base font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full font-sans",
                completed && "text-muted-foreground"
              )}
            />
          ) : (
            <span 
              onClick={handleTitleClick}
              className={cn(
                "text-base font-medium cursor-text truncate transition-colors duration-300",
                completed ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
              )}
            >
              {todo.title}
            </span>
          )}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 transition-colors duration-300",
            isTodayTask 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground",
            completed && "opacity-50 grayscale"
          )}>
            {isTodayTask ? 'Today' : 'Week'}
          </span>
        </div>
        {hasDueDate && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300",
            completed && "opacity-60"
          )}>
            <Calendar className="h-3 w-3" />
            <span className="font-medium">Due {new Date(todo.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      {!isReadOnly && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 text-muted-foreground rounded-lg cursor-pointer transition-colors",
              completed ? "hover:text-destructive hover:bg-destructive/10" : "hover:text-destructive hover:bg-destructive/10"
            )}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

const QUADRANTS = {
  do_first: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    Icon: Flame
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Not Urgent & Important', 
    color: 'bg-primary/80',
    lightBg: 'bg-primary/5',
    border: 'border-primary/10',
    iconColor: 'text-primary/80',
    Icon: CalendarClock
  },
  delegate: {
    title: 'Delegate',
    subtitle: 'Urgent & Not Important',
    color: 'bg-primary/60',
    lightBg: 'bg-muted/50',
    border: 'border-muted',
    iconColor: 'text-primary/60',
    Icon: Users
  },
  eliminate: {
    title: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    color: 'bg-muted-foreground',
    lightBg: 'bg-muted/30',
    border: 'border-muted/50',
    iconColor: 'text-muted-foreground',
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
  updateTodo,
  isReadOnly = false
}: {
  todos: Todo[]
  createTodo: (data: { title: string; quadrant: TodoQuadrant; due_date?: string }) => Promise<Todo>
  toggleComplete: (id: string) => Promise<Todo | undefined>
  deleteTodo: (id: string) => Promise<void>
  updateTodo: (id: string, data: Partial<Todo>) => Promise<Todo>
  isReadOnly?: boolean
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
    if (isReadOnly) return
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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
          <Button
            variant={timePeriod === 'today' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimePeriod('today')}
            className={cn(
              "gap-2 rounded-lg cursor-pointer h-9 px-4 transition-all duration-300",
              timePeriod === 'today' ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sun className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={timePeriod === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimePeriod('week')}
            className={cn(
              "gap-2 rounded-lg cursor-pointer h-9 px-4 transition-all duration-300",
              timePeriod === 'week' ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            This Week
          </Button>
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          {timePeriod === 'today' 
            ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : `${new Date(getStartOfWeek()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(getEndOfWeek()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          }
        </p>
      </div>

      {!isReadOnly && (
        <Card className="border-none shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-muted/30 ring-1 ring-border/50">
          <CardContent className="p-2">
            <form onSubmit={handleAdd} className="flex items-center gap-4 p-2">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1 flex items-center gap-3">
                <Input
                  ref={inputRef}
                  placeholder={`Add a task for ${timePeriod === 'today' ? 'today' : 'this week'}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-12 flex-1 text-lg border-none bg-transparent px-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 font-medium"
                  autoFocus
                />
                {showDatePicker ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 w-40 rounded-lg border-border/50 bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowDatePicker(false)
                        setDueDate('')
                      }}
                      className="h-9 w-9 cursor-pointer hover:bg-destructive/10 hover:text-destructive rounded-lg"
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
                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer rounded-xl transition-colors"
                    title="Add due date"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
                <List className="h-4 w-4" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">To Do</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted text-muted-foreground rounded-full border border-border/50">
              {pendingTodos.length}
            </span>
          </div>
          <div className="min-h-[200px] space-y-3">
            {pendingTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-muted/20 border border-dashed border-border">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground/50">
                  <Check className="h-8 w-8" />
                </div>
                <p className="text-base text-muted-foreground font-medium">
                  {timePeriod === 'today' ? "All caught up for today!" : "All caught up for the week!"}
                </p>
                <p className="text-sm text-muted-foreground/50 mt-1">Enjoy your free time</p>
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
                        className="flex items-center gap-4 p-4 rounded-xl bg-background border ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                      >
                        <div className="flex-shrink-0 h-6 w-6 rounded-full border-2 border-muted" />
                        <div className="flex-1 flex flex-col gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-9 text-base font-medium border-0 focus-visible:ring-0 p-0"
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
                              className="h-8 w-40 text-xs"
                            />
                            {editDueDate && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditDueDate('')}
                                className="h-8 px-2 text-muted-foreground cursor-pointer text-xs"
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
                            className="h-8 px-3 cursor-pointer text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-8 px-3 cursor-pointer text-xs"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <TodoItemRow
                      key={todo.id}
                      todo={todo}
                      isTodayTask={isTodayTask}
                      hasDueDate={!!hasDueDate}
                      onToggle={handleToggle}
                      onUpdate={async (title) => {
                        setOptimisticTodos(prev => prev.map(t =>
                          t.id === todo.id ? { ...t, title } : t
                        ))
                        try {
                          await updateTodo(todo.id, { title })
                        } catch (error) {
                          console.error('Failed to update todo:', error)
                          setOptimisticTodos(prev => prev.map(t =>
                            t.id === todo.id ? todo : t
                          ))
                        }
                      }}
                      onEdit={() => handleEdit(todo)}
                      onDelete={() => handleDelete(todo.id)}
                      isReadOnly={isReadOnly}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted text-muted-foreground">
                <Check className="h-4 w-4" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-muted-foreground">Completed</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-muted text-muted-foreground/70 rounded-full border border-border/50">
              {completedTodos.length}
            </span>
          </div>
          <div className="min-h-[200px] space-y-3">
            {completedTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-muted/20 border border-dashed border-border opacity-60">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground/30">
                  <Archive className="h-8 w-8" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No completed tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTodos.map((todo) => {
                  const isTodayTask = isToday(todo.due_date)
                  const hasDueDate = todo.due_date && !isToday(todo.due_date) && !isThisWeek(todo.due_date)
                  return (
                    <TodoItemRow
                      key={todo.id}
                      todo={todo}
                      isTodayTask={isTodayTask}
                      hasDueDate={!!hasDueDate}
                      completed
                      onToggle={handleToggle}
                      onUpdate={async (title) => {
                        setOptimisticTodos(prev => prev.map(t =>
                          t.id === todo.id ? { ...t, title } : t
                        ))
                        try {
                          await updateTodo(todo.id, { title })
                        } catch (error) {
                          console.error('Failed to update todo:', error)
                          setOptimisticTodos(prev => prev.map(t =>
                            t.id === todo.id ? todo : t
                          ))
                        }
                      }}
                      onEdit={() => handleEdit(todo)}
                      onDelete={() => handleDelete(todo.id)}
                      isReadOnly={isReadOnly}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatrixTodoItem({
  todo,
  onToggle,
  onUpdate,
  onEdit,
  onDelete,
  isReadOnly = false,
}: {
  todo: Todo
  onToggle: () => void
  onUpdate: (title: string) => void
  onEdit: () => void
  onDelete: () => void
  isReadOnly?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(todo.title)

  const handleTitleClick = () => {
    if (!todo.completed && !isReadOnly) {
      setEditedTitle(todo.title)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== todo.title) {
      onUpdate(trimmed)
    } else {
      setEditedTitle(todo.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(todo.title)
      setIsEditing(false)
    }
  }

  return (
    <li className="group flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors duration-200 first:mt-2 last:mb-2 mx-2 rounded-xl">
      <button
        onClick={onToggle}
        className={cn(
          "flex-shrink-0 mt-0.5 h-5 w-5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center border-2",
          todo.completed
            ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
            : "border-muted-foreground/30 hover:border-primary bg-transparent text-transparent hover:bg-primary/5"
        )}
      >
        <Check className={cn("h-3 w-3 transition-transform duration-300", todo.completed ? "scale-100" : "scale-0")} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0 pt-0.5">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 w-full font-sans leading-relaxed"
          />
        ) : (
          <p 
            onClick={handleTitleClick}
            className={cn(
              "text-sm font-medium leading-relaxed transition-all duration-200",
              todo.completed 
                ? "text-muted-foreground line-through opacity-60 cursor-default" 
                : "cursor-text text-foreground"
            )}
          >
            {todo.title}
          </p>
        )}
        {todo.description && (
          <p className={cn(
            "text-xs text-muted-foreground line-clamp-2 mt-0.5",
            todo.completed && "opacity-60"
          )}>
            {todo.description}
          </p>
        )}
        {todo.due_date && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5",
            todo.completed && "opacity-60"
          )}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(todo.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      {!isReadOnly && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer rounded-lg"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Edit task</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete task</span>
          </Button>
        </div>
      )}
    </li>
  )
}

function MatrixView({
  todos,
  getTodosByQuadrant,
  toggleComplete,
  updateTodo,
  deleteTodo,
  onAddClick,
  onEditClick,
  isReadOnly = false
}: {
  todos: Todo[]
  getTodosByQuadrant: (quadrant: TodoQuadrant) => Todo[]
  toggleComplete: (id: string) => Promise<Todo | undefined>
  updateTodo: (id: string, data: Partial<Todo>) => Promise<Todo>
  deleteTodo: (id: string) => Promise<void>
  onAddClick: (quadrant: TodoQuadrant) => void
  onEditClick: (todo: Todo) => void
  isReadOnly?: boolean
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(Object.entries(QUADRANTS) as [TodoQuadrant, typeof QUADRANTS[TodoQuadrant]][]).map(([key, config]) => {
        const quadrantTodos = getTodosByQuadrant(key)
        
        return (
          <Card key={key} className={cn("flex flex-col overflow-hidden min-h-[350px] border shadow-sm transition-all duration-300 hover:shadow-md", config.border)}>
            <div className={cn("px-5 py-4 flex items-center justify-between border-b border-border/50", config.lightBg)}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-background/50 shadow-sm", config.iconColor)}>
                  <config.Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold leading-none text-foreground tracking-tight">{config.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{config.subtitle}</p>
                </div>
              </div>
              {!isReadOnly && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-background/80 cursor-pointer rounded-lg transition-colors"
                  onClick={() => onAddClick(key)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add task to {config.title}</span>
                </Button>
              )}
            </div>

            <CardContent className="flex-1 p-0 overflow-hidden bg-gradient-to-b from-background to-muted/20">
              {quadrantTodos.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground/40">
                  <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                    <config.Icon className="h-6 w-6 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No tasks yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/30 max-h-[400px] overflow-y-auto scrollbar-none py-2">
                  {quadrantTodos.map((todo) => (
                    <MatrixTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleComplete(todo.id)}
                      onUpdate={(title) => updateTodo(todo.id, { title })}
                      onEdit={() => onEditClick(todo)}
                      onDelete={() => deleteTodo(todo.id)}
                      isReadOnly={isReadOnly}
                    />
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
  const { isShareView } = useShareView()
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
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ListTodo className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">My Tasks</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {viewMode === 'matrix' 
              ? 'Prioritize with the Eisenhower Matrix.' 
              : 'Quickly capture and organize your tasks.'}
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-muted/50 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm">
          <Button
            variant={viewMode === 'matrix' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('matrix')}
            className={cn(
              "gap-2 cursor-pointer h-9 px-4 transition-all duration-300 rounded-lg",
              viewMode === 'matrix' ? "shadow-sm bg-background text-foreground hover:bg-background/90" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Matrix</span>
          </Button>
          <Button
            variant={viewMode === 'quick' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('quick')}
            className={cn(
              "gap-2 cursor-pointer h-9 px-4 transition-all duration-300 rounded-lg",
              viewMode === 'quick' ? "shadow-sm bg-background text-foreground hover:bg-background/90" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Quick</span>
          </Button>
        </div>
      </div>

      {viewMode === 'matrix' && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-primary/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Total Tasks</div>
              <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center text-primary shadow-sm">
                <List className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-primary tracking-tight">{todos.length}</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending</div>
              <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center text-orange-500 shadow-sm">
                <CalendarClock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-foreground tracking-tight">
                {getPendingCount()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-muted/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</div>
              <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center text-green-500 shadow-sm">
                <Check className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-foreground tracking-tight">
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
          updateTodo={updateTodo}
          deleteTodo={deleteTodo}
          onAddClick={handleOpenDialog}
          onEditClick={handleOpenEditDialog}
          isReadOnly={isShareView}
        />
      ) : (
        <QuickEntryView
          todos={todos}
          createTodo={createTodo}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          updateTodo={updateTodo}
          isReadOnly={isShareView}
        />
      )}

      {!isShareView && (
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
      )}

      {!isShareView && (
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
      )}
    </div>
  )
}
