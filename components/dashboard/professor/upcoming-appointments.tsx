'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { UpcomingAppointment } from '@/types/dashboard-professor'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getStatusBadge(status: UpcomingAppointment['status']) {
  switch (status) {
    case 'confirmado':
      return (
        <Badge variant="default" className="bg-emerald-500 text-[10px]">
          Confirmado
        </Badge>
      )
    case 'pendente':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px]">
          Pendente
        </Badge>
      )
    default:
      return null
  }
}

function formatAppointmentDate(dateString: string): string {
  const date = parseISO(dateString)

  if (isToday(date)) {
    return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`
  }

  if (isTomorrow(date)) {
    return `AmanhÃ£, ${format(date, 'HH:mm', { locale: ptBR })}`
  }

  return format(date, "dd/MM 'Ã s' HH:mm", { locale: ptBR })
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Próximos Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum agendamento pendente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Seus próximos atendimentos aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const appointmentDate = parseISO(appointment.dataHora)
                const isAppointmentToday = isToday(appointmentDate)

                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      isAppointmentToday
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card hover:bg-muted/50'
                    )}
                  >
                    {/* Avatar */}
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarImage
                        src={appointment.alunoAvatar || undefined}
                        alt={appointment.alunoNome}
                      />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(appointment.alunoNome)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {appointment.alunoNome}
                        </p>
                        {getStatusBadge(appointment.status)}
                      </div>

                      {appointment.titulo && (
                        <p className="text-xs text-muted-foreground truncate">
                          {appointment.titulo}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            'font-medium',
                            isAppointmentToday && 'text-primary'
                          )}
                        >
                          {formatAppointmentDate(appointment.dataHora)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.duracao} min
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
