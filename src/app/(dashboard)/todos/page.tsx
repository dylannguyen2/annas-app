'use client'

import { useState } from 'react'
import { useTodos } from '@/hooks/use-todos'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Loader2, Calendar, Flame, CalendarClock, Users, Archive, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo, TodoQuadrant } from '@/types/database'

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

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedQuadrant, setSelectedQuadrant] = useState<TodoQuadrant>('do_first')
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Manage your tasks using the Eisenhower Matrix.</p>
      </div>

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
                  onClick={() => handleOpenDialog(key)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add task to {config.title}</span>
                </Button>
              </div>
              
              <CardContent className="flex-1 p-0">
                {quadrantTodos.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground/50">
                    <p className="text-sm">No tasks yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/50">
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
                          onClick={() => handleOpenEditDialog(todo)}
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
                            onClick={() => handleOpenEditDialog(todo)}
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
