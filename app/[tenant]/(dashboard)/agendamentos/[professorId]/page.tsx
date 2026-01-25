import { AgendamentoScheduler } from "../components/scheduler"
import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { getProfessorById } from "@/app/actions/agendamentos"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AgendamentoProfessorPageProps {
  params: Promise<{ professorId: string }>
}

export default async function AgendamentoProfessorPage({ params }: AgendamentoProfessorPageProps) {
  const resolvedParams = await params
  const { professorId } = resolvedParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch professor data
  const professor = await getProfessorById(professorId)

  if (!professor) {
    notFound()
  }

  const initials = professor.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <main className="flex min-h-screen flex-col py-8 px-4 md:py-16 md:px-5 gap-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agendamentos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Professor header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pb-4 border-b">
        <Avatar className="h-16 w-16">
          <AvatarImage src={professor.foto_url || undefined} alt={professor.nome} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-2xl md:text-3xl">
            Agendar com {professor.nome}
          </h1>
          {professor.especialidade && (
            <p className="text-muted-foreground">
              {professor.especialidade}
            </p>
          )}
          {!professor.tem_disponibilidade && (
            <p className="text-sm text-amber-600 mt-2">
              Este professor ainda nao configurou horarios de disponibilidade.
            </p>
          )}
        </div>
      </div>

      {/* Scheduler */}
      <div className="my-4">
        {professor.tem_disponibilidade ? (
          <Suspense fallback={<SchedulerSkeleton />}>
            <AgendamentoScheduler professorId={professorId} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/50">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Horarios nao disponiveis
            </h2>
            <p className="text-muted-foreground max-w-md">
              Este professor ainda nao configurou seus horarios de atendimento.
              Por favor, escolha outro professor ou tente novamente mais tarde.
            </p>
            <Button asChild className="mt-6">
              <Link href="/agendamentos">
                Ver outros professores
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

function SchedulerSkeleton() {
  return (
    <div className="w-full bg-background px-8 py-6 rounded-md border">
      <div className="flex gap-6">
        <Skeleton className="h-[320px] w-[280px]" />
        <Skeleton className="h-[320px] w-[320px]" />
        <Skeleton className="h-[320px] w-[280px]" />
      </div>
    </div>
  )
}
