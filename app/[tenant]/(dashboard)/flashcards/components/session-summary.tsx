'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, TrendingUp, RefreshCw } from 'lucide-react'

type FeedbackCount = {
    errei: number
    parcial: number
    dificil: number
    facil: number
}

type SessionSummaryProps = {
    feedbacks: number[] // Array de feedbacks (1-4) da sessão
    onFinish: () => void
    onStudyMore: () => void
}

export function SessionSummary({ feedbacks, onFinish, onStudyMore }: SessionSummaryProps) {
    // Contar feedbacks
    const counts: FeedbackCount = {
        errei: feedbacks.filter((f) => f === 1).length,
        parcial: feedbacks.filter((f) => f === 2).length,
        dificil: feedbacks.filter((f) => f === 3).length,
        facil: feedbacks.filter((f) => f === 4).length,
    }

    // Calcular score: (Bom + Fácil) / Total
    const total = feedbacks.length
    const acertos = counts.dificil + counts.facil // Feedback 3 e 4 são acertos
    const score = total > 0 ? Math.round((acertos / total) * 100) : 0

    // Cores para o gráfico
    const erreiColor = 'bg-[#F87171]' // Vermelho
    const parcialColor = 'bg-[#FB923C]' // Laranja
    const dificilColor = 'bg-[#FACC15]' // Amarelo
    const facilColor = 'bg-[#34D399]' // Verde

    // Calcular percentuais para o gráfico
    const erreiPercent = total > 0 ? (counts.errei / total) * 100 : 0
    const parcialPercent = total > 0 ? (counts.parcial / total) * 100 : 0
    const dificilPercent = total > 0 ? (counts.dificil / total) * 100 : 0
    const facilPercent = total > 0 ? (counts.facil / total) * 100 : 0

    const erreiPercentLabel = total > 0 ? Math.round(erreiPercent) : 0
    const parcialPercentLabel = total > 0 ? Math.round(parcialPercent) : 0
    const dificilPercentLabel = total > 0 ? Math.round(dificilPercent) : 0
    const facilPercentLabel = total > 0 ? Math.round(facilPercent) : 0

    // Determinar mensagem baseada no score
    const getScoreMessage = (score: number) => {
        if (score >= 80) return { text: 'Excelente!', color: 'text-[#34D399]' }
        if (score >= 60) return { text: 'Bom trabalho!', color: 'text-[#60A5FA]' }
        if (score >= 40) return { text: 'Continue praticando!', color: 'text-[#FACC15]' }
        return { text: 'Não desista!', color: 'text-[#F87171]' }
    }

    const scoreMessage = getScoreMessage(score)

    // Gerar ID único para este componente para evitar conflitos de CSS
    const chartId = React.useId()

    const headingClass = 'text-lg md:text-xl font-bold tracking-tight text-foreground'

    return (
        <Card className="border-2 border-primary/50">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        .chart-container-${chartId.replace(/:/g, '')} {
          --errei-width: ${erreiPercent}%;
          --parcial-width: ${parcialPercent}%;
          --dificil-width: ${dificilPercent}%;
          --facil-width: ${facilPercent}%;
        }
      `,
                }}
            />
            <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                    <Trophy className="h-12 w-12 text-[#FACC15]" />
                </div>
                <CardTitle className={headingClass}>Sessão Concluída!</CardTitle>
                <CardDescription>Você completou 10 flashcards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score Geral */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <h3 className={headingClass}>Score Geral</h3>
                    </div>
                    <div className={`text-4xl font-bold ${scoreMessage.color}`}>
                        {score}%
                    </div>
                    <p className={`text-lg font-medium ${scoreMessage.color}`}>{scoreMessage.text}</p>
                    <p className="text-sm text-muted-foreground">
                        {acertos} de {total} acertos (Dificil + Fácil)
                    </p>
                </div>

                {/* Gráfico Visual - Barra de Distribuição */}
                <div className="space-y-3">
                    <h3 className={`${headingClass} text-center`}>Distribuição de Respostas</h3>
                    <div className="relative h-10 rounded-md overflow-hidden border">
                        <div className={`absolute inset-0 flex chart-container-${chartId.replace(/:/g, '')}`}>
                            {erreiPercent > 0 && (
                                <div
                                    className={`${erreiColor} flex-[0_0_var(--errei-width)] flex items-center justify-center`}
                                    title={`Errei: ${counts.errei}`}
                                >
                                    {erreiPercentLabel >= 10 && (
                                        <span className="text-xs font-bold text-white tabular-nums drop-shadow-sm">
                                            {erreiPercentLabel}%
                                        </span>
                                    )}
                                </div>
                            )}
                            {parcialPercent > 0 && (
                                <div
                                    className={`${parcialColor} flex-[0_0_var(--parcial-width)] flex items-center justify-center`}
                                    title={`Acertei parcialmente: ${counts.parcial}`}
                                >
                                    {parcialPercentLabel >= 10 && (
                                        <span className="text-xs font-bold text-white tabular-nums drop-shadow-sm">
                                            {parcialPercentLabel}%
                                        </span>
                                    )}
                                </div>
                            )}
                            {dificilPercent > 0 && (
                                <div
                                    className={`${dificilColor} flex-[0_0_var(--dificil-width)] flex items-center justify-center`}
                                    title={`Acertei com dificuldade: ${counts.dificil}`}
                                >
                                    {dificilPercentLabel >= 10 && (
                                        <span className="text-xs font-bold text-slate-950 tabular-nums drop-shadow-sm">
                                            {dificilPercentLabel}%
                                        </span>
                                    )}
                                </div>
                            )}
                            {facilPercent > 0 && (
                                <div
                                    className={`${facilColor} flex-[0_0_var(--facil-width)] flex items-center justify-center`}
                                    title={`Acertei com facilidade: ${counts.facil}`}
                                >
                                    {facilPercentLabel >= 10 && (
                                        <span className="text-xs font-bold text-white tabular-nums drop-shadow-sm">
                                            {facilPercentLabel}%
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Legenda (box vertical) */}
                    <div className="mx-auto w-fit rounded-md border bg-muted/20 px-3 py-2">
                        <div className="grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-1 text-[11px]">
                            <div className="font-semibold text-muted-foreground text-center">Legendas</div>
                            <div className="font-semibold text-muted-foreground text-center">Número de acertos</div>
                            <div className="font-semibold text-muted-foreground text-center">Acertos percentuais</div>

                            <div className="flex items-center justify-start gap-2">
                                <span className={`h-3 w-3 rounded ${erreiColor}`} />
                                <span className="font-medium">Errei</span>
                            </div>
                            <div className="tabular-nums text-center">{counts.errei}</div>
                            <div className="tabular-nums text-center">{erreiPercentLabel}%</div>

                            <div className="flex items-center justify-start gap-2">
                                <span className={`h-3 w-3 rounded ${parcialColor}`} />
                                <span className="font-medium">Acertei parcialmente</span>
                            </div>
                            <div className="tabular-nums text-center">{counts.parcial}</div>
                            <div className="tabular-nums text-center">{parcialPercentLabel}%</div>

                            <div className="flex items-center justify-start gap-2">
                                <span className={`h-3 w-3 rounded ${dificilColor}`} />
                                <span className="font-medium">Acertei com dificuldade</span>
                            </div>
                            <div className="tabular-nums text-center">{counts.dificil}</div>
                            <div className="tabular-nums text-center">{dificilPercentLabel}%</div>

                            <div className="flex items-center justify-start gap-2">
                                <span className={`h-3 w-3 rounded ${facilColor}`} />
                                <span className="font-medium">Acertei com facilidade</span>
                            </div>
                            <div className="tabular-nums text-center">{counts.facil}</div>
                            <div className="tabular-nums text-center">{facilPercentLabel}%</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar do Score */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Domínio do Conteúdo</span>
                        <span className="font-medium">{score}%</span>
                    </div>
                    <Progress value={score} className="h-3" />
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button onClick={onFinish} variant="default" className="flex-1">
                        Concluir Sessão
                    </Button>
                    <Button onClick={onStudyMore} variant="outline" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Estudar Mais 10
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
