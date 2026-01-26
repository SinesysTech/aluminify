"use client";

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
                    {/* v2.2.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500 shadow"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v2.2.0 - Foundation Upgrade</h2>
                            <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-mono font-bold">LATEST</span>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">26 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300 bg-card p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <p>
                                Uma reestruturação completa da fundação do sistema para garantir escalabilidade e manutenção a longo prazo.
                                Adotamos uma arquitetura estritamente modular.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li><strong>Arquitetura:</strong> Migração para padrão de Módulos Funcionais (`app/[tenant]/(modules)`).</li>
                                <li><strong>API V2:</strong> Nova API REST hierárquica e localizada (`/api/curso`, `/api/usuario`).</li>
                                <li><strong>Docs:</strong> Centralização da documentação técnica e READMEs por módulo.</li>
                                <li><strong>Limpeza:</strong> Remoção de código legado e pastas duplicadas (`admin`, `dashboard` raiz).</li>
                            </ul>
                        </div>
                    </div>

                    {/* v2.1.0 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">v2.1.0 - The Focus Update</h2>
                        </div>
                        <time className="block text-sm text-zinc-400 mb-4">12 Jan 2026</time>
                        <div className="prose prose-sm text-zinc-600 dark:text-zinc-300">
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
                                O grande dia. Aluminify agora é 100% open source sob licença MIT.
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Código fonte liberado no GitHub.</li>
                                <li>Documentação de self-hosting via Docker Compose.</li>
                                <li>Lançamento do plano Cloud para escolas que preferem gestão assistida.</li>
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