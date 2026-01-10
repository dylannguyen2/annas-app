'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const supabase = createClient()

  const checkVerification = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      setVerified(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
      return true
    }
    return false
  }, [supabase.auth, router])

  useEffect(() => {
    checkVerification()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const isVerified = await checkVerification()
        if (!isVerified) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email_confirmed_at) {
            setVerified(true)
            setTimeout(() => {
              router.push('/dashboard')
              router.refresh()
            }, 1500)
          }
        }
      }
    })

    const interval = setInterval(checkVerification, 3000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase.auth, router, checkVerification])

  const handleResend = async () => {
    if (!email) {
      toast.error('No email address found')
      return
    }

    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Verification email sent!')
    }
    setResending(false)
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Email verified!</h2>
              <p className="text-muted-foreground text-sm">
                Redirecting you to the app...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We sent a verification link to{' '}
              {email ? <strong>{email}</strong> : 'your email'}
            </p>
            <p className="text-muted-foreground text-xs">
              Click the link in the email to verify your account. This page will automatically redirect once verified.
            </p>
            
            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
