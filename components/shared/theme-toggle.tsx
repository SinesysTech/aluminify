'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeContext } from '@/components/providers/theme-provider'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  iconOnly?: boolean
  className?: string
}

export function ThemeToggle({ iconOnly = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useThemeContext()

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

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn("size-9", className)}
        aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      >
        {theme === 'dark' ? (
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
      tooltip={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {theme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
      <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
    </SidebarMenuButton>
  )
}

