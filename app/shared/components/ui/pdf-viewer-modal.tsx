'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, Download } from 'lucide-react'

interface PdfViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string
  title?: string
}

export function PdfViewerModal({
  open,
  onOpenChange,
  pdfUrl,
  title = 'Visualizar PDF',
}: PdfViewerModalProps) {
  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank')
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = title || 'documento.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden relative">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={title}
            style={{ minHeight: '100%' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

