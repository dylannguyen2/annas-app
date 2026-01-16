'use client'

import { useState, useEffect } from 'react'
import { useMoods } from '@/hooks/use-moods'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatDisplayDate } from '@/lib/utils/dates'
import { ChevronLeft, ChevronRight, Smile, List, Search, X } from 'lucide-react'
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

const TABS = [
  { id: 'log', label: 'Log Mood', icon: Smile },
  { id: 'history', label: 'History', icon: List },
] as const

export default function MoodPage() {
  const { isShareView } = useShareView()
  const { moods, loading, saveMood, getMoodForDate } = useMoods()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<string>('log')
  const [historySearch, setHistorySearch] = useState('')
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(20)
  
  const selectedDateStr = formatDate(selectedDate)
  const moodForSelectedDate = getMoodForDate(selectedDateStr)

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)
  const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  useEffect(() => {
    setVisibleHistoryCount(20)
  }, [activeTab, historySearch])

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string; date: Date }) => {
    await saveMood({ date: formatDate(data.date), mood: data.mood, energy: data.energy, stress: data.stress, notes: data.notes })
  }
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    if (!isSameMonth(date, calendarMonth)) {
      setCalendarMonth(date)
    }
  }

  const filteredHistory = moods.filter(mood => {
    if (!historySearch.trim()) return true
    return mood.notes?.toLowerCase().includes(historySearch.toLowerCase())
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const visibleHistory = filteredHistory.slice(0, visibleHistoryCount)
  const hasMoreHistory = filteredHistory.length > visibleHistoryCount

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-6 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            <div className="relative p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
              <Smile className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              Mood
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Track how you&apos;re feeling each day.
            </p>
          </div>
        </div>
        {!isShareView && <PanicButton />}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-hidden whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'log' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-6">
              <Card className="h-full border-border/50 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
                  <CardTitle className="text-base font-semibold">Calendar</CardTitle>
                  <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-background shadow-none"
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium min-w-[80px] text-center">
                      {format(calendarMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-background shadow-none"
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      disabled={isSameMonth(calendarMonth, new Date())}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-3 sm:px-4">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <div key={day} className="py-1">{day}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
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
                            "group relative aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border",
                            hasMood 
                              ? MOOD_STYLES[moodEntry.mood!]
                              : "bg-muted/10 text-muted-foreground/30 border-transparent",
                            isCurrentDay && !hasMood && "bg-accent/40 font-semibold border-accent",
                            isFutureDay ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-accent/20",
                            isSelected && "ring-2 ring-primary border-primary shadow-md z-10 bg-primary/5",
                            !hasMood && !isSelected && "border-border/40 hover:border-primary/30"
                          )}
                        >
                          {hasMood ? (
                            <span className="text-lg filter drop-shadow-sm">{MOOD_EMOJIS[moodEntry.mood!]}</span>
                          ) : (
                            <span className={cn(
                              "text-[10px] w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                              isCurrentDay ? "bg-primary text-primary-foreground shadow-sm" : "",
                              isSelected && !isCurrentDay ? "text-primary font-bold" : ""
                            )}>
                              {format(date, 'd')}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col">
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
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Mood History</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {visibleHistory.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {visibleHistory.map((mood) => {
                       const moodDate = new Date(mood.date + 'T00:00:00')
                       const hasMood = mood.mood !== undefined && mood.mood !== null
                       
                       return (
                        <button
                          key={mood.id}
                          onClick={() => {
                            setSelectedDate(moodDate)
                            setCalendarMonth(moodDate)
                            setActiveTab('log')
                          }}
                          className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-colors group text-left"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110",
                              hasMood ? MOOD_STYLES[mood.mood!] : "bg-secondary"
                            )}>
                              {hasMood ? MOOD_EMOJIS[mood.mood!] : '❓'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground flex items-center gap-2">
                                {formatDisplayDate(mood.date)}
                                <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium shrink-0">
                                  {mood.energy}/5 Energy
                                </span>
                              </p>
                              {mood.notes ? (
                                <p className="text-xs text-muted-foreground truncate font-light leading-relaxed mt-0.5">
                                  {mood.notes}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic mt-0.5 opacity-50">
                                  No notes
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="pl-4 shrink-0 text-right hidden sm:block">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Stress</div>
                            <div className="flex gap-0.5 justify-end">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    i < (mood.stress ?? 0) ? "bg-red-400" : "bg-muted"
                                  )} 
                                />
                              ))}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {hasMoreHistory && (
                      <div className="p-4 text-center border-t border-border/40">
                        <Button 
                          variant="outline" 
                          onClick={() => setVisibleHistoryCount(prev => prev + 20)}
                          className="w-full sm:w-auto"
                        >
                          Load More
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      {historySearch ? <Search className="h-8 w-8 opacity-20" /> : <Smile className="h-8 w-8 opacity-20" />}
                    </div>
                    <p className="font-medium">{historySearch ? 'No matching entries' : 'No mood entries yet'}</p>
                    <p className="text-sm opacity-70">
                      {historySearch ? 'Try a different search term' : 'Start tracking your mood to see history'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
