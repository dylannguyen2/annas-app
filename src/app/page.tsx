import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Activity, Utensils, Brain, Sparkles } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Anna&apos;s World</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your personal wellness companion
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Track your mood, meals, workouts, and daily habits. Connect with Garmin to sync your activities automatically.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start tracking
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-20">
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="Mood"
            description="Track how you feel each day"
          />
          <FeatureCard
            icon={<Utensils className="h-6 w-6" />}
            title="Meals"
            description="Log what you eat with photos"
          />
          <FeatureCard
            icon={<Activity className="h-6 w-6" />}
            title="Workouts"
            description="Sync from Garmin or log manually"
          />
          <FeatureCard
            icon={<Heart className="h-6 w-6" />}
            title="Habits"
            description="Build healthy daily routines"
          />
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        Made with love for Anna
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 md:p-6 rounded-xl bg-card border text-center space-y-2">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
