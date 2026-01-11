import { redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface SharePageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { token } = await params
  const { error } = await searchParams

  if (error === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground">
              This share link is not valid. It may have been deleted or never existed.
            </p>
          </div>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Link Expired</h1>
            <p className="text-muted-foreground">
              This share link has expired. Please ask the owner for a new link.
            </p>
          </div>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  redirect(`/api/share-links/activate/${token}`)
}
