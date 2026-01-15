import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
  '/pricing',
  '/api/webhooks',
  '/api/demo',
  '/demo',
  '/share',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  if (isPublicRoute(pathname) || pathname === '/') {
    return supabaseResponse
  }

  const demoToken = request.cookies.get('demo_token')?.value
  const demoOwnerId = request.cookies.get('demo_owner_id')?.value

  if (demoToken && demoOwnerId) {
    const { data: demoSession } = await supabase
      .from('demo_sessions')
      .select('*')
      .eq('token', demoToken)
      .eq('owner_id', demoOwnerId)
      .is('ended_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (demoSession) {
      return supabaseResponse
    }
  }

  const shareToken = request.cookies.get('share_token')?.value
  const shareOwnerId = request.cookies.get('share_owner_id')?.value

  if (shareToken && shareOwnerId) {
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', shareToken)
      .eq('owner_id', shareOwnerId)
      .single()

    if (shareLink) {
      const isExpired = shareLink.expires_at && new Date(shareLink.expires_at) < new Date()
      if (!isExpired) {
        const isAllowedPage = shareLink.allowed_pages.some((page: string) => 
          pathname === page || pathname.startsWith(page + '/')
        )
        
        if (isAllowedPage || pathname === '/') {
          return supabaseResponse
        }
        
        const url = request.nextUrl.clone()
        url.pathname = shareLink.allowed_pages[0] || '/'
        return NextResponse.redirect(url)
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const hasActiveSubscription = subscription && 
    ['active', 'trialing'].includes(subscription.status) &&
    new Date(subscription.current_period_end) > new Date()

  if (!hasActiveSubscription && !pathname.startsWith('/pricing')) {
    const url = request.nextUrl.clone()
    url.pathname = '/pricing'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
