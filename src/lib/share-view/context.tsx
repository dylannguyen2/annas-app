'use client'

import * as React from 'react'

interface ShareViewContextType {
  isShareView: boolean
  allowedPages: string[]
  ownerName: string | null
  exitShareView: () => Promise<void>
}

const ShareViewContext = React.createContext<ShareViewContextType>({
  isShareView: false,
  allowedPages: [],
  ownerName: null,
  exitShareView: async () => {},
})

interface ShareViewProviderProps {
  children: React.ReactNode
  initialShareView?: {
    isShareView: boolean
    allowedPages: string[]
    ownerName: string | null
  }
}

export function ShareViewProvider({ children, initialShareView }: ShareViewProviderProps) {
  const [isShareView, setIsShareView] = React.useState(initialShareView?.isShareView ?? false)
  const [allowedPages, setAllowedPages] = React.useState<string[]>(initialShareView?.allowedPages ?? [])
  const [ownerName, setOwnerName] = React.useState<string | null>(initialShareView?.ownerName ?? null)

  const exitShareView = React.useCallback(async () => {
    await fetch('/api/share-links/validate', { method: 'DELETE' })
    setIsShareView(false)
    setAllowedPages([])
    setOwnerName(null)
    window.location.href = '/login'
  }, [])

  return (
    <ShareViewContext.Provider value={{ isShareView, allowedPages, ownerName, exitShareView }}>
      {children}
    </ShareViewContext.Provider>
  )
}

export function useShareView() {
  return React.useContext(ShareViewContext)
}

export function isPageAllowed(allowedPages: string[], pathname: string): boolean {
  if (allowedPages.length === 0) return true
  return allowedPages.some(page => pathname === page || pathname.startsWith(page + '/'))
}
