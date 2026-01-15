'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const complete = () => {
    clearTimers()
    setProgress(100)
    timeoutRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 200)
  }

  const start = () => {
    clearTimers()
    setVisible(true)
    setProgress(0)
    
    setTimeout(() => setProgress(20), 0)
    setTimeout(() => setProgress(40), 100)
    setTimeout(() => setProgress(60), 200)
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + 2
      })
    }, 500)
  }

  useEffect(() => {
    complete()
    return clearTimers
  }, [pathname, searchParams])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor?.href) return
      
      try {
        const url = new URL(anchor.href)
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          start()
        }
      } catch {}
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/20">
      <div 
        className="h-full bg-primary transition-all ease-out"
        style={{ 
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
        }}
      />
    </div>
  )
}
