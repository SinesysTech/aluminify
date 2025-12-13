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

export function FlashcardSessionSummary({ feedbacks, onFinish, onStudyMore }: SessionSummaryProps) {
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
  const erreiColor = 'bg-red-500'
  const parcialColor = 'bg-yellow-500'
  const dificilColor = 'bg-blue-500'
  const facilColor = 'bg-green-500'

  // Calcular percentuais para o gráfico
  const erreiPercent = total > 0 ? (counts.errei / total) * 100 : 0
  const parcialPercent = total > 0 ? (counts.parcial / total) * 100 : 0
  const dificilPercent = total > 0 ? (counts.dificil / total) * 100 : 0
  const facilPercent = total > 0 ? (counts.facil / total) * 100 : 0

  // Determinar mensagem baseada no score
  const getScoreMessage = (score: number) => {
    if (score >= 80) return { text: 'Excelente!', color: 'text-green-600' }
    if (score >= 60) return { text: 'Bom trabalho!', color: 'text-blue-600' }
    if (score >= 40) return { text: 'Continue praticando!', color: 'text-yellow-600' }
    return { text: 'Não desista!', color: 'text-red-600' }
  }

  const scoreMessage = getScoreMessage(score)

  return (
    <Card className="border-2 border-primary/50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl">Sessão Concluída!</CardTitle>
        <CardDescription>Você completou 10 flashcards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Geral */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Score Geral</span>
          </div>
          <div className="text-4xl font-bold" style={{ color: scoreMessage.color }}>
            {score}%
          </div>
          <p className={`text-lg font-medium ${scoreMessage.color}`}>{scoreMessage.text}</p>
          <p className="text-sm text-muted-foreground">
            {acertos} de {total} acertos (Dificil + Fácil)
          </p>
        </div>

        {/* Gráfico Visual - Barra de Distribuição */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-center">Distribuição de Respostas</h3>
          <div className="relative h-8 rounded-md overflow-hidden border">
            <div className="absolute inset-0 flex">
              {erreiPercent > 0 && (
                <div
                  className={erreiColor}
                  style={{ width: `${erreiPercent}%` }}
                  title={`Errei: ${counts.errei}`}
                />
              )}
              {parcialPercent > 0 && (
                <div
                  className={parcialColor}
                  style={{ width: `${parcialPercent}%` }}
                  title={`Parcial: ${counts.parcial}`}
                />
              )}
              {dificilPercent > 0 && (
                <div
                  className={dificilColor}
                  style={{ width: `${dificilPercent}%` }}
                  title={`Difícil: ${counts.dificil}`}
                />
              )}
              {facilPercent > 0 && (
                <div
                  className={facilColor}
                  style={{ width: `${facilPercent}%` }}
                  title={`Fácil: ${counts.facil}`}
                />
              )}
            </div>
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {counts.errei > 0 && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${erreiColor}`} />
                <span>Errei: {counts.errei}</span>
              </div>
            )}
            {counts.parcial > 0 && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${parcialColor}`} />
                <span>Parcial: {counts.parcial}</span>
              </div>
            )}
            {counts.dificil > 0 && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${dificilColor}`} />
                <span>Difícil: {counts.dificil}</span>
              </div>
            )}
            {counts.facil > 0 && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${facilColor}`} />
                <span>Fácil: {counts.facil}</span>
              </div>
            )}
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












