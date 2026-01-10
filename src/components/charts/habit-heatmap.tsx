'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HabitCompletion {
  date: string
  completed: number
  total: number
}

interface HabitHeatmapProps {
  data: HabitCompletion[]
  year?: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

export function HabitHeatmap({ data, year = new Date().getFullYear() }: HabitHeatmapProps) {
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
      <div className="overflow-x-auto">
        <div className="inline-block min-w-fit">
          <div className="flex gap-1 mb-1 ml-8 text-xs text-muted-foreground">
            {monthLabels.map((label, i) => (
              <div 
                key={i} 
                style={{ 
                  marginLeft: i === 0 ? `${label.weekIndex * 13}px` : `${(label.weekIndex - (monthLabels[i - 1]?.weekIndex || 0) - 1) * 13}px` 
                }}
              >
                {label.month}
              </div>
            ))}
          </div>
          
          <div className="flex">
            <div className="flex flex-col gap-[2px] mr-1 text-xs text-muted-foreground">
              {DAYS.map((day, i) => (
                <div key={i} className="h-[11px] flex items-center">{day}</div>
              ))}
            </div>
            
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => {
                    const isInYear = day.date.getFullYear() === year
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-[11px] h-[11px] rounded-sm ${
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
          
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-muted" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/25" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary/75" />
              <div className="w-[11px] h-[11px] rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
