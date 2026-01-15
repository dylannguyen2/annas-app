'use client'

import { useState } from 'react'
import { useMoods } from '@/hooks/use-moods'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatDisplayDate } from '@/lib/utils/dates'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Smile } from 'lucide-react'
import { PageSkeleton } from '@/components/dashboard/page-skeleton'
import { PanicButton } from '@/components/panic-button'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth, isToday, isFuture, isSameDay } from 'date-fns'
import { useShareView } from '@/lib/share-view/context'
import { cn } from '@/lib/utils'

const MOOD_EMOJIS: Record<number, string> = {
  0: '😰',
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const MOOD_STYLES: Record<number, string> = {
  0: 'bg-primary/5 text-primary border-primary/10',
  1: 'bg-primary/10 text-primary border-primary/20',
  2: 'bg-primary/20 text-primary border-primary/30',
  3: 'bg-primary/40 text-primary-foreground border-transparent',
  4: 'bg-primary/70 text-primary-foreground border-transparent',
  5: 'bg-primary text-primary-foreground border-transparent',
}

export default function MoodPage() {
  const { isShareView } = useShareView()
  const { moods, loading, saveMood, getMoodForDate } = useMoods()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  
  const selectedDateStr = formatDate(selectedDate)
  const moodForSelectedDate = getMoodForDate(selectedDateStr)

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string; date: Date }) => {
    await saveMood({ date: formatDate(data.date), mood: data.mood, energy: data.energy, stress: data.stress, notes: data.notes })
  }
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Smile className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Mood</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track how you&apos;re feeling each day.
          </p>
        </div>
        {!isShareView && <PanicButton />}
      </div>

      <div className={`grid gap-8 ${isShareView ? 'lg:grid-cols-2' : 'lg:grid-cols-12'}`}>
        {!isShareView && (
          <div className="lg:col-span-7 space-y-8">
            <MoodPicker
              key={selectedDateStr}
              initialMood={moodForSelectedDate?.mood ?? undefined}
              initialEnergy={moodForSelectedDate?.energy ?? 3}
              initialStress={moodForSelectedDate?.stress ?? 3}
              initialNotes={moodForSelectedDate?.notes ?? ''}
              date={selectedDate}
              onDateChange={handleDateChange}
              onSave={handleSaveMood}
            />
            
            <div className="space-y-4">
              <h3 className="text-xl font-light tracking-tight pl-1">Recent Entries</h3>
              {moods.length === 0 ? (
                <Card className="bg-primary/5 border-dashed border-primary/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                    <span className="text-4xl opacity-50">🌱</span>
                    <p className="text-muted-foreground text-sm">Start tracking your journey today</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {moods.slice(0, 5).map((mood) => {
                     const moodDate = new Date(mood.date + 'T00:00:00')
                     const isSelected = isSameDay(moodDate, selectedDate)
                     const hasMood = mood.mood !== undefined && mood.mood !== null
                     
                     return (
                      <button
                        key={mood.id}
                        onClick={() => {
                          setSelectedDate(moodDate)
                          setCalendarMonth(moodDate)
                        }}
                        className={cn(
                          "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left w-full border",
                          isSelected 
                            ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20" 
                            : "bg-card hover:bg-primary/5 border-transparent hover:border-primary/10 shadow-sm hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110",
                          hasMood ? MOOD_STYLES[mood.mood!] : "bg-secondary"
                        )}>
                          {hasMood ? MOOD_EMOJIS[mood.mood!] : '❓'}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-baseline justify-between mb-1">
                            <p className="font-medium text-sm text-foreground">
                              {formatDisplayDate(mood.date)}
                            </p>
                            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
                              {mood.energy}/5 Energy
                            </span>
                          </div>
                          {mood.notes && (
                            <p className="text-xs text-muted-foreground truncate font-light leading-relaxed">
                              {mood.notes}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={isShareView ? "w-full" : "lg:col-span-5"}>
          <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6">
              <div className="flex w-full items-center justify-between">
                <CardTitle className="text-xl font-light">Calendar</CardTitle>
                <div className="flex items-center gap-2 bg-secondary/50 rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-background shadow-none"
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[100px] text-center">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-background shadow-none"
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    disabled={isSameMonth(calendarMonth, new Date())}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-7 gap-3 mb-4">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
                  <div key={i} className="text-center text-[11px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: emptyDays }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {daysInMonth.map((date) => {
                  const dateStr = formatDate(date)
                  const moodEntry = moods.find(m => m.date === dateStr)
                  const isCurrentDay = isToday(date)
                  const isFutureDay = isFuture(date)
                  const isSelected = isSameDay(date, selectedDate)
                  const hasMood = moodEntry?.mood !== undefined && moodEntry.mood !== null
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFutureDay && setSelectedDate(date)}
                      disabled={isFutureDay}
                      className={cn(
                        "group relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 border",
                        hasMood 
                          ? MOOD_STYLES[moodEntry.mood!]
                          : "bg-secondary/30 text-muted-foreground border-transparent",
                        isCurrentDay && !hasMood && "ring-2 ring-primary/30 ring-offset-2",
                        isFutureDay ? "opacity-20 cursor-not-allowed" : "hover:scale-110 cursor-pointer hover:shadow-md",
                        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background z-10 scale-105 shadow-lg",
                        !hasMood && !isSelected && "hover:bg-secondary/60"
                      )}
                    >
                      {hasMood ? (
                        <span className="text-xl filter drop-shadow-sm">{MOOD_EMOJIS[moodEntry.mood!]}</span>
                      ) : (
                        <span className="text-xs font-medium opacity-60 group-hover:opacity-100">{format(date, 'd')}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
