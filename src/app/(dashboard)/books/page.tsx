'use client'

import { useState, useEffect } from 'react'
import { useBooks, type Book, type SearchResult, type BookStatus, type BookFormat } from '@/hooks/use-books'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { 
  BookOpen, 
  Search, 
  Plus, 
  Star, 
  Trash2, 
  BookMarked, 
  CheckCircle2, 
  Library, 
  Loader2,
  TrendingUp,
  Calendar,
  Pencil,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ArrowLeft,
  Headphones,
  Smartphone,
  BookText,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'want_to_read', label: 'Want to Read', icon: BookMarked },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'read', label: 'Read', icon: CheckCircle2 },
  { id: 'listened', label: 'Listened', icon: Headphones },
] as const

type TabStatus = 'want_to_read' | 'reading' | 'read' | 'listened'
type AddStatus = 'want_to_read' | 'reading' | 'read' | 'listened'

const FORMATS = [
  { id: 'book', label: 'Book', icon: BookText, shortLabel: 'Book' },
  { id: 'ebook', label: 'E-book', icon: Smartphone, shortLabel: 'E-book' },
  { id: 'audiobook', label: 'Audio', icon: Headphones, shortLabel: 'Audio' },
] as const

function FormatSelector({ 
  value, 
  onChange,
  compact = false 
}: { 
  value: BookFormat
  onChange: (format: BookFormat) => void
  compact?: boolean
}) {
  return (
    <div className={cn("flex gap-1", compact ? "" : "w-full")}>
      {FORMATS.map((format) => {
        const Icon = format.icon
        const isSelected = value === format.id
        return (
          <button
            key={format.id}
            type="button"
            onClick={() => onChange(format.id as BookFormat)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border transition-all cursor-pointer",
              compact 
                ? "px-2 py-1 text-[10px]" 
                : "flex-1 px-3 py-2 text-xs",
              isSelected 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border/50 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
            )}
          >
            <Icon className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            <span className="font-medium">{compact ? format.shortLabel : format.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function FormatBadge({ format }: { format: BookFormat }) {
  const formatConfig = FORMATS.find(f => f.id === format)
  if (!formatConfig || format === 'book') return null
  
  const Icon = formatConfig.icon
  return (
    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-white text-[10px] font-medium">
      <Icon className="h-3 w-3" />
    </div>
  )
}

function StarRating({ 
  rating = 0, 
  onChange, 
  readonly = false 
}: { 
  rating?: number | null
  onChange?: (r: number) => void
  readonly?: boolean 
}) {
  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readonly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeftHalf = e.clientX - rect.left < rect.width / 2
    onChange(isLeftHalf ? star - 0.5 : star)
  }

  const getFillPercent = (star: number): number => {
    const r = rating || 0
    if (r >= star) return 100
    if (r >= star - 0.5) return 50
    return 0
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercent = getFillPercent(star)
        
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={(e) => handleClick(star, e)}
            className={cn(
              "p-0.5 transition-all hover:scale-110 focus:outline-hidden relative",
              readonly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"
            )}
          >
            <Star className="h-4 w-4 text-muted-foreground/30" />
            <Star 
              className="h-4 w-4 fill-yellow-400 text-yellow-400 absolute top-0.5 left-0.5"
              style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
            />
          </button>
        )
      })}
    </div>
  )
}

function SearchBookDialog({ 
  open, 
  onOpenChange,
  searchBooks,
  addBook,
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  searchBooks: (query: string) => Promise<SearchResult[]>
  addBook: (data: Partial<Book> & { title: string }) => Promise<Book>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  
  const [finishedBook, setFinishedBook] = useState<SearchResult | null>(null)
  const [finishedRating, setFinishedRating] = useState(0)
  const [finishedDate, setFinishedDate] = useState(new Date().toISOString().split('T')[0])
  const [finishedFormat, setFinishedFormat] = useState<BookFormat>('book')

  const [manualMode, setManualMode] = useState(false)
  const [manualBook, setManualBook] = useState({
    title: '',
    author: '',
    cover_url: '',
    status: 'want_to_read' as AddStatus,
    format: 'book' as BookFormat,
    rating: 0,
    finished_at: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!open) {
      setManualMode(false)
      setManualBook({
        title: '',
        author: '',
        cover_url: '',
        status: 'want_to_read',
        format: 'book',
        rating: 0,
        finished_at: new Date().toISOString().split('T')[0]
      })
      setQuery('')
      setResults([])
      setFinishedFormat('book')
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const data = await searchBooks(query)
        setResults(data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to search books')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchBooks])

  const handleAdd = async (book: SearchResult, status: BookStatus = 'want_to_read') => {
    setAddingId(book.open_library_key)
    try {
      const bookData: Partial<Book> & { title: string } = {
        ...book,
        status,
      }
      if (status === 'reading') {
        bookData.started_at = new Date().toISOString()
      }
      await addBook(bookData)
      toast.success(`Added "${book.title}" to your library`)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add book')
    } finally {
      setAddingId(null)
    }
  }

  const handleAddAsFinished = async () => {
    if (!finishedBook) return
    setAddingId(finishedBook.open_library_key)
    try {
      await addBook({
        ...finishedBook,
        status: 'finished',
        format: finishedFormat,
        rating: finishedRating || null,
        finished_at: finishedDate ? new Date(finishedDate).toISOString() : new Date().toISOString(),
        started_at: finishedDate ? new Date(finishedDate).toISOString() : new Date().toISOString(),
      })
      toast.success(`Added "${finishedBook.title}" as finished`)
      setFinishedBook(null)
      setFinishedRating(0)
      setFinishedDate(new Date().toISOString().split('T')[0])
      setFinishedFormat('book')
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add book')
    } finally {
      setAddingId(null)
    }
  }

  const handleManualAdd = async () => {
    if (!manualBook.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const isFinished = manualBook.status === 'read' || manualBook.status === 'listened'
      const dbStatus: BookStatus = isFinished ? 'finished' : (manualBook.status as BookStatus)
      const format: BookFormat = manualBook.status === 'listened' ? 'audiobook' : manualBook.format

      const bookData: Partial<Book> & { title: string } = {
        title: manualBook.title,
        author: manualBook.author,
        cover_url: manualBook.cover_url,
        status: dbStatus,
        format: format,
      }

      if (manualBook.status === 'reading') {
        bookData.started_at = new Date().toISOString()
      } else if (isFinished) {
        const date = manualBook.finished_at ? new Date(manualBook.finished_at) : new Date()
        bookData.finished_at = date.toISOString()
        bookData.started_at = date.toISOString()
        bookData.rating = manualBook.rating || null
      }

      await addBook(bookData)
      toast.success(`Added "${manualBook.title}" to your library`)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add book')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Search or Add Book</DialogTitle>
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
              <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or ISBN..."
                className="pl-10 pr-10 h-12 text-lg border-none bg-secondary/30 focus-visible:ring-0 focus-visible:bg-secondary/50 transition-colors rounded-xl"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {isSearching ? (
                <div className="absolute right-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : query && (
                <button 
                  className="absolute right-3 p-1 rounded-full hover:bg-secondary cursor-pointer"
                  onClick={() => setQuery('')}
                >
                  <span className="sr-only">Clear</span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          {manualMode ? (
            <div className="space-y-6 max-w-lg mx-auto py-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Enter book title"
                    value={manualBook.title}
                    onChange={(e) => setManualBook({ ...manualBook, title: e.target.value })}
                    className="bg-secondary/20"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author" className="text-sm font-medium">Author</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    value={manualBook.author}
                    onChange={(e) => setManualBook({ ...manualBook, author: e.target.value })}
                    className="bg-secondary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover" className="text-sm font-medium">Cover URL (Optional)</Label>
                  <Input
                    id="cover"
                    placeholder="https://example.com/cover.jpg"
                    value={manualBook.cover_url}
                    onChange={(e) => setManualBook({ ...manualBook, cover_url: e.target.value })}
                    className="bg-secondary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TABS.map((tab) => {
                      const Icon = tab.icon
                      const isSelected = manualBook.status === tab.id
                      return (
                        <div
                          key={tab.id}
                          onClick={() => setManualBook({ ...manualBook, status: tab.id as AddStatus })}
                          className={cn(
                            "cursor-pointer flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/50 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{tab.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {manualBook.status !== 'listened' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Format</Label>
                    <FormatSelector 
                      value={manualBook.format} 
                      onChange={(f) => setManualBook({ ...manualBook, format: f })} 
                    />
                  </div>
                )}

                {(manualBook.status === 'read' || manualBook.status === 'listened') && (
                  <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rating</Label>
                      <div className="h-10 flex items-center px-3 rounded-md border border-input bg-secondary/20">
                        <StarRating 
                          rating={manualBook.rating} 
                          onChange={(r) => setManualBook({ ...manualBook, rating: r })} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finished_at" className="text-sm font-medium">Date Finished</Label>
                      <Input
                        id="finished_at"
                        type="date"
                        value={manualBook.finished_at}
                        onChange={(e) => setManualBook({ ...manualBook, finished_at: e.target.value })}
                        className="bg-secondary/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button onClick={handleManualAdd} className="w-full h-11 text-base shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
              </div>
            </div>
          ) : (
            <>
              {results.length === 0 && query && !isSearching && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                  <p className="mb-4">No books found for "{query}"</p>
                  <Button variant="outline" onClick={() => setManualMode(true)}>
                    Can't find it? Add manually
                  </Button>
                </div>
              )}
              
              {results.length === 0 && !query && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-3 opacity-20" />
                  <p className="mb-4">Start typing to search the Open Library...</p>
                  <Button variant="ghost" size="sm" onClick={() => setManualMode(true)} className="text-xs">
                    Can't find it? Add manually
                  </Button>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                    {results.map((book) => (
                      <div 
                        key={book.open_library_key}
                        className="flex gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors group relative border border-transparent hover:border-border/50"
                      >
                        <div className="shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden shadow-xs relative">
                          {book.cover_url ? (
                            <img 
                              src={book.cover_url} 
                              alt={book.title}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                              <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                          <div>
                            <h4 className="font-medium text-sm leading-tight line-clamp-2 mb-1 text-foreground/90">
                              {book.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {book.author || 'Unknown Author'}
                            </p>
                            {book.year && (
                              <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                                {book.year}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="flex-1 h-7 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => handleAdd(book)}
                              disabled={addingId === book.open_library_key}
                            >
                              {addingId === book.open_library_key ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              Add
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="h-7 px-2"
                                  disabled={addingId === book.open_library_key}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => handleAdd(book, 'want_to_read')} className="cursor-pointer">
                                  <BookMarked className="mr-2 h-4 w-4" /> Want to Read
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAdd(book, 'reading')} className="cursor-pointer">
                                  <BookOpen className="mr-2 h-4 w-4" /> Currently Reading
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setFinishedBook(book)} className="cursor-pointer">
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Add as Finished...
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center pt-2 pb-4">
                    <Button variant="ghost" size="sm" onClick={() => setManualMode(true)} className="text-muted-foreground hover:text-foreground">
                      Can't find it? Add manually
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      <Dialog open={!!finishedBook} onOpenChange={(open) => !open && setFinishedBook(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Add as Finished</DialogTitle>
          {finishedBook && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden">
                  {finishedBook.cover_url ? (
                    <img src={finishedBook.cover_url} alt={finishedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{finishedBook.title}</h4>
                  <p className="text-sm text-muted-foreground">{finishedBook.author || 'Unknown Author'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Format</Label>
                <FormatSelector value={finishedFormat} onChange={setFinishedFormat} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Your Rating</Label>
                <StarRating rating={finishedRating} onChange={setFinishedRating} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="finishDate" className="text-sm">Date Finished</Label>
                <Input
                  id="finishDate"
                  type="date"
                  value={finishedDate}
                  onChange={(e) => setFinishedDate(e.target.value)}
                  className="h-9"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setFinishedBook(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAddAsFinished}
                  disabled={addingId === finishedBook.open_library_key}
                >
                  {addingId === finishedBook.open_library_key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Book
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function BookCard({ 
  book, 
  updateBook, 
  deleteBook 
}: { 
  book: Book
  updateBook: (id: string, data: Partial<Book>) => Promise<Book>
  deleteBook: (id: string) => Promise<void>
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [editStarted, setEditStarted] = useState(book.started_at ? book.started_at.split('T')[0] : '')
  const [editFinished, setEditFinished] = useState(book.finished_at ? book.finished_at.split('T')[0] : '')
  const [editFormat, setEditFormat] = useState<BookFormat>(book.format || 'book')

  const handleStatusChange = async (newStatus: TabStatus) => {
    try {
      const isFinishing = newStatus === 'read' || newStatus === 'listened'
      const dbStatus: BookStatus = isFinishing ? 'finished' : (newStatus as BookStatus)
      const updates: Partial<Book> = { status: dbStatus }
      
      if (newStatus === 'reading' && !book.started_at) {
        updates.started_at = new Date().toISOString()
      }
      
      if (isFinishing) {
        if (newStatus === 'listened') {
          updates.format = 'audiobook'
        }
        if (!book.finished_at) {
          updates.finished_at = new Date().toISOString()
          if (!book.started_at) {
            updates.started_at = new Date().toISOString()
          }
        }
      }
      
      await updateBook(book.id, updates)
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleRatingChange = async (rating: number) => {
    try {
      await updateBook(book.id, { rating })
      toast.success('Rating updated')
    } catch (error) {
      toast.error('Failed to update rating')
    }
  }

  const handleSaveEdit = async () => {
    try {
      const updates: Partial<Book> = { format: editFormat }
      if (editStarted) updates.started_at = new Date(editStarted).toISOString()
      else updates.started_at = null
      if (editFinished) updates.finished_at = new Date(editFinished).toISOString()
      else updates.finished_at = null
      
      await updateBook(book.id, updates)
      toast.success('Updated')
      setEditOpen(false)
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book?')) return
    try {
      await deleteBook(book.id)
      toast.success('Book deleted')
    } catch (error) {
      toast.error('Failed to delete book')
    }
  }

  return (
    <Card className="group relative overflow-hidden border-0 bg-transparent hover:bg-secondary/20 transition-all duration-300">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-secondary shadow-xs group-hover:shadow-md transition-all cursor-pointer">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-20" />
          </div>
        )}
        
        <FormatBadge format={book.format} />
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-[2px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md">
                {book.status === 'want_to_read' ? 'Want to Read' : 
                 book.status === 'reading' ? 'Reading' : 
                 book.format === 'audiobook' ? 'Listened' : 'Read'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-40">
              <DropdownMenuItem onClick={() => handleStatusChange('want_to_read')} className="cursor-pointer">
                <BookMarked className="mr-2 h-4 w-4" /> Want to Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('reading')} className="cursor-pointer">
                <BookOpen className="mr-2 h-4 w-4" /> Reading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('read')} className="cursor-pointer">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('listened')} className="cursor-pointer">
                <Headphones className="mr-2 h-4 w-4" /> Listened
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-2">
            <Popover open={editOpen} onOpenChange={setEditOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="center">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Edit Book</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Format</Label>
                    <FormatSelector value={editFormat} onChange={setEditFormat} compact />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="started" className="text-xs">Started Reading</Label>
                    <Input
                      id="started"
                      type="date"
                      value={editStarted}
                      onChange={(e) => setEditStarted(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finished" className="text-xs">Finished Reading</Label>
                    <Input
                      id="finished"
                      type="date"
                      value={editFinished}
                      onChange={(e) => setEditFinished(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button onClick={handleSaveEdit} size="sm" className="w-full">
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600 border-none"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
          {book.status === 'reading' && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-semibold leading-tight tracking-tight text-foreground/90 line-clamp-1" title={book.title}>
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {book.author || 'Unknown'}
        </p>
        
        {book.status === 'reading' && book.started_at && (
          <p className="text-xs text-muted-foreground/70 pt-1">
            Started {formatDate(book.started_at)}
          </p>
        )}
        
        {book.status === 'finished' && (
          <div className="pt-1 space-y-1">
            <StarRating rating={book.rating} onChange={handleRatingChange} />
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs text-muted-foreground/70 hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors">
                  <Calendar className="h-3 w-3" />
                  {book.finished_at ? formatDate(book.finished_at) : 'Add finish date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-2">
                  <Label className="text-xs">Finished Reading</Label>
                  <Input
                    type="date"
                    defaultValue={book.finished_at ? book.finished_at.split('T')[0] : ''}
                    onChange={async (e) => {
                      try {
                        await updateBook(book.id, { 
                          finished_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                        })
                        toast.success('Date updated')
                      } catch {
                        toast.error('Failed to update')
                      }
                    }}
                    className="h-8 w-40"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </Card>
  )
}

function ReadingStats({ books }: { books: Book[] }) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  
  const finishedBooks = books.filter(b => b.status === 'finished')
  const currentlyReading = books.filter(b => b.status === 'reading').length
  
  const finishedThisMonth = finishedBooks.filter(b => 
    b.finished_at && new Date(b.finished_at) >= startOfMonth
  ).length
  
  const finishedThisYear = finishedBooks.filter(b => 
    b.finished_at && new Date(b.finished_at) >= startOfYear
  ).length
  
  const ratedBooks = finishedBooks.filter(b => b.rating)
  const avgRating = ratedBooks.length > 0 
    ? (ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBooks.length).toFixed(1)
    : null

  if (books.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">This Month</span>
        </div>
        <p className="text-2xl font-bold">{finishedThisMonth}</p>
        <p className="text-xs text-muted-foreground">books finished</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">This Year</span>
        </div>
        <p className="text-2xl font-bold">{finishedThisYear}</p>
        <p className="text-xs text-muted-foreground">books finished</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Reading</span>
        </div>
        <p className="text-2xl font-bold">{currentlyReading}</p>
        <p className="text-xs text-muted-foreground">in progress</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Star className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Avg Rating</span>
        </div>
        <p className="text-2xl font-bold">{avgRating || '—'}</p>
        <p className="text-xs text-muted-foreground">{ratedBooks.length} rated</p>
      </div>
    </div>
  )
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

type SortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'title'
type RatingFilter = 'all' | '5' | '4+' | '3+' | 'unrated'

export default function BooksPage() {
  const { books, loading, searchBooks, addBook, updateBook, deleteBook } = useBooks()
  const [activeTab, setActiveTab] = useState<TabStatus>('want_to_read')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const getBooksByStatus = (status: TabStatus) => {
    let filtered: Book[]
    
    // Handle virtual statuses 'read' and 'listened'
    if (status === 'read') {
      filtered = books.filter(b => b.status === 'finished' && (b.format || 'book') !== 'audiobook')
    } else if (status === 'listened') {
      filtered = books.filter(b => b.status === 'finished' && b.format === 'audiobook')
    } else {
      filtered = books.filter(b => b.status === status)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(query) || 
        (b.author && b.author.toLowerCase().includes(query))
      )
    }

    // Apply rating and date filters for read/listened tabs
    if (status === 'read' || status === 'listened') {
      if (ratingFilter !== 'all') {
        filtered = filtered.filter(b => {
          if (ratingFilter === 'unrated') return !b.rating
          if (ratingFilter === '5') return b.rating === 5
          if (ratingFilter === '4+') return (b.rating || 0) >= 4
          if (ratingFilter === '3+') return (b.rating || 0) >= 3
          return true
        })
      }

      if (dateFrom || dateTo) {
        filtered = filtered.filter(b => {
          if (!b.finished_at) return false
          const finishedDate = new Date(b.finished_at)
          
          if (dateFrom) {
            const fromDate = new Date(dateFrom)
            if (finishedDate < fromDate) return false
          }
          
          if (dateTo) {
            const toDate = new Date(dateTo)
            toDate.setHours(23, 59, 59, 999)
            if (finishedDate > toDate) return false
          }
          
          return true
        })
      }
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const dateA = a.finished_at || a.started_at || a.created_at
          const dateB = b.finished_at || b.started_at || b.created_at
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        case 'oldest':
          const dateA2 = a.finished_at || a.started_at || a.created_at
          const dateB2 = b.finished_at || b.started_at || b.created_at
          return new Date(dateA2).getTime() - new Date(dateB2).getTime()
        case 'rating_high':
          return (b.rating || 0) - (a.rating || 0)
        case 'rating_low':
          return (a.rating || 0) - (b.rating || 0)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    
    return filtered
  }
  
  const activeBooks = getBooksByStatus(activeTab)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">My Library</h1>
            </div>
            
            <Button 
              onClick={() => setIsSearchOpen(true)}
              className="gap-2 rounded-full px-4 shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Book</span>
              <span className="inline sm:hidden">Add</span>
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const count = tab.id === 'read' 
                  ? books.filter(b => b.status === 'finished' && (b.format || 'book') !== 'audiobook').length
                  : tab.id === 'listened'
                  ? books.filter(b => b.status === 'finished' && b.format === 'audiobook').length
                  : books.filter(b => b.status === tab.id).length
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabStatus)}
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
            
            <div className="flex items-center gap-1 shrink-0">
              {mobileSearchOpen ? (
                <div className="relative sm:hidden w-[160px] mr-1 animate-in slide-in-from-right-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="h-8 w-full pl-8 pr-8 text-xs bg-background/50 focus:bg-background transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setMobileSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 sm:hidden"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              
              <div className="relative hidden sm:block w-[180px] mr-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search books..."
                  className="h-8 w-full pl-8 pr-8 text-xs bg-background/50 focus:bg-background transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex h-8 gap-1 text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setSortBy('newest')} className={cn("cursor-pointer", sortBy === 'newest' && "bg-secondary")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')} className={cn("cursor-pointer", sortBy === 'oldest' && "bg-secondary")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')} className={cn("cursor-pointer", sortBy === 'title' && "bg-secondary")}>
                    Title A-Z
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('rating_high')} className={cn("cursor-pointer", sortBy === 'rating_high' && "bg-secondary")}>
                    Highest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('rating_low')} className={cn("cursor-pointer", sortBy === 'rating_low' && "bg-secondary")}>
                    Lowest Rated
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(activeTab === 'read' || activeTab === 'listened') && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className={cn("h-8 gap-1 text-xs", (dateFrom || dateTo) && "text-primary")}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Date</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">Filter by Date</h4>
                          <p className="text-xs text-muted-foreground">Show books {activeTab === 'listened' ? 'listened' : 'read'} within range</p>
                        </div>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-4 items-center gap-2">
                            <Label htmlFor="from" className="text-xs text-right">From</Label>
                            <Input
                              id="from"
                              type="date"
                              className="col-span-3 h-8 text-xs"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <Label htmlFor="to" className="text-xs text-right">To</Label>
                            <Input
                              id="to"
                              type="date"
                              className="col-span-3 h-8 text-xs"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                            />
                          </div>
                        </div>
                        {(dateFrom || dateTo) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              setDateFrom('')
                              setDateTo('')
                            }}
                          >
                            Clear Date Filter
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className={cn("h-8 gap-1 text-xs", ratingFilter !== 'all' && "text-primary")}>
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Rating</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setRatingFilter('all')} className={cn("cursor-pointer", ratingFilter === 'all' && "bg-secondary")}>
                        All Ratings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setRatingFilter('5')} className={cn("cursor-pointer", ratingFilter === '5' && "bg-secondary")}>
                        <Star className="h-3 w-3 mr-2 fill-yellow-400 text-yellow-400" /> 5 Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('4+')} className={cn("cursor-pointer", ratingFilter === '4+' && "bg-secondary")}>
                        <Star className="h-3 w-3 mr-2 fill-yellow-400 text-yellow-400" /> 4+ Stars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRatingFilter('3+')} className={cn("cursor-pointer", ratingFilter === '3+' && "bg-secondary")}>
                        <Star className="h-3 w-3 mr-2 fill-yellow-400 text-yellow-400" /> 3+ Stars
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setRatingFilter('unrated')} className={cn("cursor-pointer", ratingFilter === 'unrated' && "bg-secondary")}>
                        Unrated
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6">
        <ReadingStats books={books} />
        
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded-sm bg-muted" />
              </div>
            ))}
          </div>
        ) : activeBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {activeBooks.map((book) => (
              <BookCard key={book.id} book={book} updateBook={updateBook} deleteBook={deleteBook} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 rounded-full bg-secondary/50 p-6 ring-1 ring-border/50">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === 'want_to_read' && "Your reading list is empty"}
              {activeTab === 'reading' && "You're not reading anything right now"}
              {activeTab === 'read' && "You haven't finished any books yet"}
              {activeTab === 'listened' && "You haven't listened to any audiobooks yet"}
            </h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              {activeTab === 'want_to_read' && "Search for books you want to read and add them to your collection to keep track of them."}
              {activeTab === 'reading' && "When you start reading a book, move it here to track your progress."}
              {activeTab === 'read' && "Finished books will appear here. You can rate them and keep a history of what you've read."}
              {activeTab === 'listened' && "Finished audiobooks will appear here. You can rate them and keep a history of what you've listened to."}
            </p>
            <Button onClick={() => setIsSearchOpen(true)} className="gap-2">
              <Search className="h-4 w-4" />
              Find Books
            </Button>
          </div>
        )}
      </div>

      <SearchBookDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen}
        searchBooks={searchBooks}
        addBook={addBook}
      />
    </div>
  )
}
