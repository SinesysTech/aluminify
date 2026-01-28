'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/app/shared/components/feedback/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCcw, XCircle, Lightbulb, AlertTriangle } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/app/shared/components/overlay/tooltip'
import { Markdown } from '@/app/shared/components/ui/custom/prompt/markdown'
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

    const frontMeasureRef = React.useRef<HTMLDivElement | null>(null)
    const backMeasureRef = React.useRef<HTMLDivElement | null>(null)
    const [flipHeight, setFlipHeight] = React.useState<number>(400)

    const normalizeMathDelimiters = React.useCallback((value?: string | null) => {
        if (!value) return ""
        return value
            .replaceAll("\\(", "$")
            .replaceAll("\\)", "$")
            .replaceAll("\\[", "$$")
            .replaceAll("\\]", "$$")
    }, [])

    const getImportanciaBadgeClass = (importancia: string) => {
        switch (importancia) {
            case 'Alta':
                return 'border-transparent bg-[#FB923C] text-white'
            case 'Media':
                return 'border-transparent bg-[#FACC15] text-white'
            case 'Baixa':
                return 'border-transparent bg-[#60A5FA] text-white'
            case 'Base':
                return 'border-transparent bg-[#22D3EE] text-white'
            default:
                return 'border-transparent bg-[#A78BFA] text-white'
        }
    }

    const updateFlipHeight = React.useCallback(() => {
        const frontEl = frontMeasureRef.current
        const backEl = backMeasureRef.current

        const frontH = frontEl
            ? Math.max(frontEl.scrollHeight, frontEl.getBoundingClientRect().height)
            : 0
        const backH = backEl
            ? Math.max(backEl.scrollHeight, backEl.getBoundingClientRect().height)
            : 0
        const next = Math.max(400, Math.ceil(Math.max(frontH, backH)))

        setFlipHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev))
    }, [])

    // Mede antes do paint para evitar "piscada" ao trocar/virar.
    React.useLayoutEffect(() => {
        updateFlipHeight()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, showAnswer, current?.pergunta, current?.resposta])

    // Reage a mudanças de layout (resize, imagens carregando, quebra de linha etc.).
    React.useEffect(() => {
        const ro = new ResizeObserver(() => {
            updateFlipHeight()
        })

        if (frontMeasureRef.current) ro.observe(frontMeasureRef.current)
        if (backMeasureRef.current) ro.observe(backMeasureRef.current)

        return () => ro.disconnect()
    }, [updateFlipHeight])

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
            <div className="perspective-1000 relative w-full" style={{ height: flipHeight }}>
                <div
                    className={`relative h-full w-full transition-all duration-500 ease-in-out transform-3d ${showAnswer ? 'transform-[rotateY(180deg)]' : ''
                        }`}
                >
                    {/* FRENTE (Pergunta) */}
                    <Card className="absolute inset-0 flex h-full flex-col backface-hidden gap-0 py-0 shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
                        <CardContent className="shrink-0 p-0">
                            <div ref={frontMeasureRef} className="mx-auto w-full max-w-2xl p-6 sm:p-10">
                                <div className="mb-4 flex items-center justify-between w-full">
                                    <Badge
                                        variant="outline"
                                        className="uppercase tracking-wider text-xs border-transparent bg-[#A78BFA] text-white shadow-sm"
                                    >
                                        Pergunta
                                    </Badge>
                                    {current.importancia && (
                                        <Badge
                                            variant="secondary"
                                            className={`flex items-center gap-1 shadow-sm ${getImportanciaBadgeClass(String(current.importancia))}`}
                                        >
                                            <Lightbulb className="h-3 w-3" />
                                            Badge: {current.importancia}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-col items-center justify-center gap-4 text-center">
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
                                    <div className="text-xl font-medium leading-relaxed sm:text-2xl whitespace-normal wrap-anywhere text-card-foreground">
                                        <Markdown>
                                            {normalizeMathDelimiters(current.pergunta)}
                                        </Markdown>
                                    </div>
                                </div>

                                <div className="mt-8 w-full shrink-0 border-t pt-6">
                                    <Button
                                        className="w-full h-12 text-lg"
                                        onClick={onReveal}
                                        autoFocus
                                    >
                                        Mostrar Resposta
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* VERSO (Resposta) */}
                    <Card className="absolute inset-0 flex h-full flex-col backface-hidden transform-[rotateY(180deg)] gap-0 py-0 shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
                        <CardContent className="shrink-0 p-0">
                            <div ref={backMeasureRef} className="mx-auto w-full max-w-2xl p-6 sm:p-10">
                                <div className="mb-4 flex items-center justify-between w-full">
                                    <Badge
                                        variant="default"
                                        className="uppercase tracking-wider text-xs border-transparent bg-[#34D399] text-white shadow-sm hover:bg-[#10B981]"
                                    >
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

                                <div className="flex flex-col items-center justify-center gap-4 text-center">
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
                                    <div className="text-lg leading-relaxed sm:text-xl whitespace-normal wrap-anywhere text-card-foreground">
                                        <Markdown>
                                            {normalizeMathDelimiters(current.resposta)}
                                        </Markdown>
                                    </div>
                                </div>

                                <div className="mt-8 w-full shrink-0 border-t pt-6">
                                    <p className="mb-4 text-center text-sm text-muted-foreground font-medium uppercase tracking-wide">
                                        Como foi para você?
                                    </p>
                                    <TooltipProvider delayDuration={150}>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="w-full flex-col items-center justify-center rounded-md bg-[#F87171] px-4 py-4 text-white shadow-md whitespace-normal overflow-hidden border border-white/20 saturate-150 hover:saturate-200 hover:bg-[#EF6B6B] focus-visible:ring-2 focus-visible:ring-[#F87171]/40 min-h-[84px]"
                                                    onClick={() => onFeedback(1)}
                                                >
                                                    <span className="w-full text-center text-sm font-semibold leading-snug sm:text-base">
                                                        Errei
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="max-w-[260px] text-center">
                                                Errei o item.
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="w-full flex-col items-center justify-center rounded-md bg-[#FACC15] px-4 py-4 text-white shadow-md whitespace-normal overflow-hidden border border-white/20 saturate-150 hover:saturate-200 hover:bg-[#EAB308] focus-visible:ring-2 focus-visible:ring-[#FACC15]/40 min-h-[84px]"
                                                    onClick={() => onFeedback(2)}
                                                >
                                                    <span className="w-full text-center text-sm font-semibold leading-snug sm:text-base">
                                                        Acertei parcialmente
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="max-w-[260px] text-center">
                                                Acertei, parte da resposta.
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="w-full flex-col items-center justify-center rounded-md bg-[#60A5FA] px-4 py-4 text-white shadow-md whitespace-normal overflow-hidden border border-white/20 saturate-150 hover:saturate-200 hover:bg-[#3B82F6] focus-visible:ring-2 focus-visible:ring-[#60A5FA]/40 min-h-[84px]"
                                                    onClick={() => onFeedback(3)}
                                                >
                                                    <span className="w-full text-center text-sm font-semibold leading-snug sm:text-base">
                                                        Acertei, mas estou inseguro
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="max-w-[260px] text-center">
                                                Acertei, mas ainda me sinto inseguro com o conteúdo.
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    className="w-full flex-col items-center justify-center rounded-md bg-[#34D399] px-4 py-4 text-white shadow-md whitespace-normal overflow-hidden border border-white/20 saturate-150 hover:saturate-200 hover:bg-[#10B981] focus-visible:ring-2 focus-visible:ring-[#34D399]/40 min-h-[84px]"
                                                    onClick={() => onFeedback(4)}
                                                >
                                                    <span className="w-full text-center text-sm font-semibold leading-snug sm:text-base">
                                                        Acertei
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="max-w-[260px] text-center">
                                                Acertei e me sinto seguro em relação a esse conteúdo.
                                            </TooltipContent>
                                        </Tooltip>
                                        </div>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
