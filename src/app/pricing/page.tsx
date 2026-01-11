'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  'Unlimited habit tracking',
  'Mood & energy logging',
  'Health data sync with Garmin',
  'Meal tracking with photos',
  'Book & media tracking',
  'Todo management with Eisenhower Matrix',
  'Cycle tracking',
  'Advanced insights & analytics',
  'Data export',
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStartTrial = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signup')
          return
        }
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Heart className="h-6 w-6 text-primary fill-primary/10" />
          <span className="font-semibold text-lg">Anna&apos;s World</span>
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Start your wellness journey
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Track your habits, mood, health, and more. All in one beautiful app.
          </p>
        </div>

        <Card className="w-full max-w-md border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
              7-DAY FREE TRIAL
            </div>
            <CardTitle className="text-2xl font-bold">Pro</CardTitle>
            <CardDescription className="text-sm">
              Everything you need to track your wellness
            </CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$10</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              onClick={handleStartTrial}
              className="w-full font-medium"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Start Free Trial'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              No credit card required for trial. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        Made with love for Anna
      </footer>
    </div>
  )
}
