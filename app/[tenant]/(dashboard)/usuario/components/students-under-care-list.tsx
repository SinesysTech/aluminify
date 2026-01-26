'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { StudentUnderCare } from '@/app/[tenant]/features/pessoas/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/app/shared/library/utils'

interface StudentsUnderCareListProps {
  students: StudentUnderCare[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-yellow-500'
  if (progress >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

function getAproveitamentoColor(aproveitamento: number): string {
  if (aproveitamento >= 80) return 'bg-emerald-100 text-emerald-800'
  if (aproveitamento >= 60) return 'bg-yellow-100 text-yellow-800'
  if (aproveitamento >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function StudentsUnderCareList({ students }: StudentsUnderCareListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Alunos sob Tutela
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {students.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">
              Nenhum aluno com agendamentos registrados
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarImage
                      src={student.avatarUrl || undefined}
                      alt={student.name}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.cursoNome}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'shrink-0 text-[10px]',
                          getAproveitamentoColor(student.aproveitamento)
                        )}
                      >
                        {student.aproveitamento}%
                      </Badge>
                    </div>

                    {/* Progresso */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{student.progresso}%</span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full transition-all duration-500',
                            getProgressColor(student.progresso)
                          )}
                          style={{ width: `${student.progresso}%` }}
                        />
                      </div>
                    </div>

                    {/* Ãšltima atividade */}
                    {student.ultimaAtividade && (
                      <p className="text-[10px] text-muted-foreground">
                        Ãšltima atividade:{' '}
                        {formatDistanceToNow(new Date(student.ultimaAtividade), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
