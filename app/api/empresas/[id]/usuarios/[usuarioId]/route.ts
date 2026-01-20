import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { UsuarioRepositoryImpl } from "@/backend/services/usuario";
import { PapelRepositoryImpl } from "@/backend/services/papel";
import { getAuthUser } from "@/backend/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/backend/middleware/empresa-context";
import type { UpdateUsuarioInput } from "@/types/shared/entities/usuario";

interface RouteContext {
  params: Promise<{ id: string; usuarioId: string }>;
}

/**
 * GET /api/empresas/[id]/usuarios/[usuarioId]
 * Busca um usuário específico
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, usuarioId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Users can view their own profile
    const canView =
      user.isSuperAdmin ||
      user.id === usuarioId ||
      user.permissions?.usuarios?.view;

    if (!canView) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar usuário" },
        { status: 403 }
      );
    }

    const repository = new UsuarioRepositoryImpl(supabase);
    const usuario = await repository.findByIdWithPapel(usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verify usuario belongs to empresa
    if (usuario.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error fetching usuario:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/empresas/[id]/usuarios/[usuarioId]
 * Atualiza um usuário
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, usuarioId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Users can edit their own profile (limited fields) or admins can edit any
    const isOwnProfile = user.id === usuarioId;
    const canEdit =
      user.isSuperAdmin || isOwnProfile || user.permissions?.usuarios?.edit;

    if (!canEdit) {
      return NextResponse.json(
        { error: "Sem permissão para editar usuário" },
        { status: 403 }
      );
    }

    const repository = new UsuarioRepositoryImpl(supabase);

    // Verify usuario exists and belongs to empresa
    const existingUsuario = await repository.findById(usuarioId);
    if (!existingUsuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (existingUsuario.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      papelId,
      nomeCompleto,
      email,
      cpf,
      telefone,
      chavePix,
      fotoUrl,
      biografia,
      especialidade,
      ativo,
    } = body;

    // If changing papel, verify permission and papel exists
    if (papelId !== undefined && papelId !== existingUsuario.papelId) {
      // Only admins can change role
      if (!user.isSuperAdmin && !user.permissions?.usuarios?.edit) {
        return NextResponse.json(
          { error: "Sem permissão para alterar papel do usuário" },
          { status: 403 }
        );
      }

      const papelRepository = new PapelRepositoryImpl(supabase);
      const papel = await papelRepository.findById(papelId);
      if (!papel) {
        return NextResponse.json(
          { error: "Papel não encontrado" },
          { status: 404 }
        );
      }

      if (papel.empresaId !== null && papel.empresaId !== id) {
        return NextResponse.json(
          { error: "Papel não pertence a esta empresa" },
          { status: 400 }
        );
      }
    }

    // If changing ativo status, verify permission
    if (ativo !== undefined && ativo !== existingUsuario.ativo) {
      if (!user.isSuperAdmin && !user.permissions?.usuarios?.edit) {
        return NextResponse.json(
          { error: "Sem permissão para alterar status do usuário" },
          { status: 403 }
        );
      }
    }

    // If editing own profile, restrict fields
    const input: UpdateUsuarioInput = {};
    if (isOwnProfile && !user.isSuperAdmin && !user.permissions?.usuarios?.edit) {
      // Own profile - limited fields
      if (nomeCompleto !== undefined) input.nomeCompleto = nomeCompleto;
      if (telefone !== undefined) input.telefone = telefone;
      if (chavePix !== undefined) input.chavePix = chavePix;
      if (fotoUrl !== undefined) input.fotoUrl = fotoUrl;
      if (biografia !== undefined) input.biografia = biografia;
      if (especialidade !== undefined) input.especialidade = especialidade;
    } else {
      // Admin edit - all fields
      if (papelId !== undefined) input.papelId = papelId;
      if (nomeCompleto !== undefined) input.nomeCompleto = nomeCompleto;
      if (email !== undefined) input.email = email;
      if (cpf !== undefined) input.cpf = cpf;
      if (telefone !== undefined) input.telefone = telefone;
      if (chavePix !== undefined) input.chavePix = chavePix;
      if (fotoUrl !== undefined) input.fotoUrl = fotoUrl;
      if (biografia !== undefined) input.biografia = biografia;
      if (especialidade !== undefined) input.especialidade = especialidade;
      if (ativo !== undefined) input.ativo = ativo;
    }

    const usuario = await repository.update(usuarioId, input);

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error updating usuario:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar usuário";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/empresas/[id]/usuarios/[usuarioId]
 * Remove (soft delete) um usuário
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id, usuarioId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Check permission to delete usuarios
    if (!user.isSuperAdmin && !user.permissions?.usuarios?.delete) {
      return NextResponse.json(
        { error: "Sem permissão para remover usuários" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const repository = new UsuarioRepositoryImpl(supabase);

    // Verify usuario exists and belongs to empresa
    const existingUsuario = await repository.findById(usuarioId);
    if (!existingUsuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (existingUsuario.empresaId !== id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Cannot delete yourself
    if (user.id === usuarioId) {
      return NextResponse.json(
        { error: "Não é possível remover seu próprio usuário" },
        { status: 400 }
      );
    }

    // Soft delete
    await repository.softDelete(usuarioId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting usuario:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao remover usuário";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
