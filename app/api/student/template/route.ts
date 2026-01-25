import { NextResponse, type NextRequest } from "next/server";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { StudentTemplateService } from "@/app/[tenant]/(dashboard)/aluno/services/student-template.service";
import { isAdminRoleTipo } from "@/app/shared/core/roles";

async function getHandler(request: AuthenticatedRequest) {
  try {
    const user = request.user;
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Permitir superadmin e admins de empresa (usuários com roleType admin)
    const isAdmin =
      user.role === "usuario" && !!user.roleType && isAdminRoleTipo(user.roleType);
    if (!user.isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const templateService = new StudentTemplateService();
    const buffer = await templateService.generateTemplate();

    // NextResponse BodyInit em ambiente server não aceita Buffer/Uint8Array aqui (types),
    // então enviamos como ArrayBuffer.
    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const filename = `modelo-importacao-alunos-${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar template de importação:", error);
    return NextResponse.json(
      { error: "Erro ao gerar template de importação" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return requireAuth(getHandler)(request);
}
