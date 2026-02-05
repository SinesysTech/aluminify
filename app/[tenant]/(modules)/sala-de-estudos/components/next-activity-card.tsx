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
import { formatTipoAtividade } from '@/shared/library/utils'

interface NextActivityCardProps {
  activity: AtividadeComProgresso | null
  onViewAll?: () => void
  className?: string
}

function ActivityIcon({ tipo, className }: { tipo: TipoAtividade; className?: string }) {
  switch (tipo) {
    case 'Nivel_1':
    case 'Nivel_2':
    case 'Nivel_3':
    case 'Nivel_4':
      return <Video className={className} />
    case 'Lista_Mista':
    case 'Simulado_Diagnostico':
    case 'Simulado_Cumulativo':
    case 'Simulado_Global':
      return <FileText className={className} />
    case 'Conceituario':
    case 'Revisao':
      return <BookOpen className={className} />
    case 'Flashcards':
      return <HelpCircle className={className} />
    default:
      return <HelpCircle className={className} />
  }
}

export function NextActivityCard({ activity, onViewAll, className }: NextActivityCardProps) {
  const params = useParams()
  const tenant = params?.tenant as string

  if (!activity) {
    return (
      <Card className={cn('border-dashed rounded-2xl dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5', className)}>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg">Parabéns!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Você concluiu todas as atividades disponíveis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const focoHref = `/${tenant}/foco?cursoId=${activity.cursoId}&atividadeId=${activity.id}&disciplinaId=${activity.disciplinaId}&frenteId=${activity.frenteId}&moduloId=${activity.moduloId}`

  return (
    <Card className={cn(
      'overflow-hidden rounded-2xl pt-0',
      'bg-linear-to-br from-emerald-500/5 via-transparent to-transparent',
      'border-emerald-500/20 hover:border-emerald-500/40 transition-colors',
      'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5',
      className
    )}>
      <div className="h-0.5 bg-linear-to-r from-emerald-400 to-teal-500" />
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon + Content */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-linear-to-br from-emerald-500 to-teal-500">
              <ActivityIcon tipo={activity.tipo} className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Próxima atividade
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  {formatTipoAtividade(activity.tipo)}
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
                'bg-linear-to-r from-emerald-500 to-teal-500',
                'hover:from-emerald-600 hover:to-teal-600',
                'hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02]',
                'transition-all duration-200 text-white'
              )}
            >
              <Link href={focoHref}>
                <Timer className="h-5 w-5" />
                <span>Começar Agora</span>
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
