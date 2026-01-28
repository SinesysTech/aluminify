'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    RotateCcw,
    Loader2,
    AlertTriangle,
    ChevronRight,
    XCircle,
    CircleCheck,
    CircleHelp,
    CircleDot,
} from 'lucide-react'
import { Markdown } from '@/app/shared/components/ui/custom/prompt/markdown'
import { Flashcard } from '../types'
import { cn } from '@/lib/utils'

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

// Frases motivacionais para estudo
const STUDY_QUOTES = [
    { text: 'A repetição é a mãe da habilidade.', author: 'Tony Robbins' },
    { text: 'O conhecimento é poder.', author: 'Francis Bacon' },
    { text: 'Quanto mais você pratica, mais sorte você tem.', author: 'Gary Player' },
    { text: 'A educação é a arma mais poderosa para mudar o mundo.', author: 'Nelson Mandela' },
    { text: 'Aprender é a única coisa que a mente nunca se cansa.', author: 'Leonardo da Vinci' },
    { text: 'O segredo de progredir é começar.', author: 'Mark Twain' },
    { text: 'Cada dia é uma nova oportunidade de aprender.', author: 'Dalai Lama' },
    { text: 'A persistência realiza o impossível.', author: 'Provérbio Chinês' },
]

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
    const progress = cards.length > 0 ? (currentIndex + 1) / Math.min(cards.length, SESSION_SIZE) : 0
    const isFinished = currentIndex >= cards.length

    const [showControls, setShowControls] = React.useState(true)
    const [currentQuote] = React.useState(() =>
        STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]
    )
    const [reducedMotion, setReducedMotion] = React.useState(() => {
        if (typeof window === 'undefined') return false
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })

    const normalizeMathDelimiters = React.useCallback((value?: string | null) => {
        if (!value) return ""
        return value
            .replaceAll("\\(", "$")
            .replaceAll("\\)", "$")
            .replaceAll("\\[", "$$")
            .replaceAll("\\]", "$$")
    }, [])

    // Detect reduced motion preference
    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    // Auto-hide controls after 4s of inactivity
    React.useEffect(() => {
        let timeout: NodeJS.Timeout

        const resetTimer = () => {
            setShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setShowControls(false)
            }, 4000)
        }

        resetTimer()

        const handleMouseMove = () => resetTimer()
        const handleKeyDown = (e: KeyboardEvent) => {
            resetTimer()

            // Keyboard shortcuts
            if (e.key === ' ' && !showAnswer) {
                e.preventDefault()
                onReveal()
            } else if (showAnswer && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault()
                onFeedback(parseInt(e.key))
            } else if (e.key === 'Escape') {
                onExit()
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            clearTimeout(timeout)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [showAnswer, onReveal, onFeedback, onExit])

    // Loading state
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
                    <p className="text-lg text-slate-300">Preparando flashcards...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-6 text-center px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                        <AlertTriangle className="h-10 w-10 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-white">Erro ao carregar</h2>
                        <p className="text-slate-400 max-w-md">{error}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={onReload}
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Tentar Novamente
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onExit}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Empty/finished state
    if (!current || isFinished) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-6 text-center px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
                        <CircleCheck className="h-10 w-10 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-white">Sessão finalizada</h2>
                        <p className="text-slate-400">Não há mais flashcards para revisar.</p>
                    </div>
                    <Button
                        onClick={onExit}
                        className="bg-violet-600 hover:bg-violet-500 text-white"
                    >
                        Voltar ao Início
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Sessão de Flashcards"
            onMouseMove={() => setShowControls(true)}
        >
            {/* Animated Aurora Background */}
            <div className="absolute inset-0 bg-slate-950 pointer-events-none">
                {!reducedMotion && (
                    <>
                        {/* Aurora layers - violet/blue theme for study */}
                        <div className="absolute inset-0 opacity-40 transition-opacity duration-1000">
                            {/* Primary aurora wave */}
                            <div
                                className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 animate-aurora-slow"
                                style={{
                                    background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 40%, transparent 70%)'
                                }}
                            />
                            {/* Secondary aurora wave */}
                            <div
                                className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 animate-aurora-medium"
                                style={{
                                    background: 'radial-gradient(ellipse 60% 40% at 60% 60%, rgba(168, 85, 247, 0.2) 0%, transparent 60%)'
                                }}
                            />
                            {/* Tertiary aurora wave */}
                            <div
                                className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 animate-aurora-fast"
                                style={{
                                    background: 'radial-gradient(ellipse 50% 30% at 40% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
                                }}
                            />
                        </div>
                        {/* Subtle noise overlay */}
                        <div
                            className="absolute inset-0 opacity-[0.015]"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                            }}
                        />
                    </>
                )}
                {/* Fallback for reduced motion */}
                {reducedMotion && (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
                        }}
                    />
                )}
            </div>

            {/* Top controls bar - auto-hide */}
            <div
                className={cn(
                    'absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 transition-all duration-500',
                    showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
                )}
            >
                {/* Progress indicator */}
                <div className="flex items-center gap-4">
                    {/* Progress ring */}
                    <div className="relative">
                        <svg width="56" height="56" className="-rotate-90">
                            <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-white/10"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                className="text-violet-400 transition-all duration-500"
                                strokeDasharray={2 * Math.PI * 22}
                                strokeDashoffset={(2 * Math.PI * 22) - (progress * 2 * Math.PI * 22)}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                            {currentIndex + 1}/{Math.min(cards.length, SESSION_SIZE)}
                        </span>
                    </div>
                    <div className="text-sm text-slate-400">
                        {Math.round(progress * 100)}% concluído
                    </div>
                </div>

                {/* Exit button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onExit}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Encerrar sessão"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Main content - centered */}
            <div className="h-full w-full flex flex-col items-center justify-center px-6 relative z-10">
                {/* Flashcard */}
                <div className="w-full max-w-2xl perspective-1000">
                    <div
                        className={cn(
                            'relative w-full transition-all duration-700 transform-3d',
                            showAnswer && 'transform-[rotateY(180deg)]'
                        )}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* FRONT - Question */}
                        <div
                            className={cn(
                                'w-full rounded-2xl p-8 md:p-12 backface-hidden',
                                'bg-white/3 backdrop-blur-xl',
                                'border border-white/10',
                                'shadow-2xl shadow-black/20'
                            )}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {/* Question badge */}
                            <div className="flex items-center justify-center mb-8">
                                <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                    Pergunta
                                </span>
                            </div>

                            {/* Question content */}
                            <div className="flex flex-col items-center justify-center min-h-[200px] gap-6">
                                {current.perguntaImagemUrl && (
                                    <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={current.perguntaImagemUrl}
                                            alt="Imagem da pergunta"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                )}
                                <div className="text-xl md:text-2xl lg:text-3xl font-medium text-center text-white leading-relaxed">
                                    <Markdown>
                                        {normalizeMathDelimiters(current.pergunta)}
                                    </Markdown>
                                </div>
                            </div>

                            {/* Reveal button */}
                            <div className="mt-10 pt-8 border-t border-white/10">
                                <Button
                                    onClick={onReveal}
                                    className={cn(
                                        'w-full h-14 text-lg font-medium',
                                        'bg-violet-600 hover:bg-violet-500 text-white',
                                        'transition-all duration-300 hover:scale-[1.02]',
                                        'shadow-lg shadow-violet-500/25'
                                    )}
                                    autoFocus
                                >
                                    Revelar Resposta
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                                <p className="mt-3 text-center text-xs text-slate-500">
                                    ou pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Espaço</kbd>
                                </p>
                            </div>
                        </div>

                        {/* BACK - Answer */}
                        <div
                            className={cn(
                                'absolute inset-0 w-full rounded-2xl p-8 md:p-12 backface-hidden',
                                'bg-white/3 backdrop-blur-xl',
                                'border border-white/10',
                                'shadow-2xl shadow-black/20',
                                'transform-[rotateY(180deg)]'
                            )}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {/* Answer badge */}
                            <div className="flex items-center justify-center mb-8">
                                <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Resposta
                                </span>
                            </div>

                            {/* Answer content */}
                            <div className="flex flex-col items-center justify-center min-h-[160px] gap-6">
                                {current.respostaImagemUrl && (
                                    <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={current.respostaImagemUrl}
                                            alt="Imagem da resposta"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                )}
                                <div className="text-lg md:text-xl lg:text-2xl font-medium text-center text-white leading-relaxed">
                                    <Markdown>
                                        {normalizeMathDelimiters(current.resposta)}
                                    </Markdown>
                                </div>
                            </div>

                            {/* Feedback buttons */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="mb-5 text-center text-sm text-slate-400 font-medium">
                                    Como foi?
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <FeedbackButton
                                        onClick={() => onFeedback(1)}
                                        icon={<XCircle className="h-5 w-5" />}
                                        label="Errei"
                                        shortcut="1"
                                        colorClass="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
                                    />
                                    <FeedbackButton
                                        onClick={() => onFeedback(2)}
                                        icon={<CircleDot className="h-5 w-5" />}
                                        label="Parcial"
                                        shortcut="2"
                                        colorClass="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
                                    />
                                    <FeedbackButton
                                        onClick={() => onFeedback(3)}
                                        icon={<CircleHelp className="h-5 w-5" />}
                                        label="Inseguro"
                                        shortcut="3"
                                        colorClass="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/30"
                                    />
                                    <FeedbackButton
                                        onClick={() => onFeedback(4)}
                                        icon={<CircleCheck className="h-5 w-5" />}
                                        label="Acertei"
                                        shortcut="4"
                                        colorClass="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote section */}
                <div className={cn(
                    'absolute bottom-24 left-0 right-0 px-8 transition-all duration-700',
                    showControls ? 'opacity-60' : 'opacity-30'
                )}>
                    <blockquote className="max-w-xl mx-auto text-center">
                        <p className="text-sm md:text-base text-slate-400 italic leading-relaxed">
                            &ldquo;{currentQuote.text}&rdquo;
                        </p>
                        <footer className="mt-2 text-xs text-slate-500">
                            — {currentQuote.author}
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Bottom hint */}
            <div className={cn(
                'absolute bottom-6 left-0 right-0 text-center z-20 transition-all duration-500 pointer-events-none',
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
                <p className="text-xs text-slate-500">
                    Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Esc</kbd> para sair
                </p>
            </div>

            {/* CSS for aurora animations */}
            <style jsx>{`
                @keyframes aurora-slow {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    25% { transform: translate(5%, 5%) rotate(5deg); }
                    50% { transform: translate(0%, 10%) rotate(0deg); }
                    75% { transform: translate(-5%, 5%) rotate(-5deg); }
                }
                @keyframes aurora-medium {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    33% { transform: translate(-8%, 8%) rotate(-8deg); }
                    66% { transform: translate(8%, -4%) rotate(8deg); }
                }
                @keyframes aurora-fast {
                    0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
                    50% { transform: translate(10%, -10%) rotate(10deg); }
                }
                .animate-aurora-slow {
                    animation: aurora-slow 30s ease-in-out infinite;
                }
                .animate-aurora-medium {
                    animation: aurora-medium 20s ease-in-out infinite;
                }
                .animate-aurora-fast {
                    animation: aurora-fast 15s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}

// Feedback button component
function FeedbackButton({
    onClick,
    icon,
    label,
    shortcut,
    colorClass,
}: {
    onClick: () => void
    icon: React.ReactNode
    label: string
    shortcut: string
    colorClass: string
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl',
                'border transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                colorClass
            )}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
            <kbd className="text-[10px] opacity-60 font-mono">{shortcut}</kbd>
        </button>
    )
}
