import { requireUser } from "@/app/shared/core/auth";
import { HotmartIntegration } from "./components/hotmart-integration";

export default async function FinanceiroIntegracoesPage() {
  const user = await requireUser({ allowedRoles: ["usuario"] });

  if (!user.empresaId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Integrações de Pagamento</h1>
          <p className="page-subtitle">
            Você precisa estar vinculado a uma empresa para gerenciar
            integrações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Integrações de Pagamento</h1>
        <p className="page-subtitle">
          Configure webhooks para receber dados automaticamente de plataformas
          de pagamento.
        </p>
      </div>

      <HotmartIntegration empresaId={user.empresaId} />
    </div>
  );
}
