"use client"

import { useState } from "react"
import { AgendamentoComDetalhes, cancelAgendamentoWithReason } from "@/app/actions/agendamentos"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, isFuture, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Video,
  X,
  CalendarX,
  Loader2,
  ExternalLink,
  Download,
  MessageSquare
} from "lucide-react"

interface MeusAgendamentosListProps {
  agendamentos: AgendamentoComDetalhes[]
}

export function MeusAgendamentosList({ agendamentos }: MeusAgendamentosListProps) {
  const [activeTab, setActiveTab] = useState("proximos")

  const proximos = agendamentos.filter(a =>
    (a.status === "pendente" || a.status === "confirmado") &&
    isFuture(new Date(a.data_inicio))
  )

  const passados = agendamentos.filter(a =>
    a.status === "concluido" ||
    a.status === "cancelado" ||
    isPast(new Date(a.data_inicio))
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="proximos">
          Proximos ({proximos.length})
        </TabsTrigger>
        <TabsTrigger value="historico">
          Historico ({passados.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="proximos" className="mt-4">
        {proximos.length === 0 ? (
          <EmptyState message="Voce nao tem agendamentos proximos" />
        ) : (
          <div className="space-y-3">
            {proximos.map((agendamento) => (
              <AgendamentoAlunoCard
                key={agendamento.id}
                agendamento={agendamento}
                showActions={true}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="historico" className="mt-4">
        {passados.length === 0 ? (
          <EmptyState message="Nenhum agendamento no historico" />
        ) : (
          <div className="space-y-3">
            {passados.map((agendamento) => (
              <AgendamentoAlunoCard
                key={agendamento.id}
                agendamento={agendamento}
                showActions={false}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarX className="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle>Sem agendamentos</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

interface AgendamentoAlunoCardProps {
  agendamento: AgendamentoComDetalhes
  showActions: boolean
}

function AgendamentoAlunoCard({ agendamento, showActions }: AgendamentoAlunoCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const dataInicio = new Date(agendamento.data_inicio)
  const dataFim = new Date(agendamento.data_fim)
  const professor = agendamento.professor

  const statusConfig = {
    pendente: { label: "Aguardando confirmacao", variant: "outline" as const, className: "border-amber-500 text-amber-600" },
    confirmado: { label: "Confirmado", variant: "default" as const, className: "bg-emerald-500" },
    cancelado: { label: "Cancelado", variant: "destructive" as const, className: "" },
    concluido: { label: "Concluido", variant: "secondary" as const, className: "" }
  }

  const status = statusConfig[agendamento.status]

  const handleCancel = async () => {
    if (!agendamento.id) return
    setIsCancelling(true)
    try {
      await cancelAgendamentoWithReason(agendamento.id, motivoCancelamento || undefined)
      toast.success("Agendamento cancelado")
      setCancelDialogOpen(false)
      setMotivoCancelamento("")
    } catch (error) {
      toast.error("Erro ao cancelar agendamento")
      console.error(error)
    } finally {
      setIsCancelling(false)
    }
  }

  const downloadIcal = () => {
    if (agendamento.id) {
      window.open(`/api/agendamentos/${agendamento.id}/ical`, "_blank")
    }
  }

  return (
    <>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setDetailsDialogOpen(true)}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Professor Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                Mentoria com {professor?.nome || "Professor"}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(dataInicio, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {/* Date/Time Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
                </span>
              </div>
            </div>

            {/* Status */}
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {agendamento.link_reuniao && agendamento.status === "confirmado" && (
                <Button size="sm" variant="outline" asChild>
                  <a href={agendamento.link_reuniao} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" />
                    Entrar
                  </a>
                </Button>
              )}

              {agendamento.status === "confirmado" && (
                <Button size="sm" variant="ghost" onClick={downloadIcal}>
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {showActions && (agendamento.status === "pendente" || agendamento.status === "confirmado") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Motivo cancelamento */}
          {agendamento.status === "cancelado" && agendamento.motivo_cancelamento && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span className="font-medium">Motivo:</span> {agendamento.motivo_cancelamento}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={status.variant} className={status.className}>
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Professor</span>
              <span className="font-medium">{professor?.nome}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">
                {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Horario</span>
              <span className="font-medium">
                {format(dataInicio, "HH:mm")} - {format(dataFim, "HH:mm")}
              </span>
            </div>

            {agendamento.link_reuniao && agendamento.status === "confirmado" && (
              <div className="space-y-2">
                <span className="text-muted-foreground text-sm">Link da reuniao</span>
                <Button className="w-full" asChild>
                  <a href={agendamento.link_reuniao} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" />
                    Entrar na Reuniao
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}

            {agendamento.observacoes && (
              <div className="space-y-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Suas observacoes
                </span>
                <p className="text-sm p-3 rounded-lg bg-muted">{agendamento.observacoes}</p>
              </div>
            )}

            {agendamento.status === "confirmado" && (
              <Button variant="outline" className="w-full" onClick={downloadIcal}>
                <Download className="mr-2 h-4 w-4" />
                Adicionar ao Calendario
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Imprevisto, preciso reagendar..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
