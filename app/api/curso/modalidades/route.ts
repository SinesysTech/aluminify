import { NextResponse } from "next/server";
import {
  requireAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { getDatabaseClientAsUser } from "@/app/shared/core/database/database";

async function getHandler(request: AuthenticatedRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 },
      );
    }
    const client = getDatabaseClientAsUser(token);

    // RLS will handle tenant filtering
    // RLS will handle tenant filtering
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { data: rawData, error } = await (client
      .from("modalidades_curso" as any)
      .select("*")
      .order("nome") as unknown as Promise<{ data: any[]; error: any }>);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (error) {
      console.error("Error fetching modalidade_curso:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const data = rawData?.map((m) => ({
      id: m.id,
      nome: m.nome,
      slug: m.slug,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error fetching modalidade_curso:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = requireAuth(getHandler);
