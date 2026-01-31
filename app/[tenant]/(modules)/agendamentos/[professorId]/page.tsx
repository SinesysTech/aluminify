import { AgendamentoScheduler } from "../components/scheduler"
import { createClient } from "@/app/shared/core/server"
import { redirect, notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/app/shared/components/feedback/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AgendamentoProfessorPageProps {
  params: Promise<{ professorId: string; tenant: string }>
}

interface Professor {
  id: string
  nome: string
  foto_url: string | null
  especialidade: string | null
  tem_disponibilidade: boolean
}

async function getProfessorById(supabase: Awaited<ReturnType<typeof createClient>>, professorId: string): Promise<Professor | null> {
  const { data: professor, error } = await supabase
    .from("usuarios")
    .select("id, nome_completo, foto_url, especialidade")
    .eq("id", professorId)
    .single()

  if (error || !professor) {
    return null
  }

  // Check if professor has availability configured
  const { data: disponibilidade } = await supabase
    .from("agendamento_disponibilidade")
    .select("id")
    .eq("professor_id", professorId)
    .eq("ativo", true)
    .limit(1)

  return {
    id: professor.id,
    nome: professor.nome_completo,
    foto_url: professor.foto_url,
    especialidade: professor.especialidade,
    tem_disponibilidade: (disponibilidade?.length ?? 0) > 0
  }
}

export default async function AgendamentoProfessorPage({ params }: AgendamentoProfessorPageProps) {
  const resolvedParams = await params
  const { professorId, tenant } = resolvedParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${tenant}/auth`)
  }

  // Fetch professor data
  const professor = await getProfessorById(supabase, professorId)

  if (!professor) {
    notFound()
  }

  const initials = professor.nome
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${tenant}/agendamentos`}>
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
              Este professor ainda não configurou horários de disponibilidade.
            </p>
          )}
        </div>
      </div>

      {/* Scheduler */}
      <div>
        {professor.tem_disponibilidade ? (
          <Suspense fallback={<SchedulerSkeleton />}>
            <AgendamentoScheduler professorId={professorId} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/50">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Horários não disponíveis
            </h2>
            <p className="text-muted-foreground max-w-md">
              Este professor ainda não configurou seus horários de atendimento.
              Por favor, escolha outro professor ou tente novamente mais tarde.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${tenant}/agendamentos`}>
                Ver outros professores
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function SchedulerSkeleton() {
  return (
    <div className="w-full bg-background px-4 py-4 md:px-8 md:py-6 rounded-md border">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <Skeleton className="h-[280px] w-full lg:w-[280px]" />
        <Skeleton className="h-[280px] w-full lg:w-[320px]" />
        <Skeleton className="hidden lg:block h-[280px] w-[280px]" />
      </div>
    </div>
  )
}
