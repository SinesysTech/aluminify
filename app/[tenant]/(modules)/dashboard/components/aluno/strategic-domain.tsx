'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { Info, Brain, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { StrategicDomain, StrategicDomainRecommendation, ModuloImportancia } from '../../types'
import { cn } from '@/app/shared/library/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StrategicDomainProps {
  data: StrategicDomain
}

// Configuração visual das importâncias
const importanciaConfig: Record<ModuloImportancia, { color: string; bg: string; label: string }> = {
  Base: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Base' },
  Alta: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Alta' },
  Media: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Média' },
  Baixa: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Baixa' },
}

// Componente para exibir uma recomendação
function RecommendationCard({ rec }: { rec: StrategicDomainRecommendation }) {
  const config = importanciaConfig[rec.importancia]

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm line-clamp-2" title={rec.moduloNome}>
          {rec.moduloNome}
        </span>
        <Badge 
          variant="outline" 
          className={cn('shrink-0 text-[10px] px-1.5 py-0', config.color, config.bg, 'border-current/20')}
        >
          {config.label}
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        {rec.reason}
      </p>

      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
        {rec.flashcardsScore !== null && (
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>{rec.flashcardsScore}% Flashcards</span>
          </div>
        )}
        {rec.questionsScore !== null && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{rec.questionsScore}% Questões</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function StrategicDomain({ data }: StrategicDomainProps) {
  // Preparar dados para o gráfico de radar
  // Eixos: Flashcards e Questões para Base e Alta Recorrência
  const radarData = [
    {
      subject: 'Base (FC)',
      A: data.baseModules.flashcardsScore || 0,
      fullMark: 100,
    },
    {
      subject: 'Base (Q)',
      A: data.baseModules.questionsScore || 0,
      fullMark: 100,
    },
    {
      subject: 'Alta Rec. (Q)',
      A: data.highRecurrence.questionsScore || 0,
      fullMark: 100,
    },
    {
      subject: 'Alta Rec. (FC)',
      A: data.highRecurrence.flashcardsScore || 0,
      fullMark: 100,
    },
  ]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">
            Domínio Estratégico
          </CardTitle>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Analisa seu desempenho nos módulos mais importantes (Base e Alta Recorrência)
                  cruzando dados de Flashcards e Questões.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Gráfico Radar */}
        <div className="w-full md:w-1/2 h-[250px] md:h-auto relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
          
          {/* Legenda do Gráfico */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/30 border border-primary" />
              <span>Seu Domínio</span>
            </div>
          </div>
        </div>

        {/* Lista de Recomendações */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium">Foco Recomendado</h4>
          </div>
          
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-3">
              {data.recommendations.length > 0 ? (
                data.recommendations.map((rec) => (
                  <RecommendationCard key={rec.moduloId} rec={rec} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-green-500/50" />
                  <p className="text-sm">Parabéns!</p>
                  <p className="text-xs">
                    Você tem um bom domínio dos módulos estratégicos.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
