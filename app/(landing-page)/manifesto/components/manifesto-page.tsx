"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ManifestoPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-background text-foreground font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border"
                    : "bg-transparent border-b border-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <Link className="flex items-center gap-2 group" href="/">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-display text-xl group-hover:scale-105 transition-transform">
                                A
                            </div>
                            <span className="font-display font-bold text-lg tracking-tight">
                                Aluminify
                            </span>
                        </Link>
                        <Link
                            href="/signup"
                            className="text-xs font-mono text-muted-foreground hover:text-primary dark:hover:text-white transition-colors"
                        >
                            Criar Instância -&gt;
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-32 px-6">
                <header className="max-w-3xl mx-auto mb-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-full mb-8 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-primary dark:bg-white rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            Carta Aberta aos Educadores
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 leading-tight text-primary dark:text-white">
                        A Soberania de <br />
                        Nutrir Mentes.
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Por que decidimos construir a infraestrutura invisível que o seu
                        curso merece.
                    </p>
                </header>

                <article className="max-w-2xl mx-auto relative pl-8 md:pl-12">
                    {/* Timeline Line */}
                    <div className="absolute left-0 top-0 h-full w-px bg-linear-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent"></div>

                    <section className="mb-20 relative">
                        <span className="absolute -left-9.25 md:-left-13.25 top-1 w-3 h-3 bg-white dark:bg-background border-2 border-zinc-200 dark:border-zinc-700 rounded-full z-10"></span>
                        <h2 className="landing-section-title mb-6 text-primary dark:text-white">
                            Ensinar é um ato de autonomia.
                        </h2>
                        <div className="prose prose-zinc dark:prose-invert prose-lg text-muted-foreground leading-relaxed">
                            <p>
                                Quando você fecha a porta da sala de aula, aquele espaço é seu.
                                A didática é sua. A conexão no olhar de cada estudante é sua. É
                                um momento sagrado de transmissão e construção.
                            </p>
                            <p>
                                Mas, no mundo digital, tentaram convencer você a abrir mão
                                disso.
                            </p>
                            <p>
                                Disseram que, para ensinar online, você precisava ser um
                                &quot;criador de conteúdo&quot;. Que precisava alugar um terreno em
                                plataformas que não são suas. Plataformas que escondem os dados
                                dos seus alunos, que mudam o algoritmo sem avisar e que cobram
                                &quot;pedágio&quot; sobre o crescimento do seu negócio.
                            </p>
                            <p className="font-medium text-primary dark:text-white">
                                Nós discordamos radicalmente dessa visão.
                            </p>
                        </div>
                    </section>

                    <section className="mb-24 relative">
                        <span className="absolute -left-9.25 md:-left-13.25 top-1 w-3 h-3 bg-primary dark:bg-white border-2 border-primary dark:border-white rounded-full z-10"></span>

                        <h2 className="landing-section-title mb-8 text-primary dark:text-white">O mito do &quot;ser sem luz&quot;.</h2>

                        <div className="bg-card border border-border rounded-xl p-8 md:p-10 shadow-sm mb-10 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-9xl text-primary dark:text-white leading-none select-none group-hover:scale-110 transition-transform duration-700">
                                Aa
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-4 mb-4 border-b border-border pb-4">
                                    <h3 className="text-3xl font-bold text-primary dark:text-white font-serif">
                                        Alumnus
                                    </h3>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        latim • /a-lum-nus/
                                    </span>
                                </div>

                                <ol className="space-y-4 font-serif text-lg text-primary/80 dark:text-white/80">
                                    <li className="flex gap-4">
                                        <span className="font-mono text-xs text-muted-foreground mt-1.5">
                                            1.
                                        </span>
                                        <span>
                                            Particípio passivo do verbo{" "}
                                            <strong>Alere</strong>.
                                        </span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="font-mono text-xs text-muted-foreground mt-1.5">
                                            2.
                                        </span>
                                        <span>
                                            Significado: Nutrir, alimentar, sustentar, fazer
                                            crescer.
                                        </span>
                                    </li>
                                    <li className="flex gap-4 opacity-50">
                                        <span className="font-mono text-xs text-muted-foreground mt-1.5">
                                            x.
                                        </span>
                                        <span className="line-through decoration-zinc-400">
                                            Antigo mito: A-lumen (sem luz).
                                        </span>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className="prose prose-zinc dark:prose-invert prose-lg text-muted-foreground leading-relaxed">
                            <p>
                                Há uma lenda urbana pedagógica que insiste em dizer que &quot;aluno&quot;
                                vem de <em>A-lumen</em> (sem luz). Rejeitamos essa ideia de que
                                seu estudante é um vaso vazio e escuro esperando ser preenchido.
                            </p>
                            <p>
                                A verdade etimológica é muito mais poderosa.
                                <strong>Aluno é aquele que é nutrido para crescer.</strong>
                            </p>
                            <p>
                                O seu papel é nutrir o intelecto deles. O nosso papel é garantir
                                que nada — absolutamente nada — atrapalhe esse processo.
                            </p>
                        </div>
                    </section>

                    <section className="mb-20 relative">
                        <span className="absolute -left-9.25 md:-left-13.25 top-1 w-3 h-3 bg-white dark:bg-background border-2 border-border rounded-full z-10"></span>
                        <h2 className="landing-section-title mb-6 text-primary dark:text-white">Nós somos o solo fértil.</h2>
                        <div className="prose prose-zinc dark:prose-invert prose-lg text-muted-foreground leading-relaxed">
                            <p>
                                Se o aluno precisa ser nutrido, o curso precisa de solo fértil.
                                É aqui que entra o <strong>Aluminify</strong>.
                            </p>
                            <p>
                                Não somos uma rede social de cursos. Não somos um marketplace.
                                Somos <strong>infraestrutura</strong>.
                            </p>
                            <p>
                                Pense na sua sala de aula. Você não quer que o
                                ar-condicionado faça barulho, ou que a cadeira quebre. Você quer
                                que a estrutura seja tão boa que se torne invisível, permitindo
                                que o foco total esteja na aula.
                            </p>
                            <p>
                                No digital, nossa missão é a mesma: latência zero, dados
                                seguros, interface limpa.
                                <strong>
                                    A tecnologia deve ser invisível para que o ensino seja
                                    inesquecível.
                                </strong>
                            </p>
                        </div>
                    </section>

                    <section className="relative">
                        <span className="absolute -left-9.25 md:-left-13.25 top-1 w-3 h-3 bg-white dark:bg-background border-2 border-primary dark:border-white rounded-full z-10"></span>

                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-2xl p-8 md:p-12 text-center mt-8">
                            <h3 className="text-xl font-bold text-primary dark:text-white mb-4">
                                Retome a sua soberania.
                            </h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                Seus alunos são seus. Sua marca é sua. Sua tecnologia deve ser
                                sua também.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/signup"
                                    className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-zinc-200 dark:shadow-none"
                                >
                                    Começar Agora
                                </Link>
                                <Link
                                    href="/"
                                    className="px-8 py-3 bg-white dark:bg-zinc-800 border border-border text-primary dark:text-white rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Voltar para Home
                                </Link>
                            </div>

                            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-3 opacity-60">
                                <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-600 rounded flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-300">
                                    A
                                </div>
                                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                    Aluminify Team
                                </span>
                            </div>
                        </div>
                    </section>
                </article>
            </main>

            <footer className="border-t border-border bg-card py-12 text-center">
                <p className="text-xs text-muted-foreground font-mono">
                    © 2026 Aluminify Inc. A infraestrutura invisível da educação.
                </p>
            </footer>
        </div>
    );
}
