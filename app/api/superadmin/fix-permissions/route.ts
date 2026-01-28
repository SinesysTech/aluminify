import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";

/**
 * GET /api/superadmin/fix-permissions
 * Corrige permissões de professores adicionando is_admin = true
 * Requer autenticação de superadmin
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas superadmin pode corrigir permissões." },
        { status: 403 }
      );
    }

    const adminClient = getDatabaseClient();

    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) throw error;

    let updatedCount = 0;
    const errors: { id: string; error: string }[] = [];

    for (const authUser of users) {
      const role = authUser.user_metadata?.role;
      const isProfessor =
        role === "professor" ||
        authUser.user_metadata?.is_professor === true ||
        authUser.user_metadata?.is_professor === "true";

      if (isProfessor) {
        const { error: updateError } =
          await adminClient.auth.admin.updateUserById(authUser.id, {
            user_metadata: {
              ...authUser.user_metadata,
              is_admin: true,
            },
          });

        if (updateError) {
          errors.push({ id: authUser.id, error: updateError.message });
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
      { status: 500 }
    );
  }
}
