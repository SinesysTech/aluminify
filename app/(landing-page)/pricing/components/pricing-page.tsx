"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
import { Check, HelpCircle } from "lucide-react";

export function PricingPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased transition-colors duration-200">
            <Nav activeLink="precos" />

            <main>
                <section className="pt-24 pb-20 text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6 text-foreground">
                        Investimento Previsível.
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                        Escolha a infraestrutura que se adapta ao estágio do seu negócio.
                        Do MVP ao Enterprise, sem surpresas na fatura.
                    </p>
                    
                    {/* Toggle Monthly/Yearly (Visual only for now) */}
                    <div className="inline-flex items-center bg-muted p-1 rounded-lg">
                        <button className="px-4 py-1.5 text-sm font-medium rounded-md bg-background shadow-sm text-foreground">Mensal</button>
                        <button className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">Anual (-20%)</button>
                    </div>
                </section>

                <section className="pb-24 px-4">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                        {/* Community */}
                        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col hover:border-zinc-400 transition-colors">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold font-display">Community</h3>
                                <p className="text-sm text-muted-foreground mt-1">Para desenvolvedores.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">R$ 0</span>
                            </div>
                            <div className="text-sm space-y-4 mb-8 grow">
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Código Open Source (Self-hosted)</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Sem limite de alunos</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Atualizações via Git</span>
                                </div>
                                <div className="flex gap-3 text-muted-foreground">
                                    <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs">✕</span>
                                    <span>Suporte Dedicado</span>
                                </div>
                            </div>
                            <Link href="/opensource" className="w-full py-3 border border-border rounded-lg text-center font-medium hover:bg-muted transition-colors">
                                Ver Repositório
                            </Link>
                        </div>

                        {/* Pro Cloud */}
                        <div className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-2xl p-8 flex flex-col shadow-2xl relative overflow-hidden transform md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                                Mais Popular
                            </div>
                            <div className="mb-4">
                                <h3 className="text-xl font-bold font-display">Pro Cloud</h3>
                                <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">Para escolas em crescimento.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">R$ 499</span>
                                <span className="text-sm text-zinc-400 dark:text-zinc-600">/mês</span>
                            </div>
                            <div className="text-sm space-y-4 mb-8 grow text-zinc-300 dark:text-zinc-700">
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span className="font-bold text-white dark:text-black">Até 500 alunos ativos</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Infraestrutura Gerenciada</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>CDN Global de Vídeo</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                    <span>Backup Diário</span>
                                </div>
                                <div className="p-3 bg-white/10 dark:bg-black/10 rounded-lg text-xs mt-4">
                                    + R$ 1,00 por aluno extra ativo no mês.
                                </div>
                            </div>
                            <Link href="/signup" className="w-full py-3 bg-white dark:bg-black text-black dark:text-white rounded-lg text-center font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                Começar Trial de 14 dias
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col hover:border-zinc-400 transition-colors">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold font-display">Enterprise</h3>
                                <p className="text-sm text-muted-foreground mt-1">Para grandes operações.</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">Custom</span>
                            </div>
                            <div className="text-sm space-y-4 mb-8 grow">
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Alunos Ilimitados</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>SLA de 99.9%</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Single Sign-On (SSO)</span>
                                </div>
                                <div className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    <span>Gerente de Contas Dedicado</span>
                                </div>
                            </div>
                            <Link href="mailto:enterprise@aluminify.com" className="w-full py-3 border border-border rounded-lg text-center font-medium hover:bg-muted transition-colors">
                                Falar com Vendas
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-card border-t border-border">
                    <div className="max-w-3xl mx-auto px-4">
                        <h2 className="text-2xl font-bold text-center mb-12">Perguntas Frequentes</h2>
                        <div className="space-y-4">
                            <details className="group border border-border rounded-lg p-4 cursor-pointer bg-background">
                                <summary className="flex justify-between items-center font-medium list-none text-foreground">
                                    <span>O que conta como &quot;aluno ativo&quot;?</span>
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </summary>
                                <div className="text-muted-foreground text-sm mt-3 pt-3 border-t border-border leading-relaxed">
                                    Consideramos ativo qualquer aluno que tenha feito login na plataforma pelo menos uma vez no período de cobrança (mês). Alunos cadastrados que não acessam não geram custo variável.
                                </div>
                            </details>
                            <details className="group border border-border rounded-lg p-4 cursor-pointer bg-background">
                                <summary className="flex justify-between items-center font-medium list-none text-foreground">
                                    <span>Posso migrar do Self-Hosted para o Cloud?</span>
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </summary>
                                <div className="text-muted-foreground text-sm mt-3 pt-3 border-t border-border leading-relaxed">
                                    Sim! Oferecemos ferramentas de migração de banco de dados para trazer seus dados da versão open-source para nossa nuvem gerenciada sem perda de histórico.
                                </div>
                            </details>
                            <details className="group border border-border rounded-lg p-4 cursor-pointer bg-background">
                                <summary className="flex justify-between items-center font-medium list-none text-foreground">
                                    <span>Existe custo de setup?</span>
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </summary>
                                <div className="text-muted-foreground text-sm mt-3 pt-3 border-t border-border leading-relaxed">
                                    Não para os planos Cloud padrão. Você cria a conta e começa a usar imediatamente. Para o plano Enterprise, pode haver custos dependendo das customizações solicitadas.
                                </div>
                            </details>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}