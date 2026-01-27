import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import type { EmpresaWithMetrics } from "@/app/superadmin/empresas/types";

// GET /api/superadmin/empresas - List all empresas with metrics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode acessar." },
        { status: 403 },
      );
    }

    const adminClient = getDatabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const plano = searchParams.get("plano");
    const search = searchParams.get("search");

    // Build query
    let query = adminClient
      .from("empresas")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("ativo", status === "ativo");
    }
    if (plano && plano !== "all") {
      query = query.eq(
        "plano",
        plano as "basico" | "profissional" | "enterprise",
      );
    }
    if (search) {
      query = query.or(
        `nome.ilike.%${search}%,slug.ilike.%${search}%,cnpj.ilike.%${search}%`,
      );
    }

    const { data: empresas, error } = await query;

    if (error) {
      console.error("Error fetching empresas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar empresas" },
        { status: 500 },
      );
    }

    // Get metrics for each empresa
    const empresasWithMetrics: EmpresaWithMetrics[] = await Promise.all(
      (empresas || []).map(async (empresa) => {
        const [usuariosResult, alunosResult, cursosResult] = await Promise.all([
          adminClient
            .from("usuarios")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", empresa.id)
            .eq("ativo", true)
            .is("deleted_at", null),
          adminClient
            .from("alunos")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", empresa.id)
            .is("deleted_at", null),
          adminClient
            .from("cursos")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", empresa.id),
        ]);

        return {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          cnpj: empresa.cnpj,
          emailContato: empresa.email_contato,
          telefone: empresa.telefone,
          logoUrl: empresa.logo_url,
          plano: empresa.plano,
          ativo: empresa.ativo,
          createdAt: empresa.created_at,
          updatedAt: empresa.updated_at,
          totalUsuarios: usuariosResult.count ?? 0,
          totalAlunos: alunosResult.count ?? 0,
          totalCursos: cursosResult.count ?? 0,
        };
      }),
    );

    return NextResponse.json({ data: empresasWithMetrics });
  } catch (error) {
    console.error("Error in GET /api/superadmin/empresas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
