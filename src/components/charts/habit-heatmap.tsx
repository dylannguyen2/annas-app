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

interface HabitCompletion {
  date: string
  completed: number
  total: number
}

interface HabitHeatmapProps {
  data: HabitCompletion[]
  year?: number
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function getIntensityColor(completed: number, total: number): string {
  if (total === 0) return 'bg-muted'
  const ratio = completed / total
  if (ratio === 0) return 'bg-muted'
  if (ratio <= 0.25) return 'bg-primary/25'
  if (ratio <= 0.5) return 'bg-primary/50'
  if (ratio <= 0.75) return 'bg-primary/75'
  return 'bg-primary'
}

function getIntensityLabel(completed: number, total: number): string {
  if (total === 0) return ''
  const ratio = completed / total
  if (ratio === 0) return ''
  if (ratio <= 0.25) return '25%'
  if (ratio <= 0.5) return '50%'
  if (ratio <= 0.75) return '75%'
  return '100%'
}

function MonthView({ data }: { data: HabitCompletion[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const completionMap = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>()
    data.forEach(d => map.set(d.date, { completed: d.completed, total: d.total }))
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
          className="h-7 w-7 cursor-pointer"
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
          className="h-7 w-7 cursor-pointer"
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
          const dayData = completionMap.get(dateStr)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)
          const isFutureDay = isFuture(day)
          
          if (!isCurrentMonth) {
            return <div key={dateStr} className="aspect-square" />
          }
          
          const completed = dayData?.completed || 0
          const total = dayData?.total || 0
          
          return (
            <div
              key={dateStr}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                ${getIntensityColor(completed, total)}
                ${isTodayDate ? 'ring-2 ring-primary' : ''}
                ${isFutureDay ? 'opacity-30' : ''}
              `}
              title={`${format(day, 'MMM d')}${total > 0 ? ` - ${completed}/${total} habits` : ''}`}
            >
              {total > 0 && completed > 0 ? (
                <span className="text-[10px] font-medium text-primary-foreground">
                  {getIntensityLabel(completed, total)}
                </span>
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

function YearView({ data, year }: { data: HabitCompletion[], year: number }) {
  const completionMap = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>()
    data.forEach(d => map.set(d.date, { completed: d.completed, total: d.total }))
    return map
  }, [data])

  const weeks = useMemo(() => {
    const result: { date: Date; completed: number; total: number }[][] = []
    const startDate = new Date(year, 0, 1)
    const startDay = startDate.getDay()
    
    const firstSunday = new Date(startDate)
    firstSunday.setDate(firstSunday.getDate() - startDay)
    
    let currentDate = new Date(firstSunday)
    let currentWeek: { date: Date; completed: number; total: number }[] = []
    
    while (currentDate.getFullYear() <= year || (currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0 && currentDate.getDate() <= 7)) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const isInYear = currentDate.getFullYear() === year
      const dayData = completionMap.get(dateStr)
      
      currentWeek.push({
        date: new Date(currentDate),
        completed: isInYear && dayData ? dayData.completed : 0,
        total: isInYear && dayData ? dayData.total : 0,
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
  }, [year, completionMap])

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
                          className={`flex-1 aspect-square rounded-sm cursor-pointer ${
                            !isInYear 
                              ? 'bg-transparent' 
                              : getIntensityColor(day.completed, day.total)
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
                            {day.total > 0 
                              ? `${day.completed}/${day.total} habits completed`
                              : 'No habits tracked'
                            }
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
          <div className="w-3 h-3 rounded-sm bg-primary/25" />
          <div className="w-3 h-3 rounded-sm bg-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/75" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function HabitHeatmap({ data, year = new Date().getFullYear() }: HabitHeatmapProps) {
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
