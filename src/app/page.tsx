import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, Activity, Utensils, Brain, Sparkles, ArrowRight, Sun, Cloud, Star } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20 font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-float opacity-60" style={{ animationDuration: '25s' }} />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-float opacity-60" style={{ animationDuration: '20s', animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] animate-float opacity-50" style={{ animationDuration: '30s', animationDelay: '5s' }} />
      
      <div className="absolute top-[15%] left-[10%] text-primary/20 animate-bounce-subtle" style={{ animationDuration: '4s' }}>
        <Cloud className="w-24 h-24" />
      </div>
      <div className="absolute top-[25%] right-[15%] text-accent/20 animate-pulse" style={{ animationDuration: '6s' }}>
        <Star className="w-16 h-16" />
      </div>
      <div className="absolute bottom-[20%] left-[5%] text-secondary/30 animate-wiggle" style={{ animationDuration: '8s' }}>
        <Sun className="w-32 h-32" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-background/30 backdrop-blur-md border-b border-white/10 supports-[backdrop-filter]:bg-background/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all scale-110" />
              <Image
                src="/anna.png"
                alt="Anna"
                width={40}
                height={40}
                className="relative rounded-full border-2 border-white/50 shadow-sm group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground/80 group-hover:text-primary transition-colors">Anna&apos;s World</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full px-6">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full px-8 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-105 transition-all bg-primary text-primary-foreground border-2 border-transparent hover:border-white/20">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-40 pb-24 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <svg className="absolute top-[-40px] left-[50%] transform -translate-x-1/2 w-32 h-32 opacity-20 text-accent pointer-events-none" viewBox="0 0 100 100">
            <path d="M10,50 Q25,25 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M20,60 Q35,35 60,60 T100,60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" style={{ opacity: 0.5 }} />
          </svg>

          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/50 border border-white/40 shadow-sm backdrop-blur-sm text-sm text-muted-foreground mb-6 hover:scale-105 transition-transform cursor-default ring-1 ring-primary/5">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-medium">Welcome to your safe space</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1] text-foreground drop-shadow-sm">
            Make every day <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-gradient">a little brighter</span>
              <svg className="absolute -bottom-2 left-0 w-full h-4 text-primary/20 z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light pt-4">
            A cozy corner of the internet to track your mood, meals, and movement. Built with love, just for you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-full h-16 px-10 text-lg gap-3 shadow-xl shadow-primary/15 hover:shadow-2xl hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300 bg-primary text-primary-foreground group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative">Start your journey</span>
                <ArrowRight className="h-5 w-5 relative group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-16 px-10 text-lg bg-white/40 hover:bg-white/60 border-white/60 hover:border-primary/20 backdrop-blur-sm transition-all duration-300 text-foreground/80">
                Take a peek
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mt-40">
          <FeatureCard
            icon={<Brain className="h-7 w-7" />}
            title="Mood Garden"
            description="Plant seeds of gratitude and watch your emotional landscape bloom."
            delay={0.1}
            color="bg-chart-1/10"
            textColor="text-chart-1"
            rotate="-rotate-2"
          />
          <FeatureCard
            icon={<Utensils className="h-7 w-7" />}
            title="Mindful Eating"
            description="Savor your meals with photo logs that focus on nourishment, not numbers."
            delay={0.2}
            color="bg-chart-2/10"
            textColor="text-chart-2"
            rotate="rotate-1"
          />
          <FeatureCard
            icon={<Activity className="h-7 w-7" />}
            title="Gentle Movement"
            description="Celebrate every step. Syncs with Garmin to honor your body's rhythm."
            delay={0.3}
            color="bg-chart-3/10"
            textColor="text-chart-3"
            rotate="-rotate-1"
          />
          <FeatureCard
            icon={<Heart className="h-7 w-7" />}
            title="Self Care"
            description="Build routines that feel like a warm hug, not a chore."
            delay={0.4}
            color="bg-chart-4/10"
            textColor="text-chart-4"
            rotate="rotate-2"
          />
        </div>

        <div className="mt-40 text-center space-y-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[80px] -z-10" />
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground/60">Made for wellness, designed for joy</p>
          <div className="flex justify-center gap-2 opacity-50">
             <Star className="h-4 w-4" />
             <Star className="h-4 w-4" />
             <Star className="h-4 w-4" />
          </div>
        </div>

      </main>

      <footer className="relative mt-auto border-t border-white/20 bg-white/30 backdrop-blur-md">
        <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <Image src="/anna.png" alt="Anna" width={24} height={24} className="rounded-full" />
            <span className="font-medium">© 2026 Anna&apos;s World</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-primary transition-colors relative group">
              Privacy
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-primary transition-colors relative group">
              Terms
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
            <a href="#" className="hover:text-primary transition-colors relative group">
              Say Hello
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description,
  delay = 0,
  color,
  textColor,
  rotate
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
  color: string;
  textColor: string;
  rotate: string;
}) {
  return (
    <div 
      className={`group p-8 rounded-[2rem] bg-white/60 border border-white/60 hover:border-white/80 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 relative overflow-hidden backdrop-blur-sm animate-in-up ${rotate}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 ${color} rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700 opacity-50`} />
      
      <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border border-white/50 flex items-center justify-center mb-6 ${textColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10`}>
        {icon}
      </div>
      
      <h3 className="font-bold text-xl mb-3 text-foreground/90 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed font-light">
        {description}
      </p>
    </div>
  )
}
