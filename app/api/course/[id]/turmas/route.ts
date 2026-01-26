import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { createStudentTransferService } from "@/app/[tenant]/(dashboard)/usuario/services";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId e obrigatorio" },
        { status: 400 },
      );
    }

    const transferService = createStudentTransferService(supabase);
    const turmas = await transferService.getTurmasByCourse(courseId);

    return NextResponse.json({ data: turmas });
  } catch (error) {
    console.error("Error fetching turmas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar turmas" },
      { status: 500 },
    );
  }
}
