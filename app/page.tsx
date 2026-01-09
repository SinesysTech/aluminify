import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Cloud,
  Database,
  Github,
  GraduationCap,
  Layers,
  Palette,
  Sparkles,
  Calendar,
  Brain,
  Users,
  Building2,
  ExternalLink,
} from "lucide-react";

import { getAuthenticatedUser } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    if (user.mustChangePassword) {
      redirect("/primeiro-acesso");
    }
    redirect(getDefaultRouteForRole(user.role));
  }

  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Aluminify</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Recursos
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Precos
            </Link>
            <Link
              href="https://github.com/sinesys/aluminify"
              className="text-sm text-muted-foreground hover:text-foreground"
              target="_blank"
            >
              GitHub
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">
                Comecar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [mask-image:linear-gradient(to_bottom,transparent,10%,white,90%,transparent)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-medium">
              Public Beta • 100% Open Source
            </span>
          </Badge>
          <h1 className="mb-6 bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl dark:from-white dark:to-gray-400">
            A infraestrutura invisivel{" "}
            <br className="hidden md:block" />
            da educacao.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Plataforma open source e white-label para escolas que buscam
            soberania sobre seus dados, sem reinventar a roda. Hospede voce
            mesmo ou use nossa cloud gerenciada.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                <Cloud className="mr-2 h-5 w-5" />
                Comecar Agora (Cloud)
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://github.com/sinesys/aluminify"
                target="_blank"
              >
                <Github className="mr-2 h-5 w-5" />
                Star on GitHub
              </Link>
            </Button>
          </div>

          {/* Hero Browser Mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 opacity-30 blur dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />

            {/* Browser frame */}
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center gap-4 border-b bg-muted/50 p-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="flex h-6 w-64 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    app.suaescola.com.br/aluno
                  </div>
                </div>
              </div>

              {/* Content mockup */}
              <div className="flex h-[350px] md:h-[400px]">
                {/* Sidebar */}
                <div className="hidden w-56 border-r bg-muted/30 p-4 md:block">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 rounded-md bg-primary/10 p-2 text-sm font-medium">
                      <Layers className="h-4 w-4" /> Meu Progresso
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Cronograma
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4" /> Flashcards
                    </div>
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Brain className="h-4 w-4" /> Simulados
                    </div>
                  </div>
                </div>

                {/* Main area */}
                <div className="flex-1 bg-background p-4 md:p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between md:mb-6">
                    <div>
                      <div className="text-base font-semibold md:text-lg">
                        Bom dia, Maria!
                      </div>
                      <div className="text-xs text-muted-foreground md:text-sm">
                        Faltam 45 dias para o ENEM
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-semibold md:h-10 md:w-10">
                      M
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="mb-4 grid grid-cols-3 gap-2 md:mb-6 md:gap-4">
                    <div className="rounded-lg border bg-card p-2 md:p-4">
                      <div className="text-lg font-bold md:text-2xl">847</div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">
                        Questoes resolvidas
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-2 md:p-4">
                      <div className="text-lg font-bold text-green-600 md:text-2xl">
                        76%
                      </div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">
                        Taxa de acerto
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-2 md:p-4">
                      <div className="text-lg font-bold md:text-2xl">12h</div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">
                        Estudo esta semana
                      </div>
                    </div>
                  </div>

                  {/* Progress area */}
                  <div className="rounded-lg border bg-card p-3 md:p-4">
                    <div className="mb-2 text-sm font-medium md:mb-3">
                      Proximas atividades
                    </div>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Matematica - Geometria Espacial</span>
                        <span className="ml-auto text-muted-foreground">
                          14:00
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Biologia - Revisao de flashcards</span>
                        <span className="ml-auto text-muted-foreground">
                          16:30
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="border-y bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Confiado por escolas que priorizam seus alunos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Colegio Exemplo</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Instituto Alpha</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Escola Beta</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">Centro Gamma</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Construido para escolas modernas
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Aluminify foi projetado com as praticas e principios que capacitam
              escolas de alta performance.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Soberania de Dados</CardTitle>
                <CardDescription>
                  Seus dados ficam com voce. Hospede em seu proprio servidor ou
                  use nossa cloud — a escolha e sua, sempre.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>White Label Nativo</CardTitle>
                <CardDescription>
                  Logo, cores e dominio personalizados. A plataforma e sua, com
                  a identidade da sua escola desde o primeiro dia.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>IA Contextual (RAG)</CardTitle>
                <CardDescription>
                  Assistente que entende o conteudo da sua escola. Respostas
                  baseadas nos seus materiais, nao em dados genericos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section
        id="features"
        className="bg-muted/30 px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Construido para times de produto
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Do gerenciamento de alunos ao planejamento de estudos, Aluminify
              fornece tudo que sua escola precisa para colaborar efetivamente.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Large Card - Area do Aluno Zen */}
            <Card className="group relative overflow-hidden transition-all md:col-span-2 lg:col-span-2 lg:row-span-2">
              {/* Focus Mode Badge */}
              <div className="absolute right-4 top-4 z-10">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Focus Mode
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                  Area do Aluno Zen
                </CardTitle>
                <CardDescription>
                  Interface limpa e focada para alunos acessarem materiais,
                  cronogramas e flashcards sem distracao.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10" />
                    <div>
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="mt-1 h-3 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Matematica - Aula 1</span>
                      <Badge variant="secondary" className="ml-auto">
                        Concluido
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-5 w-5 rounded border-2" />
                      <span className="text-sm">Fisica - Exercicios</span>
                      <Badge variant="outline" className="ml-auto">
                        Em progresso
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-5 w-5 rounded border-2" />
                      <span className="text-sm">Quimica - Revisao</span>
                      <Badge variant="outline" className="ml-auto">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flashcards Card */}
            <Card className="group transition-all hover:border-blue-200 dark:hover:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                  Flashcards Algoritmicos
                </CardTitle>
                <CardDescription>
                  Repeticao espacada inteligente que se adapta ao ritmo de
                  aprendizado de cada aluno.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">847</div>
                    <div className="text-xs text-muted-foreground">
                      Cards revisados hoje
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-500">
                      +23%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Retencao
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card className="group transition-all hover:border-purple-200 dark:hover:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                  Cronograma Inteligente
                </CardTitle>
                <CardDescription>
                  Planejamento de estudos adaptativo baseado em metas e
                  disponibilidade do aluno.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 transition-transform group-hover:translate-x-1">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">Matematica</span>
                    <div className="ml-auto h-2 w-20 rounded-full bg-muted">
                      <div className="h-2 w-16 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 transition-transform delay-75 group-hover:translate-x-1">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Fisica</span>
                    <div className="ml-auto h-2 w-20 rounded-full bg-muted">
                      <div className="h-2 w-12 rounded-full bg-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 transition-transform delay-150 group-hover:translate-x-1">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">Quimica</span>
                    <div className="ml-auto h-2 w-20 rounded-full bg-muted">
                      <div className="h-2 w-8 rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Source vs Cloud */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Escolha seu modelo</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Hospede voce mesmo gratuitamente ou deixe a infraestrutura conosco.
              Mesma plataforma, sua escolha.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Self-Hosted */}
            <Card className="relative overflow-hidden border-2">
              <div className="absolute right-4 top-4">
                <Badge variant="secondary">Open Source</Badge>
              </div>
              <CardHeader className="pt-12">
                <CardTitle className="text-2xl">Community</CardTitle>
                <CardDescription>Self-Hosted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">R$ 0</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Codigo fonte completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Alunos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Customizacao total</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Comunidade no Discord</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href="https://github.com/sinesys/aluminify"
                    target="_blank"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Ver no GitHub
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Cloud */}
            <Card className="relative overflow-hidden bg-primary text-primary-foreground shadow-2xl">
              {/* Badge Popular */}
              <div className="absolute right-0 top-0 rounded-bl-lg bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Popular
              </div>
              <CardHeader className="relative z-10 pt-12">
                <CardTitle className="text-2xl text-primary-foreground">
                  Aluminify Cloud
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gerenciado por nos
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div>
                  <span className="text-4xl font-bold">Escala</span>
                  <span className="text-gray-400"> com voce</span>
                  <p className="mt-1 text-sm text-gray-400">
                    A partir de R$ 500/mes (ate 300 alunos)
                  </p>
                </div>
                <ul className="space-y-3 text-gray-200">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>Setup instantaneo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>CDN Global otimizado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>Backups automaticos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    <span>Suporte dedicado</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-white text-primary hover:bg-gray-100"
                  asChild
                >
                  <Link href="/auth/sign-up">
                    Comecar Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
              {/* Glow decorativo */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gray-800 opacity-50 blur-3xl" />
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Precos transparentes para Cloud
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Pague apenas pelo que usar. Sem surpresas, sem taxas escondidas.
            </p>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-4 text-left font-semibold">
                        Plano
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Alunos
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Preco
                      </th>
                      <th className="px-6 py-4 text-left font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-6 py-4">
                        <div className="font-medium">Start</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        Ate 300
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">R$ 500</span>/mes
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" asChild>
                          <Link href="/auth/sign-up">Comecar</Link>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b bg-card shadow-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-primary">
                          Growth
                          <Badge className="bg-blue-100 text-[10px] text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Recomendado
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        301 - 500
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">R$ 500</span> + R$
                        1,50/aluno extra
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" asChild>
                          <Link href="/auth/sign-up">Comecar</Link>
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-6 py-4">
                        <div className="font-medium">Scale</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        501 - 1000
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">Teto anterior</span> +
                        R$ 1,00/aluno extra
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" asChild>
                          <Link href="/auth/sign-up">Comecar</Link>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="font-medium">Enterprise</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">1001+</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">Sob consulta</span>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="mailto:contato@aluminify.com">
                            Contato
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Perguntas Frequentes</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Encontre respostas para as duvidas mais comuns sobre a plataforma.
            </p>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Como comeco com o Aluminify?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Voce pode criar uma conta gratuita no Cloud em minutos ou
                  clonar o repositorio do GitHub para hospedar em seu proprio
                  servidor.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Como funciona a colaboracao entre professores?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Professores podem compartilhar materiais, criar cronogramas
                  colaborativos e acompanhar o progresso dos alunos em tempo
                  real.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Quais integracoes estao disponiveis?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Integramos com Google Calendar, sistemas de pagamento e
                  oferecemos API REST completa para integracoes customizadas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Quais sao os planos de precos?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O plano Cloud comeca em R$ 500/mes para ate 300 alunos. A
                  versao self-hosted e totalmente gratuita.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Meus dados estao seguros?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim. Usamos criptografia em transito e em repouso, backups
                  automaticos diarios e seguimos as melhores praticas de
                  seguranca LGPD.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Quais opcoes de suporte estao disponiveis?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comunidade no Discord para self-hosted. Suporte prioritario
                  por email e chat para planos Cloud.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ainda tem duvidas?{" "}
            <Link
              href="mailto:contato@aluminify.com"
              className="text-primary hover:underline"
            >
              Entre em contato com nossa equipe
            </Link>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary px-4 py-24 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Mantenha-se atualizado com Aluminify
          </h2>
          <p className="mx-auto mb-8 max-w-2xl opacity-90">
            Receba as ultimas atualizacoes sobre novos recursos, integracoes e
            insights sobre educacao.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Digite seu email"
              className="flex-1 rounded-md border-0 bg-primary-foreground/10 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
            />
            <Button
              variant="secondary"
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="font-bold">Aluminify</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A infraestrutura invisivel da educacao. Open source e
                white-label para escolas modernas.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground">
                    Precos
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="hover:text-foreground">
                    Comecar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="https://docs.aluminify.com"
                    target="_blank"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Documentacao
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/sinesys/aluminify"
                    target="_blank"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://discord.gg/aluminify"
                    target="_blank"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Discord
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacidade" className="hover:text-foreground">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="hover:text-foreground">
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">
              2025 Aluminify. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <Link
                href="https://sinesys.com"
                target="_blank"
                className="font-semibold hover:text-foreground"
              >
                Sinesys Intelligence
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
