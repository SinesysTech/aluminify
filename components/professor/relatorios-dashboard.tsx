"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  FileText,
  Download,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  gerarRelatorio,
  getRelatorios,
  getRelatorioById,
  type Relatorio,
  type RelatorioTipo,
} from "@/app/actions/agendamentos"
import { cn } from "@/lib/utils"

interface RelatoriosDashboardProps {
  empresaId: string
}

export function RelatoriosDashboard({ empresaId }: RelatoriosDashboardProps) {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    data_fim: new Date(),
    tipo: 'mensal' as RelatorioTipo,
  })

  const loadRelatorios = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getRelatorios(empresaId, 10)
      setRelatorios(data)
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Erro ao carregar relatórios")
    } finally {
      setIsLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    loadRelatorios()
  }, [loadRelatorios])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const relatorio = await gerarRelatorio(
        empresaId,
        formData.data_inicio,
        formData.data_fim,
        formData.tipo
      )
      toast.success("Relatório gerado com sucesso!")
      setSelectedRelatorio(relatorio)
      loadRelatorios()
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Erro ao gerar relatório")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewRelatorio = async (id: string) => {
    try {
      const relatorio = await getRelatorioById(id)
      if (relatorio) {
        setSelectedRelatorio(relatorio)
      }
    } catch (error) {
      console.error("Error loading report:", error)
      toast.error("Erro ao carregar relatório")
    }
  }

  const dados = selectedRelatorio?.dados_json

  return (
    <div className="space-y-6">
      {/* Generate Report Card */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Novo Relatório</CardTitle>
          <CardDescription>
            Gere relatórios de agendamentos para análise e planejamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    selected={formData.data_inicio}
                    onSelect={(date) =>
                      setFormData({ ...formData, data_inicio: date || new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                    selected={formData.data_fim}
                    onSelect={(date) =>
                      setFormData({ ...formData, data_fim: date || new Date() })
                    }
                    disabled={(date) => date < formData.data_inicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Tipo de Relatório</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo: value as RelatorioTipo })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="customizado">Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
          <CardDescription>Últimos relatórios gerados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : relatorios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum relatório gerado ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Taxa de Ocupação</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.map((relatorio) => (
                  <TableRow key={relatorio.id}>
                    <TableCell>
                      {format(new Date(relatorio.periodo_inicio), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}{" "}
                      -{" "}
                      {format(new Date(relatorio.periodo_fim), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {relatorio.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{relatorio.dados_json.total_agendamentos}</TableCell>
                    <TableCell>
                      {(relatorio.dados_json.taxa_ocupacao * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {format(new Date(relatorio.gerado_em), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRelatorio(relatorio.id)}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Details */}
      {selectedRelatorio && dados && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detalhes do Relatório</CardTitle>
                <CardDescription>
                  {format(new Date(selectedRelatorio.periodo_inicio), "PPP", {
                    locale: ptBR,
                  })}{" "}
                  -{" "}
                  {format(new Date(selectedRelatorio.periodo_fim), "PPP", {
                    locale: ptBR,
                  })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total de Agendamentos"
                value={dados.total_agendamentos}
                icon={CalendarIcon}
              />
              <MetricCard
                title="Taxa de Ocupação"
                value={`${(dados.taxa_ocupacao * 100).toFixed(1)}%`}
                icon={TrendingUp}
              />
              <MetricCard
                title="Taxa de Não Comparecimento"
                value={`${(dados.taxa_nao_comparecimento * 100).toFixed(1)}%`}
                icon={XCircle}
              />
              <MetricCard
                title="Por Status"
                value={`${dados.por_status.confirmado} confirmados`}
                icon={CheckCircle}
              />
            </div>

            {/* Status Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Distribuição por Status</h3>
              <div className="space-y-2">
                <StatusBar
                  label="Confirmados"
                  value={dados.por_status.confirmado}
                  total={dados.total_agendamentos}
                  color="bg-blue-500"
                />
                <StatusBar
                  label="Pendentes"
                  value={dados.por_status.pendente}
                  total={dados.total_agendamentos}
                  color="bg-yellow-500"
                />
                <StatusBar
                  label="Concluídos"
                  value={dados.por_status.concluido}
                  total={dados.total_agendamentos}
                  color="bg-green-500"
                />
                <StatusBar
                  label="Cancelados"
                  value={dados.por_status.cancelado}
                  total={dados.total_agendamentos}
                  color="bg-red-500"
                />
              </div>
            </div>

            {/* Professors Performance */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Desempenho por Professor</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Taxa de Comparecimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.por_professor.map((prof) => (
                    <TableRow key={prof.professor_id}>
                      <TableCell className="font-medium">{prof.nome}</TableCell>
                      <TableCell>{prof.total}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={prof.taxa_comparecimento * 100}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            {(prof.taxa_comparecimento * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Peak Hours */}
            {dados.horarios_pico.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Horários de Pico</h3>
                <div className="flex flex-wrap gap-2">
                  {dados.horarios_pico.map((horario, index) => (
                    <Badge key={index} variant="secondary">
                      {horario}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ElementType
}

function MetricCard({ title, value, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatusBarProps {
  label: string
  value: number
  total: number
  color?: string
}

 
function StatusBar({ label, value, total, color: _color }: StatusBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {value} ({(percentage).toFixed(1)}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

