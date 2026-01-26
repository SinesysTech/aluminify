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
                                Sistema Operacional Educacional
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 text-foreground max-w-4xl mx-auto">
                            Uma suíte completa de <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
                                Módulos Nativos.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                            Esqueça integrações remendadas. O Aluminify oferece uma experiência unificada
                            onde cada módulo — do player de vídeo ao sistema financeiro — fala a mesma língua.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span>Performance Edge</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>Segurança Enterprise</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <WifiOff className="w-4 h-4 text-blue-500" />
                                <span>Offline-First</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Modules Grid */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Núcleo Acadêmico</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Ferramentas poderosas projetadas para maximizar a retenção e o aprendizado.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Sala de Estudos */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Sala de Estudos Imersiva</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Player de vídeo focado, sem distrações. Suporte a materiais complementares, anotações sincronizadas e modo teatro.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Resumo Automático (IA)
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Navegação por Atalhos
                                    </li>
                                </ul>
                            </div>

                            {/* Flashcards */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Flashcards Inteligentes</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Sistema de Repetição Espaçada (SRS) integrado. O aluno revisa o conteúdo certo na hora certa para fixação de longo prazo.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Algoritmo SM-2
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Criação via IA
                                    </li>
                                </ul>
                            </div>

                            {/* Agendamentos */}
                            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Mentorias e Agenda</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    Sistema completo de agendamento para mentorias individuais ou em grupo. Sincronização com Google Calendar e Zoom.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Gestão de Fuso Horário
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3 h-3 text-green-500" /> Links Automáticos
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
                                    <span className="text-xs font-medium text-foreground">Backoffice</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                                    Gestão Administrativa <br /> sem dor de cabeça.
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Uma área de gestão separada e segura. Controle matrículas, financeiro e configurações do tenant em um painel dedicado.
                                </p>
                                
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">Gestão de Usuários e Papéis</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Controle granular de permissões (RBAC). Convide professores, monitores e administradores com acessos específicos.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">Estrutura Curricular Flexível</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Organize cursos em segmentos, disciplinas, frentes e módulos. Adapte a plataforma à sua metodologia, não o contrário.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl blur-lg opacity-50"></div>
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

                {/* Technical Features */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-display font-bold mb-12">Excelência Técnica</h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">99%</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lighthouse Score</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">&lt;100ms</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">TTFB Global</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">100%</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type Safe</div>
                            </div>
                            <div className="p-6 bg-card border border-border rounded-xl text-center">
                                <div className="text-3xl font-bold mb-2">PWA</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Installable</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}