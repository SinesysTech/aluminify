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
                    <h1 className="text-4xl font-display font-bold mb-4">O que vem por aí</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Veja o que já lançamos e o que estamos preparando para tornar seu curso ainda melhor.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Concluído */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Já disponível</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase">Lançado</span>
                                </div>
                                <h4 className="font-bold mb-2">Sistema completo</h4>
                                <p className="text-sm text-muted-foreground">
                                    Área do aluno, área administrativa, gestão de matrículas e pagamentos — tudo funcionando e integrado.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <h4 className="font-bold mb-2">Área do Aluno</h4>
                                <p className="text-sm text-muted-foreground">
                                    Sala de estudos com vídeo-aulas, flashcards para memorização, cronograma de estudos e modo foco.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <h4 className="font-bold mb-2">Gestão Administrativa</h4>
                                <p className="text-sm text-muted-foreground">
                                    Painel separado para você gerenciar turmas, alunos, professores e acompanhar relatórios.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Em Desenvolvimento */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Em desenvolvimento</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">Em teste</span>
                                </div>
                                <h4 className="font-bold mb-2 text-blue-600 dark:text-blue-400">Pontos e conquistas</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Seus alunos ganham pontos, sobem de nível e desbloqueiam conquistas. Mais motivação para estudar!
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <h4 className="font-bold mb-2">Melhor no celular</h4>
                                <p className="text-sm text-muted-foreground">
                                    Estamos deixando a experiência no celular ainda melhor para seus alunos estudarem de qualquer lugar.
                                </p>
                            </div>

                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <h4 className="font-bold mb-2">Relatórios inteligentes</h4>
                                <p className="text-sm text-muted-foreground">
                                    Veja quais alunos estão ficando para trás e receba alertas automáticos para agir a tempo.
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