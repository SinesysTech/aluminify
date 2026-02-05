'use client'

import { Timer, ArrowRight, BookOpen, FileText, Video, HelpCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AtividadeComProgresso } from '../types'
import { TipoAtividade } from '@/app/shared/types/enums'
import { formatTipoAtividade } from '@/shared/library/utils'

type Prioridade = 'urgente' | 'normal' | 'fallback'

interface NextActivityCardProps {
  activity: (AtividadeComProgresso & { _prioridade: Prioridade }) | null
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
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-amber-600" />
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
  const prioridade = activity._prioridade

  return (
    <Card className={cn(
      'overflow-hidden rounded-2xl pt-0',
      'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5',
      prioridade === 'urgente' && [
        'bg-linear-to-br from-rose-500/5 via-transparent to-transparent',
        'border-rose-500/20 hover:border-rose-500/40 transition-colors',
      ],
      prioridade === 'normal' && [
        'bg-linear-to-br from-amber-500/5 via-transparent to-transparent',
        'border-amber-500/20 hover:border-amber-500/40 transition-colors',
      ],
      prioridade === 'fallback' && [
        'bg-linear-to-br from-primary/5 via-transparent to-transparent',
        'border-primary/20 hover:border-primary/40 transition-colors',
      ],
      className
    )}>
      <div className={cn(
        'h-0.5 bg-linear-to-r',
        prioridade === 'urgente' && 'from-rose-400 to-orange-500',
        prioridade === 'normal' && 'from-amber-400 to-orange-500',
        prioridade === 'fallback' && 'from-primary/60 to-primary/30',
      )} />
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon + Content */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={cn(
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-linear-to-br',
              prioridade === 'urgente' && 'from-rose-500 to-orange-500',
              prioridade === 'normal' && 'from-amber-500 to-orange-500',
              prioridade === 'fallback' && 'from-primary to-primary/80',
            )}>
              <ActivityIcon tipo={activity.tipo} className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Próxima atividade
                </span>
                <Badge variant="outline" className={cn(
                  'text-[10px]',
                  prioridade === 'urgente' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                  prioridade === 'normal' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  prioridade === 'fallback' && 'bg-primary/10 text-primary border-primary/20',
                )}>
                  {formatTipoAtividade(activity.tipo)}
                </Badge>
                {activity.obrigatorio && (
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    prioridade === 'urgente'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  )}>
                    Obrigatória
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-lg truncate" title={activity.titulo}>
                {activity.titulo}
              </h3>

              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground truncate">
                  {activity.disciplinaNome} &bull; {activity.frenteNome}
                </p>
                {prioridade === 'urgente' && (
                  <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Aulas concluídas
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              size="lg"
              className={cn(
                'gap-2 font-semibold shadow-lg px-6',
                'hover:shadow-xl hover:scale-[1.02]',
                'transition-all duration-200 text-white',
                prioridade === 'urgente' && [
                  'bg-linear-to-r from-rose-500 to-orange-500',
                  'hover:from-rose-600 hover:to-orange-600',
                  'hover:shadow-rose-500/20',
                ],
                prioridade === 'normal' && [
                  'bg-linear-to-r from-amber-500 to-orange-500',
                  'hover:from-amber-600 hover:to-orange-600',
                  'hover:shadow-amber-500/20',
                ],
                prioridade === 'fallback' && [
                  'bg-linear-to-r from-primary to-primary/80',
                  'hover:from-primary/90 hover:to-primary/70',
                  'hover:shadow-primary/20',
                ],
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
