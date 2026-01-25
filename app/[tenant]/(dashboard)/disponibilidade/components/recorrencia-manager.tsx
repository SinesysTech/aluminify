
"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  getRecorrencias,
  createRecorrencia,
  updateRecorrencia,
  deleteRecorrencia,
  type Recorrencia,
} from "@/app/[tenant]/(dashboard)/agendamentos/lib/actions"
import { Loader2, Plus, Pencil, Trash, Calendar, Clock, CalendarDays, List } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/app/shared/core/utils"

const DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

// Time slots for the calendar preview (8am to 8pm)
const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const SLOT_DURATIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "60 minutos" },
]

const TIPO_SERVICO_OPTIONS = [
  { value: "plantao", label: "Plantao de Duvidas" },
  { value: "mentoria", label: "Mentoria" },
]

interface RecorrenciaManagerProps {
  professorId: string
  empresaId: string
}

type RecorrenciaFormData = {
  tipo_servico: "plantao" | "mentoria"
  data_inicio: string
  data_fim: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  duracao_slot_minutos: number
  ativo: boolean
}

const defaultFormData: RecorrenciaFormData = {
  tipo_servico: "mentoria",
  data_inicio: format(new Date(), "yyyy-MM-dd"),
  data_fim: "",
  dia_semana: 1,
  hora_inicio: "09:00",
  hora_fim: "17:00",
  duracao_slot_minutos: 30,
  ativo: true,
}

