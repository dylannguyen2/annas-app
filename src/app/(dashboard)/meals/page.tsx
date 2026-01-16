'use client'

import { useEffect, useRef, useState } from 'react'
import { useMeals, type MealType } from '@/hooks/use-meals'
import { useShareView } from '@/lib/share-view/context'
import { MealForm } from '@/components/forms/meal-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2, CalendarIcon, Camera, X, ChevronLeft, ChevronRight, Download, Maximize2, Plus, ImagePlus, Pencil, MapPin, Pin, Trash2, UtensilsCrossed, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { format } from 'date-fns'
import { formatDate } from '@/lib/utils/dates'

interface Meal {
  id: string
  date: string
  meal_type: MealType
  photo_url: string | null
  photo_urls: string[]
  description: string | null
  location: string | null
  notes: string | null
  pinned: boolean
  created_at: string
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const getMealTypeFromTime = (date: Date): MealType => {
  const hour = date.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

const TABS = [
  { id: 'log', label: 'Log Meal', icon: Camera },
  { id: 'history', label: 'History', icon: List },
] as const

export default function MealsPage() {
  const { meals, loading, createMeal, updateMeal, deleteMeal, uploadPhoto, getMealsForDate, togglePin, getPinnedMeals } = useMeals()
  const { isShareView } = useShareView()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; meal: Meal } | null>(null)
  
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)
  const [quickCaptureDate, setQuickCaptureDate] = useState<Date>(new Date())
  const [quickCaptureDateOpen, setQuickCaptureDateOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [addingToMeal, setAddingToMeal] = useState<Meal | null>(null)
  const [activeTab, setActiveTab] = useState<string>('log')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const addPhotoInputRef = useRef<HTMLInputElement>(null)
  
  const selectedDateStr = formatDate(selectedDate)
  const mealsForDate = getMealsForDate(selectedDateStr)
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const getPhotos = (meal: Meal): string[] => {
    if (meal.photo_urls && meal.photo_urls.length > 0) return meal.photo_urls
    if (meal.photo_url) return [meal.photo_url]
    return []
  }

  const allPhotosForDate = mealsForDate.flatMap(meal => {
    const photos = getPhotos(meal)
    return photos.map(url => ({ url, meal }))
  })

  const todayStr = formatDate(new Date())
  const todayMeals = getMealsForDate(todayStr)
  const todayPhotos = todayMeals.flatMap(meal => {
    const photos = getPhotos(meal)
    return photos.map(url => ({ url, meal }))
  })

  const mealsByDate = meals.reduce((acc, meal) => {
    const date = meal.date
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  const sortedDates = Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a))

  useEffect(() => {
    const getPanelSnapshot = () => {
      const row = document.querySelector<HTMLElement>('[data-meals-panel-row="top"]')
      const calendarEl = document.querySelector<HTMLElement>('[data-meals-panel="calendar"]')
      const photosEl = document.querySelector<HTMLElement>('[data-meals-panel="photos"]')
      const detailsEl = document.querySelector<HTMLElement>('[data-meals-panel="details"]')

      const rect = (el: HTMLElement | null) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        }
      }

      const styles = (el: HTMLElement | null) => {
        if (!el) return null
        const s = window.getComputedStyle(el)
        return {
          display: s.display,
          position: s.position,
          top: s.top,
          alignSelf: s.alignSelf,
          alignItems: s.alignItems,
          justifyContent: s.justifyContent,
          marginTop: s.marginTop,
          paddingTop: s.paddingTop,
        }
      }

      return {
        activeTab,
        scrollY: window.scrollY,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        row: { rect: rect(row), styles: styles(row) },
        calendar: { rect: rect(calendarEl), styles: styles(calendarEl) },
        photos: { rect: rect(photosEl), styles: styles(photosEl) },
        details: { rect: rect(detailsEl), styles: styles(detailsEl) },
      }
    }

    const getStickyContext = () => {
      const detailsEl = document.querySelector<HTMLElement>('[data-meals-panel="details"]')
      if (!detailsEl) return { found: false as const }

      const chain: Array<{
        tag: string
        overflowX: string
        overflowY: string
        position: string
        isRow: boolean
      }> = []

      let el: HTMLElement | null = detailsEl.parentElement
      while (el && el !== document.body) {
        const s = window.getComputedStyle(el)
        const isRow = el.getAttribute('data-meals-panel-row') === 'top'
        chain.push({
          tag: el.tagName.toLowerCase(),
          overflowX: s.overflowX,
          overflowY: s.overflowY,
          position: s.position,
          isRow,
        })
        el = el.parentElement
      }

      const firstNonVisible = chain.find((x) => x.overflowX !== 'visible' || x.overflowY !== 'visible') ?? null

      return {
        found: true as const,
        firstNonVisible,
        chain: chain.slice(0, 12),
      }
    }

    const postLog = (hypothesisId: string, message: string, data: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c595dca9-6389-474c-bc53-1a783c267343', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix-2',
          hypothesisId,
          location: 'src/app/(dashboard)/meals/page.tsx:meals-panel-alignment',
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }

    // Mount snapshot (tests baseline layout + computed styles)
    postLog('H_BASELINE', 'Meals panel alignment snapshot (mount)', getPanelSnapshot())
    postLog('H_SCROLL_CONTAINER', 'Meals details sticky context (mount)', getStickyContext())

    // First scroll snapshot (tests sticky behavior / sticking threshold)
    let loggedScroll = false
    const onScroll = () => {
      if (loggedScroll) return
      loggedScroll = true
      postLog('H_STICKY', 'Meals panel alignment snapshot (first scroll)', getPanelSnapshot())
      postLog('H_SCROLL_CONTAINER', 'Meals details sticky context (first scroll)', getStickyContext())
    }

    // Resize snapshot (tests responsive breakpoints affecting alignment)
    const onResize = () => {
      postLog('H_RESPONSIVE', 'Meals panel alignment snapshot (resize)', getPanelSnapshot())
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [activeTab])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setCalendarOpen(false)
    }
  }

  const handleEditMeal = async (data: {
    date: string
    meal_type: MealType
    photo_url?: string | null
    description?: string
    notes?: string
  }) => {
    if (!editingMeal) return
    await updateMeal(editingMeal.id, data)
    setEditingMeal(null)
  }

  const handleQuickCapture = () => {
    setQuickCaptureDate(new Date())
    setPhotoPreview(null)
    fileInputRef.current?.click()
  }

  const handleUpload = () => {
    setQuickCaptureDate(selectedDate)
    setPhotoPreview(null)
    uploadInputRef.current?.click()
  }

  const handleQuickCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isUpload = e.target === uploadInputRef.current
    const dateToUse = isUpload ? selectedDate : quickCaptureDate

    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
    setQuickCaptureOpen(true)

    setUploading(true)
    try {
      const url = await uploadPhoto(file)
      await createMeal({
        date: formatDate(dateToUse),
        meal_type: getMealTypeFromTime(dateToUse),
        photo_url: url,
      })
      setQuickCaptureOpen(false)
      setPhotoPreview(null)
    } catch (err) {
      console.error('Failed to save meal:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }

  const handleQuickCaptureDateChange = async (date: Date | undefined) => {
    if (!date || !photoPreview) return
    setQuickCaptureDate(date)
    setQuickCaptureDateOpen(false)
  }

  const handleAddPhotoToMeal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !addingToMeal) return

    setUploading(true)
    try {
      const existingPhotos = getPhotos(addingToMeal)
      const newUrls: string[] = []
      
      for (const file of Array.from(files)) {
        const url = await uploadPhoto(file)
        newUrls.push(url)
      }
      
      await updateMeal(addingToMeal.id, {
        photo_urls: [...existingPhotos, ...newUrls]
      })
    } catch (err) {
      console.error('Failed to add photos:', err)
    } finally {
      setUploading(false)
      setAddingToMeal(null)
      if (addPhotoInputRef.current) addPhotoInputRef.current.value = ''
    }
  }

  const handleDownloadPhoto = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `meal-photo-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to download:', err)
    }
  }

  

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500" onClick={() => setSelectedPhoto(null)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleQuickCapturePhoto}
        className="hidden"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickCapturePhoto}
        className="hidden"
      />
      <input
        ref={addPhotoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddPhotoToMeal}
        className="hidden"
      />
      
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
              <UtensilsCrossed className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              Meals
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Snap a photo to log your meals.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative lg:hidden">
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </Button>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden lg:flex">
                <CalendarIcon className="h-4 w-4" />
                {isToday ? 'Today' : format(selectedDate, 'MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
{!isShareView && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handleUpload}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button onClick={handleQuickCapture} className="gap-2">
                <Camera className="h-4 w-4" />
                Snap
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
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
            </button>
          )
        })}
      </div>
      
      <Dialog open={quickCaptureOpen} onOpenChange={setQuickCaptureOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {photoPreview && (
            <>
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Meal preview"
                  className="w-full max-h-80 object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Saving...</p>
                    </div>
                  </div>
                )}
                {!uploading && (
                  <div className="absolute top-3 right-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => {
                        setQuickCaptureOpen(false)
                        setPhotoPreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {!uploading && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{MEAL_ICONS[getMealTypeFromTime(quickCaptureDate)]} {MEAL_LABELS[getMealTypeFromTime(quickCaptureDate)]}</p>
                      <p className="text-sm text-muted-foreground">Auto-detected from time</p>
                    </div>
                    <Popover open={quickCaptureDateOpen} onOpenChange={setQuickCaptureDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(quickCaptureDate, 'MMM d')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={quickCaptureDate}
                          onSelect={handleQuickCaptureDateChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Saved! Tap anywhere to dismiss.</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {activeTab === 'log' && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {todayPhotos.length === 0 && !isShareView ? (
          <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-primary/60" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No meals logged today</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Snap a photo of your meal to start tracking what you eat
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleQuickCapture} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={handleUpload} className="gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {!isShareView && (
                <button
                  className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (todayMeals.length > 0) {
                      setAddingToMeal(todayMeals[0])
                      addPhotoInputRef.current?.click()
                    } else {
                      handleUpload()
                    }
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-primary/50 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-primary/50" />
                      <span className="text-sm font-medium text-primary/60">Add Photo</span>
                    </>
                  )}
                </button>
              )}
              {todayPhotos.map(({ url, meal }, index) => (
                <div
                  key={`${meal.id}-${index}`}
                  className={cn(
                    "group relative aspect-square rounded-2xl overflow-hidden bg-secondary cursor-pointer ring-2 transition-all duration-200",
                    selectedPhoto?.url === url ? "ring-primary shadow-lg shadow-primary/20" : "ring-transparent hover:ring-primary/40"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPhoto(selectedPhoto?.url === url ? null : { url, meal })
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 left-2">
                    <span className="text-lg bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                      {MEAL_ICONS[meal.meal_type]}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate drop-shadow-lg">
                      {meal.description || MEAL_LABELS[meal.meal_type]}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFullscreenPhoto(url)
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedPhoto && (
              <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="sm:w-48 sm:flex-shrink-0">
                      <img
                        src={selectedPhoto.url}
                        alt=""
                        className="w-full sm:w-48 h-48 object-cover rounded-xl cursor-pointer"
                        onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl">{MEAL_ICONS[selectedPhoto.meal.meal_type]}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{MEAL_LABELS[selectedPhoto.meal.meal_type]}</h3>
                            <p className="text-sm text-muted-foreground">{format(new Date(selectedPhoto.meal.date + 'T00:00:00'), 'EEEE, MMMM d')}</p>
                          </div>
                        </div>
                        {!isShareView && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={cn("h-9 w-9 cursor-pointer", selectedPhoto.meal.pinned && "text-primary")}
                              onClick={() => togglePin(selectedPhoto.meal.id)}
                            >
                              <Pin className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 cursor-pointer"
                              onClick={() => setEditingMeal(selectedPhoto.meal)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 cursor-pointer text-destructive hover:text-destructive"
                              onClick={() => deleteMeal(selectedPhoto.meal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {selectedPhoto.meal.description && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What I ate</p>
                          <p className="text-sm">{selectedPhoto.meal.description}</p>
                        </div>
                      )}
                      
                      {selectedPhoto.meal.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPhoto.meal.location}</span>
                        </div>
                      )}
                      
                      {selectedPhoto.meal.notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-sm text-muted-foreground italic">{selectedPhoto.meal.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          View Full
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownloadPhoto(selectedPhoto.url)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      )}

      {activeTab === 'history' && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20 h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                className="rounded-md w-full"
                modifiers={{
                  hasMeals: meals.map(m => new Date(m.date + 'T00:00:00'))
                }}
                modifiersClassNames={{
                  hasMeals: '[&_button]:bg-primary/20 [&_button]:font-semibold'
                }}
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  <span>Has meals</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isToday ? "Today's Meals" : format(selectedDate, 'EEEE, MMMM d')}
              </h3>
              <span className="text-sm text-muted-foreground">
                {allPhotosForDate.length} {allPhotosForDate.length === 1 ? 'photo' : 'photos'}
              </span>
            </div>

            {allPhotosForDate.length === 0 ? (
              <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <UtensilsCrossed className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="font-medium">No meals logged this day</p>
                  <p className="text-sm opacity-70">Select another date to view meals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allPhotosForDate.map(({ url, meal }, index) => (
                    <div
                      key={`${meal.id}-${index}`}
                      className={cn(
                        "group relative aspect-square rounded-2xl overflow-hidden bg-secondary cursor-pointer ring-2 transition-all duration-200",
                        selectedPhoto?.url === url ? "ring-primary shadow-lg shadow-primary/20" : "ring-transparent hover:ring-primary/40"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto(selectedPhoto?.url === url ? null : { url, meal })
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 left-2">
                        <span className="text-lg bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                          {MEAL_ICONS[meal.meal_type]}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium truncate drop-shadow-lg">
                          {meal.description || MEAL_LABELS[meal.meal_type]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPhoto && (
                  <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="sm:w-48 sm:flex-shrink-0">
                          <img
                            src={selectedPhoto.url}
                            alt=""
                            className="w-full sm:w-48 h-48 object-cover rounded-xl cursor-pointer"
                            onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl">{MEAL_ICONS[selectedPhoto.meal.meal_type]}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{MEAL_LABELS[selectedPhoto.meal.meal_type]}</h3>
                                <p className="text-sm text-muted-foreground">{format(new Date(selectedPhoto.meal.date + 'T00:00:00'), 'EEEE, MMMM d')}</p>
                              </div>
                            </div>
                            {!isShareView && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={cn("h-9 w-9 cursor-pointer", selectedPhoto.meal.pinned && "text-primary")}
                                  onClick={() => togglePin(selectedPhoto.meal.id)}
                                >
                                  <Pin className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 cursor-pointer"
                                  onClick={() => setEditingMeal(selectedPhoto.meal)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 cursor-pointer text-destructive hover:text-destructive"
                                  onClick={() => deleteMeal(selectedPhoto.meal.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {selectedPhoto.meal.description && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What I ate</p>
                              <p className="text-sm">{selectedPhoto.meal.description}</p>
                            </div>
                          )}
                          
                          {selectedPhoto.meal.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedPhoto.meal.location}</span>
                            </div>
                          )}
                          
                          {selectedPhoto.meal.notes && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                              <p className="text-sm text-muted-foreground italic">{selectedPhoto.meal.notes}</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                              View Full
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleDownloadPhoto(selectedPhoto.url)}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <Dialog open={!!fullscreenPhoto} onOpenChange={(open) => !open && setFullscreenPhoto(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          {fullscreenPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={fullscreenPhoto}
                alt=""
                className="max-w-full max-h-[90vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  onClick={() => handleDownloadPhoto(fullscreenPhoto)}
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  onClick={() => setFullscreenPhoto(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {allPhotosForDate.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    onClick={() => {
                      const currentIndex = allPhotosForDate.findIndex(p => p.url === fullscreenPhoto)
                      const prevIndex = currentIndex === 0 ? allPhotosForDate.length - 1 : currentIndex - 1
                      setFullscreenPhoto(allPhotosForDate[prevIndex].url)
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    onClick={() => {
                      const currentIndex = allPhotosForDate.findIndex(p => p.url === fullscreenPhoto)
                      const nextIndex = currentIndex === allPhotosForDate.length - 1 ? 0 : currentIndex + 1
                      setFullscreenPhoto(allPhotosForDate[nextIndex].url)
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full">
                    <span className="text-white text-sm">
                      {allPhotosForDate.findIndex(p => p.url === fullscreenPhoto) + 1} / {allPhotosForDate.length}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto && typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-xl border bg-card">
          {selectedPhoto && (
            <div>
              <div className="px-4 py-3 border-b">
                <p className="font-semibold">Details</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="relative">
                  <img
                    src={selectedPhoto.url}
                    alt=""
                    className="w-full rounded-lg cursor-pointer"
                    onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white cursor-pointer"
                      onClick={() => setFullscreenPhoto(selectedPhoto.url)}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white cursor-pointer"
                      onClick={() => handleDownloadPhoto(selectedPhoto.url)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MEAL_ICONS[selectedPhoto.meal.meal_type]}</span>
                    <div>
                      <p className="font-medium text-sm">{MEAL_LABELS[selectedPhoto.meal.meal_type]}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(selectedPhoto.meal.date), 'MMM d')}</p>
                    </div>
                  </div>
{!isShareView && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-7 w-7 cursor-pointer ${selectedPhoto.meal.pinned ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => togglePin(selectedPhoto.meal.id)}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 cursor-pointer"
                        onClick={() => {
                          setSelectedPhoto(null)
                          setEditingMeal(selectedPhoto.meal)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => {
                          deleteMeal(selectedPhoto.meal.id)
                          setSelectedPhoto(null)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {selectedPhoto.meal.description && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">What I ate</p>
                    <p className="text-sm">{selectedPhoto.meal.description}</p>
                  </div>
                )}
                {selectedPhoto.meal.location && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedPhoto.meal.location}</span>
                  </div>
                )}
                {selectedPhoto.meal.notes && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm italic text-muted-foreground">{selectedPhoto.meal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingMeal && (
        <MealForm
          meal={editingMeal}
          onSubmit={handleEditMeal}
          onUploadPhoto={uploadPhoto}
          open={!!editingMeal}
          onOpenChange={(open) => !open && setEditingMeal(null)}
        />
      )}
    </div>
  )
}
