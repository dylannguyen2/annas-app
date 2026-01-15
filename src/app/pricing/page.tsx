'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .single()
        
        const isActive = subscription && 
          ['active', 'trialing'].includes(subscription.status) &&
          new Date(subscription.current_period_end) > new Date()
        
        setHasSubscription(!!isActive)
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [supabase])

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
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-primary/20 blur-[120px] opacity-40 animate-in fade-in duration-1000" />
        <div className="absolute top-[20%] -right-[10%] h-[60vh] w-[60vw] rounded-full bg-accent/20 blur-[120px] opacity-40 animate-in fade-in duration-1000 delay-300" />
        <div className="absolute bottom-0 left-1/3 h-[50vh] w-[50vw] rounded-full bg-blue-500/10 blur-[100px] opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20 backdrop-blur-md transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Anna&apos;s World
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="rounded-full hover:bg-white/10">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="rounded-full hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 pb-16">
          <div className="text-center mb-10 space-y-4 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/50 shadow-sm backdrop-blur-md mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                Premium Wellness
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent pb-2">
              Invest in your <span className="text-primary italic">best self</span>
            </h1>
            <p className="text-lg text-muted-foreground/90 max-w-lg mx-auto leading-relaxed">
              Unlock the full potential of your wellness journey with our comprehensive suite of tracking tools and insights.
            </p>
          </div>

          <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-[2.5rem] blur-xl opacity-70 group-hover:opacity-100 transition duration-1000" />
            
            <Card className="relative w-full border-white/20 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
              
              <CardHeader className="flex flex-col items-center text-center pb-8 pt-8 space-y-4">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-accent blur opacity-40 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-yellow-200" />
                    7-DAY FREE TRIAL
                  </div>
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold">Pro Membership</CardTitle>
                  <CardDescription className="text-base">
                    Complete access to all premium features
                  </CardDescription>
                </div>
                
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-5xl font-bold tracking-tight">$12</span>
                  <span className="text-muted-foreground font-medium">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 px-8 pb-8">
                <div className="space-y-4">
                  {FEATURES.map((feature, i) => (
                    <div 
                      key={feature} 
                      className="flex items-center gap-3 group/item"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex-shrink-0 rounded-full bg-primary/10 p-1 group-hover/item:bg-primary/20 transition-colors">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80 group-hover/item:text-foreground transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {error}
                    </div>
                  )}

                  {checkingAuth ? (
                    <Button className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-primary/20" size="lg" disabled>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </Button>
                  ) : hasSubscription ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          You&apos;re already subscribed!
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        onClick={handleStartTrial}
                        className="group w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            Start 7-Day Free Trial
                            <Sparkles className="w-4 h-4 opacity-70 group-hover:animate-pulse" />
                          </span>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secure payment • Cancel anytime • No charge today</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground/60 flex items-center justify-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-primary fill-primary/30" /> for Anna
          </p>
        </footer>
      </div>
    </div>
  )
}

