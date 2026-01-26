"use client"

import { useState } from "react"
import { AgendamentoComDetalhes } from "@/app/[tenant]/(modules)/agendamentos/types"
import { confirmarAgendamento, rejeitarAgendamento, updateAgendamento } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/shared/components/forms/input"
import { Label } from "@/app/shared/components/forms/label"
import { Textarea } from "@/app/shared/components/forms/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/shared/components/overlay/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar,
  Clock,
  User,
  Mail,
  Video,
  MessageSquare,
  Check,
  X,
  Loader2,
  ExternalLink,
  Copy
} from "lucide-react"

interface AgendamentoDetailsProps {
  agendamento: AgendamentoComDetalhes
}

export function AgendamentoDetails({ agendamento }: AgendamentoDetailsProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [linkReuniao, setLinkReuniao] = useState(agendamento.link_reuniao || "")
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const dataInicio = new Date(agendamento.data_inicio)
  const dataFim = new Date(agendamento.data_fim)
  const aluno = agendamento.aluno

  const statusConfig = {
    pendente: { label: "Pendente", variant: "outline" as const, className: "border-amber-500 text-amber-600" },
    confirmado: { label: "Confirmado", variant: "default" as const, className: "bg-emerald-500" },
    cancelado: { label: "Cancelado", variant: "destructive" as const, className: "" },
    concluido: { label: "Concluído", variant: "secondary" as const, className: "" }
  }

  const status = statusConfig[agendamento.status]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleConfirm = async () => {
    if (!agendamento.id) return
    setIsConfirming(true)
    try {
      await confirmarAgendamento(agendamento.id, linkReuniao || undefined)
      toast.success("Agendamento confirmado com sucesso!")
      setConfirmDialogOpen(false)
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
    } catch (error) {
      toast.error("Erro ao rejeitar agendamento")
      console.error(error)
    } finally {
      setIsRejecting(false)
    }
  }

  const handleUpdateLink = async () => {
    if (!agendamento.id) return
    setIsUpdating(true)
    try {
      await updateAgendamento(agendamento.id, { link_reuniao: linkReuniao })
      toast.success("Link atualizado com sucesso!")
      setLinkDialogOpen(false)
    } catch (error) {
      toast.error("Erro ao atualizar link")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const copyLink = () => {
    if (agendamento.link_reuniao) {
      navigator.clipboard.writeText(agendamento.link_reuniao)
      toast.success("Link copiado!")
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Aluno Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={aluno?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {aluno ? getInitials(aluno.nome) : "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium">{aluno?.nome || "Aluno desconhecido"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {aluno?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agendamento Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalhes do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">
              {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horário</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
            </span>
          </div>

          {agendamento.confirmado_em && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Confirmado em</span>
              <span className="text-sm">
                {format(new Date(agendamento.confirmado_em), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Criado em</span>
            <span className="text-sm">
              {agendamento.created_at && format(new Date(agendamento.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reuniao Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Link da Reunião
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamento.link_reuniao ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <span className="flex-1 truncate text-sm">{agendamento.link_reuniao}</span>
                <Button variant="ghost" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={agendamento.link_reuniao} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              {agendamento.status === "confirmado" && (
                <Button variant="outline" onClick={() => setLinkDialogOpen(true)} className="w-full">
                  Alterar Link
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">
                Nenhum link de reunião configurado
              </p>
              {agendamento.status === "confirmado" && (
                <Button variant="outline" onClick={() => setLinkDialogOpen(true)}>
                  Adicionar Link
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamento.observacoes ? (
            <p className="text-sm">{agendamento.observacoes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma observação do aluno</p>
          )}

          {agendamento.motivo_cancelamento && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">Motivo do cancelamento:</p>
              <p className="text-sm mt-1">{agendamento.motivo_cancelamento}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {agendamento.status === "pendente" && (
        <div className="md:col-span-2 flex gap-3 justify-end">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setRejectDialogOpen(true)}
          >
            <X className="mr-2 h-4 w-4" />
            Rejeitar
          </Button>
          <Button onClick={() => setConfirmDialogOpen(true)}>
            <Check className="mr-2 h-4 w-4" />
            Confirmar
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              Confirme o agendamento e opcionalmente adicione um link de reunião.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-link">Link da Reunião (opcional)</Label>
              <Input
                id="confirm-link"
                placeholder="https://meet.google.com/..."
                value={linkReuniao}
                onChange={(e) => setLinkReuniao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isConfirming}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Agendamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O aluno será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-motivo">Motivo da Rejeição</Label>
              <Textarea
                id="reject-motivo"
                placeholder="Ex: Horário indisponível..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isRejecting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !motivoRejeicao.trim()}>
              {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Link da Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-link">Link da Reunião</Label>
              <Input
                id="update-link"
                placeholder="https://meet.google.com/..."
                value={linkReuniao}
                onChange={(e) => setLinkReuniao(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLink} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
