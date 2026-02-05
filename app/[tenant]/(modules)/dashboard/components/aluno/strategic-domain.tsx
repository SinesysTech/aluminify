'use client'

import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { Info, Brain, Target, CheckCircle2 } from 'lucide-react'
import type { StrategicDomain, StrategicDomainRecommendation, ModuloImportancia } from '../../types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTheme } from 'next-themes'

interface StrategicDomainProps {
  data: StrategicDomain
}

// Configuração visual das importâncias - harmonizada com o tema violet/fuchsia do card
const importanciaConfig: Record<ModuloImportancia, { className: string; label: string }> = {
  Base: { className: 'bg-fuchsia-500 text-white', label: 'Base' },
  Alta: { className: 'bg-violet-500 text-white', label: 'Alta' },
  Media: { className: 'bg-violet-400/80 text-white', label: 'Média' },
  Baixa: { className: 'bg-violet-300/60 text-violet-800 dark:text-violet-100', label: 'Baixa' },
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
        <span className={cn("shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium", config.className)}>
          {config.label}
        </span>
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
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark' || theme === 'dark'

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

  // Cores adaptáveis ao tema - usando roxo #A78BFA
  const chartColors = useMemo(() => {
    const purpleColor = '#A78BFA' // Cor roxa especificada
    
    if (isDark) {
      // No modo escuro, usar cores mais claras para melhor visibilidade
      return {
        grid: 'rgba(255, 255, 255, 0.15)',
        text: 'rgba(255, 255, 255, 0.7)',
        primary: purpleColor,
      }
    }
    
    // Modo claro - usar cores escuras para melhor visibilidade
    return {
      grid: 'rgba(0, 0, 0, 0.2)',
      text: 'rgba(0, 0, 0, 0.8)',
      primary: purpleColor,
    }
  }, [isDark])

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 rounded-2xl pt-0 dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/5">
      <div className="h-0.5 bg-linear-to-r from-violet-400 to-fuchsia-500" />
      <CardContent className="p-4 md:p-5 flex-1 flex flex-col min-h-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="widget-title">Domínio Estratégico</h3>
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
            <p className="text-xs text-muted-foreground">Desempenho em módulos de Base e Alta Recorrência</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Gráfico Radar */}
          <div className="w-full md:w-1/2 h-62.5 relative">
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid 
                stroke={chartColors.grid}
                strokeOpacity={isDark ? 0.3 : 0.2}
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ 
                  fill: chartColors.text, 
                  fontSize: 10
                }}
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
                stroke={chartColors.primary}
                fill={chartColors.primary}
                strokeWidth={2}
                fillOpacity={isDark ? 0.5 : 0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
          
          {/* Legenda do Gráfico */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-violet-400/30 border border-violet-400" />
              <span>Seu Domínio</span>
            </div>
          </div>
        </div>

        {/* Lista de Recomendações */}
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <h4 className="text-sm font-medium">Foco Recomendado</h4>
          </div>
          
          <ScrollArea className="flex-1 min-h-50 pr-4">
              <div className="space-y-3 min-h-50">
              {data.recommendations.length > 0 ? (
                data.recommendations.map((rec) => (
                  <RecommendationCard key={rec.moduloId} rec={rec} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-violet-400/50" />
                  <p className="text-sm">Parabéns!</p>
                  <p className="text-xs">
                    Você tem um bom domínio dos módulos estratégicos.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
