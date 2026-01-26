"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";

export function OpenSourcePage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased transition-colors duration-200">
            <Nav activeLink="opensource" />

            <main>
                {/* Hero Section */}
                <section className="pt-20 pb-16 lg:pt-28 lg:pb-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 z-0 pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8">
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">LICENSE: APACHE 2.0</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
                            Auditável. Customizável. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 to-black dark:from-zinc-300 dark:to-white">Seu.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
                            Acreditamos que a infraestrutura educacional não deve ser uma caixa preta.
                            O Aluminify é construído em público, para que você tenha controle total sobre seus dados e destino.
                        </p>

                        {/* Terminal */}
                        <div className="max-w-3xl mx-auto rounded-xl overflow-hidden bg-[#1e1e1e] text-left border border-zinc-700 shadow-2xl">
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d] border-b border-zinc-700">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                </div>
                                <div className="text-xs text-zinc-400 ml-2 font-mono">bash — 80x24</div>
                            </div>
                            <div className="p-6 font-mono text-sm text-zinc-300">
                                <div className="mb-2">
                                    <span className="text-green-400">➜</span>{" "}
                                    <span className="text-blue-400">~</span> git clone https://github.com/aluminify/core.git
                                </div>
                                <div className="mb-2 text-zinc-500">
                                    Cloning into &apos;aluminify-core&apos;...<br />
                                    remote: Enumerating objects: 4520, done.<br />
                                    remote: Total 4520 (delta 120), reused 320 (delta 80)
                                </div>
                                <div className="mb-2">
                                    <span className="text-green-400">➜</span>{" "}
                                    <span className="text-blue-400">~</span> cd aluminify-core && npm install
                                </div>
                                <div className="mb-2 text-zinc-500">added 1420 packages in 23s</div>
                                <div>
                                    <span className="text-green-400">➜</span>{" "}
                                    <span className="text-blue-400">~</span>{" "}
                                    <span className="animate-pulse">_</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stack Section */}
                <section className="py-20 lg:py-24 bg-card border-y border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Stack Moderna</h2>
                            <p className="text-muted-foreground">
                                Escolhemos as tecnologias que definem a web moderna.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="p-6 rounded-xl bg-background border border-border flex flex-col items-center justify-center gap-4 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-default group">
                                <div className="w-12 h-12 bg-white dark:bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <span className="font-bold text-black text-xs">N</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">Next.js 15</h3>
                                    <p className="text-xs text-muted-foreground mt-1">App Router & Server Actions</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-background border border-border flex flex-col items-center justify-center gap-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-default group">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                    <span className="material-icons-outlined text-blue-500">palette</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">Tailwind CSS</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Utility-First Styling</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-background border border-border flex flex-col items-center justify-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-default group">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center">
                                    <span className="material-icons-outlined text-indigo-500">storage</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">PostgreSQL</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Supabase Ready</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-background border border-border flex flex-col items-center justify-center gap-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-default group">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center">
                                    <span className="material-icons-outlined text-blue-600">layers</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold">Docker</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Containerized Deploy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Architecture Section */}
                <section className="py-20 lg:py-24 bg-background">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-display font-bold mb-12">Arquitetura do Sistema</h2>

                        <div className="relative p-8 border border-border rounded-2xl bg-white dark:bg-surface-dark overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">
                                {/* Client */}
                                <div className="flex flex-col items-center gap-4 w-full md:w-1/4">
                                    <div className="w-full p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center shadow-sm">
                                        <span className="material-icons-outlined text-3xl mb-2 text-zinc-400">laptop_mac</span>
                                        <h4 className="font-bold text-sm">Client Browser</h4>
                                        <p className="text-[10px] text-zinc-500">React SPA</p>
                                    </div>
                                </div>

                                {/* Connector */}
                                <div className="hidden md:flex flex-col items-center w-16">
                                    <div className="h-px w-full bg-zinc-300 dark:bg-zinc-600"></div>
                                    <span className="text-[10px] text-zinc-400 -mt-2 bg-white dark:bg-surface-dark px-1">HTTPS</span>
                                </div>
                                <div className="md:hidden h-8 w-px bg-zinc-300 dark:bg-zinc-600"></div>

                                {/* Server */}
                                <div className="flex flex-col items-center gap-4 w-full md:w-1/3 p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Vercel / Docker Edge</span>

                                    <div className="w-full p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-mono font-bold">API Route</span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </div>
                                    <div className="w-full p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-mono font-bold">Middleware</span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </div>
                                    <div className="w-full p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between shadow-sm">
                                        <span className="text-xs font-mono font-bold">RAG Engine</span>
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                    </div>
                                </div>

                                {/* Connector */}
                                <div className="hidden md:flex flex-col items-center w-16">
                                    <div className="h-px w-full bg-zinc-300 dark:bg-zinc-600"></div>
                                    <span className="text-[10px] text-zinc-400 -mt-2 bg-white dark:bg-surface-dark px-1">TCP</span>
                                </div>
                                <div className="md:hidden h-8 w-px bg-zinc-300 dark:bg-zinc-600"></div>

                                {/* Database */}
                                <div className="flex flex-col items-center gap-4 w-full md:w-1/4">
                                    <div className="w-full p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center shadow-sm relative">
                                        <span className="material-icons-outlined text-3xl mb-2 text-indigo-400">dns</span>
                                        <h4 className="font-bold text-sm">Database</h4>
                                        <p className="text-[10px] text-zinc-500">Postgres + Vector</p>
                                        <div className="absolute -bottom-2 -right-2 w-full h-full border-r-2 border-b-2 border-zinc-200 dark:border-zinc-700 rounded-lg -z-10"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Community Section */}
                <section className="py-20 lg:py-24 border-t border-border bg-card">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-display font-bold mb-6">Construa com a comunidade</h2>
                        <p className="text-muted-foreground mb-10">
                            Junte-se a outros desenvolvedores e escolas que estão moldando o futuro do LMS open source.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <a
                                href="https://github.com/aluminify/core/discussions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-6 rounded-xl border border-border hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                                    <span className="material-icons-outlined">code</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg group-hover:text-primary dark:group-hover:text-white transition-colors">GitHub Discussions</h4>
                                    <p className="text-sm text-muted-foreground">Reporte bugs e sugira features.</p>
                                </div>
                            </a>
                            <a
                                href="https://discord.gg/aluminify"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-6 rounded-xl border border-border hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                                    <span className="material-icons-outlined">chat_bubble_outline</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Discord Community</h4>
                                    <p className="text-sm text-muted-foreground">Converse em tempo real com o time.</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
