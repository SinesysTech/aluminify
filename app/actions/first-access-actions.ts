"use server";

import { createClient } from "@/lib/server";
import { getDatabaseClient } from "@/backend/clients/database";

export type FinalizeFirstAccessResult = {
  success: boolean;
  error?: string;
};

/**
 * Finaliza o primeiro acesso no servidor:
 * - garante `must_change_password=false` no user_metadata (admin API)
 * - tenta limpar flags na tabela `alunos` quando existir registro
 *
 * Motivo: evitar loops em `/primeiro-acesso` quando a atualização client-side
 * não persiste/propaga imediatamente ou quando há inconsistência de cadastros.
 */
export async function finalizeFirstAccessAction(): Promise<FinalizeFirstAccessResult> {
  try {
    const sessionClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Não autenticado" };
    }

    const adminClient = getDatabaseClient();

    const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nextMeta: Record<string, unknown> = {
      ...currentMeta,
      must_change_password: false,
    };

    const { error: metaError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: nextMeta,
    });

    if (metaError) {
      console.error("[finalizeFirstAccessAction] erro ao atualizar metadata:", metaError);
      return { success: false, error: metaError.message || "Falha ao finalizar primeiro acesso" };
    }

    // Se for aluno, tentar limpar também na tabela alunos (se existir).
    const role = currentMeta.role;
    if (role === "aluno") {
      const { data: alunoById, error: alunoIdError } = await adminClient
        .from("alunos")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (alunoIdError) {
        console.warn("[finalizeFirstAccessAction] erro ao buscar aluno por id:", alunoIdError);
      }

      if (alunoById?.id) {
        const { error: alunoUpdateError } = await adminClient
          .from("alunos")
          .update({ must_change_password: false, senha_temporaria: null })
          .eq("id", user.id);

        if (alunoUpdateError) {
          console.warn("[finalizeFirstAccessAction] erro ao atualizar aluno:", alunoUpdateError);
        }
      } else if (user.email) {
        // Fallback por email (bases legadas podem ter divergência id/email)
        const { error: alunoUpdateByEmailError } = await adminClient
          .from("alunos")
          .update({ must_change_password: false, senha_temporaria: null })
          .eq("email", user.email.toLowerCase());

        if (alunoUpdateByEmailError) {
          console.warn(
            "[finalizeFirstAccessAction] erro ao atualizar aluno por email:",
            alunoUpdateByEmailError
          );
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[finalizeFirstAccessAction] erro inesperado:", error);
    return { success: false, error: "Erro interno ao finalizar primeiro acesso" };
  }
}

