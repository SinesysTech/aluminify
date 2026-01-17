import { IntegracaoManager } from "@/components/professor/integracao-manager"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function IntegracoesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get professor's empresa_id
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id")
    .eq("id", user.id)
    .single()

  if (!professor?.empresa_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Integracoes</h1>
          <p className="text-muted-foreground">
            Voce precisa estar vinculado a uma empresa para configurar integracoes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Integracoes</h1>
        <p className="text-muted-foreground">
          Conecte servicos externos para gerar links de reuniao automaticamente.
        </p>
      </div>

      {params.success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Sucesso!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            {params.success === "google" && "Google Calendar conectado com sucesso!"}
            {params.success === "zoom" && "Zoom conectado com sucesso!"}
          </AlertDescription>
        </Alert>
      )}

      {params.error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro na integracao</AlertTitle>
          <AlertDescription>
            {params.error === "missing_params" && "Parametros de autenticacao ausentes."}
            {params.error === "access_denied" && "Acesso negado pelo servico."}
            {!["missing_params", "access_denied"].includes(params.error) && params.error}
          </AlertDescription>
        </Alert>
      )}

      <IntegracaoManager professorId={user.id} />
    </div>
  )
}
