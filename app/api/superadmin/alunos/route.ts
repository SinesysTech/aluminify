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

/**
 * POST /api/superadmin/alunos
 * Criar aluno (apenas superadmin)
 * Permite criar aluno com ou sem courseIds
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode criar alunos." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      email,
      fullName,
      cpf,
      phone,
      birthDate,
      address,
      zipCode,
      enrollmentNumber,
      instagram,
      twitter,
      courseIds,
      temporaryPassword,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email é obrigatório" },
        { status: 400 },
      );
    }

    const hasCourses =
      courseIds && Array.isArray(courseIds) && courseIds.length > 0;
    if (!hasCourses && !temporaryPassword && !cpf) {
      return NextResponse.json(
        {
          error:
            "Quando não há cursos, é necessário fornecer CPF ou senha temporária (temporaryPassword)",
        },
        { status: 400 },
      );
    }

    if (temporaryPassword && temporaryPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha temporária deve ter pelo menos 8 caracteres" },
        { status: 400 },
      );
    }

    let finalTemporaryPassword = temporaryPassword;
    if (!hasCourses && !finalTemporaryPassword) {
      if (cpf) {
        finalTemporaryPassword = cpf.replace(/\D/g, "");
      } else {
        finalTemporaryPassword = randomBytes(16).toString("hex");
      }
    }

    try {
      const adminClient = getDatabaseClient();

      if (!hasCourses) {
        const { data: authUser, error: authError } =
          await adminClient.auth.admin.createUser({
            email,
            password: finalTemporaryPassword!,
            email_confirm: true,
            user_metadata: {
              role: "aluno",
              full_name: fullName,
              must_change_password: true,
            },
          });

        if (authError || !authUser?.user) {
          return NextResponse.json(
            {
              error: `Erro ao criar usuário: ${authError?.message || "Unknown error"}`,
            },
            { status: 500 },
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const repository = new StudentRepositoryImpl(adminClient);
        let aluno = await repository.findById(authUser.user.id);

        if (!aluno) {
          return NextResponse.json(
            {
              error:
                "Aluno criado mas registro não encontrado. Tente novamente.",
            },
            { status: 500 },
          );
        }

        const updateData: Record<string, unknown> = {};
        if (cpf) updateData.cpf = cpf;
        if (phone) updateData.phone = phone;
        if (birthDate) updateData.birthDate = birthDate;
        if (address) updateData.address = address;
        if (zipCode) updateData.zipCode = zipCode;
        if (enrollmentNumber) updateData.enrollmentNumber = enrollmentNumber;
        if (instagram) updateData.instagram = instagram;
        if (twitter) updateData.twitter = twitter;

        if (Object.keys(updateData).length > 0) {
          aluno = await repository.update(authUser.user.id, updateData);
        }

        return NextResponse.json(
          {
            id: aluno.id,
            email: aluno.email,
            fullName: aluno.fullName,
            cpf: aluno.cpf,
            phone: aluno.phone,
            birthDate: aluno.birthDate,
            address: aluno.address,
            zipCode: aluno.zipCode,
            enrollmentNumber: aluno.enrollmentNumber,
            instagram: aluno.instagram,
            twitter: aluno.twitter,
            courses: [],
            courseIds: [],
            mustChangePassword: aluno.mustChangePassword,
            temporaryPassword: finalTemporaryPassword,
            createdAt: aluno.createdAt,
            updatedAt: aluno.updatedAt,
          },
          { status: 201 },
        );
      } else {
        const student = await studentService.create({
          email,
          fullName,
          cpf,
          phone,
          birthDate,
          address,
          zipCode,
          enrollmentNumber,
          instagram,
          twitter,
          courseIds,
          temporaryPassword: finalTemporaryPassword,
        });

        return NextResponse.json(student, { status: 201 });
      }
    } catch (error) {
      console.error("Error creating student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar aluno";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in superadmin alunos POST endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar aluno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
