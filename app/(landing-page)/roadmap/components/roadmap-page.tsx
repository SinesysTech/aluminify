"use client";

import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
import { CheckCircle2, MapPin } from "lucide-react";

export function RoadmapPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased">
            <Nav />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-display font-bold mb-4">Roadmap de Produto</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Acompanhe a evolução do Aluminify. Nossa missão é construir a infraestrutura educacional mais flexível e robusta do mercado.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Concluído */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Concluído (Q1 2026)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">ARCH-2.0</span>
                                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase">Released</span>
                                </div>
                                <h4 className="font-bold mb-2">Arquitetura Modular</h4>
                                <p className="text-sm text-muted-foreground">
                                    Refatoração completa para sistema de módulos isolados (Curso, Usuário, Financeiro) com separação estrita entre visão do aluno e gestão.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">API-2.0</span>
                                </div>
                                <h4 className="font-bold mb-2">API Hierárquica</h4>
                                <p className="text-sm text-muted-foreground">
                                    Nova estrutura de endpoints RESTful padronizada e localizada (/api/usuario, /api/curso), espelhando os módulos funcionais.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">CORE-100</span>
                                </div>
                                <h4 className="font-bold mb-2">Módulos Essenciais</h4>
                                <p className="text-sm text-muted-foreground">
                                    Implementação completa dos módulos de Sala de Estudos, Cronograma Inteligente, Flashcards e Foco (Pomodoro).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Em Desenvolvimento */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Em Desenvolvimento</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">GAME-01</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">Beta</span>
                                </div>
                                <h4 className="font-bold mb-2 text-blue-600 dark:text-blue-400">Gamificação</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Sistema de ranking, badges e recompensas para engajamento do aluno.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">MOB-01</span>
                                </div>
                                <h4 className="font-bold mb-2">Mobile First UX</h4>
                                <p className="text-sm text-muted-foreground">
                                    Otimização completa da Sala de Estudos e Navegação para dispositivos móveis (PWA).
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">ANA-02</span>
                                </div>
                                <h4 className="font-bold mb-2">Analytics Avançado</h4>
                                <p className="text-sm text-muted-foreground">
                                    Dashboards preditivos de desempenho e retenção para gestores.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Futuro */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Planejado (Q3/Q4 2026)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-5 rounded-xl border border-border border-dashed">
                                <h4 className="font-bold mb-2 text-muted-foreground">Modo Offline</h4>
                                <p className="text-sm text-muted-foreground">
                                    Download seguro de conteúdo para estudo sem conexão à internet.
                                </p>
                            </div>
                            <div className="bg-muted/30 p-5 rounded-xl border border-border border-dashed">
                                <h4 className="font-bold mb-2 text-muted-foreground">Comunidade & Social</h4>
                                <p className="text-sm text-muted-foreground">
                                    Fóruns de dúvida contextualizados e interação entre alunos.
                                </p>
                            </div>
                            <div className="bg-muted/30 p-5 rounded-xl border border-border border-dashed">
                                <h4 className="font-bold mb-2 text-muted-foreground">IA Multimodal (Tobias V2)</h4>
                                <p className="text-sm text-muted-foreground">
                                    Tutor capaz de analisar imagens e áudio para dúvidas complexas.
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