"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/shared/core/server";
import { UserBaseService } from "@/app/[tenant]/(modules)/usuario/services/user-base.service";
import { UsuarioRepositoryImpl } from "@/app/[tenant]/(modules)/usuario/services/usuario.repository";
import { requireUser } from "@/app/shared/core/auth";
import type { RoleTipo } from "@/app/shared/types/entities/papel";

const createMemberSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  papelTipo: z.enum(["admin", "professor", "staff", "monitor"], {
    errorMap: () => ({ message: "Papel inválido" }),
  }),
});

export type CreateMemberState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    nomeCompleto?: string[];
    email?: string[];
    papelTipo?: string[];
  };
} | null;

export async function createMemberAction(
  prevState: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const user = await requireUser();

  if (!user.empresaId) {
    return { error: "Usuário não pertence a uma empresa" };
  }

  const rawData = {
    nomeCompleto: formData.get("nomeCompleto"),
    email: formData.get("email"),
    papelTipo: formData.get("papelTipo"),
  };

  const validatedFields = createMemberSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: "Erro de validação",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nomeCompleto, email, papelTipo } = validatedFields.data;

  try {
    const supabase = await createClient();
    const usuarioRepository = new UsuarioRepositoryImpl(supabase);
    const userBaseService = new UserBaseService();

    // 1. Verificar se já existe usuário com este email na empresa
    const existingUser = await usuarioRepository.findByEmail(
      email,
      user.empresaId,
    );
    if (existingUser) {
      return {
        error: "Já existe um membro com este email nesta empresa",
        fieldErrors: { email: ["Email já cadastrado"] },
      };
    }

    // 2. Buscar o ID do papel correspondente
    // Como a tabela de papeis pode variar, vamos buscar pelo tipo e empresaId
    // Assumindo que existam papeis padrão ou customizados.
    // Se for um papel de sistema (sem empresaId), a query deve considerar isso.
    // Mas o repository listByPapelTipo filtra por empresaId.
    // Vamos listar os papeis da empresa e filtrar pelo tipo.

    // Melhor abordagem: Buscar um papel que corresponda ao tipo selecionado.
    // Se houver múltiplos, pegamos o primeiro (geralmente o padrão).
    const { data: papeis, error: papeisError } = await supabase
      .from("papeis")
      .select("id")
      .or(`empresa_id.eq.${user.empresaId},empresa_id.is.null`)
      .eq("tipo", papelTipo)
      .limit(1);

    if (papeisError || !papeis || papeis.length === 0) {
      return { error: `Papel do tipo '${papelTipo}' não encontrado` };
    }

    const papelId = papeis[0].id;

    // 3. Criar usuário no Supabase Auth (via Admin API)
    const isAdmin = papelTipo === "admin";
    const { userId: authUserId } = await userBaseService.createAuthUser({
      email,
      fullName: nomeCompleto,
      role: "usuario", // Role do Supabase Auth (geral)
      empresaId: user.empresaId,
      isAdmin,
      mustChangePassword: true, // Forçar troca de senha no primeiro login
    });

    // 4. Criar registro na tabela publica 'usuarios'
    await usuarioRepository.create({
      id: authUserId,
      empresaId: user.empresaId,
      papelId,
      nomeCompleto,
      email,
      ativo: true,
    });

    revalidatePath("/settings/equipe"); // Revalidar a lista
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar membro:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao criar membro",
    };
  }
}
