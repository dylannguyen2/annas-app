import { format, subDays, startOfWeek, addDays, differenceInDays, parseISO } from 'date-fns'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    dates.push(formatDate(subDays(new Date(), i)))
  }
  return dates
}

export function getWeekDates(date: Date = new Date()): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(addDays(start, i)))
  }
  return dates
}

export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  
  const sortedDates = [...completedDates].sort().reverse()
  const today = formatDate(new Date())
  const yesterday = formatDate(subDays(new Date(), 1))
  
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0
  }
  
  let streak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const current = parseISO(sortedDates[i - 1])
    const prev = parseISO(sortedDates[i])
    const diff = differenceInDays(current, prev)
    
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export function getDayName(date: string): string {
  return format(parseISO(date), 'EEE')
}

export function getDayNumber(date: string): string {
  return format(parseISO(date), 'd')
}

export function isToday(date: string): boolean {
  return date === formatDate(new Date())
}
