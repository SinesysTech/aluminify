"use client";

import Link from "next/link";

export function LandingPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-[0.4] grid-bg"></div>
            </div>

            <nav className="sticky top-0 z-50 w-full border-b border-border-light/80 dark:border-border-dark/80 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-8">
                            <Link className="flex items-center gap-2" href="/">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-display text-xl">
                                    A
                                </div>
                                <span className="font-display font-bold text-lg tracking-tight">
                                    Aluminify
                                </span>
                            </Link>
                            <div className="hidden md:flex gap-6 text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
                                <a
                                    className="hover:text-primary dark:hover:text-white transition-colors"
                                    href="#recursos"
                                >
                                    Recursos
                                </a>
                                <a
                                    className="hover:text-primary dark:hover:text-white transition-colors"
                                    href="#manifesto"
                                >
                                    Manifesto
                                </a>
                                <Link
                                    className="hover:text-primary dark:hover:text-white transition-colors"
                                    href="/pricing"
                                >
                                    Planos
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <a
                                className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-white transition-colors hidden sm:block"
                                href="/login.html"
                            >
                                Login
                            </a>
                            <a
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-zinc-300 dark:shadow-none"
                                href="/signup.html"
                            >
                                Criar Instância
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                LMS v2.0 Beta Disponível
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 text-primary dark:text-white">
                            A infraestrutura invisível <br className="hidden md:block" /> da educação.
                        </h1>

                        <p className="text-lg md:text-xl text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
                            O primeiro <strong>LMS Open Source</strong> desenhado para cursos de alta performance.
                            Tenha a tecnologia das grandes plataformas, com a sua marca e controle total sobre seus alunos.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <a
                                className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 dark:shadow-none"
                                href="/signup.html"
                            >
                                Começar Agora
                                <span className="material-icons-outlined text-sm">arrow_forward</span>
                            </a>
                            <a
                                className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group"
                                href="https://github.com/aluminify"
                            >
                                <svg
                                    className="w-5 h-5 text-zinc-500 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                Ver no GitHub
                            </a>
                        </div>

                        <div className="relative max-w-5xl mx-auto">
                            <div className="absolute -inset-1 bg-linear-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 rounded-xl blur opacity-40"></div>

                            <div className="relative bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl overflow-hidden aspect-16/10 md:aspect-video flex flex-col">
                                <div className="border-b border-border-light dark:border-border-dark bg-zinc-50 dark:bg-zinc-900/50 p-3 flex items-center gap-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="h-7 w-full max-w-lg bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 flex items-center px-3 text-[11px] text-zinc-400 font-mono shadow-sm mx-auto">
                                        <span className="material-icons-outlined text-[12px] mr-2">lock</span>
                                        https://aluno.seupreparatorio.com.br
                                    </div>
                                </div>

                                <div className="flex-1 flex overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
                                    <div className="w-14 md:w-56 border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hidden sm:flex flex-col p-4 justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white text-sm font-bold font-display">A</div>
                                                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded hidden md:block"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-9 bg-zinc-100 dark:bg-zinc-800/50 rounded flex items-center px-2 gap-3 border border-zinc-200 dark:border-zinc-700">
                                                    <span className="material-icons-outlined text-sm text-primary">dashboard</span>
                                                    <div className="h-2 w-20 bg-zinc-300 dark:bg-zinc-600 rounded hidden md:block"></div>
                                                </div>
                                                <div className="h-9 flex items-center px-2 gap-3 text-zinc-400">
                                                    <span className="material-icons-outlined text-sm">library_books</span>
                                                    <div className="h-2 w-16 bg-zinc-100 dark:bg-zinc-800 rounded hidden md:block"></div>
                                                </div>
                                                <div className="h-9 flex items-center px-2 gap-3 text-zinc-400">
                                                    <span className="material-icons-outlined text-sm">style</span>
                                                    <div className="h-2 w-14 bg-zinc-100 dark:bg-zinc-800 rounded hidden md:block"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                                            <div className="hidden md:block space-y-1">
                                                <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                                                <div className="h-1.5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col gap-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2"></div>
                                                <div className="h-3 w-64 bg-zinc-100 dark:bg-zinc-900 rounded"></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                            <div className="col-span-2 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-0 overflow-hidden flex flex-col">
                                                <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center">
                                                    <span className="material-icons-outlined text-4xl text-zinc-300 dark:text-zinc-600">play_circle</span>
                                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1 rounded font-mono">12:40</div>
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        <div className="h-2 w-16 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                                                    </div>
                                                    <div className="h-4 w-3/4 bg-zinc-800 dark:bg-zinc-200 rounded mb-2"></div>
                                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded mb-4">
                                                        <div className="h-full w-1/3 bg-blue-500 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-8 -mt-8"></div>
                                                <span className="material-icons-outlined text-3xl text-red-500 mb-2">style</span>
                                                <div className="h-3 w-16 bg-zinc-800 dark:bg-white rounded mb-1"></div>
                                                <div className="h-2 w-10 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-border-light dark:border-border-dark" id="manifesto">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <span className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase mb-6 block">Nossa Filosofia</span>

                        <h2 className="text-3xl md:text-4xl font-display font-bold text-primary dark:text-white mb-8 leading-tight">
                            Ensinar é, antes de tudo, <br className="hidden md:block" /> um ato de autonomia.
                        </h2>

                        <div className="prose prose-zinc dark:prose-invert mx-auto text-text-muted-light dark:text-text-muted-dark leading-relaxed text-lg max-w-2xl">
                            <p>
                                Quando você fecha a porta da sala de aula, aquele espaço é seu. A didática é sua. A conexão é sua. Mas, no digital, tentaram convencer você a abrir mão disso.
                            </p>
                            <p>
                                Disseram que, para ensinar online, você precisava alugar um terreno em plataformas que não são suas. Nós discordamos. O Aluminify nasceu para devolver a soberania à sua instituição.
                            </p>
                        </div>

                        <div className="mt-10">
                            <Link href="/manifesto" className="inline-flex items-center gap-2 text-primary dark:text-white font-medium border-b border-primary dark:border-white pb-0.5 hover:opacity-70 transition-opacity group">
                                Ler manifesto completo
                                <span className="material-icons-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-white dark:bg-background-dark" id="recursos">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="group">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">
                                        verified_user
                                    </span>
                                </div>
                                <h3 className="text-xl font-display font-semibold mb-3">
                                    Soberania de Dados
                                </h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    Sua lista de alunos é o ativo mais valioso da sua instituição. Aqui, o banco de dados é seu, sem intermediários ou bloqueios.
                                </p>
                            </div>
                            <div className="group">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">
                                        branding_watermark
                                    </span>
                                </div>
                                <h3 className="text-xl font-display font-semibold mb-3">
                                    Sua Marca em 1º Lugar
                                </h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    O aluno acessa o <strong>seu domínio</strong> (ex: aluno.seucurso.com). Personalize cores, logos e identidade. Nós somos o palco invisível.
                                </p>
                            </div>
                            <div className="group">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">
                                        psychology
                                    </span>
                                </div>
                                <h3 className="text-xl font-display font-semibold mb-3">
                                    Monitoria com IA
                                </h3>
                                <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                                    Um tutor digital treinado *apenas* com as suas apostilas e aulas. Ele tira dúvidas dos alunos 24h usando a sua metodologia.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-24 border-t border-border-light dark:border-border-dark bg-white dark:bg-background-dark">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Escolha o modelo ideal</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-8 border border-border-light dark:border-border-dark flex flex-col h-full">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold mb-2">Comunidade</h3>
                                    <div className="text-sm text-text-muted-light dark:text-text-muted-dark font-mono">SELF-HOSTED</div>
                                </div>
                                <div className="text-4xl font-bold mb-6">R$ 0<span className="text-lg font-normal text-text-muted-light dark:text-text-muted-dark">/mês</span></div>
                                <p className="text-text-muted-light dark:text-text-muted-dark mb-8 grow">
                                    Para instituições que possuem equipe técnica de TI. Baixe o código, instale nos seus servidores e tenha controle absoluto sem custo de licença.
                                </p>
                                <ul className="space-y-3 mb-8 text-sm">
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-500 text-base">check</span> Sem custo de licença (Open Source)</li>
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-500 text-base">check</span> Instale onde quiser</li>
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-500 text-base">check</span> Suporte da comunidade</li>
                                </ul>
                                <a className="w-full py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg text-center font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" href="/open-source.html">
                                    Acessar Código
                                </a>
                            </div>

                            <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl flex flex-col h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-white/10 px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">Recomendado</div>
                                <div className="mb-6 relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Aluminify Cloud</h3>
                                    <div className="text-sm text-zinc-400 font-mono">GERENCIADO</div>
                                </div>
                                <div className="text-4xl font-bold mb-6 relative z-10">Escala<span className="text-lg font-normal text-zinc-400"> com você</span></div>
                                <p className="text-zinc-300 mb-8 grow relative z-10">
                                    Para quem quer focar apenas no ensino. Nós cuidamos dos servidores, backups, segurança e atualizações. Sua escola no ar em minutos.
                                </p>
                                <ul className="space-y-3 mb-8 text-sm text-zinc-200 relative z-10">
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-400 text-base">check</span> Setup instantâneo</li>
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-400 text-base">check</span> Vídeos de alta velocidade (CDN)</li>
                                    <li className="flex items-center gap-2"><span className="material-icons-outlined text-green-400 text-base">check</span> Suporte dedicado</li>
                                </ul>
                                <a className="w-full py-3 bg-white text-primary rounded-lg text-center font-bold hover:bg-zinc-100 transition-colors relative z-10" href="/signup.html">
                                    Criar Instância
                                </a>
                                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-zinc-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-24 bg-background-light dark:bg-background-dark">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h3 className="text-2xl font-bold text-primary dark:text-white mb-4">Investimento Cloud</h3>
                            <p className="text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto">
                                Modelo justo e cumulativo. Você paga um valor base pela faixa e um adicional pequeno apenas por aluno excedente.
                            </p>
                        </div>
                        <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-xl shadow-sm">
                            <table className="w-full text-left border-collapse bg-white dark:bg-surface-dark">
                                <thead>
                                    <tr className="border-b border-border-light dark:border-border-dark bg-zinc-50 dark:bg-zinc-900/50">
                                        <th className="py-4 px-6 text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Plano</th>
                                        <th className="py-4 px-6 text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Capacidade</th>
                                        <th className="py-4 px-6 text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Investimento Mensal</th>
                                        <th className="py-4 px-6 text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Modelo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/pricing.html'}>
                                        <td className="py-6 px-6 font-bold text-lg">Start</td>
                                        <td className="py-6 px-6 text-text-muted-light dark:text-text-muted-dark">Até 300 alunos</td>
                                        <td className="py-6 px-6 font-mono font-medium">R$ 500,00<span className="text-xs text-zinc-500 font-sans">/fixo</span></td>
                                        <td className="py-6 px-6 text-sm text-text-muted-light dark:text-text-muted-dark">Valor único para validação inicial.</td>
                                    </tr>
                                    <tr className="bg-blue-50/30 dark:bg-blue-900/10 relative z-10 cursor-pointer transition-colors" onClick={() => window.location.href = '/pricing.html'}>
                                        <td className="py-6 px-6 font-bold text-lg text-primary dark:text-white flex items-center gap-2">
                                            Growth
                                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase border border-blue-200">Recomendado</span>
                                        </td>
                                        <td className="py-6 px-6 text-text-muted-light dark:text-text-muted-dark font-medium">301 a 500 alunos</td>
                                        <td className="py-6 px-6 font-mono text-blue-700 dark:text-blue-300 font-bold">R$ 500,00<span className="text-xs text-zinc-500 font-normal dark:text-zinc-400"> + R$ 1,50/extra</span></td>
                                        <td className="py-6 px-6 text-sm text-text-muted-light dark:text-text-muted-dark">Base + valor por aluno excedente.</td>
                                    </tr>
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/pricing.html'}>
                                        <td className="py-6 px-6 font-bold text-lg">Scale</td>
                                        <td className="py-6 px-6 text-text-muted-light dark:text-text-muted-dark">501 a 1.000 alunos</td>
                                        <td className="py-6 px-6 font-mono font-medium">R$ 800,00<span className="text-xs text-zinc-500 font-sans"> + R$ 1,00/extra</span></td>
                                        <td className="py-6 px-6 text-sm text-text-muted-light dark:text-text-muted-dark">Custo marginal reduzido para escala.</td>
                                    </tr>
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/pricing.html'}>
                                        <td className="py-6 px-6 font-bold text-lg">Enterprise</td>
                                        <td className="py-6 px-6 text-text-muted-light dark:text-text-muted-dark">1.001+ alunos</td>
                                        <td className="py-6 px-6 font-mono font-medium">Sob Consulta</td>
                                        <td className="py-6 px-6 text-sm text-text-muted-light dark:text-text-muted-dark">Condições especiais e infra dedicada.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6 text-center">
                            <a href="/pricing.html" className="text-sm font-medium text-primary hover:underline dark:text-white">Ver detalhes completos e opcionais →</a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold font-display text-xs">
                                    A
                                </div>
                                <span className="font-display font-bold text-lg">
                                    Aluminify
                                </span>
                            </div>
                            <p className="text-text-muted-light dark:text-text-muted-dark text-sm max-w-xs mb-6">
                                A plataforma que empodera educadores com a tecnologia de elite que eles merecem.
                            </p>
                            <div className="flex gap-4">
                                <a
                                    className="text-zinc-400 hover:text-primary dark:hover:text-white transition-colors"
                                    href="https://github.com/aluminify"
                                >
                                    <span className="sr-only">GitHub</span>
                                    <svg
                                        aria-hidden="true"
                                        className="h-6 w-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            clipRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                            fillRule="evenodd"
                                        ></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Produto</h4>
                            <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark">
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/features.html"
                                    >
                                        Recursos
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/roadmap.html"
                                    >
                                        Roadmap
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/changelog.html"
                                    >
                                        Novidades
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/pricing.html"
                                    >
                                        Preços
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Suporte</h4>
                            <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark">
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/docs.html"
                                    >
                                        Central de Ajuda
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/docs.html#api"
                                    >
                                        Documentação Técnica
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="#"
                                    >
                                        Comunidade
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="hover:text-primary dark:hover:text-white transition-colors"
                                        href="/status.html"
                                    >
                                        Status do Sistema
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border-light dark:border-border-dark pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            © 2026 Aluminify Inc. Apache 2.0 License.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
                                Powered by Sinesys Intelligence
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
