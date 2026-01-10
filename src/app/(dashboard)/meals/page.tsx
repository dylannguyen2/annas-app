'use client'

import { useState } from 'react'
import { useMeals, type MealType } from '@/hooks/use-meals'
import { MealForm } from '@/components/forms/meal-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CalendarIcon, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { formatDate, formatDisplayDate } from '@/lib/utils/dates'

interface Meal {
  id: string
  date: string
  meal_type: MealType
  photo_url: string | null
  description: string | null
  notes: string | null
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

export default function MealsPage() {
  const { meals, loading, createMeal, updateMeal, deleteMeal, uploadPhoto, getMealsForDate } = useMeals()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  
  const selectedDateStr = formatDate(selectedDate)
  const mealsForDate = getMealsForDate(selectedDateStr)
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setCalendarOpen(false)
    }
  }

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id)
    setSelectedMeal(null)
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
    setSelectedMeal(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meals</h2>
          <p className="text-muted-foreground">
            Track what you eat with photos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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
          <MealForm onSubmit={createMeal} onUploadPhoto={uploadPhoto} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isToday ? "Today's Meals" : format(selectedDate, 'EEEE, MMMM d')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mealsForDate.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-muted-foreground mb-4">No meals logged for this day</p>
              <MealForm 
                onSubmit={createMeal} 
                onUploadPhoto={uploadPhoto}
                trigger={<Button>Log Your First Meal</Button>}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mealsForDate.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className="relative group rounded-xl overflow-hidden bg-secondary/50 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                >
                  {meal.photo_url ? (
                    <img
                      src={meal.photo_url}
                      alt={meal.description || MEAL_LABELS[meal.meal_type]}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-secondary">
                      <span className="text-6xl">{MEAL_ICONS[meal.meal_type]}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{MEAL_ICONS[meal.meal_type]}</span>
                      <span className="font-medium">{MEAL_LABELS[meal.meal_type]}</span>
                    </div>
                    {meal.description && (
                      <p className="text-sm text-muted-foreground truncate">{meal.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meals.slice(0, 10).map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                >
                  {meal.photo_url ? (
                    <img
                      src={meal.photo_url}
                      alt={meal.description || ''}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-2xl">{MEAL_ICONS[meal.meal_type]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{MEAL_LABELS[meal.meal_type]}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDate(meal.date)}
                      </span>
                    </div>
                    {meal.description && (
                      <p className="text-sm text-muted-foreground truncate">{meal.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {selectedMeal && (
            <>
              {selectedMeal.photo_url ? (
                <div className="relative">
                  <img
                    src={selectedMeal.photo_url}
                    alt={selectedMeal.description || MEAL_LABELS[selectedMeal.meal_type]}
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-secondary">
                  <span className="text-8xl">{MEAL_ICONS[selectedMeal.meal_type]}</span>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{MEAL_ICONS[selectedMeal.meal_type]}</span>
                    <h3 className="text-xl font-semibold">{MEAL_LABELS[selectedMeal.meal_type]}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDisplayDate(selectedMeal.date)}
                  </p>
                </div>
                
                {selectedMeal.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">What I ate</h4>
                    <p>{selectedMeal.description}</p>
                  </div>
                )}
                
                {selectedMeal.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                    <p className="text-sm italic">{selectedMeal.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingMeal(selectedMeal)
                      setSelectedMeal(null)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDeleteMeal(selectedMeal.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
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
