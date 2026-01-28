"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
import {
    Github,
    GitFork,
    Server,
    Cloud,
    Code2,
    Book,
    MessageSquare
} from "lucide-react";

export function OpenSourcePage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased transition-colors duration-200">
            <Nav activeLink="opensource" />

            <main>
                {/* Hero Section */}
                <section className="pt-24 pb-20 lg:pt-32 lg:pb-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-size-[40px_40px] opacity-50 z-0 pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8">
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">MIT LICENSE</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
                            Construído em Público.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-black dark:from-zinc-300 dark:to-white">Propriedade Sua.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                            A infraestrutura educacional não deve ser uma caixa preta.
                            O Aluminify Core é livre para inspecionar, modificar e hospedar.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://github.com/SinesysTech/aluminify"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Github className="w-5 h-5" />
                                Star on GitHub
                            </a>
                            <a
                                href="https://github.com/SinesysTech/aluminify/fork"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 bg-background border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2"
                            >
                                <GitFork className="w-5 h-5" />
                                Fork Repository
                            </a>
                        </div>
                    </div>
                </section>

                {/* Deployment Models */}
                <section className="py-24 bg-card border-y border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Escolha sua Jornada</h2>
                            <p className="text-muted-foreground">
                                Liberdade total para quem tem time técnico, facilidade total para quem quer focar no negócio.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Self Hosted */}
                            <div className="bg-background border border-border rounded-xl p-8 flex flex-col hover:border-zinc-400 transition-colors">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-6">
                                    <Server className="w-6 h-6 text-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Self-Hosted</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Para desenvolvedores e equipes de engenharia. Baixe o código, configure seus servidores e rode onde quiser. Sem custos de licença.
                                </p>
                                <div className="font-mono text-xs bg-muted p-4 rounded-lg mb-6 border border-border">
                                    git clone ...<br />
                                    docker-compose up
                                </div>
                                <Link href="/docs" className="text-center py-2 border border-border rounded-lg text-sm font-bold hover:bg-muted transition-colors">
                                    Ler Documentação
                                </Link>
                            </div>

                            {/* Cloud Managed */}
                            <div className="bg-background border border-border rounded-xl p-8 flex flex-col hover:border-blue-400 transition-colors relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                                    Recomendado
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                                    <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Aluminify Cloud</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Para criadores e cursos. Infraestrutura gerenciada, atualizações automáticas, CDN global e suporte prioritário.
                                </p>
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Setup Instantâneo</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Backups Diários</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Segurança Monitorada</span>
                                    </div>
                                </div>
                                <Link href="/pricing" className="text-center py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
                                    Ver Planos Cloud
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contribute Section */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-display font-bold mb-6">Faça parte do Core</h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Aluminify é mantido por um time central e colaboradores ao redor do mundo.
                                    Ajude-nos a democratizar a tecnologia educacional.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a href="https://github.com/SinesysTech/aluminify/issues" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                        <Code2 className="w-5 h-5 text-purple-500" />
                                        <div className="text-sm font-bold">Resolver Issues</div>
                                    </a>
                                    <Link href="/docs" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                        <Book className="w-5 h-5 text-blue-500" />
                                        <div className="text-sm font-bold">Melhorar Docs</div>
                                    </Link>
                                    <a href="https://discord.gg/aluminify" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                                        <div className="text-sm font-bold">Discutir no Discord</div>
                                    </a>
                                </div>
                            </div>
                            <div className="bg-[#0d1117] rounded-xl border border-zinc-800 p-6 shadow-2xl font-mono text-sm">
                                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                                    <span className="text-zinc-400">contributors.ts</span>
                                    <span className="text-zinc-500 text-xs">TypeScript</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-purple-400">const <span className="text-blue-400">contributors</span> = [</div>
                                    <div className="pl-4 text-green-400">&quot;pedro-nexus&quot;<span className="text-zinc-500">,</span></div>
                                    <div className="pl-4 text-green-400">&quot;sarah-dev&quot;<span className="text-zinc-500">,</span></div>
                                    <div className="pl-4 text-green-400">&quot;alex-edu&quot;<span className="text-zinc-500">,</span></div>
                                    <div className="pl-4 text-zinc-500">{`// ...join us!`}</div>
                                    <div className="text-purple-400">];</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}