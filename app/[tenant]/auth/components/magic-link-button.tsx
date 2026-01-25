'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/app/shared/core/utils'

interface MagicLinkButtonProps {
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function MagicLinkButton({
  onClick,
  loading,
  disabled,
  className,
}: MagicLinkButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'group w-full focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
      {loading ? 'Enviando...' : 'Enviar Magic Link'}
    </Button>
  )
}
