
import { requireUser } from "@/app/shared/core/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegracaoManager } from "@/app/[tenant]/(modules)/agendamentos/configuracoes/components/integracao-manager"
import { ConfiguracoesForm } from "@/app/[tenant]/(modules)/agendamentos/configuracoes/components/configuracoes-form"
import { HotmartIntegration } from "@/app/[tenant]/(modules)/financeiro/integracoes/components/hotmart-integration"
import { getConfiguracoesProfessor } from "@/app/[tenant]/(modules)/agendamentos/lib/actions"

export default async function IntegracoesPage() {
  const user = await requireUser({ allowedRoles: ["usuario"] })

  if (!user.empresaId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Integrações</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para gerenciar integrações.
          </p>
        </div>
      </div>
    )
  }

  const configuracoes = await getConfiguracoesProfessor(user.id)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Integrações e Configurações</h1>
        <p className="page-subtitle">
          Gerencie suas conexões externas e configurações de agendamento.
        </p>
      </div>

      <Tabs defaultValue="videoconferencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videoconferencia">Videoconferência</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
        </TabsList>

        <TabsContent value="videoconferencia" className="space-y-4">
          <IntegracaoManager professorId={user.id} />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <HotmartIntegration empresaId={user.empresaId} />
        </TabsContent>

        <TabsContent value="agendamento" className="space-y-4">
          <ConfiguracoesForm
            professorId={user.id}
            initialData={configuracoes}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
