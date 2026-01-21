"use server";

import { createClient } from "@/lib/server";
import { getDatabaseClient } from "@/backend/clients/database";
import { createUserRoleIdentifier } from "@/backend/services/user/user-role-identifier.service";

export type IdentifyRoleResult = {
  success: boolean;
  redirectUrl?: string;
  error?: string;
};

export async function identifyUserRoleAction(
  userId: string,
): Promise<IdentifyRoleResult> {
  try {
    // Segurança: não confiar no userId vindo do cliente.
    // Sempre validar contra o usuário autenticado da sessão/cookies.
    const sessionClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Não autenticado" };
    }

    if (userId && userId !== user.id) {
      console.warn(
        `[identifyUserRoleAction] userId não corresponde ao usuário autenticado. Ignorando parâmetro.`,
        { providedUserId: userId, authenticatedUserId: user.id },
      );
    }

    // Use o client com privilégios de service role para resolver roles com consistência
    // e (se necessário) persistir metadata sem expor isso ao browser.
    const adminClient = getDatabaseClient();
    const roleIdentifier = createUserRoleIdentifier(adminClient);

    const { primaryRole } = await roleIdentifier.identifyUserRoles(user.id, {
      includeDetails: false,
    });

    let redirectUrl = "/protected"; // Fallback

    switch (primaryRole) {
      case "superadmin":
        redirectUrl = "/admin"; // Or superadmin specific dashboard
        break;
      case "usuario":
        redirectUrl = "/professor/dashboard";
        break;
      case "aluno":
        // Tenta obter o slug da empresa do metadata ou params
        // O ideal é redirecionar para uma rota que sabe resolver o tenant,
        // mas como a rota é /[tenant]/aluno/dashboard, precisamos do slug.

        // TODO: Buscar slug da empresa se não estiver no metadata
        // Por hora, vamos redirecionar para /aluno que faz o redirect correto
        // se o usuário tiver empresaSlug (veja app/(dashboard)/aluno/page.tsx)
        redirectUrl = "/aluno";
        break;
      default:
        console.warn(
          `[identifyUserRoleAction] Unknown role: ${primaryRole} for user ${user.id}`,
        );
        redirectUrl = "/protected";
    }

    // Persistir o role detectado no metadata para que guards/redirects (lib/auth.ts) fiquem consistentes.
    // Importante: só o server atualiza isso (admin API), o cliente não define role.
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          role: primaryRole,
        },
      });
    } catch (persistError) {
      console.warn(
        "[identifyUserRoleAction] Falha ao persistir role no metadata:",
        persistError,
      );
      // Não bloquear login por falha de persistência
    }

    return { success: true, redirectUrl };
  } catch (error) {
    console.error("[identifyUserRoleAction] Error:", error);
    return { success: false, error: "Failed to identify user role" };
  }
}
