import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import {
  EmpresaRepositoryImpl,
  EmpresaService,
} from "@/app/[tenant]/(modules)/empresa/services";
import type { Database } from "@/app/shared/core/database.types";

/**
 * POST /api/empresa/self
 *
 * Permite que um professor SEM empresa crie sua própria empresa (onboarding)
 * e seja vinculado como owner/admin.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "usuario") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas usuários da instituição podem criar empresa neste fluxo.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const nome = String(body?.nome ?? "").trim();
    const cnpjRaw = body?.cnpj ? String(body.cnpj).trim() : "";
    const cnpjDigits = cnpjRaw.replace(/\D/g, "");
    const cnpj = cnpjDigits.length === 0 ? undefined : cnpjDigits; // sempre normaliza para dígitos
    const emailContato = body?.emailContato
      ? String(body.emailContato).trim()
      : undefined;
    const telefone = body?.telefone ? String(body.telefone).trim() : undefined;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 },
      );
    }

    // Validação amigável (evita 500 por erro de input)
    if (cnpj && cnpj.length !== 14) {
      return NextResponse.json(
        { error: "CNPJ deve ter 14 dígitos" },
        { status: 400 },
      );
    }

    if (cnpj && /^(\d)\1+$/.test(cnpj)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    const adminClient = getDatabaseClient();

    // Confirmar que o usuario existe e ainda não está vinculado a uma empresa
    const { data: professor, error: professorError } = await adminClient
      .from("usuarios")
      .select("id, empresa_id")
      .eq("id", user.id)
      .maybeSingle();

    // Type assertion: Query result properly typed from Database schema
    type ProfessorEmpresa = Pick<
      Database["public"]["Tables"]["usuarios"]["Row"],
      "id" | "empresa_id"
    >;
    const typedProfessor = professor as ProfessorEmpresa | null;

    if (professorError || !typedProfessor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 },
      );
    }

    if (typedProfessor.empresa_id) {
      return NextResponse.json(
        { error: "Este professor já está vinculado a uma empresa" },
        { status: 409 },
      );
    }

    // 1) Criar empresa com bypass de RLS (service role)
    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);
    const empresa = await service.create({
      nome,
      cnpj,
      emailContato,
      telefone,
      plano: "basico",
    });

    // 2) Vincular usuario à empresa
    const { error: updateProfessorError } = await adminClient
      .from("usuarios")
      .update({ empresa_id: empresa.id })
      .eq("id", user.id);

    if (updateProfessorError) {
      return NextResponse.json(
        {
          error: `Erro ao vincular professor à empresa: ${updateProfessorError.message}`,
        },
        { status: 500 },
      );
    }

    // 3) Inserir em usuarios_empresas como owner/admin
    const { error: adminInsertError } = await adminClient
      .from("usuarios_empresas")
      .insert({
        empresa_id: empresa.id,
        usuario_id: user.id,
        papel_base: "usuario",
        is_owner: true,
        is_admin: true,
        ativo: true,
      });

    if (adminInsertError) {
      console.error("Error inserting usuarios_empresas:", adminInsertError);
      // Não falhar completamente, mas logar o erro
      // O usuario já foi vinculado à empresa na tabela usuarios
    }

    // 4) Atualizar registro em usuarios para papel professor_admin
    // Buscar papel_id do professor_admin
    const { data: papelAdmin } = await adminClient
      .from("papeis")
      .select("id")
      .eq("tipo", "professor_admin")
      .eq("is_system", true)
      .single();

    if (papelAdmin) {
      const { error: updateUsuarioError } = await adminClient
        .from("usuarios")
        .update({
          empresa_id: empresa.id,
          papel_id: papelAdmin.id,
        })
        .eq("id", user.id);

      if (updateUsuarioError) {
        console.error("Error updating usuario:", updateUsuarioError);
      }
    }

    // 5) Atualizar metadata do usuário (melhora UX de contexto no frontend)
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          role: "usuario",
          role_type: "professor_admin",
          empresa_id: empresa.id,
          is_admin: true,
        },
      });
    } catch (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      // Não falhar completamente, os metadados podem ser atualizados depois
    }

    return NextResponse.json(
      {
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          plano: empresa.plano,
        },
        message: "Empresa criada e vinculada ao professor com sucesso.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating self empresa:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar empresa";
    // Se cair aqui por erro de validação, devolver 400 para UX melhor
    if (
      typeof message === "string" &&
      (message.includes("CNPJ deve ter 14 dígitos") ||
        message.includes("CNPJ inválido"))
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
