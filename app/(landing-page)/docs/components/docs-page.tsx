"use client";

import Link from "next/link";

export function DocsPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased transition-colors duration-200">
            <nav className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center">
                        <div className="flex items-center gap-8">
                            <Link className="flex items-center gap-2" href="/">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold font-display text-xs">
                                    A
                                </div>
                                <span className="font-display font-bold text-sm tracking-tight">Aluminify Docs</span>
                            </Link>
                            <div className="hidden md:flex gap-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
                                <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-700 shadow-sm text-primary dark:text-white">v2.0 (Latest)</span>
                                <a href="#" className="px-2 py-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">v1.5</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <Link className="text-zinc-500 hover:text-primary dark:hover:text-white" href="/">Voltar ao site</Link>
                            <a className="text-zinc-500 hover:text-primary dark:hover:text-white" href="https://github.com/aluminify" target="_blank" rel="noopener noreferrer">GitHub</a>
                            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></div>
                            <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                <span className="material-icons-outlined text-base">search</span>
                                <span className="hidden sm:inline text-xs border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">⌘K</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex max-w-[90rem] mx-auto">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto sidebar-scroll pt-8 pb-10 pl-8 pr-4 bg-background">
                    <div className="space-y-8">
                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-primary dark:text-white mb-3">Getting Started</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#" className="block text-primary dark:text-blue-400 font-medium border-l-2 border-blue-500 pl-3 -ml-3">Introduction</a>
                                </li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Quickstart</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Architecture</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">Deployment</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Docker Compose</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Vercel & Supabase</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Environment Variables</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">White Label</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Theming Guide</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Custom Components</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Email Templates</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">API Reference</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Authentication</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Students</a></li>
                                <li><a href="#" className="block hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">Progress Tracking</a></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 py-10 px-4 sm:px-6 lg:px-8 lg:pr-72">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <span>Docs</span>
                        <span className="material-icons-outlined text-xs">chevron_right</span>
                        <span>Getting Started</span>
                        <span className="material-icons-outlined text-xs">chevron_right</span>
                        <span className="font-medium text-primary dark:text-white">Introduction</span>
                    </div>

                    <h1 className="text-4xl font-display font-bold mb-6 text-primary dark:text-white">Aluminify Documentation</h1>
                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-3xl">
                        Bem-vindo ao Developer Hub. Aqui você aprende como fazer o deploy, customizar e escalar sua própria instância do Aluminify.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        <a href="#" className="p-4 rounded-xl border border-border hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                            <span className="material-icons-outlined text-blue-500 mb-2">rocket_launch</span>
                            <h3 className="font-bold text-primary dark:text-white group-hover:text-blue-500 transition-colors">Quickstart Guide</h3>
                            <p className="text-sm text-muted-foreground mt-1">Coloque sua escola no ar em menos de 10 minutos.</p>
                        </a>
                        <a href="#" className="p-4 rounded-xl border border-border hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
                            <span className="material-icons-outlined text-purple-500 mb-2">palette</span>
                            <h3 className="font-bold text-primary dark:text-white group-hover:text-purple-500 transition-colors">Customização Visual</h3>
                            <p className="text-sm text-muted-foreground mt-1">Aprenda a configurar cores, fontes e logo.</p>
                        </a>
                        <a href="#" className="p-4 rounded-xl border border-border hover:border-green-400 dark:hover:border-green-500 transition-all group">
                            <span className="material-icons-outlined text-green-500 mb-2">api</span>
                            <h3 className="font-bold text-primary dark:text-white group-hover:text-green-500 transition-colors">API Reference</h3>
                            <p className="text-sm text-muted-foreground mt-1">Endpoints REST para integrações externas.</p>
                        </a>
                        <a href="#" className="p-4 rounded-xl border border-border hover:border-orange-400 dark:hover:border-orange-500 transition-all group">
                            <span className="material-icons-outlined text-orange-500 mb-2">school</span>
                            <h3 className="font-bold text-primary dark:text-white group-hover:text-orange-500 transition-colors">Modelagem Pedagógica</h3>
                            <p className="text-sm text-muted-foreground mt-1">Como estruturar trilhas, módulos e aulas.</p>
                        </a>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <h3>Installation</h3>
                        <p>O Aluminify é distribuído como uma aplicação Next.js containerizada. O método recomendado para produção é via Docker.</p>

                        <div className="relative group mt-4 mb-8">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative bg-[#0d1117] rounded-lg border border-border-dark overflow-hidden font-mono text-sm">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border-dark">
                                    <span className="text-xs text-zinc-400">bash</span>
                                    <button className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                                        <span className="material-icons-outlined text-[14px]">content_copy</span>
                                        Copy
                                    </button>
                                </div>
                                <div className="p-4 text-zinc-300">
                                    <span className="text-zinc-500"># Clone o repositório</span><br/>
                                    <span className="text-purple-400">git</span> clone https://github.com/aluminify/core.git<br/><br/>
                                    <span className="text-zinc-500"># Entre na pasta</span><br/>
                                    <span className="text-purple-400">cd</span> aluminify-core<br/><br/>
                                    <span className="text-zinc-500"># Copie as variáveis de ambiente</span><br/>
                                    <span className="text-purple-400">cp</span> .env.example .env.local<br/><br/>
                                    <span className="text-zinc-500"># Inicie com Docker</span><br/>
                                    <span className="text-purple-400">docker-compose</span> up -d
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg mb-8">
                            <h4 className="text-blue-700 dark:text-blue-300 font-bold text-sm mb-1 m-0">Requisito de Banco de Dados</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400 m-0">
                                O Aluminify requer uma instância PostgreSQL v15+ com a extensão <code>pgvector</code> habilitada para as funcionalidades de IA.
                            </p>
                        </div>

                        <h3>Próximos Passos</h3>
                        <p>Agora que você tem o sistema rodando, recomendamos configurar o provedor de autenticação.</p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-border flex justify-between">
                        <div></div>
                        <a href="#" className="flex items-center gap-2 text-right group">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Próximo</div>
                                <div className="text-primary dark:text-white font-bold group-hover:text-blue-500 transition-colors">Configuração de Variáveis</div>
                            </div>
                            <span className="material-icons-outlined text-zinc-400 group-hover:text-blue-500">arrow_forward</span>
                        </a>
                    </div>
                </main>

                {/* Table of Contents */}
                <aside className="hidden xl:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 pt-8 pr-8">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4">On this page</h5>
                    <ul className="space-y-3 text-sm border-l border-border">
                        <li><a href="#" className="block pl-4 text-blue-500 border-l-2 border-blue-500 -ml-px">Introduction</a></li>
                        <li><a href="#" className="block pl-4 text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200">Installation</a></li>
                        <li><a href="#" className="block pl-4 text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200">Requirements</a></li>
                        <li><a href="#" className="block pl-4 text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200">Next Steps</a></li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}
