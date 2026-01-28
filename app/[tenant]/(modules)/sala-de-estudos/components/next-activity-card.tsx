'use client'

import { Timer, ArrowRight, BookOpen, FileText, Video, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AtividadeComProgresso } from '../types'
import { TipoAtividade } from '@/app/shared/types/enums'

interface NextActivityCardProps {
  activity: AtividadeComProgresso | null
  onViewAll?: () => void
  className?: string
}

function getActivityIcon(tipo: TipoAtividade) {
  switch (tipo) {
    case 'Videoaula':
      return Video
    case 'Lista de Exercicios':
    case 'Simulado':
      return FileText
    case 'Leitura':
      return BookOpen
    default:
      return HelpCircle
  }
}

function getActivityColor(tipo: TipoAtividade) {
  switch (tipo) {
    case 'Videoaula':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20'
    case 'Lista de Exercicios':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'Simulado':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'Leitura':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function NextActivityCard({ activity, onViewAll, className }: NextActivityCardProps) {
  const params = useParams()
  const tenant = params?.tenant as string

  if (!activity) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg">Parabens!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Voce concluiu todas as atividades disponiveis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const ActivityIcon = getActivityIcon(activity.tipo)
  const activityColorClass = getActivityColor(activity.tipo)

  const focoHref = `/${tenant}/foco?cursoId=${activity.cursoId}&atividadeId=${activity.id}&disciplinaId=${activity.disciplinaId}&frenteId=${activity.frenteId}&moduloId=${activity.moduloId}`

  return (
    <Card className={cn(
      'overflow-hidden',
      'bg-linear-to-br from-primary/5 via-transparent to-transparent',
      'border-primary/20 hover:border-primary/40 transition-colors',
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon + Content */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn(
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              activityColorClass
            )}>
              <ActivityIcon className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Proxima atividade
                </span>
                <Badge variant="outline" className={cn('text-[10px]', activityColorClass)}>
                  {activity.tipo}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg truncate" title={activity.titulo}>
                {activity.titulo}
              </h3>

              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {activity.disciplinaNome} &bull; {activity.frenteNome}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              size="lg"
              className={cn(
                'gap-2 font-semibold shadow-lg px-6',
                'bg-linear-to-r from-primary to-primary/80',
                'hover:from-primary/90 hover:to-primary/70',
                'hover:shadow-xl hover:scale-[1.02]',
                'transition-all duration-200'
              )}
            >
              <Link href={focoHref}>
                <Timer className="h-5 w-5" />
                <span>Comecar Agora</span>
              </Link>
            </Button>

            {onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <span>Ver todas</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
