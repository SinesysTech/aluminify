'use client'

import * as React from 'react'
import { useTheme } from '@/hooks/use-theme'
import { ThemeConfigProvider } from '@/components/active-theme'
import { Toaster } from '@/components/ui/sonner'

type ThemeProviderProps = {
  children: React.ReactNode
}

const ThemeContext = React.createContext<
  | {
    theme: 'light' | 'dark'
    setTheme: (theme: 'light' | 'dark' | ((prev: 'light' | 'dark') => 'light' | 'dark')) => void
    toggleTheme: () => void
    mounted: boolean
  }
  | undefined
>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useTheme()

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeConfigProvider>
        {children}
        <Toaster />
      </ThemeConfigProvider>
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}





