import { createClient } from "@/app/shared/core/server"
import { redirect, notFound } from "next/navigation"
import { getAgendamentoById } from "@/app/[tenant]/(modules)/agendamentos/lib/actions";
import { AgendamentoDetails } from "../../components/agendamento-details"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string; tenant: string }>
}

export default async function AgendamentoDetailPage({ params }: PageProps) {
  const { id, tenant } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${tenant}/auth/login`)
  }

  const agendamento = await getAgendamentoById(id)

  if (!agendamento || agendamento.professor_id !== user.id) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${tenant}/agendamentos`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            Detalhes do Agendamento
          </h1>
          <p className="page-subtitle">
            Visualize e gerencie este agendamento
          </p>
        </div>
      </div>

      <AgendamentoDetails agendamento={agendamento} />
    </div>
  )
}
