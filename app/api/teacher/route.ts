import { NextRequest, NextResponse } from "next/server";
import {
  teacherService,
  TeacherConflictError,
  TeacherValidationError,
} from "@/backend/services/teacher";
import { getAuthUser } from "@/backend/auth/middleware";

const serializeTeacher = (
  teacher: Awaited<ReturnType<typeof teacherService.getById>>,
) => ({
  id: teacher.id,
  fullName: teacher.fullName,
  email: teacher.email,
  cpf: teacher.cpf,
  phone: teacher.phone,
  biography: teacher.biography,
  photoUrl: teacher.photoUrl,
  specialty: teacher.specialty,
  createdAt: teacher.createdAt.toISOString(),
  updatedAt: teacher.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof TeacherValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof TeacherConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  // Log detalhado do erro
  console.error("Teacher API Error:", error);

  // Extrair mensagem de erro mais detalhada
  let errorMessage = "Internal server error";
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error("Error stack:", error.stack);
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message);
  }

  return NextResponse.json(
    {
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const result = await teacherService.list();
    const teachers = Array.isArray(result) ? result : result.data;
    return NextResponse.json({ data: teachers.map(serializeTeacher) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Apenas usuarios (staff) e superadmins podem criar professores
    if (
      user.role !== "usuario" &&
      user.role !== "usuario" &&
      user.role !== "superadmin"
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas usuários da instituição ou superadmin podem criar professores.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log("[Teacher POST] Request body:", body);

    if (!body?.fullName || !body?.email) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: fullName e email são necessários",
        },
        { status: 400 },
      );
    }

    // Super Admin pode criar sem empresaId, outros professores precisam de empresaId
    if (!user.isSuperAdmin && !body?.empresaId) {
      return NextResponse.json(
        { error: "empresaId é obrigatório para professores" },
        { status: 400 },
      );
    }

    const teacher = await teacherService.create({
      id: body?.id,
      empresaId: body?.empresaId || null,
      fullName: body?.fullName,
      email: body?.email,
      cpf: body?.cpf,
      phone: body?.phone,
      biography: body?.biography,
      photoUrl: body?.photoUrl,
      specialty: body?.specialty,
    });
    console.log("[Teacher POST] Teacher created:", teacher.id);
    return NextResponse.json(
      { data: serializeTeacher(teacher) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Teacher POST] Error creating teacher:", error);
    return handleError(error);
  }
}
