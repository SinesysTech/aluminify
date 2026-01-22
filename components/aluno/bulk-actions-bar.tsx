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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
      <span className="text-sm font-medium">
        {selectedCount} aluno{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
      </span>
      <div className="h-4 w-px bg-zinc-700" />
      <Button
        variant="secondary"
        size="sm"
        onClick={onTransfer}
        className="bg-white text-zinc-900 hover:bg-zinc-100"
      >
        <ArrowRightLeft className="w-4 h-4 mr-2" />
        Transferir
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
