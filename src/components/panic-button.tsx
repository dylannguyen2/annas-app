'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Heart, Wind, Eye, Phone, X, ChevronRight } from 'lucide-react'

type ExerciseType = 'menu' | 'breathing' | 'grounding' | 'affirmations'

const AFFIRMATIONS = [
  "This feeling is temporary. It will pass.",
  "You are safe. You are okay.",
  "You've gotten through this before.",
  "Take it one breath at a time.",
  "You are stronger than you know.",
  "This moment does not define you.",
  "It's okay to not be okay.",
  "You are doing the best you can.",
]

export function PanicButton() {
  const [open, setOpen] = useState(false)
  const [exercise, setExercise] = useState<ExerciseType>('menu')
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathCount, setBreathCount] = useState(0)
  const [groundingStep, setGroundingStep] = useState(0)
  const [affirmationIndex, setAffirmationIndex] = useState(0)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setExercise('menu')
      setBreathPhase('inhale')
      setBreathCount(0)
      setGroundingStep(0)
    }
  }

  useEffect(() => {
    if (exercise !== 'breathing' || !open) return

    const durations = { inhale: 4000, hold: 4000, exhale: 4000 }
    const timer = setTimeout(() => {
      if (breathPhase === 'inhale') setBreathPhase('hold')
      else if (breathPhase === 'hold') setBreathPhase('exhale')
      else {
        setBreathPhase('inhale')
        setBreathCount(c => c + 1)
      }
    }, durations[breathPhase])

    return () => clearTimeout(timer)
  }, [breathPhase, exercise, open])

  useEffect(() => {
    if (exercise !== 'affirmations' || !open) return
    const timer = setInterval(() => {
      setAffirmationIndex(i => (i + 1) % AFFIRMATIONS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [exercise, open])

  const groundingSteps = [
    { count: 5, sense: 'SEE', prompt: 'Name 5 things you can see around you' },
    { count: 4, sense: 'TOUCH', prompt: 'Name 4 things you can physically feel' },
    { count: 3, sense: 'HEAR', prompt: 'Name 3 things you can hear right now' },
    { count: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell' },
    { count: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste' },
  ]

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
      >
        <Heart className="mr-1.5 h-4 w-4" />
        Panic Button
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              {exercise === 'menu' && "You're going to be okay"}
              {exercise === 'breathing' && 'Breathing Exercise'}
              {exercise === 'grounding' && '5-4-3-2-1 Grounding'}
              {exercise === 'affirmations' && 'Affirmations'}
            </DialogTitle>
          </DialogHeader>

          {exercise === 'menu' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Take a moment. Choose something that might help:
              </p>
              
              <button
                onClick={() => setExercise('breathing')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Wind className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Breathing Exercise</p>
                  <p className="text-xs text-muted-foreground">4-4-4 box breathing to calm your nervous system</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setExercise('grounding')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">5-4-3-2-1 Grounding</p>
                  <p className="text-xs text-muted-foreground">Use your senses to anchor to the present</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setExercise('affirmations')}
                className="w-full flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Affirmations</p>
                  <p className="text-xs text-muted-foreground">Gentle reminders that you&apos;re okay</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="pt-2 border-t">
                <a
                  href="tel:13-11-14"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Lifeline Australia</p>
                    <p className="text-xs text-muted-foreground">13 11 14 - 24/7 crisis support</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {exercise === 'breathing' && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000
                    ${breathPhase === 'inhale' ? 'scale-100 bg-blue-100 dark:bg-blue-900' : ''}
                    ${breathPhase === 'hold' ? 'scale-110 bg-blue-200 dark:bg-blue-800' : ''}
                    ${breathPhase === 'exhale' ? 'scale-90 bg-blue-50 dark:bg-blue-950' : ''}
                  `}
                >
                  <span className="text-2xl font-medium text-blue-700 dark:text-blue-300">
                    {breathPhase === 'inhale' && 'Breathe In'}
                    {breathPhase === 'hold' && 'Hold'}
                    {breathPhase === 'exhale' && 'Breathe Out'}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {breathPhase === 'inhale' && 'Slowly breathe in through your nose...'}
                  {breathPhase === 'hold' && 'Gently hold your breath...'}
                  {breathPhase === 'exhale' && 'Slowly release through your mouth...'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Breath {breathCount + 1} of 5
                </p>
              </div>

              {breathCount >= 5 && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">Great job!</p>
                  <p className="text-sm text-muted-foreground">You completed 5 breathing cycles</p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setExercise('menu')}>
                <X className="mr-1.5 h-4 w-4" />
                Back to Menu
              </Button>
            </div>
          )}

          {exercise === 'grounding' && (
            <div className="space-y-6 py-4">
              {groundingStep < 5 ? (
                <>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                      <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {groundingSteps[groundingStep].count}
                      </span>
                    </div>
                    <p className="text-lg font-medium">{groundingSteps[groundingStep].sense}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {groundingSteps[groundingStep].prompt}
                    </p>
                  </div>

                  <div className="flex gap-1 justify-center">
                    {groundingSteps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-8 rounded-full transition-colors ${
                          i <= groundingStep ? 'bg-green-500' : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>

                  <Button className="w-full" onClick={() => setGroundingStep(s => s + 1)}>
                    {groundingStep < 4 ? 'Next' : 'Finish'}
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium text-lg">Well done!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You&apos;ve reconnected with the present moment.
                  </p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setExercise('menu')}>
                <X className="mr-1.5 h-4 w-4" />
                Back to Menu
              </Button>
            </div>
          )}

          {exercise === 'affirmations' && (
            <div className="space-y-6 py-4">
              <div className="min-h-[120px] flex items-center justify-center p-6 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-xl text-center font-medium text-purple-800 dark:text-purple-200 transition-opacity">
                  {AFFIRMATIONS[affirmationIndex]}
                </p>
              </div>

              <div className="flex gap-1 justify-center">
                {AFFIRMATIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      i === affirmationIndex ? 'bg-purple-500' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={() => setExercise('menu')}>
                <X className="mr-1.5 h-4 w-4" />
                Back to Menu
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
