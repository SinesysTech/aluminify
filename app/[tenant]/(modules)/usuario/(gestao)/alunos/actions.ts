"use server";

import { createClient } from "@/app/shared/core/server";
import { createStudentService } from "@/app/[tenant]/(modules)/usuario/services/student.service";
import { getAuthenticatedUser } from "@/app/shared/core/auth";
import { CreateStudentInput } from "@/app/shared/types/entities/user";
import { revalidatePath } from "next/cache";
import { canDelete } from "@/app/shared/core/roles";

export async function deleteStudentAction(studentId: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Check permission to delete students
    const canDeleteStudents =
      user.role === "superadmin" || canDelete(user.permissions, "alunos");
    if (!canDeleteStudents) {
      return {
        success: false,
        error: "Permissão negada. Apenas administradores podem excluir alunos.",
      };
    }

    const supabase = await createClient();
    const studentService = createStudentService(supabase);

    await studentService.delete(studentId);

    revalidatePath("/usuario/alunos");
    revalidatePath("/usuario/alunos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createStudentAction(data: CreateStudentInput) {
  try {
    // Obter usuário autenticado para pegar empresaId
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    if (!user.empresaId) {
      return {
        success: false,
        error: "Usuário não está associado a uma empresa",
      };
    }

    // Usar cliente com contexto do usuário para respeitar RLS
    const supabase = await createClient();
    const studentService = createStudentService(supabase);

    // Passar empresaId do usuário para o aluno
    const newStudent = await studentService.create({
      ...data,
      empresaId: user.empresaId,
    });

    revalidatePath("/usuario/alunos");
    revalidatePath("/usuario/alunos");
    revalidatePath("/aluno");

    return { success: true, data: newStudent };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: (error as Error).message };
  }
}
