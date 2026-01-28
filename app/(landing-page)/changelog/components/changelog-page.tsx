"use client";

import { Nav } from "../../components/nav";

export function ChangelogPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased min-h-screen">
            <Nav />

            <main className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-display font-bold mb-4">
                    Novidades e melhorias
                </h1>
                <p className="text-muted-foreground mb-12">
                    Veja o que estamos melhorando na plataforma.
                </p>

                <div className="relative border-l border-zinc-200 dark:border-zinc-700 ml-4 space-y-12">
                    {/* v2.2.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500 shadow"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">Nova estrutura da plataforma</h2>
                            <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">NOVO</span>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">26 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300 bg-card p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <p>
                                Reorganizamos toda a plataforma para ficar mais rápida, estável e fácil de usar.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li><strong>Melhor organização:</strong> Cada área da plataforma agora funciona de forma independente e mais estável.</li>
                                <li><strong>Sistema mais rápido:</strong> Melhorias que deixam tudo carregando mais rápido.</li>
                                <li><strong>Documentação:</strong> Instruções mais claras para quem quer instalar por conta própria.</li>
                                <li><strong>Limpeza geral:</strong> Removemos o que não estava sendo usado.</li>
                            </ul>
                        </div>
                    </div>

                    {/* v2.1.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">Modo Foco para alunos</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">12 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                                Melhoramos a experiência do aluno com um novo modo que esconde todas as distrações durante o vídeo.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li><strong>Novo:</strong> Modo Foco — esconde menus e deixa só o vídeo na tela.</li>
                                <li><strong>Melhoria:</strong> Vídeos carregam mais rápido e gastam menos internet.</li>
                                <li><strong>Correção:</strong> Progresso dos alunos agora calcula certinho.</li>
                            </ul>
                        </div>
                    </div>

                    {/* v2.0.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">Lançamento gratuito</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">01 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
                            <p>
                                O grande dia! Aluminify agora é 100% gratuito e de código aberto.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Qualquer pessoa pode usar sem pagar nada.</li>
                                <li>Instruções para instalar no seu próprio servidor.</li>
                                <li>Lançamento do plano Nuvem para quem prefere que a gente cuide de tudo.</li>
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