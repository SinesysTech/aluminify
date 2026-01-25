"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PricingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark"
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
                        <div className="flex items-center gap-4">
                            <Link
                                className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-white transition-colors"
                                href="/"
                            >
                                Voltar para Home
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                            >
                                Criar Instância
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-24">
                <section className="py-20 text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6 text-primary dark:text-white">
                        Investimento Justo e Escalável
                    </h1>
                    <p className="text-lg text-text-muted-light dark:text-text-muted-dark max-w-2xl mx-auto leading-relaxed">
                        Um modelo cumulativo desenhado para o crescimento. Você paga uma base
                        fixa pela sua faixa atual e um valor pequeno apenas pelos alunos
                        excedentes.
                    </p>
                </section>

                <section className="pb-12 px-4">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex flex-col hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-outlined text-zinc-400">psychology_alt</span>
                                    <h3 className="text-lg font-bold text-primary dark:text-white">Inicial</h3>
                                </div>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Para validação mínima.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-primary dark:text-white">R$ 500</span>
                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark block mt-1">Valor fixo mensal</span>
                            </div>
                            <div className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6 grow border-t border-border-light dark:border-border-dark pt-4">
                                <p className="mb-2 font-medium text-primary dark:text-white">Até 300 alunos</p>
                                <p className="mb-2">
                                    Incluso na taxa. Ideal para quem está começando a digitalizar o preparatório.
                                </p>
                            </div>
                            <Link href="/signup" className="w-full py-2 border border-border-light dark:border-border-dark rounded-lg text-center text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-primary dark:text-white">
                                Escolher Inicial
                            </Link>
                        </div>

                        <div className="bg-primary text-white border border-primary rounded-xl p-6 shadow-lg transform md:-translate-y-4 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                                Acelerado
                            </div>
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-outlined text-white">rocket_launch</span>
                                    <h3 className="text-lg font-bold">Crescimento</h3>
                                </div>
                                <p className="text-sm text-zinc-400">Para expansão acelerada.</p>
                            </div>
                            <div className="mb-2">
                                <span className="text-3xl font-bold">R$ 500</span>
                                <span className="text-sm text-zinc-400"> base</span>
                            </div>
                            <div className="text-xs font-mono text-blue-200 mb-6 bg-white/10 p-2 rounded">
                                + R$ 1,50 por aluno extra (&gt;300)
                            </div>
                            <div className="text-sm text-zinc-300 mb-6 grow border-t border-zinc-700 pt-4">
                                <p className="mb-2 text-white font-medium">301 a 500 alunos</p>
                                <p className="text-xs">
                                    Ex: 400 alunos = R$ 500 + (100 x 1,50) = <strong>R$ 650/mês</strong>.
                                </p>
                            </div>
                            <Link href="/signup" className="w-full py-2 bg-white text-primary rounded-lg text-center text-sm font-bold hover:bg-zinc-100 transition-colors">
                                Escolher Crescimento
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex flex-col hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-outlined text-zinc-600 dark:text-zinc-400">trending_up</span>
                                    <h3 className="text-lg font-bold text-primary dark:text-white">Escala</h3>
                                </div>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Melhor custo-benefício.</p>
                            </div>
                            <div className="mb-2">
                                <span className="text-3xl font-bold text-primary dark:text-white">R$ 800</span>
                                <span className="text-sm text-text-muted-light dark:text-text-muted-dark"> base</span>
                            </div>
                            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                                + R$ 1,00 por aluno extra (&gt;500)
                            </div>
                            <div className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6 grow border-t border-border-light dark:border-border-dark pt-4">
                                <p className="mb-2 font-medium text-primary dark:text-white">501 a 1.000 alunos</p>
                                <p className="text-xs">
                                    Ex: 800 alunos = R$ 800 + (300 x 1,00) = <strong>R$ 1.100/mês</strong>.
                                </p>
                            </div>
                            <Link href="/signup" className="w-full py-2 border border-border-light dark:border-border-dark rounded-lg text-center text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-primary dark:text-white">
                                Escolher Escala
                            </Link>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-icons-outlined text-zinc-500 dark:text-zinc-400">domain</span>
                                    <h3 className="text-lg font-bold text-primary dark:text-white">Enterprise</h3>
                                </div>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Estrutura robusta.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-2xl font-bold text-primary dark:text-white">Sob Consulta</span>
                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark block mt-1">A partir de R$ 1.599</span>
                            </div>
                            <div className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6 grow border-t border-border-light dark:border-border-dark pt-4">
                                <p className="mb-2 font-medium text-primary dark:text-white">Acima de 1.000 alunos</p>
                                <p>Condições especiais e infraestrutura dedicada.</p>
                            </div>
                            <a href="mailto:comercial@aluminify.com" className="w-full py-2 border border-border-light dark:border-border-dark rounded-lg text-center text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-primary dark:text-white">
                                Falar com Consultor
                            </a>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-white dark:bg-surface-dark border-y border-border-light dark:border-border-dark">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row gap-12">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary dark:text-white">
                                        <span className="material-icons-outlined">build</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary dark:text-white">Setup e Implantação</h3>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Fase inicial de calibração técnica</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-border-light dark:border-border-dark">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Investimento Único</span>
                                        <span className="text-2xl font-bold text-primary dark:text-white">R$ 1.600,00</span>
                                    </div>

                                    <ul className="space-y-3 text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                                        <li className="flex gap-2">
                                            <span className="material-icons-outlined text-green-600 text-sm">check_circle</span>
                                            Configuração dos Agentes de IA e Base de Conhecimento
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="material-icons-outlined text-green-600 text-sm">check_circle</span>
                                            Integração com Plataforma de Vendas
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="material-icons-outlined text-green-600 text-sm">check_circle</span>
                                            Prazo estimado: 10 dias
                                        </li>
                                    </ul>

                                    <div className="border-t border-border-light dark:border-border-dark pt-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark block mb-3">Condições Especiais</span>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-surface-dark p-3 rounded border border-border-light dark:border-border-dark text-center">
                                                <span className="block text-xs text-text-muted-light dark:text-text-muted-dark">Contrato 12 meses</span>
                                                <span className="block font-bold text-green-600">25% OFF</span>
                                                <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark">Setup: R$ 1.200</span>
                                            </div>
                                            <div className="dark:bg-surface-dark p-3 rounded border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-center">
                                                <span className="block text-xs text-blue-800 dark:text-blue-300">Contrato 24 meses</span>
                                                <span className="block font-bold text-blue-600 dark:text-blue-400">SETUP GRÁTIS</span>
                                                <span className="text-[10px] text-blue-800 dark:text-blue-300">100% OFF</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-text-muted-light dark:text-text-muted-dark text-center">
                                            Pagamento facilitado: 5% OFF à vista ou 3x sem juros.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary dark:text-white">
                                        <span className="material-icons-outlined">extension</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary dark:text-white">Melhorias Opcionais</h3>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Potencialize sua infraestrutura</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="border border-border-light dark:border-border-dark rounded-lg p-5 hover:border-primary dark:hover:border-white transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-primary dark:text-white">Agente WhatsApp 24/7</h4>
                                            <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-mono">Popular</span>
                                        </div>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3 leading-relaxed">
                                            Automação integrada ao Chatwoot. Responde dúvidas frequentes e faz triagem de alunos a qualquer hora do dia.
                                        </p>
                                        <div className="flex items-baseline gap-2 text-sm">
                                            <span className="font-mono font-bold text-primary dark:text-white">R$ 2.000,00</span>
                                            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">(Setup Único) + Variável mensal</span>
                                        </div>
                                    </div>

                                    <div className="border border-border-light dark:border-border-dark rounded-lg p-5 hover:border-primary dark:hover:border-white transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-primary dark:text-white">Conteúdo Especializado (RAG)</h4>
                                        </div>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3 leading-relaxed">
                                            Transcrição e organização das suas aulas para treinar a IA com sua metodologia exata. Reduz alucinações drasticamente.
                                        </p>
                                        <div className="flex items-baseline gap-2 text-sm">
                                            <span className="font-mono font-bold text-primary dark:text-white">R$ 10,00</span>
                                            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">por hora de conteúdo processado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-zinc-50 dark:bg-zinc-900 border-b border-border-light dark:border-border-dark">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 text-primary dark:text-white font-bold mb-4">
                            <span className="material-icons-outlined">visibility</span>
                            <h3>Diferencial Ético: Transparência Total</h3>
                        </div>
                        <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed mb-8">
                            Ao contrário de plataformas que lucram com um percentual sobre o seu consumo de IA, nós optamos pela independência.
                            <strong>O custo de consumo dos agentes (tokens) é pago diretamente por você aos provedores</strong> (OpenAI/Anthropic).
                            Nós não temos lucro sobre o seu uso. Você paga apenas pelo que consome, com total controle.
                        </p>
                        <div className="p-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm inline-block text-left max-w-lg">
                            <p className="text-sm italic text-text-muted-light dark:text-text-muted-dark">
                                &quot;A Sinesys opta por dar controle de gastos e qualidade ao cliente... sem conflito de interesses.&quot;
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-10 text-primary dark:text-white">Dúvidas Comuns</h2>
                        <div className="space-y-3">
                            <details className="group bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4 cursor-pointer">
                                <summary className="flex justify-between items-center font-medium list-none text-sm text-primary dark:text-white">
                                    <span>Como funciona o contrato mínimo?</span>
                                    <span className="material-icons-outlined text-text-muted-light dark:text-text-muted-dark transition group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="text-text-muted-light dark:text-text-muted-dark text-sm mt-3 leading-relaxed">
                                    O contrato mínimo é de 6 meses. Isso garante que tenhamos tempo hábil para implementar a cultura da plataforma e você ver resultados reais na retenção dos alunos.
                                </div>
                            </details>

                            <details className="group bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4 cursor-pointer">
                                <summary className="flex justify-between items-center font-medium list-none text-sm text-primary dark:text-white">
                                    <span>O que está incluso na Integração de Plataforma Gratuita?</span>
                                    <span className="material-icons-outlined text-text-muted-light dark:text-text-muted-dark transition group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="text-text-muted-light dark:text-text-muted-dark text-sm mt-3 leading-relaxed">
                                    Conectamos seu sistema de vendas (Hotmart, Eduzz, Kiwify, etc.) para que o cadastro do aluno no Aluminify seja automático assim que a compra for aprovada.
                                </div>
                            </details>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark py-12 text-center">
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-mono">
                    © 2026 Aluminify Inc. A infraestrutura invisível da educação.
                </p>
            </footer>
        </div>
    );
}
