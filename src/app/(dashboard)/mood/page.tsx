'use client'

import { useMoods } from '@/hooks/use-moods'
import { MoodPicker } from '@/components/dashboard/mood-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDisplayDate } from '@/lib/utils/dates'
import { Loader2 } from 'lucide-react'

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export default function MoodPage() {
  const { moods, loading, saveMood, getTodayMood } = useMoods()
  const todayMood = getTodayMood()
  const today = formatDate(new Date())

  const handleSaveMood = async (data: { mood: number; energy: number; stress: number; notes?: string }) => {
    await saveMood({ date: today, ...data })
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

      <div className="grid gap-6 md:grid-cols-2">
        <MoodPicker
          initialMood={todayMood?.mood ?? undefined}
          initialEnergy={todayMood?.energy ?? 3}
          initialStress={todayMood?.stress ?? 3}
          initialNotes={todayMood?.notes ?? ''}
          onSave={handleSaveMood}
        />

        <Card>
          <CardHeader>
            <CardTitle>Recent Moods</CardTitle>
          </CardHeader>
          <CardContent>
            {moods.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No mood entries yet. Log your first mood!
              </p>
            ) : (
              <div className="space-y-3">
                {moods.slice(0, 7).map((mood) => (
                  <div
                    key={mood.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {mood.mood ? MOOD_EMOJIS[mood.mood] : '❓'}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {formatDisplayDate(mood.date)}
                        </p>
                        {mood.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {mood.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Energy: {mood.energy}/5</p>
                      <p>Stress: {mood.stress}/5</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mood Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (27 - i))
              const dateStr = formatDate(date)
              const moodEntry = moods.find(m => m.date === dateStr)
              
              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-lg bg-secondary/30"
                  title={formatDisplayDate(dateStr)}
                >
                  {moodEntry?.mood ? MOOD_EMOJIS[moodEntry.mood] : ''}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
