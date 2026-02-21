"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
import {
    Github,
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
                            Gratuito e seu.<br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-600 to-black dark:from-zinc-300 dark:to-white">Para sempre.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                            O Aluminify é código aberto. Isso significa que você pode usar de graça,
                            sem depender de ninguém, e ter controle total sobre seus dados e sua plataforma.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://github.com/SinesysTech/aluminify"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Github className="w-5 h-5" />
                                Ver no GitHub
                            </a>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-8 py-3.5 bg-background border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                            >
                                Ver planos
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Deployment Models */}
                <section className="py-24 bg-card border-y border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Como você quer usar?</h2>
                            <p className="text-muted-foreground">
                                Você decide: instala por conta própria ou a gente cuida de tudo pra você.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Self Hosted */}
                            <div className="bg-background border border-border rounded-xl p-8 flex flex-col hover:border-zinc-400 transition-colors">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-6">
                                    <Server className="w-6 h-6 text-foreground" />
                                </div>
                                <h3 className="landing-card-title mb-2">Instalação própria</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Se você tem alguém que entende de tecnologia (um sobrinho, um técnico), pode instalar de graça no seu próprio servidor. Controle total.
                                </p>
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>100% gratuito</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Você é o dono</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                                        <span>Precisa de conhecimento técnico</span>
                                    </div>
                                </div>
                                <Link href="/docs" className="text-center py-2 border border-border rounded-lg text-sm font-bold hover:bg-muted transition-colors">
                                    Ver instruções
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
                                <h3 className="landing-card-title mb-2">Nuvem Aluminify</h3>
                                <p className="text-muted-foreground mb-6 flex-1">
                                    Para quem quer focar no curso, não na tecnologia. A gente cuida de tudo: instalação, atualização, segurança e backup.
                                </p>
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Começa em minutos</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Seus dados sempre seguros</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span>Suporte quando precisar</span>
                                    </div>
                                </div>
                                <Link href="/pricing" className="text-center py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
                                    Ver planos
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comunidade Section */}
                <section className="py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center">
                            <h2 className="text-3xl font-display font-bold mb-6">Faça parte da comunidade</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                Professores e desenvolvedores de todo o Brasil estão construindo o Aluminify juntos.
                                Tire dúvidas, sugira melhorias ou apenas acompanhe as novidades.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <a href="https://github.com/SinesysTech/aluminify" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                    <Code2 className="w-5 h-5 text-purple-500" />
                                    <div className="text-sm font-bold">Código no GitHub</div>
                                </a>
                                <Link href="/docs" className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                    <Book className="w-5 h-5 text-blue-500" />
                                    <div className="text-sm font-bold">Documentação</div>
                                </Link>
                                <a href="https://discord.gg/aluminify" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                                    <div className="text-sm font-bold">Comunidade Discord</div>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}