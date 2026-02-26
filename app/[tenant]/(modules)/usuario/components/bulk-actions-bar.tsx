'use client'

import { ArrowRightLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
  selectedCount: number
  onTransfer: () => void
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  onTransfer,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-safe-area)+1rem)] md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card backdrop-blur-xl text-foreground border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
      <span className="text-sm font-medium">
        {selectedCount} aluno{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
      </span>
      <div className="h-4 w-px bg-border" />
      <Button
        variant="secondary"
        size="sm"
        onClick={onTransfer}
        className="bg-card text-foreground hover:bg-muted"
      >
        <ArrowRightLeft className="w-4 h-4 mr-2" />
        Transferir
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
