'use client'

import * as React from 'react'
import { ThemeConfigProvider } from '@/components/active-theme'

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeConfigProvider>
      {children}
    </ThemeConfigProvider>
  )
}





