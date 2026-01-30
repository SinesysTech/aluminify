import { NextResponse } from "next/server";
import {
  requireUserAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import {
  clearImpersonationContext,
  getImpersonationContext,
} from "@/app/shared/core/auth-impersonate";
import { getDefaultRouteForRole } from "@/app/shared/core/roles";
import { invalidateAuthSessionCache } from "@/app/shared/core/auth";

async function postHandler(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se está realmente em modo impersonação
    const context = await getImpersonationContext();
    if (!context) {
      // Se não estiver em modo impersonação, retornamos sucesso pois o objetivo (não estar impersonando)
      // já está garantido. Isso evita erros 400 desnecessários no console durante o login normal.
      return NextResponse.json(
        { success: true, message: "Já está no contexto real" },
        { status: 200 },
      );
    }

    // Verificar se o usuário real corresponde
    if (context.realUserId !== request.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Limpar contexto e cache de sessão
    await clearImpersonationContext();
    await invalidateAuthSessionCache(request.user.id);

    return NextResponse.json({
      success: true,
      redirectTo: getDefaultRouteForRole(context.realUserRole),
    });
  } catch (error) {
    console.error("Erro ao parar impersonação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export const POST = requireUserAuth(postHandler);