export function RecorrenciaManager({ professorId, empresaId }: RecorrenciaManagerProps) {
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RecorrenciaFormData>(defaultFormData)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showCalendarPreview, setShowCalendarPreview] = useState(false)

  const fetchRecorrencias = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getRecorrencias(professorId)
      setRecorrencias(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao carregar disponibilidade",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [professorId])

  useEffect(() => {
    fetchRecorrencias()
  }, [fetchRecorrencias])

  const handleOpenDialog = (recorrencia?: Recorrencia) => {
    if (recorrencia) {
      setEditingId(recorrencia.id || null)
      setFormData({
        tipo_servico: recorrencia.tipo_servico,
        data_inicio: recorrencia.data_inicio,
        data_fim: recorrencia.data_fim || "",
        dia_semana: recorrencia.dia_semana,
        hora_inicio: recorrencia.hora_inicio,
        hora_fim: recorrencia.hora_fim,
        duracao_slot_minutos: recorrencia.duracao_slot_minutos,
        ativo: recorrencia.ativo,
      })
    } else {
      setEditingId(null)
      setFormData(defaultFormData)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.data_inicio || !formData.hora_inicio || !formData.hora_fim) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatorios",
        variant: "destructive",
      })
      return
    }

    if (formData.hora_fim <= formData.hora_inicio) {
      toast({
        title: "Erro",
        description: "O horario de fim deve ser maior que o de inicio",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateRecorrencia(editingId, {
          tipo_servico: formData.tipo_servico,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim || null,
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          duracao_slot_minutos: formData.duracao_slot_minutos,
          ativo: formData.ativo,
        })
        toast({
          title: "Sucesso",
          description: "Disponibilidade atualizada!",
        })
      } else {
        await createRecorrencia({
          professor_id: professorId,
          empresa_id: empresaId,
          tipo_servico: formData.tipo_servico,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim || null,
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          duracao_slot_minutos: formData.duracao_slot_minutos,
          ativo: formData.ativo,
        })
        toast({
          title: "Sucesso",
          description: "Disponibilidade criada!",
        })
      }
      setDialogOpen(false)
      fetchRecorrencias()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao salvar disponibilidade",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecorrencia(id)
      toast({
        title: "Sucesso",
        description: "Disponibilidade removida!",
      })
      setDeleteConfirmId(null)
      fetchRecorrencias()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao remover disponibilidade",
        variant: "destructive",
      })
    }
  }

  const handleToggleAtivo = async (recorrencia: Recorrencia) => {
    try {
      await updateRecorrencia(recorrencia.id!, { ativo: !recorrencia.ativo })
      toast({
        title: "Sucesso",
        description: recorrencia.ativo ? "Disponibilidade desativada" : "Disponibilidade ativada",
      })
      fetchRecorrencias()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      })
    }
  }

  const formatDateRange = (inicio: string, fim: string | null) => {
    const dataInicio = new Date(inicio + "T12:00:00")
    if (!fim) {
      return `A partir de ${format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} `
    }
    const dataFim = new Date(fim + "T12:00:00")
    return `${format(dataInicio, "dd/MM/yyyy")} - ${format(dataFim, "dd/MM/yyyy")} `
  }

  const calculateSlots = (inicio: string, fim: string, duracao: number) => {
    const [hI, mI] = inicio.split(":").map(Number)
    const [hF, mF] = fim.split(":").map(Number)
    const totalMinutos = (hF * 60 + mF) - (hI * 60 + mI)
    return Math.floor(totalMinutos / duracao)
  }

  // Check if an hour is covered by active recorrencias for a specific day
  const getRecorrenciasForSlot = (dayIndex: number, hour: number) => {
    return recorrencias.filter((rec) => {
      if (!rec.ativo || rec.dia_semana !== dayIndex) return false
      const [hInicio] = rec.hora_inicio.split(":").map(Number)
      const [hFim] = rec.hora_fim.split(":").map(Number)
      return hour >= hInicio && hour < hFim
    })
  }

  // Get the color for a time slot based on recorrencias
  const getSlotStyle = (dayIndex: number, hour: number) => {
    const recs = getRecorrenciasForSlot(dayIndex, hour)
    if (recs.length === 0) return { bg: "bg-muted/30", text: "" }

    const hasMentoria = recs.some((r) => r.tipo_servico === "mentoria")
    const hasPlantao = recs.some((r) => r.tipo_servico === "plantao")

    if (hasMentoria && hasPlantao) {
      return { bg: "bg-gradient-to-r from-primary/40 to-secondary/40", text: "M+P" }
    }
    if (hasMentoria) {
      return { bg: "bg-primary/40", text: "" }
    }
    return { bg: "bg-secondary/40", text: "" }
  }

  if (loading) {
    return <TableSkeleton rows={3} columns={6} />
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Disponibilidade" : "Nova Disponibilidade"}
            </DialogTitle>
            <DialogDescription>
              Configure o horario de atendimento para um dia da semana
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tipo de Servico */}
            <div className="grid gap-2">
              <Label htmlFor="tipo_servico">Tipo de Servico</Label>
              <Select
                value={formData.tipo_servico}
                onValueChange={(value: "plantao" | "mentoria") =>
                  setFormData({ ...formData, tipo_servico: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_SERVICO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dia da Semana */}
            <div className="grid gap-2">
              <Label htmlFor="dia_semana">Dia da Semana</Label>
              <Select
                value={String(formData.dia_semana)}
                onValueChange={(value) =>
                  setFormData({ ...formData, dia_semana: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hora_inicio">Horario Inicio</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, hora_inicio: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hora_fim">Horario Fim</Label>
                <Input
                  id="hora_fim"
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) =>
                    setFormData({ ...formData, hora_fim: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Duracao do Slot */}
            <div className="grid gap-2">
              <Label htmlFor="duracao">Duracao de cada atendimento</Label>
              <Select
                value={String(formData.duracao_slot_minutos)}
                onValueChange={(value) =>
                  setFormData({ ...formData, duracao_slot_minutos: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_DURATIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.hora_inicio && formData.hora_fim && (
                <p className="text-xs text-muted-foreground">
                  {calculateSlots(formData.hora_inicio, formData.hora_fim, formData.duracao_slot_minutos)} slots disponiveis
                </p>
              )}
            </div>

            {/* Periodo de Vigencia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_inicio">Data Inicio *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_fim">Data Fim (opcional)</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) =>
                    setFormData({ ...formData, data_fim: e.target.value })
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe a data fim vazia para disponibilidade indefinida
            </p>

            {/* Ativo */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked === true })
                }
              />
              <Label htmlFor="ativo">Disponibilidade ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {recorrencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/50">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma disponibilidade configurada
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Configure seus horarios de atendimento para que alunos possam agendar mentorias.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Configurar Horarios
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendarPreview(!showCalendarPreview)}
              >
                {showCalendarPreview ? (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    Lista
                  </>
                ) : (
                  <>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Horario
              </Button>
            </div>

            {showCalendarPreview ? (
              // Calendar Preview
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/40" />
                    <span>Mentoria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-secondary/40" />
                    <span>Plantao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted/30" />
                    <span>Indisponivel</span>
                  </div>
                </div>

                {/* Weekly Calendar Grid */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-8 text-sm">
                    {/* Header Row */}
                    <div className="p-2 font-medium bg-muted/50 border-b border-r text-center">
                      Hora
                    </div>
                    {DAYS_SHORT.map((day, i) => (
                      <div
                        key={day}
                        className={cn(
                          "p-2 font-medium bg-muted/50 border-b text-center",
                          i < 6 && "border-r"
                        )}
                      >
                        {day}
                      </div>
                    ))}

                    {/* Time Slots */}
                    {CALENDAR_HOURS.map((hour, hourIdx) => (
                      <>
                        <div
                          key={`hour - ${hour} `}
                          className={cn(
                            "p-2 text-sm text-muted-foreground border-r text-center",
                            hourIdx < CALENDAR_HOURS.length - 1 && "border-b"
                          )}
                        >
                          {hour.toString().padStart(2, "0")}:00
                        </div>
                        {DAYS_SHORT.map((_, dayIdx) => {
                          const slotStyle = getSlotStyle(dayIdx, hour)
                          return (
                            <div
                              key={`slot - ${hour} -${dayIdx} `}
                              className={cn(
                                "p-2 text-xs text-center transition-colors",
                                slotStyle.bg,
                                hourIdx < CALENDAR_HOURS.length - 1 && "border-b",
                                dayIdx < 6 && "border-r"
                              )}
                            >
                              {slotStyle.text}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="text-sm text-muted-foreground">
                  {recorrencias.filter(r => r.ativo).length} horario(s) ativo(s) configurado(s)
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Duracao</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recorrencias.map((rec) => (
                    <TableRow key={rec.id} className={!rec.ativo ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {DAYS[rec.dia_semana]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {rec.hora_inicio} - {rec.hora_fim}
                        </div>
                      </TableCell>
                      <TableCell>{rec.duracao_slot_minutos} min</TableCell>
                      <TableCell>
                        <Badge variant={rec.tipo_servico === "mentoria" ? "default" : "secondary"}>
                          {rec.tipo_servico === "mentoria" ? "Mentoria" : "Plantao"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateRange(rec.data_inicio, rec.data_fim ?? null)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rec.ativo ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleToggleAtivo(rec)}
                        >
                          {rec.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(rec)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Dialog
                            open={deleteConfirmId === rec.id}
                            onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(rec.id!)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmar exclusao</DialogTitle>
                                <DialogDescription>
                                  Tem certeza que deseja excluir esta disponibilidade?
                                  Esta acao nao pode ser desfeita.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(rec.id!)}
                                >
                                  Excluir
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>
    </>
  )
}
