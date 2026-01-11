'use client'

import { useState, useEffect } from 'react'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useWishlist, type WishlistItem } from '@/hooks/use-wishlist'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Gift, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Check, 
  ExternalLink,
  Loader2,
  Pencil,
  Link as LinkIcon,
  ArrowLeft,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'unpurchased', label: 'Wishlist', icon: Gift },
  { id: 'purchased', label: 'Purchased', icon: ShoppingBag },
] as const

type TabType = typeof TABS[number]['id']

function AddItemDialog({
  open,
  onOpenChange,
  addItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  addItem: (data: { url: string; title?: string; image_url?: string; price?: string; currency?: string; notes?: string }) => Promise<WishlistItem>
}) {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setManualMode(false)
      setInputValue('')
      setTitle('')
      setUrl('')
      setImageUrl('')
      setPrice('')
      setCurrency('')
      setNotes('')
    }
  }, [open])

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleAddUrl = async () => {
    if (!inputValue.trim() || !isValidUrl(inputValue)) return
    
    setIsAdding(true)
    try {
      await addItem({ url: inputValue })
      toast.success('Item added to wishlist')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    
    setIsAdding(true)
    try {
      await addItem({ 
        url,
        title,
        image_url: imageUrl || undefined,
        price: price || undefined,
        currency: currency || undefined,
        notes: notes || undefined,
      })
      toast.success('Item added to wishlist')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Add Item to Wishlist</DialogTitle>
        <div className="p-4 border-b border-border/50 sticky top-0 z-10 bg-background/50">
          {manualMode ? (
            <div className="flex items-center gap-2 h-12">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setManualMode(false)}
                className="-ml-2 hover:bg-secondary/50 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">Add Manually</h2>
            </div>
          ) : (
            <div className="relative flex items-center">
              <LinkIcon className="absolute left-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Paste a product URL..."
                className="pl-10 pr-10 h-12 text-lg border-none bg-secondary/30 focus-visible:ring-0 focus-visible:bg-secondary/50 transition-colors rounded-xl"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidUrl(inputValue)) {
                    e.preventDefault()
                    handleAddUrl()
                  }
                }}
                autoFocus
              />
              {isAdding ? (
                <div className="absolute right-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : inputValue && (
                <button 
                  className="absolute right-3 p-1 rounded-full hover:bg-secondary cursor-pointer"
                  onClick={() => setInputValue('')}
                >
                  <span className="sr-only">Clear</span>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {manualMode ? (
            <form onSubmit={handleAddManual} className="space-y-4 max-w-md mx-auto py-2">
              <div className="space-y-2">
                <Label htmlFor="manual-title" className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="manual-title"
                  placeholder="Product name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary/20"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-url" className="text-sm font-medium">URL <span className="text-red-500">*</span></Label>
                <Input
                  id="manual-url"
                  placeholder="https://example.com/product..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-secondary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-image" className="text-sm font-medium">Image URL</Label>
                <Input
                  id="manual-image"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-secondary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-price" className="text-sm font-medium">Price</Label>
                  <Input
                    id="manual-price"
                    placeholder="99.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-secondary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-currency" className="text-sm font-medium">Currency</Label>
                  <Input
                    id="manual-currency"
                    placeholder="USD"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-secondary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="manual-notes"
                  placeholder="Any notes about this item..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="bg-secondary/20"
                />
              </div>
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isAdding || !title.trim() || !url.trim()}
                  className="w-full h-11 text-base shadow-lg shadow-primary/20"
                >
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </form>
          ) : (
            <>
              {isValidUrl(inputValue) ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-primary/10 rounded-full p-4 mb-4">
                    <LinkIcon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-2">Ready to add</p>
                  <p className="text-xs text-muted-foreground mb-6 max-w-sm truncate px-4">{inputValue}</p>
                  <Button onClick={handleAddUrl} disabled={isAdding} className="gap-2">
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add to Wishlist
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mb-3 opacity-20" />
                  <p className="mb-4">Paste a product URL to add to your wishlist</p>
                  <Button variant="ghost" size="sm" onClick={() => setManualMode(true)} className="text-xs">
                    Can't paste a URL? Add manually
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditItemDialog({
  item,
  open,
  onOpenChange,
  updateItem,
}: {
  item: WishlistItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  updateItem: (id: string, data: Partial<WishlistItem>) => Promise<WishlistItem>
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && item) {
      setTitle(item.title)
      setUrl(item.url)
      setImageUrl(item.image_url || '')
      setPrice(item.price || '')
      setCurrency(item.currency || '')
      setNotes(item.notes || '')
    }
  }, [open, item])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !title.trim() || !url.trim()) return

    setIsSaving(true)
    try {
      await updateItem(item.id, {
        title,
        url,
        image_url: imageUrl || null,
        price: price || null,
        currency: currency || null,
        notes: notes || null,
      })
      toast.success('Item updated')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update item')
    } finally {
      setIsSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">Edit Item</DialogTitle>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL <span className="text-red-500">*</span></Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-image">Image URL</Label>
            <Input
              id="edit-image"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                placeholder="99.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                placeholder="USD"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any notes about this item..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !title.trim() || !url.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailPanel({
  item,
  onClose,
  onEdit,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: WishlistItem
  onClose: () => void
  onEdit: (item: WishlistItem) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<WishlistItem>) => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(item.title)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleTitleClick = () => {
    setEditedTitle(item.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== item.title) {
      onUpdate(item.id, { title: trimmed })
    } else {
      setEditedTitle(item.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(item.title)
      setIsEditingTitle(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm text-muted-foreground">Item Details</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-secondary/50 mb-4">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                <Gift className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-lg font-semibold leading-tight bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
              ) : (
                <h2 
                  onClick={handleTitleClick}
                  className="text-lg font-semibold leading-tight cursor-text"
                >
                  {item.title}
                </h2>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <LinkIcon className="h-3 w-3" />
                <span>{item.site_name || new URL(item.url).hostname.replace('www.', '')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Added {formatDate(item.created_at)}
              </p>
            </div>
            
            {item.price && (
              <div className="inline-flex items-center rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-lg font-bold">
                {item.currency} {item.price}
              </div>
            )}

            {item.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</span>
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <Button 
          variant={item.purchased ? "secondary" : "default"}
          size="sm"
          className={cn(
            "w-full gap-1.5", 
            item.purchased && "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
          )}
          onClick={() => onToggle(item.id)}
        >
          <Check className="h-3.5 w-3.5" />
          {item.purchased ? "Purchased" : "Mark Purchased"}
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          className="w-full gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function MobileDetailSheet({
  item,
  open,
  onClose,
  onEdit,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: WishlistItem | null
  open: boolean
  onClose: () => void
  onEdit: (item: WishlistItem) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<WishlistItem>) => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(item?.title || '')

  if (!item) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleTitleClick = () => {
    setEditedTitle(item.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== item.title) {
      onUpdate(item.id, { title: trimmed })
    } else {
      setEditedTitle(item.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(item.title)
      setIsEditingTitle(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex flex-col max-h-[90vh]">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-secondary/50 mb-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                    <Gift className="h-16 w-16" />
                  </div>
                )}
              </div>

              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                />
              ) : (
                <h2 onClick={handleTitleClick} className="text-xl font-semibold cursor-text">{item.title}</h2>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {item.site_name || new URL(item.url).hostname.replace('www.', '')} • Added {formatDate(item.created_at)}
              </p>
              
              {item.price && (
                <div className="inline-flex items-center rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-lg font-bold mt-3">
                  {item.currency} {item.price}
                </div>
              )}

              {item.notes && (
                <div className="rounded-lg bg-muted/50 p-3 mt-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</span>
                  <p className="mt-1 text-sm">{item.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              <Button 
                variant={item.purchased ? "secondary" : "default"}
                className={cn("w-full gap-2", item.purchased && "bg-green-100 text-green-700")}
                onClick={() => onToggle(item.id)}
              >
                <Check className="h-4 w-4" />
                {item.purchased ? "Purchased" : "Mark Purchased"}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}

function WishlistItemCard({ 
  item, 
  togglePurchased, 
  deleteItem,
  onEdit,
  onClick,
  isSelected,
}: { 
  item: WishlistItem
  togglePurchased: (id: string) => Promise<WishlistItem | undefined>
  deleteItem: (id: string) => Promise<void>
  onEdit: () => void
  onClick: () => void
  isSelected?: boolean
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this item?')) return
    setIsDeleting(true)
    try {
      await deleteItem(item.id)
      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete item')
      setIsDeleting(false)
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await togglePurchased(item.id)
      toast.success(item.purchased ? 'Marked as unpurchased' : 'Marked as purchased')
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setIsToggling(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card 
      data-wishlist-card
      className={cn(
        "group relative overflow-hidden border-0 bg-transparent hover:bg-secondary/20 transition-all duration-300 cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary shadow-xs group-hover:shadow-md transition-all">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
            <Gift className="h-8 w-8 opacity-20" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-[2px]">
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
              asChild
              onClick={handleLinkClick}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full border-white/20 backdrop-blur-md transition-colors",
                item.purchased 
                  ? "bg-green-500/80 border-transparent text-white hover:bg-green-600" 
                  : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
              onClick={handleToggle}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>

            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600 border-none backdrop-blur-md"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {item.price && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-medium text-white shadow-sm opacity-100 group-hover:opacity-0 transition-opacity">
            {item.currency} {item.price}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5 px-0.5">
        <h3 className="text-sm font-medium leading-tight text-foreground/90 line-clamp-1" title={item.title}>
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.site_name || new URL(item.url).hostname.replace('www.', '')}
        </p>
      </div>
    </Card>
  )
}

export default function WishlistPage() {
  const { 
    items,
    unpurchasedItems, 
    purchasedItems, 
    loading, 
    addItem, 
    updateItem,
    togglePurchased, 
    deleteItem 
  } = useWishlist()
  
  const [activeTab, setActiveTab] = useState<TabType>('unpurchased')
  const [commandOpen, setCommandOpen] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  const handleEditItem = (item: WishlistItem) => {
    setEditItem(item)
    setEditOpen(true)
  }

  const handleItemClick = (item: WishlistItem) => {
    setSelectedItem(item)
    if (window.innerWidth < 1024) {
      setMobileSheetOpen(true)
    }
  }

  const handleClosePanel = () => {
    setSelectedItem(null)
    setMobileSheetOpen(false)
  }

  const handlePanelEdit = (item: WishlistItem) => {
    handleEditItem(item)
  }

  const handlePanelToggle = async (id: string) => {
    await togglePurchased(id)
    const updated = items.find(i => i.id === id)
    if (updated) setSelectedItem({...updated, purchased: !updated.purchased})
  }
  
  const handlePanelDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteItem(id)
      setSelectedItem(null)
      setMobileSheetOpen(false)
      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  const activeItems = activeTab === 'unpurchased' ? unpurchasedItems : purchasedItems

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Wishlist</h1>
            </div>
            
            <Button 
              onClick={() => setCommandOpen(true)}
              className="gap-2 rounded-full px-4 shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="inline sm:hidden">Add</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 pb-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const count = tab.id === 'unpurchased' ? unpurchasedItems.length : purchasedItems.length
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-hidden whitespace-nowrap cursor-pointer",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    {tab.label}
                    <span className={cn(
                      "ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px]",
                      isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-secondary-foreground/10 text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        <div 
          className="flex-1 px-4 py-8 md:px-6"
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (!target.closest('[data-wishlist-card]') && !target.closest('[data-detail-panel]')) {
              setSelectedItem(null)
            }
          }}
        >
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
                  <div className="h-2 w-1/2 animate-pulse rounded-sm bg-muted" />
                </div>
              ))}
            </div>
          ) : activeItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-6">
              {activeItems.map((item) => (
                <WishlistItemCard 
                  key={item.id} 
                  item={item} 
                  togglePurchased={togglePurchased} 
                  deleteItem={deleteItem}
                  onEdit={() => handleEditItem(item)}
                  onClick={() => handleItemClick(item)}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-6 rounded-full bg-secondary/50 p-6 ring-1 ring-border/50">
                <Gift className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {activeTab === 'unpurchased' && "Your wishlist is empty"}
                {activeTab === 'purchased' && "No purchased items yet"}
              </h3>
              <p className="mb-6 max-w-md text-muted-foreground">
                {activeTab === 'unpurchased' && "Found something you like? Add it to your wishlist."}
                {activeTab === 'purchased' && "Items you mark as purchased will appear here."}
              </p>
              {activeTab === 'unpurchased' && (
                <Button onClick={() => setCommandOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedItem && (
          <div data-detail-panel className="hidden lg:block fixed right-0 top-0 h-screen w-[360px] border-l border-border/50 bg-background/95 backdrop-blur-sm z-20 shadow-xl">
            <DetailPanel
              item={selectedItem}
              onClose={handleClosePanel}
              onEdit={handlePanelEdit}
              onToggle={handlePanelToggle}
              onDelete={handlePanelDelete}
              onUpdate={async (id, data) => {
                await updateItem(id, data)
                if (data.title) setSelectedItem({...selectedItem, ...data})
              }}
            />
          </div>
        )}
      </div>

      <MobileDetailSheet
        item={selectedItem}
        open={mobileSheetOpen}
        onClose={handleClosePanel}
        onEdit={handlePanelEdit}
        onToggle={handlePanelToggle}
        onDelete={handlePanelDelete}
        onUpdate={async (id, data) => {
          await updateItem(id, data)
          if (selectedItem && data.title) setSelectedItem({...selectedItem, ...data})
        }}
      />

      <AddItemDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        addItem={addItem}
      />

      <EditItemDialog
        item={editItem}
        open={editOpen}
        onOpenChange={setEditOpen}
        updateItem={updateItem}
      />
    </div>
  )
}
