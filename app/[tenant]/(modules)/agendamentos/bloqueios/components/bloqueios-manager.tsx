"use client"

import { useCallback, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/shared/components/forms/input"
import { Label } from "@/app/shared/components/forms/label"
import { Textarea } from "@/app/shared/components/forms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/shared/components/forms/select"
import { Calendar } from "@/app/shared/components/forms/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/shared/components/overlay/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/shared/components/overlay/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/components/dataviz/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2, Edit, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/app/shared/core/client"
import { cn } from "@/lib/utils"
import type { Database } from "@/app/shared/core/database.types"

const TIPOS_BLOQUEIO = [
  { value: 'feriado', label: 'Feriado' },
  { value: 'recesso', label: 'Recesso' },
  { value: 'imprevisto', label: 'Imprevisto' },
  { value: 'outro', label: 'Outro' },
]

type _BloqueioRow = Database['public']['Tables']['agendamento_bloqueios']['Row']

interface Bloqueio {
  id: string
  professor_id: string | null
  tipo: 'feriado' | 'recesso' | 'imprevisto' | 'outro'
  data_inicio: string
  data_fim: string
  motivo: string | null
  criado_por: string
}

interface BloqueiosManagerProps {
  professorId: string
  empresaId: string
  isAdmin?: boolean
  currentUserId: string // ID do usuário logado (para criado_por)
}

export function BloqueiosManager({ professorId, empresaId, isAdmin = false, currentUserId }: BloqueiosManagerProps) {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBloqueio, setEditingBloqueio] = useState<Bloqueio | null>(null)
  const [formData, setFormData] = useState({
    professor_id: null as string | null,
    tipo: 'outro' as 'feriado' | 'recesso' | 'imprevisto' | 'outro',
    data_inicio: null as Date | null,
    data_fim: null as Date | null,
    hora_inicio: '00:00',
    hora_fim: '23:59',
    motivo: '',
  })
  const [afetados, setAfetados] = useState<number>(0)

  const loadBloqueios = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agendamento_bloqueios')
        .select('*')
        .eq('empresa_id', empresaId)
        .or(`professor_id.is.null,professor_id.eq.${professorId}`)
        .order('data_inicio', { ascending: false })

      if (error) throw error
      setBloqueios((data || []) as Bloqueio[])
    } catch (error) {
      console.error("Error loading bloqueios:", error)
      toast.error("Erro ao carregar bloqueios")
    } finally {
      setIsLoading(false)
    }
  }, [professorId, empresaId])

  useEffect(() => {
    loadBloqueios()
  }, [loadBloqueios])

  const checkAfetados = async (dataInicio: Date, dataFim: Date) => {
    try {
      const supabase = createClient()
      const query = supabase
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('professor_id', professorId)
        .in('status', ['pendente', 'confirmado'])
        .gte('data_inicio', dataInicio.toISOString())
        .lte('data_fim', dataFim.toISOString())

      const { count, error } = await query
      if (error) throw error
      setAfetados(count || 0)
    } catch (error) {
      console.error("Error checking affected appointments:", error)
    }
  }

  const handleOpenDialog = (bloqueio?: Bloqueio) => {
    if (bloqueio) {
      setEditingBloqueio(bloqueio)
      setFormData({
        professor_id: bloqueio.professor_id,
        tipo: bloqueio.tipo,
        data_inicio: new Date(bloqueio.data_inicio),
        data_fim: new Date(bloqueio.data_fim),
        hora_inicio: new Date(bloqueio.data_inicio).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        hora_fim: new Date(bloqueio.data_fim).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        motivo: bloqueio.motivo || '',
      })
    } else {
      setEditingBloqueio(null)
      setFormData({
        professor_id: isAdmin ? null : professorId,
        tipo: 'outro',
        data_inicio: null,
        data_fim: null,
        hora_inicio: '00:00',
        hora_fim: '23:59',
        motivo: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleDateChange = async (field: 'data_inicio' | 'data_fim', date: Date | null) => {
    setFormData({ ...formData, [field]: date })
    if (field === 'data_inicio' && date && formData.data_fim) {
      await checkAfetados(date, formData.data_fim)
    } else if (field === 'data_fim' && date && formData.data_inicio) {
      await checkAfetados(formData.data_inicio, date)
    }
  }

  const handleSubmit = async () => {
    if (!formData.data_inicio || !formData.data_fim) {
      toast.error("Selecione as datas de início e fim")
      return
    }

    if (formData.data_fim < formData.data_inicio) {
      toast.error("Data de fim deve ser posterior à data de início")
      return
    }

    try {
      const supabase = createClient()

      // Combine date and time
      const dataInicio = new Date(formData.data_inicio)
      const [horaInicio, minutoInicio] = formData.hora_inicio.split(':').map(Number)
      dataInicio.setHours(horaInicio, minutoInicio, 0, 0)

      const dataFim = new Date(formData.data_fim)
      const [horaFim, minutoFim] = formData.hora_fim.split(':').map(Number)
      dataFim.setHours(horaFim, minutoFim, 0, 0)

      const payload: Database['public']['Tables']['agendamento_bloqueios']['Insert'] = {
        professor_id: formData.professor_id,
        empresa_id: empresaId,
        tipo: formData.tipo,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        motivo: formData.motivo || null,
        criado_por: currentUserId, // Sempre usa o ID do usuário logado
      }

      if (editingBloqueio) {
        const { error } = await supabase
          .from('agendamento_bloqueios')
          .update(payload)
          .eq('id', editingBloqueio.id)

        if (error) throw error
        toast.success("Bloqueio atualizado com sucesso!")
      } else {
        const { error } = await supabase
          .from('agendamento_bloqueios')
          .insert(payload)

        if (error) throw error
        toast.success("Bloqueio criado com sucesso!")
      }

      setIsDialogOpen(false)
      loadBloqueios()
    } catch (error) {
      console.error("Error saving bloqueio:", error)
      toast.error("Erro ao salvar bloqueio")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este bloqueio?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('agendamento_bloqueios')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success("Bloqueio excluído com sucesso!")
      loadBloqueios()
    } catch (error) {
      console.error("Error deleting bloqueio:", error)
      toast.error("Erro ao excluir bloqueio")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bloqueios de Agenda</CardTitle>
            <CardDescription>
              Gerencie bloqueios de datas e horários (feriados, recessos, etc.)
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Bloqueio
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : bloqueios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum bloqueio cadastrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloqueios.map((bloqueio) => (
                <TableRow key={bloqueio.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {TIPOS_BLOQUEIO.find((t) => t.value === bloqueio.tipo)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(bloqueio.data_inicio), "PPP", { locale: ptBR })}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(bloqueio.data_inicio), "HH:mm")} -{" "}
                        {format(new Date(bloqueio.data_fim), "HH:mm")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bloqueio.professor_id ? (
                      <Badge variant="secondary">Pessoal</Badge>
                    ) : (
                      <Badge variant="default">Empresa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {bloqueio.motivo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(bloqueio)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bloqueio.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialog de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent fullScreenMobile className="md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBloqueio ? "Editar Bloqueio" : "Novo Bloqueio"}
              </DialogTitle>
              <DialogDescription>
                Configure um bloqueio de agenda. Agendamentos existentes no período serão afetados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Bloqueio</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value as typeof formData.tipo })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_BLOQUEIO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div>
                  <Label>Escopo</Label>
                  <Select
                    value={formData.professor_id ? "pessoal" : "empresa"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        professor_id: value === "pessoal" ? professorId : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">Toda a Empresa</SelectItem>
                      <SelectItem value="pessoal">Apenas Eu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_inicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_inicio ? (
                          format(formData.data_inicio, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_inicio || undefined}
                        onSelect={(date) => handleDateChange('data_inicio', date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.data_fim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_fim ? (
                          format(formData.data_fim, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_fim || undefined}
                        onSelect={(date) => handleDateChange('data_fim', date || null)}
                        disabled={(date) =>
                          formData.data_inicio ? date < formData.data_inicio : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              {afetados > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-800 dark:text-amber-200">
                    {afetados} agendamento(s) será(ão) afetado(s) por este bloqueio
                  </span>
                </div>
              )}

              <div>
                <Label>Motivo (Opcional)</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Descreva o motivo do bloqueio..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingBloqueio ? "Atualizar" : "Criar"} Bloqueio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

