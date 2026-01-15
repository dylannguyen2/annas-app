'use client'

import { useState, useEffect } from 'react'
import { useShareView } from '@/lib/share-view/context'
import { useGroceryList, useGroceryLists } from '@/hooks/use-grocery-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Plus, Trash2, Loader2, Minus, ShoppingBasket, Sparkles, ChevronDown, MoreHorizontal, Edit2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { GroceryItem } from '@/types/database'

function GroceryListItem({
  item,
  onToggle,
  onUpdate,
  onDelete,
  isShareView = false
}: {
  item: GroceryItem
  onToggle: (id: string) => void
  onUpdate: (id: string, data: Partial<GroceryItem>) => void
  onDelete: (id: string) => void
  isShareView?: boolean
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(item.name)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(item.id)
    } catch {
      setIsDeleting(false)
    }
  }

  const handleIncrement = () => onUpdate(item.id, { quantity: (item.quantity || 1) + 1 })
  const handleDecrement = () => {
    if ((item.quantity || 1) > 1) {
      onUpdate(item.id, { quantity: (item.quantity || 1) - 1 })
    }
  }

  const handleNameClick = () => {
    if (!item.checked && !isShareView) {
      setEditedName(item.name)
      setIsEditing(true)
    }
  }

  const handleNameSave = () => {
    const trimmed = editedName.trim()
    if (trimmed && trimmed !== item.name) {
      onUpdate(item.id, { name: trimmed })
    } else {
      setEditedName(item.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setEditedName(item.name)
      setIsEditing(false)
    }
  }

  return (
    <div className={cn(
      "group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
      item.checked 
        ? "bg-muted/40" 
        : "bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border"
    )}>
      <button
        onClick={() => !isShareView && onToggle(item.id)}
        disabled={isShareView}
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
          item.checked
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary/50",
          isShareView && "cursor-default"
        )}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
          />
        ) : (
          <span 
            onClick={handleNameClick}
            className={cn(
              "text-sm font-medium transition-all duration-200 line-clamp-1 cursor-text",
              item.checked && "line-through text-muted-foreground cursor-default"
            )}
          >
            {item.name}
          </span>
        )}
      </div>

      <div className={cn(
        "flex items-center gap-1 transition-opacity duration-200",
        item.checked && "opacity-40"
      )}>
        <div className="flex items-center bg-muted/50 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-muted"
            onClick={handleDecrement}
            disabled={isShareView || item.checked || (item.quantity || 1) <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-6 text-center text-xs font-semibold tabular-nums">
            {item.quantity || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-muted"
            onClick={handleIncrement}
            disabled={isShareView || item.checked}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {!isShareView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function GroceryPage() {
  const { isShareView } = useShareView()
  const {
    lists,
    createList,
    updateList,
    deleteList,
    loading: listsLoading
  } = useGroceryLists()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)

  const { 
    uncheckedItems, 
    checkedItems, 
    loading: itemsLoading, 
    addItem, 
    updateItem, 
    toggleItem, 
    deleteItem, 
    clearChecked,
  } = useGroceryList(selectedListId)

  const loading = listsLoading || (selectedListId && itemsLoading)
  const currentList = lists.find(l => l.id === selectedListId)
  
  useEffect(() => {
    if (!listsLoading && lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id)
    }
  }, [lists, listsLoading, selectedListId])

  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return

    setIsAdding(true)
    try {
      await addItem({ name: newItem.trim() })
      setNewItem('')
    } catch {
      toast.error('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    try {
      const list = await createList(newListName.trim())
      setSelectedListId(list.id)
      setIsCreateDialogOpen(false)
      setNewListName('')
      toast.success('List created')
    } catch {
      toast.error('Failed to create list')
    }
  }

  const openRenameDialog = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingListId(id)
    setNewListName(name)
    setIsRenameDialogOpen(true)
  }

  const handleRenameList = async () => {
    if (!newListName.trim() || !editingListId) return
    try {
      await updateList(editingListId, newListName.trim())
      setIsRenameDialogOpen(false)
      setNewListName('')
      setEditingListId(null)
      toast.success('List renamed')
    } catch {
      toast.error('Failed to rename list')
    }
  }

  const handleDeleteList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this list?')) return
    
    try {
      await deleteList(id)
      if (selectedListId === id) {
        const remainingLists = lists.filter(l => l.id !== id)
        setSelectedListId(remainingLists.length > 0 ? remainingLists[0].id : null)
      }
      toast.success('List deleted')
    } catch {
      toast.error('Failed to delete list')
    }
  }

  if (loading && !uncheckedItems.length && !checkedItems.length) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading your list...</p>
        </div>
      </div>
    )
  }

  const totalItems = uncheckedItems.length + checkedItems.length
  const isEmpty = totalItems === 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full page-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Grocery</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full">
                  {currentList ? currentList.name : 'All Items'}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch List</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedListId(null)}>
                  All Items
                </DropdownMenuItem>
                {lists.map((list) => (
                  <DropdownMenuItem 
                    key={list.id} 
                    onClick={() => setSelectedListId(list.id)}
                    className="flex items-center justify-between group"
                  >
                    <span className={cn(selectedListId === list.id && "font-medium")}>
                      {list.name}
                    </span>
                    {!isShareView && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => openRenameDialog(list.id, list.name, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-destructive"
                          onClick={(e) => handleDeleteList(list.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
                {!isShareView && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsCreateDialogOpen(true)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create New List
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-muted-foreground text-lg">
            {isEmpty ? 'Start adding items to your list.' : `${uncheckedItems.length} item${uncheckedItems.length !== 1 ? 's' : ''} to buy.`}
          </p>
        </div>
        
        {!isShareView && (
          <form onSubmit={handleAdd} className="flex-1 max-w-md">
            <div className="relative">
              <Input
                placeholder="Add an item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="h-11 pl-4 pr-12 rounded-xl border-border/50 bg-card shadow-sm focus-visible:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isAdding}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newItem.trim() || isAdding}
                className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Your list is empty</h2>
          <p className="text-muted-foreground text-sm">
            Add items to start your shopping list
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {uncheckedItems.length > 0 && (
            <section>
              <div className="flex flex-col gap-2">
                {uncheckedItems.map((item) => (
                  <GroceryListItem
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                    isShareView={isShareView}
                  />
                ))}
              </div>
            </section>
          )}

          {checkedItems.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Completed ({checkedItems.length})
                </span>
                {!isShareView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChecked}
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {checkedItems.map((item) => (
                  <GroceryListItem
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                    isShareView={isShareView}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Give your new grocery list a name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. Weekly Shop"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateList()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateList}>Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename List</DialogTitle>
            <DialogDescription>
              Enter a new name for your list.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename" className="text-right">
              Name
            </Label>
            <Input
              id="rename"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameList()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameList}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
