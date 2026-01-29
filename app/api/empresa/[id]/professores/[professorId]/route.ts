import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/app/shared/core/middleware/empresa-context";

interface RouteContext {
  params: Promise<{ id: string; professorId: string }>;
}

// PATCH /api/empresa/[id]/professores/[professorId] - Atualizar professor (toggle admin, etc)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, professorId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id)) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas admin da empresa pode atualizar professores.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "isAdmin deve ser um booleano" },
        { status: 400 },
      );
    }

    // Verificar se o professor pertence à empresa
    const { data: vinculo, error: fetchError } = await supabase
      .from("usuarios_empresas")
      .select("id, empresa_id, usuario_id")
      .eq("usuario_id", professorId)
      .eq("papel_base", "professor")
      .eq("empresa_id", id)
      .eq("ativo", true)
      .is("deleted_at", null)
      .single();

    // Type assertion: Query result properly typed
    type VinculoEmpresa = {
      id: string;
      empresa_id: string;
      usuario_id: string;
    };
    const typedVinculo = vinculo as VinculoEmpresa | null;

    if (fetchError || !typedVinculo) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 },
      );
    }

    if (typedVinculo.empresa_id !== id) {
      return NextResponse.json(
        { error: "Professor não pertence a esta empresa" },
        { status: 403 },
      );
    }

    // Atualizar o campo is_admin na tabela usuarios_empresas
    const { error: updateError } = await supabase
      .from("usuarios_empresas")
      .update({ is_admin: isAdmin })
      .eq("usuario_id", professorId)
      .eq("empresa_id", id);

    if (updateError) {
      throw updateError;
    }

    // Também atualizar no user_metadata do auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      professorId,
      {
        user_metadata: {
          is_admin: isAdmin,
        },
      },
    );

    if (authError) {
      console.error("Error updating auth user metadata:", authError);
      // Não falhar a request por isso, pois a tabela foi atualizada
    }

    return NextResponse.json({ success: true, isAdmin });
  } catch (error) {
    console.error("Error updating professor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar professor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
