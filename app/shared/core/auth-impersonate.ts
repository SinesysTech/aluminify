import type { AppUserRole } from "@/types/user";
import { cookies } from "next/headers";

export interface ImpersonationContext {
  realUserId: string;
  realUserRole: AppUserRole;
  impersonatedUserId: string;
  impersonatedUserRole: AppUserRole;
  startedAt: string;
}

const IMPERSONATION_COOKIE_NAME = "impersonation_context";
const IMPERSONATION_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 horas

/**
 * Armazena o contexto de impersonação em um cookie seguro
 */
export async function setImpersonationContext(
  context: ImpersonationContext,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE_NAME, JSON.stringify(context), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: IMPERSONATION_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Obtém o contexto de impersonação do cookie
 */
export async function getImpersonationContext(): Promise<ImpersonationContext | null> {
  const cookieStore = await cookies();
  const contextCookie = cookieStore.get(IMPERSONATION_COOKIE_NAME);

  if (!contextCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(contextCookie.value) as ImpersonationContext;
  } catch {
    return null;
  }
}

/**
 * Remove o contexto de impersonação
 */
export async function clearImpersonationContext(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE_NAME);
}

/**
 * Verifica se o usuário atual está em modo impersonação
 */
export async function isImpersonating(): Promise<boolean> {
  const context = await getImpersonationContext();
  return context !== null;
}

/**
 * Valida se um usuário pode impersonar outro usuário
 */
export function canImpersonateUser(
  realUserRole: AppUserRole,
  realUserEmpresaId: string | undefined,
  targetUserId: string,
  targetUserRole: AppUserRole,
  targetUserEmpresaId: string | undefined,
): { allowed: boolean; reason?: string } {
  // Superadmin pode impersonar qualquer usuário
  if (realUserRole === "superadmin") {
    return { allowed: true };
  }

  // Professores e admins de empresa (usuarios) podem impersonar apenas alunos
  if (realUserRole === "usuario") {
    if (targetUserRole !== "aluno") {
      return { allowed: false, reason: "Apenas alunos podem ser impersonados" };
    }

    // Verificar se o aluno pertence à mesma empresa (se aplicável)
    if (realUserEmpresaId && targetUserEmpresaId) {
      if (realUserEmpresaId !== targetUserEmpresaId) {
        return { allowed: false, reason: "Aluno não pertence à sua empresa" };
      }
    }

    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Você não tem permissão para impersonar usuários",
  };
}
