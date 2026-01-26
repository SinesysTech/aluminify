'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCcw, XCircle, Lightbulb, AlertTriangle } from 'lucide-react'
import { Flashcard } from '../types'

interface StudySessionProps {
    cards: Flashcard[]
    currentIndex: number
    showAnswer: boolean
    loading: boolean
    error: string | null
    onReveal: () => void
    onFeedback: (value: number) => void
    onReload: () => void
    onExit: () => void
}

export function StudySession({
    cards,
    currentIndex,
    showAnswer,
    loading,
    error,
    onReveal,
    onFeedback,
    onReload,
    onExit
}: StudySessionProps) {
    const current = cards[currentIndex]
    const SESSION_SIZE = 10
    const progress = cards.length > 0 ? ((currentIndex + 1) / SESSION_SIZE) * 100 : 0
    const isFinished = currentIndex >= cards.length

    if (loading) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border bg-card p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando flashcards para revisão...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
                <AlertTriangle className="h-10 w-10" />
                <h3 className="text-lg font-semibold">Erro ao carregar sessão</h3>
                <p>{error}</p>
                <Button variant="outline" onClick={onReload} className="mt-2">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                </Button>
            </div>
        )
    }

    if (!current || isFinished) {
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border bg-card p-6 text-center">
                <p className="text-muted-foreground">Não há mais flashcards para revisar nesta sessão.</p>
                <Button variant="outline" onClick={onExit}>Voltar ao Início</Button>
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {/* Barra de progresso */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Card {currentIndex + 1} de {Math.min(cards.length, SESSION_SIZE)}
                    </span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Cartão Flashcard */}
            <div className="perspective-1000 relative min-h-[400px]">
                <div
                    className={`relative h-full w-full transition-all duration-500 ease-in-out transform-3d ${showAnswer ? 'transform-[rotateY(180deg)]' : ''
                        }`}
                >
                    {/* FRENTE (Pergunta) */}
                    <Card className="absolute inset-0 flex flex-col backface-hidden">
                        <CardContent className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
                            <div className="mb-4 flex items-center justify-between w-full">
                                <Badge variant="outline" className="uppercase tracking-wider text-xs">
                                    Pergunta
                                </Badge>
                                {current.importancia && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Lightbulb className="h-3 w-3" />
                                        Badge: {current.importancia}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-4 text-center">
                                {current.perguntaImagemUrl && (
                                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={current.perguntaImagemUrl}
                                            alt="Imagem da pergunta"
                                            className="h-full w-full object-contain p-2"
                                        />
                                    </div>
                                )}
                                <p className="text-xl font-medium leading-relaxed sm:text-2xl">
                                    {current.pergunta}
                                </p>
                            </div>

                            <div className="mt-8 w-full border-t pt-6">
                                <Button
                                    className="w-full h-12 text-lg"
                                    onClick={onReveal}
                                    autoFocus
                                >
                                    Mostrar Resposta
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* VERSO (Resposta) */}
                    <Card className="absolute inset-0 flex flex-col backface-hidden transform-[rotateY(180deg)]">
                        <CardContent className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
                            <div className="mb-4 flex items-center justify-between w-full">
                                <Badge variant="default" className="uppercase tracking-wider text-xs bg-green-600 hover:bg-green-700">
                                    Resposta
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full"
                                    onClick={() => {
                                        // Se quiser permitir desvirar, mas o fluxo padrão é feedback
                                    }}
                                >
                                    <XCircle className="h-4 w-4 text-muted-foreground opacity-20" />
                                </Button>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-4 text-center">
                                {current.respostaImagemUrl && (
                                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={current.respostaImagemUrl}
                                            alt="Imagem da resposta"
                                            className="h-full w-full object-contain p-2"
                                        />
                                    </div>
                                )}
                                <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                                    {current.resposta}
                                </p>
                            </div>

                            <div className="mt-8 w-full border-t pt-6">
                                <p className="mb-4 text-center text-sm text-muted-foreground font-medium uppercase tracking-wide">
                                    Como foi para você?
                                </p>
                                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-auto py-2 hover:bg-red-100 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-800"
                                        onClick={() => onFeedback(1)}
                                    >
                                        <span className="text-lg font-bold">Errei</span>
                                        <span className="text-[10px] uppercase opacity-70">Difícil</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-auto py-2 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 dark:hover:bg-orange-900/30 dark:hover:text-orange-400 dark:hover:border-orange-800"
                                        onClick={() => onFeedback(2)}
                                    >
                                        <span className="text-lg font-bold">Dúvida</span>
                                        <span className="text-[10px] uppercase opacity-70">Médio</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-auto py-2 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 dark:hover:border-blue-800"
                                        onClick={() => onFeedback(3)}
                                    >
                                        <span className="text-lg font-bold">Acertei</span>
                                        <span className="text-[10px] uppercase opacity-70">Normal</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-auto py-2 hover:bg-green-100 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-900/30 dark:hover:text-green-400 dark:hover:border-green-800"
                                        onClick={() => onFeedback(4)}
                                    >
                                        <span className="text-lg font-bold">Fácil</span>
                                        <span className="text-[10px] uppercase opacity-70">Dominei</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
