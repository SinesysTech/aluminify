import type { PapelBase } from "@/app/shared/types";
import { cookies } from "next/headers";

export interface ImpersonationContext {
  realUserId: string;
  realUserRole: PapelBase;
  impersonatedUserId: string;
  impersonatedUserRole: PapelBase;
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
  realUserRole: PapelBase,
  realUserEmpresaId: string | undefined,
  _targetUserId: string,
  targetUserRole: PapelBase,
  targetUserEmpresaId: string | undefined,
): { allowed: boolean; reason?: string } {
  // Admins de empresa (usuarios) podem impersonar
  if (realUserRole === "usuario") {
    // 1. Impersonar Aluno
    if (targetUserRole === "aluno") {
      // Verificar se o aluno pertence à mesma empresa (se aplicável)
      if (realUserEmpresaId && targetUserEmpresaId) {
        if (realUserEmpresaId !== targetUserEmpresaId) {
          return { allowed: false, reason: "Aluno não pertence à sua empresa" };
        }
      }
      return { allowed: true };
    }

    // 2. Impersonar Outro Usuário da Equipe
    if (targetUserRole === "usuario") {
      if (realUserEmpresaId && targetUserEmpresaId) {
        if (realUserEmpresaId !== targetUserEmpresaId) {
          return {
            allowed: false,
            reason: "Usuário não pertence à sua empresa",
          };
        }
      }
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Tipo de usuário não pode ser impersonado",
    };
  }

  return {
    allowed: false,
    reason: "Você não tem permissão para impersonar usuários",
  };
}
