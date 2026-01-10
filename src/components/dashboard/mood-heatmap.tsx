'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  format, 
  eachDayOfInterval, 
  startOfYear, 
  endOfYear, 
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addYears,
  subYears,
  addMonths,
  subMonths,
  isSameYear,
  isSameMonth,
  getDay,
  isToday as isDateToday,
  isFuture
} from 'date-fns'

interface MoodEntry {
  id: string
  date: string
  mood: number | null
  energy: number | null
  stress: number | null
  notes: string | null
}

interface MoodHeatmapProps {
  moods: MoodEntry[]
}

const MOOD_COLORS: Record<number, string> = {
  1: 'bg-red-400 dark:bg-red-600',
  2: 'bg-orange-400 dark:bg-orange-600',
  3: 'bg-yellow-400 dark:bg-yellow-600',
  4: 'bg-lime-400 dark:bg-lime-600',
  5: 'bg-green-400 dark:bg-green-600',
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

function MonthView({ moods, moodMap }: { moods: MoodEntry[], moodMap: Map<string, MoodEntry> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={isSameMonth(currentMonth, new Date())}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const moodEntry = moodMap.get(dateStr)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isDateToday(day)
          const isFutureDay = isFuture(day)
          
          if (!isCurrentMonth) {
            return <div key={dateStr} className="aspect-square" />
          }
          
          return (
            <div
              key={dateStr}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                ${moodEntry?.mood ? MOOD_COLORS[moodEntry.mood] : 'bg-secondary/30'}
                ${isToday ? 'ring-2 ring-primary' : ''}
                ${isFutureDay ? 'opacity-30' : ''}
              `}
              title={`${format(day, 'MMM d')}${moodEntry?.mood ? ` - ${MOOD_LABELS[moodEntry.mood]}` : ''}`}
            >
              {moodEntry?.mood ? (
                <span className="text-base">{MOOD_EMOJIS[moodEntry.mood]}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">{format(day, 'd')}</span>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function YearView({ moods, moodMap }: { moods: MoodEntry[], moodMap: Map<string, MoodEntry> }) {
  const [currentYear, setCurrentYear] = useState(new Date())
  
  const yearStart = startOfYear(currentYear)
  const yearEnd = endOfYear(currentYear)
  const calendarStart = startOfWeek(yearStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(yearEnd, { weekStartsOn: 1 })
  
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }
  
  const monthLabels: { month: string; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week.find(d => d.getFullYear() === currentYear.getFullYear())
    if (firstDayOfWeek) {
      const month = firstDayOfWeek.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ month: format(firstDayOfWeek, 'MMM'), weekIndex })
        lastMonth = month
      }
    }
  })

  return (
    <>
      <div className="flex items-center justify-end gap-1 mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentYear(subYears(currentYear, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[50px] text-center">
          {format(currentYear, 'yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentYear(addYears(currentYear, 1))}
          disabled={isSameYear(currentYear, new Date())}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div>
        <div className="flex mb-1">
          <div className="w-8 shrink-0" />
          <div className="flex-1 flex gap-[2px]">
            {weeks.map((_, weekIndex) => {
              const label = monthLabels.find(m => m.weekIndex === weekIndex)
              return (
                <div key={weekIndex} className="flex-1 min-w-0">
                  {label && (
                    <span className="text-[10px] text-muted-foreground">
                      {label.month}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
          
        <div className="flex">
          <div className="flex flex-col gap-[2px] w-8 shrink-0 text-[10px] text-muted-foreground">
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center">Mon</div>
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center">Wed</div>
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center">Fri</div>
            <div className="flex-1"></div>
          </div>
          
          <div className="flex-1 flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const moodEntry = moodMap.get(dateStr)
                  const isCurrentYear = day.getFullYear() === currentYear.getFullYear()
                  const isToday = isDateToday(day)
                  
                  if (!isCurrentYear) {
                    return <div key={dateStr} className="flex-1 aspect-square" />
                  }
                  
                  return (
                    <div
                      key={dateStr}
                      className={`
                        flex-1 aspect-square rounded-[2px] transition-all cursor-default
                        ${moodEntry?.mood ? MOOD_COLORS[moodEntry.mood] : 'bg-secondary/50'}
                        ${isToday ? 'ring-1 ring-primary ring-offset-1' : ''}
                        hover:ring-1 hover:ring-foreground/30
                      `}
                      title={`${format(day, 'MMM d, yyyy')}${moodEntry?.mood ? ` - ${MOOD_LABELS[moodEntry.mood]}` : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-secondary/50" />
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className={`w-3 h-3 rounded-[2px] ${MOOD_COLORS[level]}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </>
  )
}

export function MoodHeatmap({ moods }: MoodHeatmapProps) {
  const moodMap = new Map(moods.map(m => [m.date, m]))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mood History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="md:hidden">
          <MonthView moods={moods} moodMap={moodMap} />
        </div>
        <div className="hidden md:block">
          <YearView moods={moods} moodMap={moodMap} />
        </div>
      </CardContent>
    </Card>
  )
}
