"use client";

import Link from "next/link";
import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";

export function FeaturesPage() {
    return (
        <div className="bg-background text-foreground font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-200">
            <Nav activeLink="produto" />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="pt-24 pb-20 lg:pt-32 lg:pb-24 border-b border-border bg-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern dark:bg-grid-pattern-dark opacity-[0.4] grid-bg"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Experiência do Aluno v2.0
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 text-primary dark:text-white max-w-4xl mx-auto">
                            Muito mais que um player de vídeo.<br className="hidden md:block" />
                            Um{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
                                Ambiente de Imersão.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                            Esqueça as plataformas lentas e travadas. Projetamos cada interação
                            para eliminar distrações. Do carregamento instantâneo ao modo foco,
                            tudo aqui existe para que seu aluno aprenda mais, em menos tempo.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-base text-green-500">bolt</span>
                                <span>Carregamento Instantâneo</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-base text-blue-500">visibility_off</span>
                                <span>Zero Distrações</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-base text-purple-500">devices</span>
                                <span>Design Adaptativo</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid Section */}
                <section className="py-20 lg:py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">speed</span>
                                </div>
                                <h3 className="text-lg font-bold font-display mb-2">Instant Load</h3>
                                <p className="text-sm text-muted-foreground">
                                    Pré-carregamento inteligente de rotas. Quando o aluno move o
                                    mouse para &quot;Próxima Aula&quot;, o conteúdo já está baixado.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">wifi_off</span>
                                </div>
                                <h3 className="text-lg font-bold font-display mb-2">Offline-First Logic</h3>
                                <p className="text-sm text-muted-foreground">
                                    Arquitetura preparada para PWA. Sincronização de progresso e
                                    flashcards mesmo com conexão instável.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
                                    <span className="material-icons-outlined text-zinc-700 dark:text-zinc-300">security</span>
                                </div>
                                <h3 className="text-lg font-bold font-display mb-2">Enterprise Grade</h3>
                                <p className="text-sm text-muted-foreground">
                                    Autenticação via Supabase/NextAuth. Proteção contra
                                    compartilhamento de conta e download ilegal de vídeos (DRM ready).
                                </p>
                            </div>
                        </div>

                        <div className="mb-12">
                            <h2 className="text-3xl font-bold font-display mb-8">
                                Pedagogia Algorítmica
                            </h2>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[500px]">
                            {/* Main Video Player */}
                            <div className="md:col-span-3 md:row-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-12 border-b border-border bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center px-4 gap-2 z-20 backdrop-blur">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <div className="ml-4 text-xs font-mono text-zinc-400 flex items-center gap-1">
                                        <span className="material-icons-outlined text-[10px]">lock</span>
                                        aula-04-mecanica.mp4
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">
                                            Focus Mode ON
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-full flex flex-col pt-12">
                                    <div className="flex-1 bg-zinc-900 flex items-center justify-center relative min-h-[200px]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                            <div className="w-full">
                                                <div className="h-1 bg-zinc-700 w-full mb-4 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-1/3 relative">
                                                        <div className="absolute right-0 -top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-white/80 text-sm font-medium">
                                                    <span>14:20 / 45:00</span>
                                                    <div className="flex gap-4">
                                                        <span className="material-icons-outlined cursor-pointer hover:text-white">closed_caption</span>
                                                        <span className="material-icons-outlined cursor-pointer hover:text-white">settings</span>
                                                        <span className="material-icons-outlined cursor-pointer hover:text-white">fullscreen</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="material-icons-outlined text-white/90 text-7xl opacity-80 group-hover:scale-110 transition-transform duration-300">play_circle_filled</span>
                                    </div>
                                    <div className="h-64 border-t border-border bg-card p-8 flex gap-8">
                                        <div className="w-2/3 space-y-4">
                                            <h3 className="text-2xl font-bold">04. Leis de Newton Aplicadas</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                Nesta aula vamos dissecar os principais problemas de
                                                blocos e tração. Importante revisar vetores antes de prosseguir.
                                            </p>
                                            <div className="flex gap-2 pt-2">
                                                <span className="px-2 py-1 rounded border border-border text-xs font-medium text-zinc-500">Física</span>
                                                <span className="px-2 py-1 rounded border border-border text-xs font-medium text-zinc-500">Mecânica</span>
                                            </div>
                                        </div>
                                        <div className="w-1/3 border-l border-border pl-8">
                                            <h4 className="text-sm font-bold uppercase text-zinc-400 mb-4 tracking-wider">Material de Apoio</h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-2 text-sm hover:text-blue-600 cursor-pointer transition-colors">
                                                    <span className="material-icons-outlined text-zinc-400 text-base">picture_as_pdf</span>
                                                    Lista_Exercicios_04.pdf
                                                </li>
                                                <li className="flex items-center gap-2 text-sm hover:text-blue-600 cursor-pointer transition-colors">
                                                    <span className="material-icons-outlined text-zinc-400 text-base">link</span>
                                                    Simulador PhET
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Flashcards */}
                            <div className="md:col-span-1 bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold font-display text-lg">Flashcards</h3>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 border border-border min-h-[140px] flex items-center justify-center text-center relative overflow-hidden">
                                        <div className="absolute top-2 right-2 text-[10px] text-zinc-400 font-mono">SRS: ACTIVE</div>
                                        <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                                            Qual a fórmula da 2ª Lei de Newton?
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button className="flex-1 py-2 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-200 transition-colors">
                                        Difícil
                                    </button>
                                    <button className="flex-1 py-2 rounded bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-200 transition-colors">
                                        Fácil
                                    </button>
                                </div>
                            </div>

                            {/* AI Tutor */}
                            <div className="md:col-span-1 bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col overflow-hidden group hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-icons-outlined text-purple-500">auto_awesome</span>
                                    <h3 className="font-bold font-display text-lg">Tutor AI</h3>
                                </div>
                                <div className="flex-1 space-y-3 text-xs mb-4">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg rounded-tl-none self-start max-w-[90%] text-zinc-600 dark:text-zinc-300">
                                        Explique força de atrito como se eu tivesse 10 anos.
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg rounded-tr-none self-end max-w-[90%] border border-purple-100 dark:border-purple-800 text-purple-900 dark:text-purple-200">
                                        Imagine que você está tentando deslizar de meia num chão áspero...
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Pergunte ao Aluminify..."
                                        className="w-full text-xs py-2 pl-3 pr-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    />
                                    <span className="material-icons-outlined absolute right-2 top-2 text-xs text-zinc-400">send</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Theming Section */}
                <section className="py-20 lg:py-24 border-t border-border bg-card">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-6">
                                    <span className="material-icons-outlined text-sm text-zinc-600 dark:text-zinc-300">palette</span>
                                    <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300">theming.config.ts</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                                    Sua marca, não a nossa.
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Controle cada pixel via código. Do logo no header aos e-mails
                                    transacionais. O Aluminify foi construído para ser invisível.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-xs text-blue-600 dark:text-blue-400">check</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Design Tokens</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Defina tipografia, radius e espaçamentos globais.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-xs text-blue-600 dark:text-blue-400">check</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">CSS Variables</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Suporte nativo a Tailwind Config para temas claros e escuros.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-xs text-blue-600 dark:text-blue-400">check</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Domínio Próprio</h4>
                                            <p className="text-sm text-muted-foreground">
                                                CNAME setup automático para aluno.suaescola.com.br
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500"></div>
                                <div className="relative bg-[#0d1117] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-[#161b22]">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-[#fa7970]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#faa356]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#7ce38b]"></div>
                                        </div>
                                        <span className="ml-2 text-zinc-500">tailwind.config.js</span>
                                    </div>
                                    <div className="p-6 text-zinc-300 leading-relaxed overflow-x-auto">
                                        <pre><code>{`module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6', // Your Primary Brand Color
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem' // Rounded or Square? You decide.
      }
    }
  }
}`}</code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 lg:py-24 bg-card border-t border-border">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-display font-bold mb-6">
                            Pronto para rodar sua infraestrutura?
                        </h2>
                        <p className="text-muted-foreground mb-10">
                            Comece com o plano Community gratuitamente ou escale com nossa nuvem gerenciada.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-zinc-200 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                href="/pricing"
                            >
                                Ver Planos
                            </Link>
                            <Link
                                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-transparent border border-zinc-300 dark:border-zinc-600 text-text-main-light dark:text-white font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                href="/docs"
                            >
                                Ver Documentação Técnica
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
