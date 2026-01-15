export type ThemeId = 'default' | 'cute' | 'lavender' | 'mint' | 'devil'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  emoji: string
  cssClass: string
}

export const themes: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Pink',
    description: 'Classic soft pink',
    emoji: '🌸',
    cssClass: 'theme-default',
  },
  cute: {
    id: 'cute',
    name: 'Cute Pink',
    description: 'Extra pink and kawaii',
    emoji: '🎀',
    cssClass: 'theme-cute',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple dream',
    emoji: '💜',
    cssClass: 'theme-lavender',
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    description: 'Fresh and calm',
    emoji: '🌿',
    cssClass: 'theme-mint',
  },
  devil: {
    id: 'devil',
    name: 'Devil',
    description: 'Dark and fiery red',
    emoji: '😈',
    cssClass: 'theme-devil',
  },
}

export const themeList = Object.values(themes)

export const DEFAULT_THEME: ThemeId = 'default'
