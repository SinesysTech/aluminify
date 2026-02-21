"use client";

import Link from "next/link";
import {
    BookOpen,
    Layers,
    Terminal,
    Cpu,
    Database,
    Layout,
    Shield,
    Users,
    Search,
    Github,
    ChevronRight,
    Copy,
    Check,
    ArrowRight
} from "lucide-react";
import { useState } from "react";

export function DocsPage() {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-background text-foreground font-sans antialiased transition-colors duration-200">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center">
                        <div className="flex items-center gap-8">
                            <Link className="flex items-center gap-2" href="/">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold font-display text-xs">
                                    A
                                </div>
                                <span className="font-display font-bold text-sm tracking-tight">Aluminify Docs</span>
                            </Link>
                            <div className="hidden md:flex gap-1 text-xs font-medium bg-muted p-1 rounded-md">
                                <span className="px-2 py-0.5 rounded bg-background shadow-sm text-foreground">v2.1 (Modular)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <Link className="text-muted-foreground hover:text-primary transition-colors" href="/">Voltar ao site</Link>
                            <a className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" href="https://github.com/SinesysTech/aluminify" target="_blank" rel="noopener noreferrer">
                                <Github className="w-4 h-4" />
                                <span className="hidden sm:inline">GitHub</span>
                            </a>
                            <div className="h-4 w-px bg-border"></div>
                            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs border border-border rounded px-1.5 py-0.5">⌘K</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex max-w-7xl mx-auto">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto sidebar-scroll pt-8 pb-10 pl-8 pr-4 bg-background">
                    <div className="space-y-8">
                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-primary mb-3">Visão Geral</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#intro" className="block text-primary font-medium border-l-2 border-primary pl-3 -ml-3">Introdução</a>
                                </li>
                                <li><a href="#architecture" className="block hover:text-foreground transition-colors">Arquitetura Modular</a></li>
                                <li><a href="#modules" className="block hover:text-foreground transition-colors">Módulos Funcionais</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">Desenvolvimento</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#setup" className="block hover:text-foreground transition-colors">Instalação</a></li>
                                <li><a href="#conventions" className="block hover:text-foreground transition-colors">Padrões de Código</a></li>
                                <li><a href="#api" className="block hover:text-foreground transition-colors">API Reference</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">White Label</h5>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="block hover:text-foreground transition-colors">Branding</a></li>
                                <li><a href="#" className="block hover:text-foreground transition-colors">Temas</a></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 py-10 px-4 sm:px-6 lg:px-8 lg:pr-12">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <span>Docs</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>Getting Started</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-medium text-foreground">Introdução</span>
                    </div>

                    <section id="intro" className="mb-16">
                        <h1 className="text-4xl font-display font-bold mb-6 text-foreground">Documentação Aluminify</h1>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-3xl">
                            Aluminify é uma plataforma educacional white-label open-source focada na experiência do aluno. 
                            Esta documentação cobre a arquitetura, deployment e desenvolvimento da plataforma.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all group bg-card">
                                <RocketIcon className="w-6 h-6 text-primary mb-2" />
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Quickstart</h3>
                                <p className="text-sm text-muted-foreground mt-1">Coloque seu curso no ar em poucos minutos com Docker.</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all group bg-card">
                                <Layout className="w-6 h-6 text-primary mb-2" />
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Arquitetura</h3>
                                <p className="text-sm text-muted-foreground mt-1">Entenda o padrão de módulos funcionais e route groups.</p>
                            </div>
                        </div>
                    </section>

                    <section id="architecture" className="mb-16">
                        <h2 className="landing-section-title mb-4 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-primary" />
                            Arquitetura Modular
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            O projeto segue uma arquitetura estrita de <strong>Módulos Funcionais</strong> dentro de Route Groups do Next.js.
                            Isso garante isolamento de contexto, escalabilidade e facilidade de manutenção.
                        </p>
                        
                        <div className="bg-muted/50 rounded-lg p-6 border border-border font-mono text-sm mb-6">
                            <div className="text-muted-foreground">app/</div>
                            <div className="pl-4 text-muted-foreground">├── [tenant]/ <span className="text-primary/70"># Contexto do Cliente</span></div>
                            <div className="pl-8 text-foreground">├── (modules)/ <span className="text-primary/70"># Módulos Funcionais (Layout Protegido)</span></div>
                            <div className="pl-12 text-foreground">├── curso/</div>
                            <div className="pl-12 text-foreground">├── usuario/</div>
                            <div className="pl-12 text-foreground">├── financeiro/</div>
                            <div className="pl-12 text-foreground">└── ...</div>
                            <div className="pl-8 text-foreground">└── auth/ <span className="text-primary/70"># Autenticação Pública</span></div>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">Estrutura Interna de um Módulo</h3>
                        <p className="text-muted-foreground mb-4">Cada módulo segue rigorosamente este padrão:</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <li className="border border-border p-3 rounded-lg">
                                <span className="font-mono text-primary font-bold">(aluno)/</span>
                                <p className="text-sm text-muted-foreground mt-1">Rotas e páginas visíveis para o aluno.</p>
                            </li>
                            <li className="border border-border p-3 rounded-lg">
                                <span className="font-mono text-primary font-bold">(gestao)/</span>
                                <p className="text-sm text-muted-foreground mt-1">Área administrativa (Professores e Staff).</p>
                            </li>
                            <li className="border border-border p-3 rounded-lg">
                                <span className="font-mono text-primary font-bold">components/</span>
                                <p className="text-sm text-muted-foreground mt-1">Componentes de UI isolados do módulo.</p>
                            </li>
                            <li className="border border-border p-3 rounded-lg">
                                <span className="font-mono text-primary font-bold">services/</span>
                                <p className="text-sm text-muted-foreground mt-1">Lógica de negócio e acesso a dados.</p>
                            </li>
                        </ul>
                    </section>

                    <section id="modules" className="mb-16">
                        <h2 className="landing-section-title mb-6 flex items-center gap-2">
                            <Cpu className="w-6 h-6 text-primary" />
                            Módulos Funcionais
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ModuleCard 
                                icon={<BookOpen className="w-5 h-5" />}
                                title="Curso"
                                description="Gestão acadêmica completa: Segmentos, Disciplinas, Frentes, Módulos e Conteúdos."
                            />
                            <ModuleCard 
                                icon={<Users className="w-5 h-5" />}
                                title="Usuário"
                                description="Gestão de Alunos, Professores e Staff, incluindo matrículas e permissões."
                            />
                            <ModuleCard 
                                icon={<Shield className="w-5 h-5" />}
                                title="Empresa"
                                description="Configurações do Tenant, personalização white-label e integrações."
                            />
                            <ModuleCard 
                                icon={<Terminal className="w-5 h-5" />}
                                title="Sala de Estudos"
                                description="Ambiente de execução do aluno: Player de aulas, atividades e progresso."
                            />
                        </div>
                    </section>

                    <section id="setup" className="mb-16">
                        <h2 className="landing-section-title mb-4 flex items-center gap-2">
                            <Terminal className="w-6 h-6 text-primary" />
                            Instalação
                        </h2>
                        <p className="text-muted-foreground mb-4">O método recomendado para desenvolvimento e produção é via Docker.</p>

                        <div className="relative group mt-4 mb-8">
                            <div className="absolute -inset-1 bg-linear-to-r from-primary/50 to-purple-600/50 rounded-lg blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden font-mono text-sm">
                                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                                    <span className="text-xs text-zinc-400">bash</span>
                                    <button 
                                        onClick={() => copyToClipboard("git clone https://github.com/SinesysTech/aluminify.git\ncd aluminify\ncp .env.example .env.local\ndocker-compose up -d")}
                                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="p-4 text-zinc-300 overflow-x-auto">
                                    <span className="text-zinc-500"># Clone o repositório</span><br />
                                    <span className="text-purple-400">git</span> clone https://github.com/SinesysTech/aluminify.git<br /><br />
                                    <span className="text-zinc-500"># Entre na pasta</span><br />
                                    <span className="text-purple-400">cd</span> aluminify-core<br /><br />
                                    <span className="text-zinc-500"># Configure ambiente</span><br />
                                    <span className="text-purple-400">cp</span> .env.example .env.local<br /><br />
                                    <span className="text-zinc-500"># Inicie com Docker</span><br />
                                    <span className="text-purple-400">docker-compose</span> up -d
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="api" className="mb-16">
                        <h2 className="landing-section-title mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-primary" />
                            API Reference
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            A API foi reestruturada para espelhar a organização dos módulos, utilizando rotas em português e hierárquicas.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Módulo</th>
                                        <th className="px-4 py-3">Rota Base</th>
                                        <th className="px-4 py-3">Descrição</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    <tr className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">Usuário</td>
                                        <td className="px-4 py-3 font-mono text-primary">/api/usuario</td>
                                        <td className="px-4 py-3 text-muted-foreground">Alunos, Professores, Perfil</td>
                                    </tr>
                                    <tr className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">Curso</td>
                                        <td className="px-4 py-3 font-mono text-primary">/api/curso</td>
                                        <td className="px-4 py-3 text-muted-foreground">Estrutura curricular completa</td>
                                    </tr>
                                    <tr className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">Empresa</td>
                                        <td className="px-4 py-3 font-mono text-primary">/api/empresa</td>
                                        <td className="px-4 py-3 text-muted-foreground">Configurações do Tenant</td>
                                    </tr>
                                    <tr className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">Sala de Estudos</td>
                                        <td className="px-4 py-3 font-mono text-primary">/api/sala-de-estudos</td>
                                        <td className="px-4 py-3 text-muted-foreground">Atividades e Progresso</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="mt-16 pt-8 border-t border-border flex justify-between">
                        <div></div>
                        <a href="https://github.com/SinesysTech/aluminify" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-right group">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Próximo</div>
                                <div className="text-foreground font-bold group-hover:text-primary transition-colors">Repositório GitHub</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                    </div>
                </main>

                {/* TOC Sidebar */}
                <aside className="hidden xl:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 pt-8 pr-8">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4">Nesta página</h5>
                    <ul className="space-y-3 text-sm border-l border-border">
                        <li><a href="#intro" className="block pl-4 text-primary border-l-2 border-primary -ml-px">Introdução</a></li>
                        <li><a href="#architecture" className="block pl-4 text-muted-foreground hover:text-foreground transition-colors">Arquitetura</a></li>
                        <li><a href="#modules" className="block pl-4 text-muted-foreground hover:text-foreground transition-colors">Módulos</a></li>
                        <li><a href="#setup" className="block pl-4 text-muted-foreground hover:text-foreground transition-colors">Instalação</a></li>
                        <li><a href="#api" className="block pl-4 text-muted-foreground hover:text-foreground transition-colors">API</a></li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}

function RocketIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    )
}

function ModuleCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    )
}