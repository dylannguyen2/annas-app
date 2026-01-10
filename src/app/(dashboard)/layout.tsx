import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SidebarProvider, MainContent } from '@/components/layout/layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MainContent>
          <Header />
          <main className="py-6 px-4 md:px-6 pb-20 md:pb-6">
            {children}
          </main>
        </MainContent>
        <MobileNav />
      </div>
    </SidebarProvider>
  )
}
