"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";

export function RoadmapPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased">
            <Nav />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-display font-bold mb-4">Roadmap Público</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Nossa visão para o futuro da infraestrutura educacional. Vote nas features que você mais precisa no nosso{" "}
                        <a href="https://github.com/aluminify/core/discussions" className="text-blue-600 underline decoration-1 underline-offset-2" target="_blank" rel="noopener noreferrer">
                            GitHub Discussions
                        </a>.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Em Desenvolvimento */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Em Desenvolvimento</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-400">CORE-241</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">Beta</span>
                                </div>
                                <h4 className="font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Integração Nativa Notion</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                    Sincronização bidirecional de notas de aula e agenda do aluno.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">PZ</div>
                                    <span className="text-xs text-zinc-400">Pedro Z.</span>
                                </div>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-400">AI-102</span>
                                </div>
                                <h4 className="font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">RAG Multi-idioma</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Suporte para ingestão de aulas em inglês e espanhol com legendas automáticas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Próximo */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Próximo (Q2 2026)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-400">MOB-001</span>
                                </div>
                                <h4 className="font-bold mb-2">App Mobile Offline (PWA v2)</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Download real de vídeos criptografados para assistir sem internet.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-400">ANA-300</span>
                                </div>
                                <h4 className="font-bold mb-2">Analytics Preditivo</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Alerta automático de evasão escolar baseado em padrões de login.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-zinc-400">INT-050</span>
                                </div>
                                <h4 className="font-bold mb-2">Webhooks Avançados</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Eventos em tempo real para integrações com CRMs e automações.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Futuro */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Futuro / Pesquisa</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 border-dashed">
                                <h4 className="font-bold mb-2 text-zinc-600 dark:text-zinc-300">Gamificação Multiplayer</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Batalhas de flashcards em tempo real entre alunos.
                                </p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 border-dashed">
                                <h4 className="font-bold mb-2 text-zinc-600 dark:text-zinc-300">Marketplace de Plugins</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Loja de extensões criadas pela comunidade.
                                </p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 border-dashed">
                                <h4 className="font-bold mb-2 text-zinc-600 dark:text-zinc-300">Certificados Blockchain</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Emissão de certificados verificáveis on-chain.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
