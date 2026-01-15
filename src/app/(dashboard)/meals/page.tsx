'use client'

import { useState, useRef } from 'react'
import { useMeals, type MealType } from '@/hooks/use-meals'
import { useShareView } from '@/lib/share-view/context'
import { MealForm } from '@/components/forms/meal-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2, CalendarIcon, Camera, X, ChevronLeft, ChevronRight, Download, Maximize2, Plus, ImagePlus, Pencil, MapPin, Pin, Trash2, UtensilsCrossed } from 'lucide-react'
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

  const mealsByDate = meals.reduce((acc, meal) => {
    const date = meal.date
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  const sortedDates = Object.keys(mealsByDate).sort((a, b) => b.localeCompare(a))

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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Meals</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Snap a photo to log your meals.
          </p>
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

      <div className="flex gap-4 w-full overflow-hidden">
        <div className="flex-1 min-w-0 space-y-4 overflow-hidden">
          <div className="flex flex-col md:grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] overflow-hidden w-full">
            <Card className="hidden md:block ">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Food Calendar</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  className="rounded-md [&_.has-meals]:bg-green-100 [&_.has-meals]:rounded-full [&_.has-meals]:dark:bg-green-950/50 [&_.has-meals_button[data-selected-single=true]]:bg-primary [&_.has-meals_button[data-selected-single=true]]:text-primary-foreground"
                  modifiers={{
                    hasMeals: meals.map(m => new Date(m.date + 'T00:00:00'))
                  }}
                  modifiersClassNames={{
                    hasMeals: 'has-meals'
                  }}
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-200 dark:bg-green-800" />
                    <span>Has meals</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isToday ? "Today's Photos" : format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
    
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex gap-3 overflow-x-auto p-3 max-w-[calc(100vw-2rem)] md:max-w-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {!isShareView && (
                    <button
                      className="flex-shrink-0 size-32 md:size-72 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (mealsForDate.length > 0) {
                          setAddingToMeal(mealsForDate[0])
                          addPhotoInputRef.current?.click()
                        } else {
                          handleUpload()
                        }
                      }}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 md:h-10 md:w-10 text-primary/50 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 md:h-10 md:w-10 text-primary/50" />
                          <span className="text-xs md:text-sm text-primary/50">Upload</span>
                        </>
                      )}
                    </button>
                  )}
                  {allPhotosForDate.map(({ url, meal }, index) => (
                    <div
                      key={`${meal.id}-${index}`}
                      className={`group relative flex-shrink-0 size-32 md:size-72 rounded-xl overflow-hidden bg-secondary cursor-pointer ring-2 transition-all ${selectedPhoto?.url === url ? 'ring-primary' : 'ring-transparent hover:ring-primary/30'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto({ url, meal })
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 hidden md:flex md:group-hover:opacity-100 transition-opacity items-center justify-center gap-3">
                        {!isShareView && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 md:h-11 md:w-11 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer ${meal.pinned ? 'text-primary' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePin(meal.id)
                            }}
                          >
                            <Pin className="h-3.5 w-3.5 md:h-5 md:w-5" />
                          </Button>
                        )}
                        {!isShareView && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 md:h-11 md:w-11 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMeal(meal)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-5 md:w-5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 md:h-11 md:w-11 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadPhoto(url)
                          }}
                        >
                          <Download className="h-3.5 w-3.5 md:h-5 md:w-5" />
                        </Button>
                        {!isShareView && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 md:h-11 md:w-11 rounded-full bg-white/20 hover:bg-red-500/80 text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMeal(meal.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-5 md:w-5" />
                          </Button>
                        )}
                      </div>
                      <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 group-hover:opacity-0 transition-opacity">
                        <span className="text-xs md:text-sm bg-black/70 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                          {MEAL_ICONS[meal.meal_type]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="hidden lg:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36 w-full flex items-center justify-center">
                {getPinnedMeals().length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {getPinnedMeals().map(meal => {
                      const photos = getPhotos(meal)
                      const firstPhoto = photos[0]
                      return (
                        <div
                          key={meal.id}
                          className="group relative flex-shrink-0 w-32 rounded-xl overflow-hidden bg-secondary cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            firstPhoto && setSelectedPhoto({ url: firstPhoto, meal })
                          }}
                        >
                          {firstPhoto ? (
                            <img src={firstPhoto} alt="" className="w-full h-24 object-cover" />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-secondary">
                              <span className="text-3xl">{MEAL_ICONS[meal.meal_type]}</span>
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{meal.description || MEAL_LABELS[meal.meal_type]}</p>
                            {meal.location && (
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5" />
                                {meal.location}
                              </p>
                            )}
                          </div>
                          {!isShareView && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePin(meal.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pin meals to display here</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="hidden lg:flex w-80 flex-shrink-0 sticky top-4 flex-col" onClick={(e) => e.stopPropagation()}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {selectedPhoto ? (
              <div className="space-y-4">
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
                        onClick={() => setEditingMeal(selectedPhoto.meal)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
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
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Camera className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">Click a photo to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:hidden space-y-3">
        <h3 className="text-lg font-semibold">Previous Days</h3>
        {sortedDates.map(date => {
          const dayMeals = mealsByDate[date]
          const dayPhotos = dayMeals.flatMap(meal => {
            const photos = getPhotos(meal)
            return photos.map(url => ({ url, meal }))
          })
          if (dayPhotos.length === 0) return null
          return (
            <Card key={date}>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium">
                  {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {dayPhotos.map(({ url, meal }, index) => (
                    <div
                      key={`${meal.id}-${index}`}
                      className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-secondary cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto({ url, meal })
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1">
                        <span className="text-[10px] bg-black/70 text-white px-1 py-0.5 rounded-full">
                          {MEAL_ICONS[meal.meal_type]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
