import { NextRequest, NextResponse } from "next/server";
import {
  teacherService,
  TeacherConflictError,
  TeacherNotFoundError,
  TeacherValidationError,
} from "@/app/[tenant]/(dashboard)/usuario/services";
import {
  requireAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

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

  if (error instanceof TeacherNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Pode ser público ou autenticado dependendo da necessidade
async function getHandler(
  _request: AuthenticatedRequest,
  params: { id: string },
) {
  try {
    if (!params || !params.id || params.id === "undefined") {
      console.error("[Teacher GET] Invalid params:", params);
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 },
      );
    }
    const teacher = await teacherService.getById(params.id);
    return NextResponse.json({ data: serializeTeacher(teacher) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação
async function putHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  try {
    // Validar params.id
    if (!params || !params.id || params.id === "undefined") {
      console.error("[Teacher PUT] Invalid params:", params);
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    console.log("[Teacher PUT] Request body:", body);
    console.log("[Teacher PUT] Teacher ID:", params.id);
    console.log("[Teacher PUT] Params object:", params);

    // Preparar dados de atualização - só incluir campos que foram fornecidos
    const updatePayload: {
      fullName?: string;
      email?: string;
      cpf?: string | null;
      phone?: string | null;
      biography?: string | null;
      photoUrl?: string | null;
      specialty?: string | null;
    } = {};

    if (body?.fullName !== undefined) {
      updatePayload.fullName = body.fullName;
    }
    if (body?.email !== undefined) {
      updatePayload.email = body.email;
    }
    if (body?.cpf !== undefined) {
      updatePayload.cpf = body.cpf || null;
    }
    if (body?.phone !== undefined) {
      updatePayload.phone = body.phone || null;
    }
    if (body?.biography !== undefined) {
      updatePayload.biography = body.biography || null;
    }
    if (body?.photoUrl !== undefined) {
      updatePayload.photoUrl = body.photoUrl || null;
    }
    if (body?.specialty !== undefined) {
      updatePayload.specialty = body.specialty || null;
    }

    console.log("[Teacher PUT] Update payload:", updatePayload);

    const teacher = await teacherService.update(params.id, updatePayload);
    console.log("[Teacher PUT] Teacher updated:", teacher.id);
    return NextResponse.json({ data: serializeTeacher(teacher) });
  } catch (error) {
    console.error("[Teacher PUT] Error updating teacher:", error);
    return handleError(error);
  }
}

// DELETE requer autenticação
async function deleteHandler(
  _request: AuthenticatedRequest,
  params: { id: string },
) {
  try {
    if (!params || !params.id || params.id === "undefined") {
      console.error("[Teacher DELETE] Invalid params:", params);
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 },
      );
    }
    await teacherService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const handler = requireAuth((req) => getHandler(req, params));
  return handler(request);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const handler = requireAuth((req) => putHandler(req, params));
  return handler(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const handler = requireAuth((req) => deleteHandler(req, params));
  return handler(request);
}
