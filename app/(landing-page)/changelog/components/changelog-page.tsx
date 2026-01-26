"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";

export function ChangelogPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen">
            <Nav />

            <main className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-display font-bold mb-4">
                    Novidades & Atualizações
                </h1>
                <p className="text-muted-foreground mb-12">
                    Acompanhe a evolução da infraestrutura semana a semana.
                </p>

                <div className="relative border-l border-zinc-200 dark:border-zinc-700 ml-4 space-y-12">
                    {/* v2.1.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-blue-500 shadow"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v2.1.0 - The Focus Update</h2>
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">LATEST</span>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">12 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300 bg-card p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <p>
                                Focamos totalmente na experiência do aluno nesta versão. O novo
                                &quot;Focus Mode&quot; remove todas as distrações da interface durante a reprodução de vídeo.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li><strong>Novo:</strong> Focus Mode (Atalho: F). Esconde sidebar e header.</li>
                                <li><strong>Melhoria:</strong> Player de vídeo agora suporta HLS nativo para menor consumo de dados.</li>
                                <li><strong>Fix:</strong> Correção no cálculo de progresso de módulos aninhados.</li>
                            </ul>
                        </div>
                    </div>

                    {/* v2.0.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v2.0.0 - Open Source Release</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">01 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                                O grande dia. Aluminify agora é 100% open source sob licença Apache 2.0.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Código fonte liberado no GitHub.</li>
                                <li>Documentação de self-hosting via Docker Compose.</li>
                                <li>Lançamento do plano Cloud para escolas que preferem gestão assistida.</li>
                            </ul>
                        </div>
                    </div>

                    {/* v1.9.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v1.9.0 - AI Tutor Beta</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">15 Dec 2025</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                                Introdução do sistema de tutoria com IA baseado em RAG.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Chat integrado com contexto das aulas.</li>
                                <li>Suporte a múltiplos modelos (OpenAI, Anthropic).</li>
                                <li>Dashboard de consumo de tokens.</li>
                            </ul>
                        </div>
                    </div>

                    {/* v1.8.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v1.8.0 - Flashcards SRS</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">01 Dec 2025</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                                Sistema de repetição espaçada para flashcards.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Algoritmo SM-2 adaptativo.</li>
                                <li>Geração automática de flashcards via IA.</li>
                                <li>Modo de estudo com estatísticas.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-zinc-400 border-t border-zinc-200 dark:border-zinc-700">
                © 2026 Aluminify Inc.
            </footer>
        </div>
    );
}
