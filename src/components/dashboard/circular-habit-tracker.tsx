'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, getDaysInMonth, subMonths, addMonths, isSameMonth } from 'date-fns'
import type { Habit, HabitCompletion } from '@/types/database'

interface CircularHabitTrackerProps {
  habits: Habit[]
  completions: HabitCompletion[]
  isCompleted: (habitId: string, date: string) => boolean
}

export function CircularHabitTracker({ habits, completions, isCompleted }: CircularHabitTrackerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const daysInMonth = getDaysInMonth(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  
  const size = 400
  const center = size / 2
  const outerRadius = 170
  const innerRadius = 70
  const ringGap = 3
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  
  const ringWidth = habits.length > 0 
    ? (outerRadius - innerRadius - ringGap * (habits.length - 1)) / habits.length 
    : 0
  
  const formatDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    }
  }
  
  const describeArc = (cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    const start1 = polarToCartesian(cx, cy, outerR, startAngle)
    const end1 = polarToCartesian(cx, cy, outerR, endAngle)
    const start2 = polarToCartesian(cx, cy, innerR, endAngle)
    const end2 = polarToCartesian(cx, cy, innerR, startAngle)
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    
    return [
      'M', start1.x, start1.y,
      'A', outerR, outerR, 0, largeArc, 1, end1.x, end1.y,
      'L', start2.x, start2.y,
      'A', innerR, innerR, 0, largeArc, 0, end2.x, end2.y,
      'Z'
    ].join(' ')
  }
  
  const anglePerDay = 360 / daysInMonth
  const gapAngle = 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Habit Tracker</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(currentMonth, 'MMM yyyy')}
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
        </div>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">Add habits to see your tracker</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px]">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const angle = (day - 1) * anglePerDay + anglePerDay / 2
                const pos = polarToCartesian(center, center, outerRadius + 16, angle)
                const dateStr = formatDateStr(day)
                const isToday = dateStr === todayStr
                
                return (
                  <g key={`day-${day}`}>
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-[10px] ${isToday ? 'fill-primary font-bold' : 'fill-muted-foreground'}`}
                      transform={`rotate(${angle}, ${pos.x}, ${pos.y})`}
                    >
                      {day}
                    </text>
                    {isToday && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={10}
                        className="fill-none stroke-primary"
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                )
              })}
              
              {habits.map((habit, habitIndex) => {
                const habitOuterR = outerRadius - habitIndex * (ringWidth + ringGap)
                const habitInnerR = habitOuterR - ringWidth
                
                return (
                  <g key={habit.id}>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1
                      const dateStr = formatDateStr(day)
                      const completed = isCompleted(habit.id, dateStr)
                      const startAngle = (day - 1) * anglePerDay + gapAngle / 2
                      const endAngle = day * anglePerDay - gapAngle / 2
                      
                      return (
                        <path
                          key={`${habit.id}-${day}`}
                          d={describeArc(center, center, habitInnerR, habitOuterR, startAngle, endAngle)}
                          fill={completed ? habit.color : 'currentColor'}
                          className={completed ? '' : 'text-secondary/50'}
                          opacity={completed ? 1 : 0.3}
                        >
                          <title>{`${habit.name} - Day ${day}: ${completed ? 'Done' : 'Not done'}`}</title>
                        </path>
                      )
                    })}
                  </g>
                )
              })}
              
              <circle
                cx={center}
                cy={center}
                r={innerRadius - 5}
                className="fill-background"
              />
            </svg>
            
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="text-xs text-muted-foreground">{habit.icon} {habit.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
