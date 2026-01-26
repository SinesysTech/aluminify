import { createClient } from "@/app/shared/core/server";
import { redirect } from "next/navigation";
import { HotmartIntegration } from "./components/hotmart-integration";

export default async function FinanceiroIntegracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's empresa_id from profiles or empresas
  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  const empresaId = profile?.empresa_id;

  if (!empresaId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="page-title">Integracoes de Pagamento</h1>
          <p className="page-subtitle">
            Voce precisa estar vinculado a uma empresa para gerenciar
            integracoes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="page-title">Integracoes de Pagamento</h1>
        <p className="page-subtitle">
          Configure webhooks para receber dados automaticamente de plataformas
          de pagamento.
        </p>
      </div>

      <HotmartIntegration empresaId={empresaId} />
    </div>
  );
}
