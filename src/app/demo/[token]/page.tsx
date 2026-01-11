'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DemoPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'signing-in'>('loading')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    async function validateAndSignIn() {
      try {
        const res = await fetch(`/api/demo/${token}`)
        const data = await res.json()
        
        if (data.valid) {
          setStatus('signing-in')
          setExpiresAt(data.expires_at)
          
          const signInRes = await fetch('/api/demo/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          })
          
          const signInData = await signInRes.json()
          
          if (signInData.success) {
            setStatus('valid')
            const supabase = createClient()
            await supabase.auth.setSession({
              access_token: signInData.access_token,
              refresh_token: signInData.refresh_token
            })
            setTimeout(() => router.push('/dashboard'), 1000)
          } else {
            setStatus('invalid')
            setErrorMessage(signInData.error || 'Failed to sign in')
          }
        } else {
          setStatus('invalid')
          setErrorMessage(data.error || 'Invalid demo link')
        }
      } catch (err) {
        setStatus('invalid')
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
    
    validateAndSignIn()
  }, [token, router])

  if (status === 'loading' || status === 'signing-in') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="h-8 w-8 text-primary fill-primary/10" />
          <span className="font-semibold text-2xl">Anna&apos;s World</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{status === 'loading' ? 'Validating demo link...' : 'Setting up demo session...'}</span>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold">Demo Link Invalid</h1>
            <p className="text-muted-foreground">
              {errorMessage || 'This demo link has expired or is no longer valid.'}
            </p>
            <Link href="/">
              <Button className="mt-4">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-4">
        <Heart className="h-8 w-8 text-primary fill-primary/10" />
        <span className="font-semibold text-2xl">Anna&apos;s World</span>
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Demo access granted!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Redirecting to the app...
        </p>
        {expiresAt && (
          <p className="text-xs text-muted-foreground">
            Demo expires: {new Date(expiresAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
