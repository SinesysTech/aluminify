"use client"

import { useState } from "react"
import { AgendamentoComDetalhes, confirmarAgendamento, rejeitarAgendamento } from "@/app/actions/agendamentos"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"

interface AgendamentoActionsProps {
  agendamento: AgendamentoComDetalhes
}

export function AgendamentoActions({ agendamento }: AgendamentoActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [linkReuniao, setLinkReuniao] = useState("")
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const handleConfirm = async () => {
    if (!agendamento.id) return

    setIsConfirming(true)
    try {
      await confirmarAgendamento(agendamento.id, linkReuniao || undefined)
      toast.success("Agendamento confirmado com sucesso!")
      setConfirmDialogOpen(false)
      setLinkReuniao("")
    } catch (error) {
      toast.error("Erro ao confirmar agendamento")
      console.error(error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReject = async () => {
    if (!agendamento.id || !motivoRejeicao.trim()) return

    setIsRejecting(true)
    try {
      await rejeitarAgendamento(agendamento.id, motivoRejeicao)
      toast.success("Agendamento rejeitado")
      setRejectDialogOpen(false)
      setMotivoRejeicao("")
    } catch (error) {
      toast.error("Erro ao rejeitar agendamento")
      console.error(error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default" className="gap-1">
            <Check className="h-4 w-4" />
            <span className="hidden md:inline">Confirmar</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Confirme o agendamento e opcionalmente adicione um link de reuniao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link">Link da Reuniao (opcional)</Label>
              <Input
                id="link"
                placeholder="https://meet.google.com/..."
                value={linkReuniao}
                onChange={(e) => setLinkReuniao(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole o link do Google Meet, Zoom ou outra plataforma
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isConfirming}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
            <X className="h-4 w-4" />
            <span className="hidden md:inline">Rejeitar</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Agendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeicao. O aluno sera notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Rejeicao</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Horario indisponivel, preciso reagendar..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !motivoRejeicao.trim()}
            >
              {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
