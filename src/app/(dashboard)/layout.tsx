import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SidebarProvider, MainContent } from '@/components/layout/layout-client'
import { CommandPalette } from '@/components/command-palette'
import { ShareViewProvider } from '@/lib/share-view/context'
import { ShareViewBanner } from '@/components/layout/share-view-banner'

async function getShareViewData() {
  const cookieStore = await cookies()
  const shareToken = cookieStore.get('share_token')?.value
  const shareOwnerId = cookieStore.get('share_owner_id')?.value

  if (!shareToken || !shareOwnerId) {
    return null
  }

  const supabase = await createClient()
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*, profiles!share_links_owner_id_fkey(display_name)')
    .eq('token', shareToken)
    .eq('owner_id', shareOwnerId)
    .single()

  if (!shareLink) return null
  
  const isExpired = shareLink.expires_at && new Date(shareLink.expires_at) < new Date()
  if (isExpired) return null

  return {
    isShareView: true,
    allowedPages: shareLink.allowed_pages as string[],
    ownerName: (shareLink.profiles as { display_name: string | null })?.display_name || 'Someone',
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const shareViewData = await getShareViewData()

  if (!user && !shareViewData) {
    redirect('/login')
  }

  return (
    <ShareViewProvider initialShareView={shareViewData ?? undefined}>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <MainContent>
            <div className="sticky top-0 z-40 w-full">
              {shareViewData && <ShareViewBanner ownerName={shareViewData.ownerName} />}
              <Header />
            </div>
            <main className="py-6 px-4 md:px-6 pb-20 md:pb-6">
              {children}
            </main>
          </MainContent>
          <MobileNav />
          {!shareViewData && <CommandPalette />}
        </div>
      </SidebarProvider>
    </ShareViewProvider>
  )
}
