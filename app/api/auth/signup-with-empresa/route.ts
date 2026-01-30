import { NextRequest, NextResponse } from "next/server";
import {
  EmpresaService,
  EmpresaRepositoryImpl,
} from "@/app/[tenant]/(modules)/empresa/services";
import { getDatabaseClient } from "@/app/shared/core/database/database";

/**
 * Endpoint de cadastro que cria empresa automaticamente quando professor se cadastra sem empresa_id.
 *
 * Este endpoint é chamado quando um professor faz cadastro sem estar vinculado a uma empresa existente.
 * O sistema cria automaticamente uma nova empresa e associa o professor como owner/admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, empresaNome } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "email, password e fullName são obrigatórios" },
        { status: 400 },
      );
    }

    if (!empresaNome || !empresaNome.trim()) {
      return NextResponse.json(
        { error: "nome da empresa é obrigatório" },
        { status: 400 },
      );
    }

    const adminClient = getDatabaseClient();

    // 1. Criar empresa automaticamente
    // Usar adminClient (service role) para bypass de RLS
    const repository = new EmpresaRepositoryImpl(adminClient);
    const service = new EmpresaService(repository, adminClient);

    // Usar nome da empresa fornecido (já validado acima)
    const nomeEmpresa = empresaNome.trim();

    const empresa = await service.create({
      nome: nomeEmpresa,
      plano: "basico",
    });

    // 2. Criar usuário com empresa_id
    // IMPORTANTE: role_type define o papel na tabela usuarios via trigger handle_new_user()
    // O primeiro usuário que cria a empresa deve ser professor_admin (administrador)
    const { data: newUser, error: userError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "usuario",
          role_type: "professor_admin", // Define papel como Professor Administrador
          full_name: fullName,
          empresa_id: empresa.id,
          is_admin: true,
        },
      });

    if (userError) {
      // Se falhar ao criar usuário, tentar deletar a empresa criada
      try {
        await service.delete(empresa.id);
      } catch (deleteError) {
        console.error(
          "Error deleting empresa after user creation failure:",
          deleteError,
        );
      }

      if (
        userError.message?.includes("already registered") ||
        userError.message?.includes("already exists") ||
        userError.status === 422
      ) {
        return NextResponse.json(
          { error: "Este email já está cadastrado" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: `Erro ao criar usuário: ${userError.message || "Erro desconhecido"}`,
        },
        { status: 500 },
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 },
      );
    }

    // 2.1 Criar registro em `usuarios` (fonte de verdade para empresa_id)
    // Não depender apenas de trigger, pois fluxos via admin client podem variar.
    // Buscar papel_id para professor_admin
    const { data: papelAdmin } = await adminClient
      .from("papeis")
      .select("id")
      .eq("tipo", "professor_admin")
      .eq("is_system", true)
      .maybeSingle();

    const { error: insertUsuarioError } = await adminClient
      .from("usuarios")
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email || email,
        nome_completo: fullName,
        empresa_id: empresa.id,
        cpf: null,
        telefone: null,
        biografia: null,
        foto_url: null,
        especialidade: null,
        ativo: true,
        ...(papelAdmin?.id ? { papel_id: papelAdmin.id } : {}),
      });

    if (insertUsuarioError) {
      console.error("Error creating usuario record:", insertUsuarioError);
      // rollback best-effort: remover user e empresa para não deixar tenant órfão
      try {
        await adminClient.auth.admin.deleteUser(newUser.user.id);
      } catch (deleteUserError) {
        console.error(
          "Error deleting user after usuario insert failure:",
          deleteUserError,
        );
      }
      try {
        await service.delete(empresa.id);
      } catch (deleteEmpresaError) {
        console.error(
          "Error deleting empresa after usuario insert failure:",
          deleteEmpresaError,
        );
      }
      return NextResponse.json(
        {
          error: `Erro ao criar registro de usuario: ${insertUsuarioError.message}`,
        },
        { status: 500 },
      );
    }

    // 3. Inserir em usuarios_empresas como owner/admin
    const { error: adminError } = await adminClient
      .from("usuarios_empresas")
      .insert({
        empresa_id: empresa.id,
        usuario_id: newUser.user.id,
        papel_base: "usuario",
        is_owner: true,
        is_admin: true,
        ativo: true,
      });

    if (adminError) {
      console.error("Error creating usuarios_empresas record:", adminError);
      // Não falhar, pois o usuario já foi criado
    }

    // Retornar dados do usuário e empresa criada
    return NextResponse.json(
      {
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          fullName,
        },
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
        },
        message:
          "Conta e empresa criadas com sucesso! Você é o administrador da empresa.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in signup-with-empresa:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
