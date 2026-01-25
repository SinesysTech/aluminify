import { NextResponse, type NextRequest } from "next/server";
import {
  requireUserAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { ConteudosTemplateService } from "@/app/[tenant]/(dashboard)/conteudos/services/conteudos-template.service";

export const runtime = "nodejs";

async function getHandler(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const templateService = new ConteudosTemplateService();
    const buffer = await templateService.generateTemplate();

    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const filename = `modelo-importacao-conteudos-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

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
    console.error("Erro ao gerar template de conteúdos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar template de conteúdos" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return requireUserAuth(getHandler)(request);
}
