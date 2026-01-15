'use client'

import { useState, useEffect } from 'react'
import { useMedia, type Media, type SearchResult, type MediaStatus, type MediaType } from '@/hooks/use-media'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Film, 
  Tv, 
  Search, 
  Plus, 
  Star, 
  Trash2, 
  Bookmark, 
  CheckCircle2, 
  PlayCircle, 
  Loader2,
  TrendingUp,
  Calendar,
  Pencil,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ArrowLeft,
  Clapperboard,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useShareView } from '@/lib/share-view/context'

const TABS = [
  { id: 'want_to_watch', label: 'Want to Watch', icon: Bookmark },
  { id: 'watching', label: 'Watching', icon: PlayCircle },
  { id: 'finished', label: 'Finished', icon: CheckCircle2 },
] as const

const TYPE_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
] as const

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

function SearchMediaDialog({ 
  open, 
  onOpenChange,
  searchMedia,
  addMedia,
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  searchMedia: (query: string, type?: MediaType) => Promise<SearchResult[]>
  addMedia: (data: Partial<Media> & { tmdb_id: number; media_type: MediaType; title: string }) => Promise<Media>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<MediaType | undefined>(undefined)
  
  const [finishedMedia, setFinishedMedia] = useState<SearchResult | null>(null)
  const [finishedRating, setFinishedRating] = useState(0)
  const [finishedDate, setFinishedDate] = useState(new Date().toISOString().split('T')[0])

  const [manualMode, setManualMode] = useState(false)
  const [manualMedia, setManualMedia] = useState({
    title: '',
    media_type: 'movie' as MediaType,
    poster_url: '',
    status: 'want_to_watch' as MediaStatus,
    rating: 0,
    finished_at: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!open) {
      setManualMode(false)
      setManualMedia({
        title: '',
        media_type: 'movie',
        poster_url: '',
        status: 'want_to_watch',
        rating: 0,
        finished_at: new Date().toISOString().split('T')[0]
      })
      setQuery('')
      setResults([])
      setTypeFilter(undefined)
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
        const data = await searchMedia(query, typeFilter)
        setResults(data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to search')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, typeFilter, searchMedia])

  const handleAdd = async (item: SearchResult, status: MediaStatus = 'want_to_watch') => {
    const uniqueId = `${item.media_type}-${item.tmdb_id}`
    setAddingId(uniqueId)
    try {
      const mediaData: Parameters<typeof addMedia>[0] = {
        ...item,
        status,
      }
      if (status === 'watching') {
        mediaData.started_at = new Date().toISOString()
      }
      await addMedia(mediaData)
      toast.success(`Added "${item.title}" to your library`)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      if (error instanceof Error && error.message.includes('already in your library')) {
        toast.error('This title is already in your library')
      } else {
        toast.error('Failed to add')
      }
    } finally {
      setAddingId(null)
    }
  }

  const handleAddAsFinished = async () => {
    if (!finishedMedia) return
    const uniqueId = `${finishedMedia.media_type}-${finishedMedia.tmdb_id}`
    setAddingId(uniqueId)
    try {
      await addMedia({
        ...finishedMedia,
        status: 'finished',
        rating: finishedRating || null,
        finished_at: finishedDate ? new Date(finishedDate).toISOString() : new Date().toISOString(),
        started_at: finishedDate ? new Date(finishedDate).toISOString() : new Date().toISOString(),
      })
      toast.success(`Added "${finishedMedia.title}" as finished`)
      setFinishedMedia(null)
      setFinishedRating(0)
      setFinishedDate(new Date().toISOString().split('T')[0])
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add')
    } finally {
      setAddingId(null)
    }
  }

  const handleManualAdd = async () => {
    if (!manualMedia.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const mediaData: Parameters<typeof addMedia>[0] = {
        tmdb_id: Date.now(),
        title: manualMedia.title,
        media_type: manualMedia.media_type,
        poster_url: manualMedia.poster_url || null,
        status: manualMedia.status,
      }

      if (manualMedia.status === 'watching') {
        mediaData.started_at = new Date().toISOString()
      } else if (manualMedia.status === 'finished') {
        const date = manualMedia.finished_at ? new Date(manualMedia.finished_at) : new Date()
        mediaData.finished_at = date.toISOString()
        mediaData.started_at = date.toISOString()
        mediaData.rating = manualMedia.rating || null
      }

      await addMedia(mediaData)
      toast.success(`Added "${manualMedia.title}" to your library`)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Search or Add Movie/TV Show</DialogTitle>
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
            <div className="space-y-3">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search movies and TV shows..."
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
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {TYPE_FILTERS.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.id}
                      variant={typeFilter === type.id || (type.id === 'all' && !typeFilter) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTypeFilter(type.id === 'all' ? undefined : type.id as MediaType)}
                      className="gap-1.5"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {manualMode ? (
            <div className="space-y-6 max-w-lg mx-auto py-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Enter title"
                    value={manualMedia.title}
                    onChange={(e) => setManualMedia({ ...manualMedia, title: e.target.value })}
                    className="bg-secondary/20"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: 'movie', label: 'Movie', icon: Film }, { id: 'tv', label: 'TV Show', icon: Tv }].map((type) => {
                      const Icon = type.icon
                      const isSelected = manualMedia.media_type === type.id
                      return (
                        <div
                          key={type.id}
                          onClick={() => setManualMedia({ ...manualMedia, media_type: type.id as MediaType })}
                          className={cn(
                            "cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/50 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poster" className="text-sm font-medium">Poster URL (Optional)</Label>
                  <Input
                    id="poster"
                    placeholder="https://example.com/poster.jpg"
                    value={manualMedia.poster_url}
                    onChange={(e) => setManualMedia({ ...manualMedia, poster_url: e.target.value })}
                    className="bg-secondary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TABS.map((tab) => {
                      const Icon = tab.icon
                      const isSelected = manualMedia.status === tab.id
                      return (
                        <div
                          key={tab.id}
                          onClick={() => setManualMedia({ ...manualMedia, status: tab.id as MediaStatus })}
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

                {manualMedia.status === 'finished' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rating</Label>
                      <div className="h-10 flex items-center px-3 rounded-md border border-input bg-secondary/20">
                        <StarRating 
                          rating={manualMedia.rating} 
                          onChange={(r) => setManualMedia({ ...manualMedia, rating: r })} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finished_at" className="text-sm font-medium">Date Finished</Label>
                      <Input
                        id="finished_at"
                        type="date"
                        value={manualMedia.finished_at}
                        onChange={(e) => setManualMedia({ ...manualMedia, finished_at: e.target.value })}
                        className="bg-secondary/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button onClick={handleManualAdd} className="w-full h-11 text-base shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add to Library
                </Button>
              </div>
            </div>
          ) : (
            <>
              {results.length === 0 && query && !isSearching && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clapperboard className="h-12 w-12 mb-3 opacity-20" />
                  <p className="mb-4">No results found for "{query}"</p>
                  <Button variant="outline" onClick={() => setManualMode(true)}>
                    Can't find it? Add manually
                  </Button>
                </div>
              )}
              
              {results.length === 0 && !query && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-3 opacity-20" />
                  <p className="mb-4">Search for movies and TV shows...</p>
                  <Button variant="ghost" size="sm" onClick={() => setManualMode(true)} className="text-xs">
                    Can't find it? Add manually
                  </Button>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {results.map((item) => {
                      const uniqueId = `${item.media_type}-${item.tmdb_id}`
                      return (
                        <div 
                          key={uniqueId}
                          className="flex gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors group relative border border-transparent hover:border-border/50"
                        >
                          <div className="shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden shadow-xs relative">
                            {item.poster_url ? (
                              <img 
                                src={item.poster_url} 
                                alt={item.title}
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary">
                                {item.media_type === 'movie' ? (
                                  <Film className="h-6 w-6 text-muted-foreground/50" />
                                ) : (
                                  <Tv className="h-6 w-6 text-muted-foreground/50" />
                                )}
                              </div>
                            )}
                            <div className="absolute top-1 left-1">
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-black/60 text-white border-0">
                                {item.media_type === 'movie' ? 'Movie' : 'TV'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col justify-between min-w-0 flex-1">
                            <div>
                              <h4 className="font-medium text-sm leading-tight line-clamp-2 mb-1 text-foreground/90">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.release_date && (
                                  <span>{item.release_date.split('-')[0]}</span>
                                )}
                                {item.vote_average && item.vote_average > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {item.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              {item.genres && item.genres.length > 0 && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-1">
                                  {item.genres.slice(0, 3).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="flex-1 h-7 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => handleAdd(item)}
                                disabled={addingId === uniqueId}
                              >
                                {addingId === uniqueId ? (
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
                                    disabled={addingId === uniqueId}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => handleAdd(item, 'want_to_watch')} className="cursor-pointer">
                                    <Bookmark className="mr-2 h-4 w-4" /> Want to Watch
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAdd(item, 'watching')} className="cursor-pointer">
                                    <PlayCircle className="mr-2 h-4 w-4" /> Currently Watching
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setFinishedMedia(item)} className="cursor-pointer">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Add as Finished...
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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

      <Dialog open={!!finishedMedia} onOpenChange={(open) => !open && setFinishedMedia(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Add as Finished</DialogTitle>
          {finishedMedia && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="shrink-0 w-16 h-24 bg-muted rounded-md overflow-hidden">
                  {finishedMedia.poster_url ? (
                    <img src={finishedMedia.poster_url} alt={finishedMedia.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      {finishedMedia.media_type === 'movie' ? (
                        <Film className="h-6 w-6 text-muted-foreground/50" />
                      ) : (
                        <Tv className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{finishedMedia.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {finishedMedia.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    {finishedMedia.release_date && ` (${finishedMedia.release_date.split('-')[0]})`}
                  </p>
                </div>
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
                <Button variant="outline" className="flex-1" onClick={() => setFinishedMedia(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAddAsFinished}
                  disabled={addingId === `${finishedMedia.media_type}-${finishedMedia.tmdb_id}`}
                >
                  {addingId === `${finishedMedia.media_type}-${finishedMedia.tmdb_id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

function MediaCard({
  item,
  updateMedia,
  deleteMedia,
  isReadOnly = false
}: {
  item: Media
  updateMedia: (id: string, data: Partial<Media>) => Promise<Media>
  deleteMedia: (id: string) => Promise<void>
  isReadOnly?: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [editStarted, setEditStarted] = useState(item.started_at ? item.started_at.split('T')[0] : '')
  const [editFinished, setEditFinished] = useState(item.finished_at ? item.finished_at.split('T')[0] : '')

  const handleStatusChange = async (newStatus: MediaStatus) => {
    try {
      const updates: Partial<Media> = { status: newStatus }
      
      if (newStatus === 'watching' && !item.started_at) {
        updates.started_at = new Date().toISOString()
      }
      
      if (newStatus === 'finished' && !item.finished_at) {
        updates.finished_at = new Date().toISOString()
        if (!item.started_at) {
          updates.started_at = new Date().toISOString()
        }
      }
      
      await updateMedia(item.id, updates)
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleRatingChange = async (rating: number) => {
    try {
      await updateMedia(item.id, { rating })
      toast.success('Rating updated')
    } catch (error) {
      toast.error('Failed to update rating')
    }
  }

  const handleSaveDates = async () => {
    try {
      const updates: Partial<Media> = {}
      if (editStarted) updates.started_at = new Date(editStarted).toISOString()
      else updates.started_at = null
      if (editFinished) updates.finished_at = new Date(editFinished).toISOString()
      else updates.finished_at = null
      
      await updateMedia(item.id, updates)
      toast.success('Dates updated')
      setEditOpen(false)
    } catch (error) {
      toast.error('Failed to update dates')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this from your library?')) return
    try {
      await deleteMedia(item.id)
      toast.success('Removed from library')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <Card className="group relative overflow-hidden border-0 bg-transparent hover:bg-secondary/20 transition-all duration-300">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-secondary shadow-xs group-hover:shadow-md transition-all cursor-pointer">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
            {item.media_type === 'movie' ? (
              <Film className="h-12 w-12 opacity-20" />
            ) : (
              <Tv className="h-12 w-12 opacity-20" />
            )}
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0">
            {item.media_type === 'movie' ? 'Movie' : 'TV'}
          </Badge>
        </div>
        
        {!isReadOnly && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-[2px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md">
                  {item.status === 'want_to_watch' ? 'Want to Watch' :
                   item.status === 'watching' ? 'Watching' : 'Finished'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuItem onClick={() => handleStatusChange('want_to_watch')} className="cursor-pointer">
                  <Bookmark className="mr-2 h-4 w-4" /> Want to Watch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('watching')} className="cursor-pointer">
                  <PlayCircle className="mr-2 h-4 w-4" /> Watching
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('finished')} className="cursor-pointer">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Finished
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
                    <h4 className="font-medium text-sm">Edit Dates</h4>
                    <div className="space-y-2">
                      <Label htmlFor="started" className="text-xs">Started Watching</Label>
                      <Input
                        id="started"
                        type="date"
                        value={editStarted}
                        onChange={(e) => setEditStarted(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finished" className="text-xs">Finished Watching</Label>
                      <Input
                        id="finished"
                        type="date"
                        value={editFinished}
                        onChange={(e) => setEditFinished(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button onClick={handleSaveDates} size="sm" className="w-full">
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
        )}

        <div className="absolute top-2 right-2 opacity-100 group-hover:opacity-0 transition-opacity">
          {item.status === 'watching' && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 px-1">
        <h3 className="font-semibold leading-tight tracking-tight text-foreground/90 line-clamp-1" title={item.title}>
          {item.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {item.release_date ? item.release_date.split('-')[0] : 'Unknown year'}
        </p>
        
        {item.status === 'watching' && item.started_at && (
          <p className="text-xs text-muted-foreground/70 pt-1">
            Started {formatDate(item.started_at)}
          </p>
        )}
        
        {item.status === 'finished' && (
          <div className="pt-1 space-y-1">
            <StarRating rating={item.rating} onChange={isReadOnly ? undefined : handleRatingChange} readonly={isReadOnly} />
            {!isReadOnly && <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs text-muted-foreground/70 hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors">
                  <Calendar className="h-3 w-3" />
                  {item.finished_at ? formatDate(item.finished_at) : 'Add finish date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-2">
                  <Label className="text-xs">Finished Watching</Label>
                  <Input
                    type="date"
                    defaultValue={item.finished_at ? item.finished_at.split('T')[0] : ''}
                    onChange={async (e) => {
                      try {
                        await updateMedia(item.id, {
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
            </Popover>}
            {isReadOnly && item.finished_at && (
              <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.finished_at)}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function WatchingStats({ media }: { media: Media[] }) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  
  const finishedMedia = media.filter(m => m.status === 'finished')
  const currentlyWatching = media.filter(m => m.status === 'watching').length
  
  const finishedThisMonth = finishedMedia.filter(m => 
    m.finished_at && new Date(m.finished_at) >= startOfMonth
  ).length
  
  const finishedThisYear = finishedMedia.filter(m => 
    m.finished_at && new Date(m.finished_at) >= startOfYear
  ).length
  
  const ratedMedia = finishedMedia.filter(m => m.rating)
  const avgRating = ratedMedia.length > 0 
    ? (ratedMedia.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMedia.length).toFixed(1)
    : null

  if (media.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50 min-w-[140px] flex-shrink-0 snap-start sm:min-w-0 sm:flex-shrink">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">This Month</span>
        </div>
        <p className="text-2xl font-bold">{finishedThisMonth}</p>
        <p className="text-xs text-muted-foreground">titles finished</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50 min-w-[140px] flex-shrink-0 snap-start sm:min-w-0 sm:flex-shrink">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">This Year</span>
        </div>
        <p className="text-2xl font-bold">{finishedThisYear}</p>
        <p className="text-xs text-muted-foreground">titles finished</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50 min-w-[140px] flex-shrink-0 snap-start sm:min-w-0 sm:flex-shrink">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <PlayCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Watching</span>
        </div>
        <p className="text-2xl font-bold">{currentlyWatching}</p>
        <p className="text-xs text-muted-foreground">in progress</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 border border-border/50 min-w-[140px] flex-shrink-0 snap-start sm:min-w-0 sm:flex-shrink">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Star className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Avg Rating</span>
        </div>
        <p className="text-2xl font-bold">{avgRating || '-'}</p>
        <p className="text-xs text-muted-foreground">{ratedMedia.length} rated</p>
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

export default function MediaPage() {
  const { media, loading, searchMedia, addMedia, updateMedia, deleteMedia } = useMedia()
  const { isShareView } = useShareView()
  const [activeTab, setActiveTab] = useState<MediaStatus>('want_to_watch')
  const [typeFilter, setTypeFilter] = useState<'all' | MediaType>('all')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const getMediaByStatus = (status: MediaStatus) => {
    let filtered = media.filter(m => m.status === status)
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.media_type === typeFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query)
      )
    }

    if (status === 'finished') {
      if (ratingFilter !== 'all') {
        filtered = filtered.filter(m => {
          if (ratingFilter === 'unrated') return !m.rating
          if (ratingFilter === '5') return m.rating === 5
          if (ratingFilter === '4+') return (m.rating || 0) >= 4
          if (ratingFilter === '3+') return (m.rating || 0) >= 3
          return true
        })
      }

      if (dateFrom || dateTo) {
        filtered = filtered.filter(m => {
          if (!m.finished_at) return false
          const finishedDate = new Date(m.finished_at)
          
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
  
  const activeMedia = getMediaByStatus(activeTab)

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Clapperboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Movies & TV</h1>
          </div>
          <p className="text-muted-foreground text-lg">Track what you&apos;re watching.</p>
        </div>
            
        {!isShareView && (
          <Button
            onClick={() => setIsSearchOpen(true)}
            className="gap-2 rounded-full px-4 shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Title</span>
            <span className="inline sm:hidden">Add</span>
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const count = media.filter(m => m.status === tab.id && (typeFilter === 'all' || m.media_type === typeFilter)).length
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as MediaStatus)}
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
                <div className="relative sm:hidden w-[160px] mr-1">
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
                  placeholder="Search library..."
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
              
              {activeTab === 'finished' && (
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
                          <p className="text-xs text-muted-foreground">Show titles finished within range</p>
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

        <WatchingStats media={media} />
        
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
        ) : activeMedia.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {activeMedia.map((item) => (
              <MediaCard key={item.id} item={item} updateMedia={updateMedia} deleteMedia={deleteMedia} isReadOnly={isShareView} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-secondary/50 p-6 ring-1 ring-border/50">
              <Clapperboard className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              {activeTab === 'want_to_watch' && "Your watchlist is empty"}
              {activeTab === 'watching' && "You're not watching anything right now"}
              {activeTab === 'finished' && "You haven't finished anything yet"}
            </h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              {activeTab === 'want_to_watch' && "Search for movies and TV shows you want to watch and add them to your collection."}
              {activeTab === 'watching' && "When you start watching something, move it here to track your progress."}
              {activeTab === 'finished' && "Finished titles will appear here. You can rate them and keep a history of what you've watched."}
            </p>
            {!isShareView && (
              <Button onClick={() => setIsSearchOpen(true)} className="gap-2">
                <Search className="h-4 w-4" />
                Find Movies & TV Shows
              </Button>
            )}
          </div>
        )}

      <SearchMediaDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen}
        searchMedia={searchMedia}
        addMedia={addMedia}
      />
    </div>
  )
}
