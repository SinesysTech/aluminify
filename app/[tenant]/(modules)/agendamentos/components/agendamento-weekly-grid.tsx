"use client"

import { useState, useMemo } from "react"
import { startOfWeek, addDays, format, isSameDay, parseISO, getHours, addWeeks, subWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgendamentoComDetalhes } from "@/app/[tenant]/(modules)/agendamentos/types"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/shared/components/ui/hover-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AgendamentoWeeklyGridProps {
    agendamentos: AgendamentoComDetalhes[]
    currentDate?: Date
}

export function AgendamentoWeeklyGrid({ agendamentos, currentDate = new Date() }: AgendamentoWeeklyGridProps) {
    const [viewDate, setViewDate] = useState(currentDate)

    const handleNextWeek = () => setViewDate(prev => addWeeks(prev, 1))
    const handlePrevWeek = () => setViewDate(prev => subWeeks(prev, 1))
    const handleToday = () => setViewDate(new Date())

    // 1. Calculate week days
    const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // 2. Define time slots (07:00 to 22:00)
    const timeSlots = Array.from({ length: 16 }).map((_, i) => i + 7) // 7, 8, ... 22

    // 3. Group appointments by day and hour
    const appointmentsMap = useMemo(() => {
        const map = new Map<string, AgendamentoComDetalhes[]>()

        agendamentos.forEach(apt => {
            if (apt.status === 'cancelado') return

            const start = typeof apt.data_inicio === 'string' ? parseISO(apt.data_inicio) : apt.data_inicio
            const dayKey = format(start, 'yyyy-MM-dd')
            const hourKey = getHours(start)
            const key = `${dayKey}-${hourKey}`

            if (!map.has(key)) {
                map.set(key, [])
            }
            map.get(key)!.push(apt)
        })

        return map
    }, [agendamentos])

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle>Visão Semanal</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        Hoje
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-200">
                    {/* Header Row: Days */}
                    <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b">
                        <div className="p-2 text-xs font-medium text-muted-foreground border-r bg-muted/30 flex items-center justify-center">
                            Horário
                        </div>
                        {weekDays.map(day => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "p-2 text-center text-sm font-medium border-r last:border-r-0",
                                    isSameDay(day, new Date()) && "bg-primary/5 text-primary"
                                )}
                            >
                                <div className="capitalize">{format(day, 'EEE dd/MM', { locale: ptBR })}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    <div className="divide-y">
                        {timeSlots.map(hour => (
                            <div key={hour} className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] min-h-20">
                                {/* Time Label */}
                                <div className="p-2 text-xs text-muted-foreground border-r bg-muted/10 flex items-start justify-center pt-3">
                                    {hour}:00
                                </div>

                                {/* Days Cells */}
                                {weekDays.map(day => {
                                    const dayKey = format(day, 'yyyy-MM-dd')
                                    const key = `${dayKey}-${hour}`
                                    const cellAppointments = appointmentsMap.get(key) || []

                                    return (
                                        <div key={key} className="p-1 border-r last:border-r-0 relative group">
                                            <div className="flex flex-col gap-1 h-full">
                                                {cellAppointments.map(apt => (
                                                    <AppointmentCard key={apt.id} apt={apt} />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function AppointmentCard({ apt }: { apt: AgendamentoComDetalhes }) {
    const alunoName = apt.aluno?.nome || "Aluno"
    const profName = apt.professor?.nome || "Professor"

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div className={cn(
                    "text-[10px] p-1.5 rounded border shadow-sm cursor-pointer hover:opacity-90 transition-colors duration-200 motion-reduce:transition-none",
                    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
                    apt.status === 'confirmado' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900"
                )}>
                    <div className="font-semibold truncate">{alunoName}</div>
                    <div className="text-muted-foreground/80 truncate text-[9px]">com {profName}</div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 z-50">
                <div className="space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold">{format(typeof apt.data_inicio === 'string' ? parseISO(apt.data_inicio) : apt.data_inicio, "HH:mm")} - {format(typeof apt.data_fim === 'string' ? parseISO(apt.data_fim) : apt.data_fim, "HH:mm")}</h4>
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border",
                            apt.status === 'confirmado' ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                        )}>
                            {apt.status}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Aluno</div>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={apt.aluno?.avatar_url || undefined} />
                                <AvatarFallback>{apt.aluno?.nome?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{apt.aluno?.nome}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Professor</div>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={apt.professor?.avatar_url || undefined} />
                                <AvatarFallback>{apt.professor?.nome?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{apt.professor?.nome}</span>
                        </div>
                    </div>

                    {apt.observacoes && (
                        <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                            {apt.observacoes}
                        </div>
                    )}
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}
