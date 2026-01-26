"use client";

import Link from "next/link";
import { Nav } from "./nav";
import { Footer } from "./footer";
import {
    ArrowRight,
    Github,
    Layout,
    Zap,
    Shield,
    Play,
    BookOpen,
    Users
} from "lucide-react";

export function LandingPage() {
    return (
        <div
            className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 transition-colors duration-200 flex flex-col"
            style={{
                // Landing page uses neutral/professional colors independent of tenant theme
                '--primary': 'hsl(240 5.9% 10%)',
                '--primary-foreground': 'hsl(0 0% 98%)',
                '--background': 'hsl(0 0% 100%)',
                '--foreground': 'hsl(240 10% 3.9%)',
                '--card': 'hsl(0 0% 100%)',
                '--card-foreground': 'hsl(240 10% 3.9%)',
                '--muted': 'hsl(240 4.8% 95.9%)',
                '--muted-foreground': 'hsl(240 3.8% 46.1%)',
                '--border': 'hsl(240 5.9% 90%)',
            } as React.CSSProperties}
        >
            <Nav />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    {/* Background Grid */}
                    <div
                        className="absolute inset-0 -z-10 h-full w-full"
                        style={{
                            backgroundColor: 'hsl(0 0% 100%)',
                            backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)',
                            backgroundSize: '4rem 4rem',
                        }}
                    >
                        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mb-8 animate-fade-in-up">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs font-medium text-muted-foreground">
                                v2.2 Beta Disponível
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-8 text-foreground max-w-5xl mx-auto leading-[1.1]">
                            A infraestrutura invisível <br className="hidden md:block" /> da sua escola.
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
                            A primeira área do aluno <strong>Open Source</strong> e White Label projetada para escala.
                            Do vídeo ao financeiro, sem amarras.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                            <Link
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                href="/signup"
                            >
                                Começar Agora
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                className="w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2 group"
                                href="https://github.com/aluminify"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                Star on GitHub
                            </a>
                        </div>

                        {/* App Screenshot Mockup */}
                        <div className="relative max-w-6xl mx-auto rounded-xl border border-border bg-card/50 shadow-2xl backdrop-blur-sm overflow-hidden aspect-video group">
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none"></div>
                            
                            {/* Browser Header */}
                            <div className="border-b border-border bg-muted/50 p-3 flex items-center gap-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                                <div className="h-6 w-full max-w-md bg-background rounded-md border border-border flex items-center px-3 mx-auto">
                                    <span className="text-[10px] text-muted-foreground font-mono">aluno.suaescola.com.br/dashboard</span>
                                </div>
                            </div>

                            {/* Dashboard UI Simulation */}
                            <div className="flex h-full text-left">
                                {/* Sidebar */}
                                <div className="w-64 border-r border-border bg-card p-4 hidden md:flex flex-col gap-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-primary rounded-lg"></div>
                                        <div className="h-4 w-24 bg-muted rounded"></div>
                                    </div>
                                    <div className="space-y-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={`h-10 rounded-lg flex items-center px-3 gap-3 ${i === 1 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                                                <div className="w-4 h-4 rounded-sm bg-current opacity-20"></div>
                                                <div className="h-2 w-20 bg-current opacity-20 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 bg-background/50">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <div className="h-8 w-48 bg-foreground/10 rounded mb-2"></div>
                                            <div className="h-4 w-64 bg-muted rounded"></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted border border-border"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mb-8">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-32 rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 mb-2"></div>
                                                <div className="h-4 w-24 bg-muted rounded"></div>
                                                <div className="h-8 w-16 bg-foreground/10 rounded"></div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-64 rounded-xl border border-border bg-card relative overflow-hidden flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-700">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                                        <Play className="w-16 h-16 text-primary opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 border-t border-border bg-card/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Layout className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold">Design System Nativo</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Componentes React otimizados e acessíveis. Personalize cores, 
                                    fontes e bordas através de variáveis CSS simples.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold">Edge Performance</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Renderizado no Edge com Next.js 15. Carregamento instantâneo
                                    e otimização automática de imagens e vídeos.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold">Soberania de Dados</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Hospede onde quiser (AWS, Vercel, VPS). Banco de dados Postgres
                                    com schema aberto e documentado.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bento Grid Teaser */}
                <section className="py-24 bg-background border-t border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                Tudo o que sua escola precisa.
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Modular e extensível. Comece com o básico e ative funcionalidades
                                avançadas conforme cresce.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                            <div className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Sala de Estudos</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Player de vídeo imersivo com anotações, chat e materiais de apoio integrados em uma única interface.
                                    </p>
                                </div>
                                <div className="relative z-10 mt-8 rounded-lg border border-border bg-background shadow-lg h-64 w-full overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                        <Play className="w-12 h-12 text-primary opacity-80" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                <div>
                                    <BookOpen className="w-10 h-10 text-primary mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Conteúdo</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Estrutura flexível de cursos, módulos e aulas.
                                    </p>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="h-2 w-full bg-muted rounded overflow-hidden">
                                        <div className="h-full w-3/4 bg-primary rounded"></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progresso</span>
                                        <span>75%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                <div>
                                    <Users className="w-10 h-10 text-primary mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Comunidade</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Fóruns, comentários e grupos de estudo.
                                    </p>
                                </div>
                                <div className="flex -space-x-2 mt-4">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-muted"></div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold">+40</div>
                                </div>
                            </div>

                            <div className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Analytics & Financeiro</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Visão 360º do seu negócio. Acompanhe engajamento, retenção e receita em tempo real.
                                    </p>
                                </div>
                                <div className="relative z-10 mt-8 flex gap-4 items-end h-32">
                                    {[40, 60, 45, 80, 55, 70, 90].map((h, i) => (
                                        <div key={i} className="flex-1 bg-primary/20 rounded-t-lg group-hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 border-t border-border bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                            Pronto para evoluir?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10">
                            Junte-se a centenas de escolas que já estão construindo o futuro da educação com Aluminify.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/signup"
                                className="w-full sm:w-auto px-8 py-4 bg-foreground text-background font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                Criar Conta Grátis
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full sm:w-auto px-8 py-4 bg-background border border-border font-bold rounded-lg hover:bg-muted transition-all"
                            >
                                Falar com Vendas
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}