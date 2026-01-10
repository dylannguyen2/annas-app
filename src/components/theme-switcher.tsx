'use client'

import { useAppTheme, themeList, ThemeId } from '@/lib/themes'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useAppTheme()

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {themeList.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as ThemeId)}
          className={cn(
            'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
            'hover:scale-[1.02] active:scale-[0.98]',
            theme === t.id
              ? 'border-primary bg-primary/10 shadow-md'
              : 'border-border bg-card hover:border-primary/50'
          )}
        >
          <span className="text-3xl">{t.emoji}</span>
          <span className="font-medium text-sm">{t.name}</span>
          <span className="text-xs text-muted-foreground text-center">{t.description}</span>
          {theme === t.id && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}
