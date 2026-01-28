import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { StudentRepositoryImpl } from "@/app/[tenant]/(modules)/usuario/services";
import { studentService } from "@/app/[tenant]/(modules)/usuario/services";
import { randomBytes } from "crypto";

/**
 * GET /api/superadmin/alunos
 * Lista todos os alunos de todas as empresas (apenas superadmin)
 *
 * Query params:
 * - search: busca por nome, email ou CPF
 * - empresaId: filtra por empresa
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode acessar esta rota." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const empresaId = searchParams.get("empresaId");

    const adminClient = getDatabaseClient();

    // Build query
    let query = adminClient
      .from("alunos")
      .select(
        `
        id,
        email,
        nome_completo,
        cpf,
        telefone,
        empresa_id,
        created_at,
        updated_at,
        empresas:empresa_id (
          id,
          nome,
          slug
        )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(
        `nome_completo.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`,
      );
    }

    if (empresaId && empresaId !== "all") {
      query = query.eq("empresa_id", empresaId);
    }

    const { data: alunos, error } = await query;

    if (error) {
      console.error("Error fetching alunos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar alunos" },
        { status: 500 },
      );
    }

    // Get course counts for each student
    const alunoIds = (alunos || []).map((a) => a.id);

    let courseCounts: Record<string, number> = {};
    if (alunoIds.length > 0) {
      const { data: enrollments } = await adminClient
        .from("alunos_cursos")
        .select("aluno_id")
        .in("aluno_id", alunoIds);

      if (enrollments) {
        courseCounts = enrollments.reduce(
          (acc, e) => {
            acc[e.aluno_id] = (acc[e.aluno_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      }
    }

    // Transform data
    const transformed = (alunos || []).map((aluno) => {
      const empresa = aluno.empresas as {
        id: string;
        nome: string;
        slug: string;
      } | null;
      return {
        id: aluno.id,
        email: aluno.email,
        fullName: aluno.nome_completo,
        cpf: aluno.cpf,
        phone: aluno.telefone,
        empresaId: aluno.empresa_id,
        empresaNome: empresa?.nome || null,
        empresaSlug: empresa?.slug || null,
        totalCursos: courseCounts[aluno.id] || 0,
        createdAt: aluno.created_at,
        updatedAt: aluno.updated_at,
      };
    });

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("Error in superadmin alunos endpoint:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
