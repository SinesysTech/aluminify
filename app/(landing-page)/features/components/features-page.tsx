"use client";

import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
import { 
    BookOpen, 
    Users, 
    Calendar, 
    BrainCircuit, 
    LayoutDashboard, 
    Zap, 
    Shield, 
    WifiOff,
    Check
} from "lucide-react";

export function FeaturesPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
            <Nav activeLink="produto" />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-24 pb-20 lg:pt-32 lg:pb-24 border-b border-border bg-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-[0.4] grid-bg"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Tudo em um só lugar
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 text-foreground max-w-4xl mx-auto">
                            Seu curso online <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
                                completo e organizado.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                            Chega de ficar juntando várias ferramentas. O Aluminify já vem com tudo pronto:
                            área do aluno, vídeo-aulas, materiais, pagamentos e relatórios — tudo integrado.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span>Carrega rápido</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>Dados protegidos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <WifiOff className="w-4 h-4 text-blue-500" />
                                <span>Funciona offline</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Modules Grid */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Para seus alunos aprenderem melhor</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Ferramentas que ajudam seus alunos a estudar com mais foco e a lembrar do conteúdo por mais tempo.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Sala de Estudos */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                                    <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Área do Aluno Focada</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Seus alunos assistem às aulas sem distrações. Podem baixar materiais, fazer anotações e acompanhar o progresso.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Resumo automático das aulas
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Materiais em PDF junto ao vídeo
                                    </li>
                                </ul>
                            </div>

                            {/* Flashcards */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                                    <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Flashcards para Memorização</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Seus alunos revisam o conteúdo no momento certo para não esquecer. O sistema avisa quando é hora de revisar.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Revisão inteligente
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> IA cria os cards para você
                                    </li>
                                </ul>
                            </div>

                            {/* Agendamentos */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Agendamento de Aulas</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Marque monitorias, plantões de dúvidas ou aulas particulares. Conecta com Google Agenda e Zoom automaticamente.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Lembretes automáticos
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Link da aula enviado na hora
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Management Section */}
                <section className="py-24 bg-card border-y border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6">
                                    <span className="text-xs font-medium text-foreground">Área Administrativa</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                                    Administre seu curso <br /> sem complicação.
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Tudo que você precisa para gerenciar: matrículas, pagamentos, relatórios de desempenho — em um painel simples e organizado.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">Gerencie sua equipe</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Adicione outros professores, monitores e secretários. Cada um acessa só o que precisa.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">Organize do seu jeito</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Monte suas turmas, disciplinas e módulos como preferir. A plataforma se adapta à sua metodologia.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 bg-linear-to-tr from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl blur-lg opacity-50"></div>
                                <div className="relative bg-background border border-border rounded-xl shadow-2xl overflow-hidden aspect-4/3 flex flex-col">
                                    {/* Mockup UI */}
                                    <div className="border-b border-border p-3 flex items-center gap-2 bg-muted/30">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="flex-1 flex">
                                        <div className="w-48 border-r border-border p-4 space-y-2 hidden md:block">
                                            <div className="h-2 w-20 bg-muted rounded mb-4"></div>
                                            <div className="h-8 w-full bg-primary/10 rounded"></div>
                                            <div className="h-8 w-full bg-muted/20 rounded"></div>
                                            <div className="h-8 w-full bg-muted/20 rounded"></div>
                                        </div>
                                        <div className="flex-1 p-6">
                                            <div className="flex justify-between mb-6">
                                                <div className="h-6 w-32 bg-foreground/10 rounded"></div>
                                                <div className="h-8 w-24 bg-primary rounded"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-12 w-full border border-border rounded bg-card"></div>
                                                <div className="h-12 w-full border border-border rounded bg-card"></div>
                                                <div className="h-12 w-full border border-border rounded bg-card"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefícios Práticos */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-display font-bold mb-12">Feito para funcionar bem</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">Rápido</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Carrega em segundos</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">Seguro</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Seus dados protegidos</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">Estável</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sempre no ar</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">Mobile</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Funciona no celular</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}