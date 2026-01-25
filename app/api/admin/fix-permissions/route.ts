import { NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";

export async function GET() {
  try {
    const adminClient = getDatabaseClient();

    // 1. Listar todos os usuários (em batches se necessário, mas para demo vamos pegar 50)
    // Nota: supabase.auth.admin.listUsers() tem paginação.
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({
      perPage: 1000, // Tentar pegar todos de uma vez se não forem muitos
    });

    if (error) throw error;

    let updatedCount = 0;
    const errors = [];

    for (const user of users) {
      // Verificar se é professor
      const role = user.user_metadata?.role;
      const isProfessor =
        role === "professor" ||
        user.user_metadata?.is_professor === true ||
        user.user_metadata?.is_professor === "true";

      if (isProfessor) {
        // Atualizar metadata
        const { error: updateError } =
          await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              is_admin: true,
            },
          });

        if (updateError) {
          errors.push({ id: user.id, error: updateError.message });
        } else {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalUsersScanned: users.length,
      updatedCount,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
