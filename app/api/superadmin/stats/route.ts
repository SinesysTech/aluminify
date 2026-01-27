import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";

export interface SuperAdminStats {
  totalEmpresas: number;
  empresasAtivas: number;
  totalUsuarios: number;
  totalAlunos: number;
  totalCursos: number;
  usuariosAtivos30d: number;
  recentEmpresas: RecentEmpresa[];
}

export interface RecentEmpresa {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  ativo: boolean;
  createdAt: string;
  totalUsuarios: number;
}

// GET /api/superadmin/stats - Métricas globais (apenas superadmin)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas superadmin pode acessar estas métricas.",
        },
        { status: 403 },
      );
    }

    const adminClient = getDatabaseClient();

    // Execute all queries in parallel for better performance
    const [
      empresasResult,
      empresasAtivasResult,
      usuariosResult,
      alunosResult,
      cursosResult,
      usuariosAtivos30dResult,
      recentEmpresasResult,
    ] = await Promise.all([
      // Total de empresas
      adminClient.from("empresas").select("id", { count: "exact", head: true }),

      // Empresas ativas
      adminClient
        .from("empresas")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),

      // Total de usuários (staff/professores) ativos
      adminClient
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true)
        .is("deleted_at", null),

      // Total de alunos
      adminClient
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),

      // Total de cursos
      adminClient.from("cursos").select("id", { count: "exact", head: true }),

      // Usuários ativos nos últimos 30 dias (usando RPC ou query direta)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient.rpc("count_active_users_30d" as any).maybeSingle(),

      // Últimas 5 empresas criadas com contagem de usuários
      adminClient
        .from("empresas")
        .select(
          `
          id,
          nome,
          slug,
          plano,
          ativo,
          created_at
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Handle potential errors
    if (empresasResult.error) {
      console.error("Error fetching empresas count:", empresasResult.error);
    }
    if (empresasAtivasResult.error) {
      console.error(
        "Error fetching empresas ativas count:",
        empresasAtivasResult.error,
      );
    }
    if (usuariosResult.error) {
      console.error("Error fetching usuarios count:", usuariosResult.error);
    }
    if (alunosResult.error) {
      console.error("Error fetching alunos count:", alunosResult.error);
    }
    if (cursosResult.error) {
      console.error("Error fetching cursos count:", cursosResult.error);
    }

    // Get user counts per empresa for recent empresas
    const recentEmpresas: RecentEmpresa[] = [];
    if (recentEmpresasResult.data) {
      for (const empresa of recentEmpresasResult.data) {
        const { count: usuariosCount } = await adminClient
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresa.id)
          .eq("ativo", true)
          .is("deleted_at", null);

        const { count: alunosCount } = await adminClient
          .from("alunos")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresa.id)
          .is("deleted_at", null);

        recentEmpresas.push({
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          plano: empresa.plano,
          ativo: empresa.ativo,
          createdAt: empresa.created_at,
          totalUsuarios: (usuariosCount ?? 0) + (alunosCount ?? 0),
        });
      }
    }

    // Fallback for active users count if RPC doesn't exist
    let usuariosAtivos30d = 0;
    if (usuariosAtivos30dResult.error) {
      // RPC doesn't exist, use alternative approach
      // Count distinct users from usuarios and alunos that exist
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsuarios } = await adminClient
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true)
        .is("deleted_at", null)
        .gte("updated_at", thirtyDaysAgo.toISOString());

      const { count: activeAlunos } = await adminClient
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("updated_at", thirtyDaysAgo.toISOString());

      usuariosAtivos30d = (activeUsuarios ?? 0) + (activeAlunos ?? 0);
    } else {
      usuariosAtivos30d = (usuariosAtivos30dResult.data as number) ?? 0;
    }

    const stats: SuperAdminStats = {
      totalEmpresas: empresasResult.count ?? 0,
      empresasAtivas: empresasAtivasResult.count ?? 0,
      totalUsuarios: usuariosResult.count ?? 0,
      totalAlunos: alunosResult.count ?? 0,
      totalCursos: cursosResult.count ?? 0,
      usuariosAtivos30d,
      recentEmpresas,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching superadmin stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 },
    );
  }
}
