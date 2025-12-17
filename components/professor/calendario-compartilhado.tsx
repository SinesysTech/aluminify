"use client"

import { useCallback, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import { getAgendamentosEmpresa, getProfessoresDisponibilidade } from "@/app/actions/agendamentos"
import { cn } from "@/lib/utils"

interface CalendarioCompartilhadoProps {
  empresaId: string
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  professor_id: string;
  aluno_id?: string;
  status: string;
  [key: string]: unknown;
}

interface Disponibilidade {
  professor_id: string;
  nome: string;
  foto: string | null;
  slots_disponiveis: string[];
}

export function CalendarioCompartilhado({ empresaId }: CalendarioCompartilhadoProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade[]>([])
  const [selectedProfessor, setSelectedProfessor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const start = view === 'week' 
        ? startOfWeek(currentDate, { locale: ptBR })
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      const end = view === 'week'
        ? endOfWeek(currentDate, { locale: ptBR })
        : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const [agendamentosData, disponibilidadeData] = await Promise.all([
        getAgendamentosEmpresa(empresaId, start, end),
        getProfessoresDisponibilidade(empresaId, currentDate),
      ])

      setAgendamentos(agendamentosData)
      setDisponibilidade(disponibilidadeData)
    } catch (error) {
      console.error("Error loading shared calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentDate, empresaId, view])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredAgendamentos = agendamentos.filter(a => {
    if (selectedProfessor !== 'all' && a.professor_id !== selectedProfessor) return false
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false
    return true
  })

  const professores = Array.from(
    new Set(agendamentos.map(a => ({ id: a.professor_id, nome: a.professor_nome })))
  )

  const days = view === 'week'
    ? eachDayOfInterval({
        start: startOfWeek(currentDate, { locale: ptBR }),
        end: endOfWeek(currentDate, { locale: ptBR }),
      })
    : eachDayOfInterval({
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      })

  const getAgendamentosForDay = (day: Date) => {
    return filteredAgendamentos.filter(a => {
      const agendamentoDate = new Date(a.data_inicio)
      return isSameDay(agendamentoDate, day)
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendário Compartilhado</CardTitle>
            <CardDescription>
              Visualize agendamentos de todos os professores da empresa
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mês
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os professores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os professores</SelectItem>
              {professores.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {view === 'week'
              ? `Semana de ${format(days[0], "d 'de' MMMM", { locale: ptBR })}`
              : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Week View */}
            {view === 'week' && (
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayAgendamentos = getAgendamentosForDay(day)
                  return (
                    <div key={index} className="border rounded-lg p-2 min-h-[200px]">
                      <div className="text-sm font-medium mb-2">
                        {format(day, "EEE d", { locale: ptBR })}
                      </div>
                      <div className="space-y-1">
                        {dayAgendamentos.map((agendamento) => (
                          <div
                            key={agendamento.id}
                            className={cn(
                              "p-2 rounded text-xs",
                              agendamento.status === 'confirmado' && "bg-blue-100 dark:bg-blue-900",
                              agendamento.status === 'pendente' && "bg-yellow-100 dark:bg-yellow-900",
                              agendamento.status === 'concluido' && "bg-green-100 dark:bg-green-900",
                              agendamento.status === 'cancelado' && "bg-red-100 dark:bg-red-900"
                            )}
                          >
                            <div className="font-medium truncate">
                              {agendamento.aluno_nome}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(agendamento.data_inicio), "HH:mm")}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {agendamento.professor_nome}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Month View */}
            {view === 'month' && (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const dayAgendamentos = getAgendamentosForDay(day)
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                    return (
                      <div
                        key={index}
                        className={cn(
                          "border rounded p-1 min-h-[80px]",
                          !isCurrentMonth && "opacity-50"
                        )}
                      >
                        <div className="text-xs font-medium mb-1">
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayAgendamentos.slice(0, 2).map((agendamento) => (
                            <div
                              key={agendamento.id}
                              className={cn(
                                "p-1 rounded text-[10px] truncate",
                                agendamento.status === 'confirmado' && "bg-blue-100 dark:bg-blue-900",
                                agendamento.status === 'pendente' && "bg-yellow-100 dark:bg-yellow-900"
                              )}
                            >
                              {format(new Date(agendamento.data_inicio), "HH:mm")} - {agendamento.aluno_nome}
                            </div>
                          ))}
                          {dayAgendamentos.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{dayAgendamentos.length - 2} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Availability Summary */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Disponibilidade Hoje
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {disponibilidade.map((prof) => (
                  <Card key={prof.professor_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={prof.foto} />
                          <AvatarFallback>{prof.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{prof.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {prof.slots_disponiveis.length} slots disponíveis
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

