import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/backend/clients/database";
import {
  requireUserAuth,
  AuthenticatedRequest,
} from "@/backend/auth/middleware";
import {
  courseStructureCacheService,
  activityCacheService,
} from "@/backend/services/cache";
import type { Database } from "@/lib/database.types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function handleError(error: unknown) {
  console.error("[Frente API] Error:", error);

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function deleteHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (!request.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar se o usuário é professor/usuario
  if (
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json(
      { error: "Forbidden. Only professors can delete fronts." },
      { status: 403 },
    );
  }

  const client = getDatabaseClient();
  const frenteId = params.id;
  const userId = request.user.id;
  const metadataEmpresaId = request.user.empresaId;

  try {
    // Resolver empresa_id do usuario (preferir metadata, mas cair para tabela usuarios)
    let empresaId: string | undefined = metadataEmpresaId;
    if (!empresaId && request.user.role === "usuario") {
      const { data: usuario, error: usuarioError } = await client
        .from("usuarios")
        .select("empresa_id")
        .eq("id", userId)
        .eq("ativo", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (usuarioError) {
        console.error(
          "[Frente API] Error fetching usuario empresa_id:",
          usuarioError,
        );
        return NextResponse.json(
          { error: "Failed to verify user company" },
          { status: 500 },
        );
      }

      empresaId = usuario?.empresa_id ?? undefined;
    }

    // Se não conseguimos determinar a empresa e não é superadmin, não dá para autorizar com segurança
    if (!empresaId && request.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden. Missing company context for this user." },
        { status: 403 },
      );
    }

    // 1. Buscar a frente e verificar se existe
    const { data: frente, error: frenteError } = await client
      .from("frentes")
      .select("id, nome, disciplina_id, empresa_id")
      .eq("id", frenteId)
      .maybeSingle();

    // Type assertion: Query result properly typed from Database schema
    type FrenteDetails = Pick<
      Database["public"]["Tables"]["frentes"]["Row"],
      "id" | "nome" | "disciplina_id" | "empresa_id"
    >;
    const typedFrente = frente as FrenteDetails | null;

    if (frenteError) {
      console.error("[Frente API] Error fetching frente:", frenteError);
      return NextResponse.json(
        { error: "Failed to fetch frente" },
        { status: 500 },
      );
    }

    if (!typedFrente) {
      return NextResponse.json({ error: "Frente not found" }, { status: 404 });
    }

    // 2. Validar que a frente pertence à empresa do professor
    // (em multitenancy, frentes possuem empresa_id; logo, dá pra autorizar sem depender do curso)
    if (
      request.user.role !== "superadmin" &&
      empresaId &&
      typedFrente.empresa_id !== empresaId
    ) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete fronts from your company." },
        { status: 403 },
      );
    }

    // 3. Buscar módulos da frente
    const { data: modulos, error: modulosError } = await client
      .from("modulos")
      .select("id")
      .eq("frente_id", frenteId);

    // Type assertion: Query result properly typed from Database schema
    type ModuloId = Pick<Database["public"]["Tables"]["modulos"]["Row"], "id">;
    const typedModulos = modulos as ModuloId[] | null;

    if (modulosError) {
      console.error("[Frente API] Error fetching modulos:", modulosError);
      return NextResponse.json(
        { error: "Failed to fetch modules" },
        { status: 500 },
      );
    }

    const moduloIds = typedModulos?.map((m) => m.id) || [];

    // 4. Verificar se há cronogramas que referenciam aulas desta frente
    let cronogramasCount = 0;
    if (moduloIds.length > 0) {
      // Buscar aulas dos módulos
      const { data: aulas, error: aulasError } = await client
        .from("aulas")
        .select("id")
        .in("modulo_id", moduloIds);

      // Type assertion: Query result properly typed from Database schema
      type AulaId = Pick<Database["public"]["Tables"]["aulas"]["Row"], "id">;
      const typedAulas = aulas as AulaId[] | null;

      if (aulasError) {
        console.error("[Frente API] Error fetching aulas:", aulasError);
        // Continuar mesmo com erro, pois pode não haver aulas
      } else {
        const aulaIds = typedAulas?.map((a) => a.id) || [];

        if (aulaIds.length > 0) {
          // Verificar se há cronogramas que referenciam essas aulas
          // Buscar todos os cronograma_ids (sem limit para contar todos)
          const { data: cronogramas, error: cronogramasError } = await client
            .from("cronograma_itens")
            .select("cronograma_id")
            .in("aula_id", aulaIds);

          // Type assertion: Query result properly typed from Database schema
          type CronogramaId = Pick<
            Database["public"]["Tables"]["cronograma_itens"]["Row"],
            "cronograma_id"
          >;
          const typedCronogramas = cronogramas as CronogramaId[] | null;

          if (
            !cronogramasError &&
            typedCronogramas &&
            typedCronogramas.length > 0
          ) {
            // Contar cronogramas únicos
            const cronogramaIds = new Set(
              typedCronogramas.map((c) => c.cronograma_id),
            );
            cronogramasCount = cronogramaIds.size;
          }
        }
      }
    }

    // 5. Deletar em cascata: aulas → módulos → frente
    // Primeiro, deletar todas as aulas dos módulos
    if (moduloIds.length > 0) {
      const { error: deleteAulasError } = await client
        .from("aulas")
        .delete()
        .in("modulo_id", moduloIds);

      if (deleteAulasError) {
        console.error("[Frente API] Error deleting aulas:", deleteAulasError);
        return NextResponse.json(
          { error: "Failed to delete aulas" },
          { status: 500 },
        );
      }
    }

    // Depois, deletar todos os módulos
    if (moduloIds.length > 0) {
      const { error: deleteModulosError } = await client
        .from("modulos")
        .delete()
        .in("id", moduloIds);

      if (deleteModulosError) {
        console.error(
          "[Frente API] Error deleting modulos:",
          deleteModulosError,
        );
        return NextResponse.json(
          { error: "Failed to delete modulos" },
          { status: 500 },
        );
      }
    }

    // Por fim, deletar a frente
    const { error: deleteFrenteError } = await client
      .from("frentes")
      .delete()
      .eq("id", frenteId);

    if (deleteFrenteError) {
      console.error("[Frente API] Error deleting frente:", deleteFrenteError);
      return NextResponse.json(
        { error: "Failed to delete frente" },
        { status: 500 },
      );
    }

    console.log(
      `[Frente API] Frente ${frenteId} deleted successfully by user ${userId}`,
    );

    // Invalidar cache de estrutura hierárquica e atividades
    if (typedFrente.disciplina_id) {
      await courseStructureCacheService.invalidateDisciplines([
        typedFrente.disciplina_id,
      ]);
    }
    if (moduloIds.length > 0) {
      await activityCacheService.invalidateModulos(moduloIds);
    }

    return NextResponse.json({
      success: true,
      message: "Frente deleted successfully",
      hasCronogramas: cronogramasCount > 0,
      cronogramasCount,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => deleteHandler(req, params))(request);
}
