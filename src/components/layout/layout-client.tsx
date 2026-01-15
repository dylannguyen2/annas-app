'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  expandSidebar: () => void
  collapseSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const expandSidebar = () => {
    setIsCollapsed(false)
    localStorage.setItem('sidebar-collapsed', 'false')
  }

  const collapseSidebar = () => {
    setIsCollapsed(true)
    localStorage.setItem('sidebar-collapsed', 'true')
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, expandSidebar, collapseSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export function MainContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-in-out",
        isCollapsed ? "md:pl-20" : "md:pl-60",
        className
      )}
    >
      {children}
    </div>
  )
}
