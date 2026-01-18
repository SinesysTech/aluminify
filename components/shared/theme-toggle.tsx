'use client'

import * as React from 'react'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  iconOnly?: boolean
  className?: string
}

export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) {
    if (iconOnly) {
      return (
        <Button
          variant="ghost"
          size="icon"
          disabled
          className={cn("size-9", className)}
          aria-label="Carregando tema"
        >
          <Sun className="size-4" />
        </Button>
      )
    }
    return (
      <SidebarMenuButton size="default" disabled>
        <Sun className="size-4" />
        <span>Carregando...</span>
      </SidebarMenuButton>
    )
  }

  const currentTheme = resolvedTheme || theme

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn("size-9", className)}
        aria-label={currentTheme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      >
        {currentTheme === 'dark' ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>
    )
  }

  return (
    <SidebarMenuButton
      size="default"
      onClick={toggleTheme}
      tooltip={currentTheme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      aria-label={currentTheme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {currentTheme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
      <span>{currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
    </SidebarMenuButton>
  )
}

