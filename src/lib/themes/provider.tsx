'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ThemeId, themes, DEFAULT_THEME } from './config'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'annas-app-theme'

function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stored in themes) return stored as ThemeId
  return DEFAULT_THEME
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setThemeState(getStoredTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    Object.values(themes).forEach(t => {
      root.classList.remove(t.cssClass)
    })
    
    root.classList.add(themes[theme].cssClass)
    
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider')
  }
  return context
}
