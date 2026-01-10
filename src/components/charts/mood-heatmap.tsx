'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function MoodHeatmap({ data, year = new Date().getFullYear() }: MoodHeatmapProps) {
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
          
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-[11px] h-[11px] rounded-sm bg-muted" />
              {[1, 2, 3, 4, 5].map(mood => (
                <div key={mood} className={`w-[11px] h-[11px] rounded-sm ${MOOD_COLORS[mood]}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
