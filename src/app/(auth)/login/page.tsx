'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Cloud, Star, Sun, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function AuthPageContent() {
  const searchParams = useSearchParams()
  const [isFlipped, setIsFlipped] = useState(() => searchParams.get('signup') === 'true')
  
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signupLoading, setSignupLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setLoginError(error.message)
      setLoginLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError(null)

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setSignupError(error.message)
      setSignupLoading(false)
      return
    }

    router.push(`/verify-email?email=${encodeURIComponent(signupEmail)}`)
  }

  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
    setLoginError(null)
    setSignupError(null)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/20 flex flex-col">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] animate-float opacity-60 z-0" style={{ animationDuration: '25s' }} />
      <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-float opacity-60 z-0" style={{ animationDuration: '20s', animationDelay: '2s' }} />
      <div className="fixed bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] animate-float opacity-50 z-0" style={{ animationDuration: '30s', animationDelay: '5s' }} />
      
      <div className="fixed top-[15%] left-[10%] text-primary/20 animate-bounce-subtle z-0" style={{ animationDuration: '4s' }}>
        <Cloud className="w-24 h-24" />
      </div>
      <div className="fixed top-[25%] right-[15%] text-accent/20 animate-pulse z-0" style={{ animationDuration: '6s' }}>
        <Star className="w-16 h-16" />
      </div>
      <div className="fixed bottom-[20%] left-[5%] text-secondary/30 animate-wiggle z-0" style={{ animationDuration: '8s' }}>
        <Sun className="w-32 h-32" />
      </div>

      <header className="container mx-auto px-6 py-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all scale-110" />
            <Image 
              src="/anna.png" 
              alt="Anna" 
              width={32} 
              height={32} 
              className="rounded-full relative border-2 border-white/50 shadow-sm group-hover:scale-110 transition-transform duration-300" 
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground/80 group-hover:text-primary transition-colors">Anna&apos;s World</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10" style={{ perspective: '1000px' }}>
        <div 
          className="w-full max-w-md relative transition-transform duration-700 ease-in-out"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
            <div 
              className="w-full"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div className="bg-white/60 dark:bg-card/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/5 rounded-[2.5rem] p-8 md:p-10 overflow-hidden relative h-full">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 pointer-events-none" />
                
                <div className="flex flex-col items-center text-center mb-8 relative">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-card border-4 border-white/50 dark:border-white/10 shadow-lg flex items-center justify-center mb-6 overflow-hidden p-1">
                    <Image 
                      src="/anna.png" 
                      alt="Anna" 
                      width={80} 
                      height={80} 
                      className="rounded-full w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h1>
                  <p className="text-muted-foreground">
                    Enter your details to access your space
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium ml-1">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-white/50 dark:bg-background/50 border-white/40 dark:border-white/10 focus:ring-primary/20 focus:border-primary/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-white/50 dark:bg-background/50 border-white/40 dark:border-white/10 focus:ring-primary/20 focus:border-primary/50 transition-all text-base px-4"
                    />
                  </div>

                  {loginError && (
                    <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
                      {loginError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 bg-primary text-primary-foreground" 
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <button 
                      type="button"
                      onClick={toggleFlip}
                      className="text-primary hover:text-primary/80 font-semibold hover:underline decoration-2 underline-offset-4 transition-all focus:outline-none cursor-pointer"
                    >
                      Sign up now
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="w-full absolute top-0 left-0"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="bg-white/60 dark:bg-card/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/5 rounded-[2.5rem] p-8 md:p-10 overflow-hidden relative h-full">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 pointer-events-none" />
                
                <div className="flex flex-col items-center text-center mb-8 relative">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-card border-4 border-white/50 dark:border-white/10 shadow-lg flex items-center justify-center mb-6 overflow-hidden p-1">
                    <Image 
                      src="/anna.png" 
                      alt="Anna" 
                      width={80} 
                      height={80} 
                      className="rounded-full w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Join Anna&apos;s World</h1>
                  <p className="text-muted-foreground">
                    Start your journey to a better you today
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium ml-1">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Anna"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-white/50 dark:bg-background/50 border-white/40 dark:border-white/10 focus:ring-primary/20 focus:border-primary/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium ml-1">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-white/50 dark:bg-background/50 border-white/40 dark:border-white/10 focus:ring-primary/20 focus:border-primary/50 transition-all text-base px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium ml-1">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 rounded-2xl bg-white/50 dark:bg-background/50 border-white/40 dark:border-white/10 focus:ring-primary/20 focus:border-primary/50 transition-all text-base px-4"
                    />
                  </div>

                  {signupError && (
                    <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
                      {signupError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-full font-semibold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 bg-primary text-primary-foreground" 
                    disabled={signupLoading}
                  >
                    {signupLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign Up <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button 
                      type="button"
                      onClick={toggleFlip}
                      className="text-primary hover:text-primary/80 font-semibold hover:underline decoration-2 underline-offset-4 transition-all focus:outline-none cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  )
}
