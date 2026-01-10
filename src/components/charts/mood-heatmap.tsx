'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isFuture
} from 'date-fns'

interface MoodData {
  date: string
  mood: number
}

interface MoodHeatmapProps {
  data: MoodData[]
  year?: number
}

const MOOD_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-lime-400',
  5: 'bg-green-500',
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

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function MonthView({ data }: { data: MoodData[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const moodMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => map.set(d.date, d.mood))
    return map
  }, [data])
  
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
          const mood = moodMap.get(dateStr)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)
          const isFutureDay = isFuture(day)
          
          if (!isCurrentMonth) {
            return <div key={dateStr} className="aspect-square" />
          }
          
          return (
            <div
              key={dateStr}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                ${mood ? MOOD_COLORS[mood] : 'bg-muted/50'}
                ${isTodayDate ? 'ring-2 ring-primary' : ''}
                ${isFutureDay ? 'opacity-30' : ''}
              `}
              title={`${format(day, 'MMM d')}${mood ? ` - ${MOOD_LABELS[mood]}` : ''}`}
            >
              {mood ? (
                <span className="text-base">{MOOD_EMOJIS[mood]}</span>
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

function YearView({ data, year }: { data: MoodData[], year: number }) {
  const moodMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => map.set(d.date, d.mood))
    return map
  }, [data])

  const weeks = useMemo(() => {
    const result: { date: Date; mood: number | null }[][] = []
    const startDate = new Date(year, 0, 1)
    const startDay = startDate.getDay()
    
    const firstSunday = new Date(startDate)
    firstSunday.setDate(firstSunday.getDate() - startDay)
    
    let currentDate = new Date(firstSunday)
    let currentWeek: { date: Date; mood: number | null }[] = []
    
    while (currentDate.getFullYear() <= year || (currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0 && currentDate.getDate() <= 7)) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const isInYear = currentDate.getFullYear() === year
      
      currentWeek.push({
        date: new Date(currentDate),
        mood: isInYear ? (moodMap.get(dateStr) || null) : null,
      })
      
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
      
      if (result.length >= 53) break
    }
    
    if (currentWeek.length > 0) {
      result.push(currentWeek)
    }
    
    return result
  }, [year, moodMap])

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(d => d.date.getFullYear() === year)
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex })
          lastMonth = month
        }
      }
    })
    
    return labels
  }, [weeks, year])

  return (
    <TooltipProvider>
      <div className="w-full">
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
            {DAYS.map((day, i) => (
              <div key={i} className="flex-1 flex items-center">{day}</div>
            ))}
          </div>
          
          <div className="flex-1 flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  const isInYear = day.date.getFullYear() === year
                  
                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex-1 aspect-square rounded-sm ${
                            !isInYear 
                              ? 'bg-transparent' 
                              : day.mood 
                                ? MOOD_COLORS[day.mood] 
                                : 'bg-muted'
                          }`}
                        />
                      </TooltipTrigger>
                      {isInYear && (
                        <TooltipContent>
                          <p className="font-medium">
                            {day.date.toLocaleDateString('en-AU', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-muted-foreground">
                            {day.mood ? MOOD_LABELS[day.mood] : 'No mood logged'}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-muted" />
          {[1, 2, 3, 4, 5].map(mood => (
            <div key={mood} className={`w-3 h-3 rounded-sm ${MOOD_COLORS[mood]}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function MoodHeatmap({ data, year = new Date().getFullYear() }: MoodHeatmapProps) {
  return (
    <>
      <div className="md:hidden">
        <MonthView data={data} />
      </div>
      <div className="hidden md:block">
        <YearView data={data} year={year} />
      </div>
    </>
  )
}
