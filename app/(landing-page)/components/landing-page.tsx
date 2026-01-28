"use client";

import Link from "next/link";
import { Nav } from "./nav";
import { Footer } from "./footer";
import {
    ArrowRight,
    Github,
    Layout,
    Zap,
    Shield,
    Play,
    BookOpen,
    Users,
    MessageCircle,
    TrendingUp,
    BarChart3,
    CheckCircle2,
    Clock,
    Sparkles,
    Video,
    FileText,
    Award
} from "lucide-react";

export function LandingPage() {
    return (
        <div
            className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 transition-colors duration-200 flex flex-col"
            style={{
                // Landing page uses neutral/professional colors independent of tenant theme
                '--primary': 'hsl(240 5.9% 10%)',
                '--primary-foreground': 'hsl(0 0% 98%)',
                '--background': 'hsl(0 0% 100%)',
                '--foreground': 'hsl(240 10% 3.9%)',
                '--card': 'hsl(0 0% 100%)',
                '--card-foreground': 'hsl(240 10% 3.9%)',
                '--muted': 'hsl(240 4.8% 95.9%)',
                '--muted-foreground': 'hsl(240 3.8% 46.1%)',
                '--border': 'hsl(240 5.9% 90%)',
            } as React.CSSProperties}
        >
            <Nav />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-50">
                    {/* Background Grid - mesma estrutura do login */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-60" />

                    {/* Ambient Glow */}
                    <div className="absolute left-0 right-0 top-0 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mb-8 animate-fade-in-up">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs font-medium text-muted-foreground">
                                100% gratuito e open source
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-8 text-foreground max-w-5xl mx-auto leading-[1.1]">
                            Seu curso online <br className="hidden md:block" /> profissional e completo.
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
                            A plataforma que você sempre quis: <strong>área do aluno, vídeo-aulas, pagamentos e relatórios</strong> — tudo pronto, com a sua marca, sem pagar comissão.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
                            <Link
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                href="/auth/sign-up"
                            >
                                Criar minha conta grátis
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                className="w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2 group"
                                href="/features"
                            >
                                Ver funcionalidades
                            </Link>
                        </div>

                        {/* App Screenshot Mockup - Rich Version */}
                        <div className="relative max-w-6xl mx-auto rounded-2xl border border-border/50 bg-card shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent z-20 pointer-events-none" />

                            {/* Browser Header */}
                            <div className="border-b border-border bg-white p-3 flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="h-7 flex-1 max-w-lg bg-gray-100 rounded-lg border border-gray-200 flex items-center px-3 mx-auto gap-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-gray-400" />
                                    <span className="text-[11px] text-gray-500 font-medium">aluno.seucurso.com.br/sala-de-estudos</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                                        <Layout className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard UI */}
                            <div className="flex h-[420px] text-left">
                                {/* Sidebar */}
                                <div className="w-56 border-r border-border bg-white p-4 hidden md:flex flex-col">
                                    {/* Logo */}
                                    <div className="flex items-center gap-2.5 mb-6 px-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">E+</span>
                                        </div>
                                        <span className="font-semibold text-sm text-gray-800">ENEM Plus</span>
                                    </div>

                                    {/* Nav Items */}
                                    <nav className="space-y-1 flex-1">
                                        {[
                                            { icon: Layout, label: 'Início', active: false },
                                            { icon: Play, label: 'Aulas ao Vivo', active: true, badge: '2' },
                                            { icon: BookOpen, label: 'Matérias', active: false },
                                            { icon: FileText, label: 'Simulados', active: false },
                                            { icon: Award, label: 'Desempenho', active: false },
                                        ].map((item, i) => (
                                            <div key={i} className={`h-9 rounded-lg flex items-center px-3 gap-2.5 text-xs font-medium transition-colors ${item.active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}>
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                                {'badge' in item && item.badge && (
                                                    <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{item.badge}</span>
                                                )}
                                            </div>
                                        ))}
                                    </nav>

                                    {/* Streak Card */}
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-semibold text-amber-700">7 dias de sequência!</span>
                                        </div>
                                        <p className="text-[10px] text-amber-600/70">Continue estudando para manter</p>
                                    </div>

                                    {/* User */}
                                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-800 truncate">Ana Clara</p>
                                            <p className="text-[10px] text-gray-400">3º Ano • Meta: Medicina</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-gray-50/80 overflow-hidden">
                                    {/* Header */}
                                    <div className="bg-white border-b border-border px-6 py-4 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">REDAÇÃO</span>
                                                <h2 className="text-base font-semibold text-gray-800">Estrutura da Dissertação</h2>
                                            </div>
                                            <p className="text-xs text-gray-500">Preparatório ENEM 2025 • Aula 4 de 8</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>32min restantes</span>
                                            </div>
                                            <div className="h-6 w-px bg-gray-200" />
                                            <div className="flex -space-x-2">
                                                {['from-pink-400 to-rose-500', 'from-blue-400 to-cyan-500', 'from-amber-400 to-orange-500'].map((color, i) => (
                                                    <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${color} border-2 border-white`} />
                                                ))}
                                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-medium text-gray-500">+127</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video Area */}
                                    <div className="p-6">
                                        <div className="flex gap-4 h-[280px]">
                                            {/* Video Player */}
                                            <div className="flex-1 rounded-xl bg-zinc-900 relative overflow-hidden shadow-xl">
                                                {/* Video Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-transparent to-rose-600/20" />

                                                {/* Whiteboard simulation */}
                                                <div className="absolute inset-4 top-12 bottom-20 bg-white/5 rounded-lg border border-white/10 p-4">
                                                    <div className="text-[10px] text-amber-300 font-mono mb-2">Estrutura da Redação ENEM:</div>
                                                    <div className="space-y-1.5 text-[9px] text-white/70">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded bg-amber-500/30 flex items-center justify-center text-amber-300 text-[8px]">1</span>
                                                            <span>Introdução → Contextualização + Tese</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded bg-amber-500/30 flex items-center justify-center text-amber-300 text-[8px]">2</span>
                                                            <span>Desenvolvimento 1 → Argumento + Repertório</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded bg-amber-500/30 flex items-center justify-center text-amber-300 text-[8px]">3</span>
                                                            <span>Desenvolvimento 2 → Argumento + Repertório</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded bg-emerald-500/30 flex items-center justify-center text-emerald-300 text-[8px]">4</span>
                                                            <span>Conclusão → Proposta de Intervenção</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Professor avatar */}
                                                <div className="absolute bottom-20 right-4 w-20 h-20 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 border-2 border-white/20 shadow-lg overflow-hidden">
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-white/20" />
                                                    </div>
                                                </div>

                                                {/* Video Info Overlay */}
                                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                                    <div className="px-2.5 py-1 bg-red-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                        <span className="text-[10px] text-white font-medium">AO VIVO</span>
                                                    </div>
                                                    <div className="px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                                        <Users className="w-3 h-3 text-white/70" />
                                                        <span className="text-[10px] text-white">1.284 assistindo</span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] text-white/80 font-mono">23:18</span>
                                                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                            <div className="h-full w-[58%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full relative">
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-white/80 font-mono">40:00</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-pink-600" />
                                                            <p className="text-xs text-white/90 font-medium">Prof. Marina Costa</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center relative">
                                                                <MessageCircle className="w-3.5 h-3.5 text-white/70" />
                                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full text-[7px] text-white flex items-center justify-center">5</span>
                                                            </div>
                                                            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
                                                                <FileText className="w-3.5 h-3.5 text-white/70" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Side Panel */}
                                            <div className="w-64 hidden lg:flex flex-col gap-3">
                                                {/* Progress Card */}
                                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-medium text-gray-700">Seu Progresso</span>
                                                        <span className="text-xs font-bold text-emerald-500">52%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full w-[52%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-2">4 de 8 aulas concluídas</p>
                                                </div>

                                                {/* Subject Pills */}
                                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                    <span className="text-xs font-medium text-gray-700 mb-3 block">Suas Matérias</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[
                                                            { name: 'Redação', color: 'bg-amber-100 text-amber-700', active: true },
                                                            { name: 'Matemática', color: 'bg-blue-100 text-blue-700', active: false },
                                                            { name: 'Física', color: 'bg-purple-100 text-purple-700', active: false },
                                                            { name: 'Química', color: 'bg-emerald-100 text-emerald-700', active: false },
                                                            { name: 'Biologia', color: 'bg-rose-100 text-rose-700', active: false },
                                                        ].map((subject, i) => (
                                                            <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-medium ${subject.color} ${subject.active ? 'ring-2 ring-offset-1 ring-amber-400' : 'opacity-70'}`}>
                                                                {subject.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Next Lessons */}
                                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-1">
                                                    <span className="text-xs font-medium text-gray-700 mb-3 block">Próximas Aulas</span>
                                                    <div className="space-y-2">
                                                        {[
                                                            { title: 'Repertório Sociocultural', duration: '35min', subject: 'RED' },
                                                            { title: 'Proposta de Intervenção', duration: '42min', subject: 'RED' },
                                                            { title: 'Funções do 2º Grau', duration: '38min', subject: 'MAT' },
                                                        ].map((lesson, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${lesson.subject === 'RED' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {lesson.subject}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-medium text-gray-700 truncate">{lesson.title}</p>
                                                                    <p className="text-[9px] text-gray-400">{lesson.duration}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 border-t border-border bg-card/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Layout className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold">Sua marca, seu jeito</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Personalize cores, logo e visual. Seus alunos veem a marca do seu curso,
                                    não a nossa.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold">Rápido de verdade</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Carrega instantaneamente. Vídeos, imagens e materiais
                                    são otimizados automaticamente para seus alunos.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold">Seus dados são seus</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Você tem acesso total aos dados dos seus alunos.
                                    Exporte quando quiser, sem amarras.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bento Grid Teaser */}
                <section className="py-24 bg-background border-t border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                Tudo o que seu curso precisa.
                            </h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Modular e extensível. Comece com o básico e ative funcionalidades
                                avançadas conforme cresce.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
                            {/* Sala de Estudos - Card Principal */}
                            <div className="md:col-span-2 rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group bg-gradient-to-br from-violet-500/5 via-card to-card hover:border-violet-500/30 transition-all duration-500">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />

                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                                        <Video className="w-4 h-4 text-violet-500" />
                                        <span className="text-xs font-medium text-violet-600">Player Imersivo</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Sala de Estudos</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Player de vídeo com anotações, chat e materiais integrados.
                                    </p>
                                </div>

                                {/* Video Player Mockup */}
                                <div className="relative z-10 mt-6 rounded-xl border border-border bg-zinc-900 shadow-2xl h-44 w-full overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                    {/* Video Thumbnail Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-blue-600/20" />

                                    {/* Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-white/70 font-mono">12:34</span>
                                            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full w-2/5 bg-violet-500 rounded-full" />
                                            </div>
                                            <span className="text-[10px] text-white/70 font-mono">32:10</span>
                                        </div>
                                    </div>

                                    {/* Floating Chat Bubble */}
                                    <div className="absolute top-3 right-3 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] text-white/80">3 novas mensagens</span>
                                        </div>
                                    </div>

                                    {/* Floating Note */}
                                    <div className="absolute top-3 left-3 px-3 py-2 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 -translate-x-2 group-hover:translate-x-0">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-amber-400" />
                                            <span className="text-[10px] text-white/80">Anotação salva</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conteúdo Card */}
                            <div className="rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/30 transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Conteúdo</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Estrutura flexível de cursos, módulos e aulas.
                                    </p>
                                </div>

                                {/* Module List */}
                                <div className="relative z-10 space-y-2 mt-4">
                                    {[
                                        { name: "Introdução", done: true },
                                        { name: "Fundamentos", done: true },
                                        { name: "Avançado", done: false, current: true },
                                    ].map((module, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${module.current ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
                                            {module.done ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <div className={`w-4 h-4 rounded-full border-2 ${module.current ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'}`} />
                                            )}
                                            <span className={`text-sm ${module.current ? 'font-medium text-emerald-600' : module.done ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                                                {module.name}
                                            </span>
                                            {module.current && (
                                                <span className="ml-auto text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    Em andamento
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comunidade Card */}
                            <div className="rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group bg-gradient-to-br from-blue-500/5 via-card to-card hover:border-blue-500/30 transition-all duration-500">
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Users className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Comunidade</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Fóruns, comentários e grupos de estudo.
                                    </p>
                                </div>

                                {/* Avatar Stack with Activity */}
                                <div className="relative z-10 mt-4">
                                    <div className="flex -space-x-3">
                                        {[
                                            { color: 'from-violet-500 to-purple-600' },
                                            { color: 'from-blue-500 to-cyan-500' },
                                            { color: 'from-emerald-500 to-teal-500' },
                                            { color: 'from-amber-500 to-orange-500' },
                                        ].map((avatar, i) => (
                                            <div key={i} className="relative group-hover:translate-y-[-2px] transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.color} border-2 border-card shadow-lg`} />
                                                {i === 0 && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                                                )}
                                            </div>
                                        ))}
                                        <div className="w-10 h-10 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground shadow-lg group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-colors">
                                            +247
                                        </div>
                                    </div>

                                    {/* Activity Indicator */}
                                    <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>12 membros online agora</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analytics & Financeiro - Card Principal */}
                            <div className="md:col-span-2 rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/30 transition-all duration-500">
                                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />

                                <div className="relative z-10 flex items-start justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                                            <BarChart3 className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-medium text-amber-600">Tempo Real</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Analytics & Financeiro</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            Visão 360º do seu negócio. Engajamento, retenção e receita.
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="hidden sm:flex gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                <span className="text-xs text-emerald-500 font-medium">+24%</span>
                                            </div>
                                            <span className="text-2xl font-bold">R$ 48.2k</span>
                                            <p className="text-xs text-muted-foreground">Este mês</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="relative z-10 mt-6 flex gap-3 items-end h-28">
                                    {[
                                        { h: 40, color: 'from-amber-400 to-amber-500' },
                                        { h: 65, color: 'from-amber-400 to-amber-500' },
                                        { h: 45, color: 'from-amber-400 to-amber-500' },
                                        { h: 80, color: 'from-emerald-400 to-emerald-500' },
                                        { h: 55, color: 'from-amber-400 to-amber-500' },
                                        { h: 70, color: 'from-amber-400 to-amber-500' },
                                        { h: 95, color: 'from-emerald-400 to-emerald-500', current: true },
                                    ].map((bar, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                                className={`w-full bg-gradient-to-t ${bar.color} rounded-t-lg transition-all duration-500 group-hover:opacity-100 ${bar.current ? 'opacity-100 shadow-lg shadow-emerald-500/20' : 'opacity-60'}`}
                                                style={{
                                                    height: `${bar.h}%`,
                                                    transitionDelay: `${i * 50}ms`
                                                }}
                                            />
                                            <span className="text-[9px] text-muted-foreground">
                                                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'][i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom Stats Row */}
                                <div className="relative z-10 flex gap-6 mt-4 pt-4 border-t border-border/50">
                                    {[
                                        { icon: Users, label: 'Alunos', value: '1.2k', trend: '+12%' },
                                        { icon: Clock, label: 'Horas assistidas', value: '8.4k', trend: '+18%' },
                                        { icon: Award, label: 'Certificados', value: '342', trend: '+8%' },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <stat.icon className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-bold">{stat.value}</span>
                                                    <span className="text-[10px] text-emerald-500">{stat.trend}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Manifesto Section */}
                <section className="py-24 border-t border-border bg-background">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                    <span className="text-xs font-medium text-primary">Por que existimos</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                                    Você é professor, <br />não refém de plataformas.
                                </h2>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    Cansado de pagar taxa sobre cada matrícula? De não ter acesso aos dados dos seus próprios alunos?
                                    De depender de plataformas que podem mudar as regras a qualquer momento?
                                </p>
                                <p className="text-muted-foreground mb-8">
                                    Nós acreditamos que <strong>o professor deve ter controle total</strong> sobre seu curso,
                                    seus alunos e sua tecnologia. Por isso criamos o Aluminify: para devolver a você a soberania
                                    que sempre foi sua.
                                </p>
                                <Link
                                    href="/manifesto"
                                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                                >
                                    Leia nosso manifesto
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-transparent rounded-2xl blur-lg opacity-50" />
                                <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
                                    <blockquote className="text-xl font-serif italic text-foreground mb-6 leading-relaxed">
                                        &quot;Quando você fecha a porta da sala de aula, aquele espaço é seu.
                                        A didática é sua. No digital, deveria ser igual.&quot;
                                    </blockquote>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                            A
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Manifesto Aluminify</p>
                                            <p className="text-xs text-muted-foreground">A Soberania de Nutrir Mentes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 border-t border-border bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                            Pronto para começar?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10">
                            Junte-se a centenas de professores que já estão construindo seus cursos com total liberdade.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/auth/sign-up"
                                className="w-full sm:w-auto px-8 py-4 bg-foreground text-background font-bold rounded-lg hover:opacity-90 transition-all"
                            >
                                Criar minha conta grátis
                            </Link>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-8 py-4 bg-background border border-border font-bold rounded-lg hover:bg-muted transition-all"
                            >
                                Ver planos
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}