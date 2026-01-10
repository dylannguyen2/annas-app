'use client'

import { useState } from 'react'
import { useMoods } from '@/hooks/use-moods'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatDisplayDate } from '@/lib/utils/dates'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth, isToday, isFuture } from 'date-fns'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const MOOD_COLORS: Record<number, string> = {
  1: 'bg-red-100 dark:bg-red-900/30',
  2: 'bg-orange-100 dark:bg-orange-900/30',
  3: 'bg-yellow-100 dark:bg-yellow-900/30',
  4: 'bg-lime-100 dark:bg-lime-900/30',
  5: 'bg-green-100 dark:bg-green-900/30',
}

export default function MoodPage() {
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mood</h2>
        <p className="text-muted-foreground">
          Track how you&apos;re feeling each day
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Calendar</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium min-w-[80px] text-center">
                  {format(calendarMonth, 'MMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  disabled={isSameMonth(calendarMonth, new Date())}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: emptyDays }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((date) => {
                const dateStr = formatDate(date)
                const moodEntry = moods.find(m => m.date === dateStr)
                const isCurrentDay = isToday(date)
                const isFutureDay = isFuture(date)
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => !isFutureDay && setSelectedDate(date)}
                    disabled={isFutureDay}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center transition-all text-sm
                      ${moodEntry?.mood ? MOOD_COLORS[moodEntry.mood] : 'bg-secondary/30'}
                      ${isCurrentDay ? 'ring-1 ring-primary' : ''}
                      ${isFutureDay ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                      ${selectedDate && formatDate(selectedDate) === dateStr ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    {moodEntry?.mood ? MOOD_EMOJIS[moodEntry.mood] : <span className="text-[10px] text-muted-foreground">{format(date, 'd')}</span>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent</CardTitle>
          </CardHeader>
          <CardContent>
            {moods.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                No mood entries yet
              </p>
            ) : (
              <div className="space-y-2">
                {moods.slice(0, 5).map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => {
                      const date = new Date(mood.date + 'T00:00:00')
                      setSelectedDate(date)
                      setCalendarMonth(date)
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors w-full text-left"
                  >
                    <span className="text-lg">
                      {mood.mood ? MOOD_EMOJIS[mood.mood] : '❓'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">
                        {formatDisplayDate(mood.date)}
                      </p>
                      {mood.notes && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {mood.notes}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
