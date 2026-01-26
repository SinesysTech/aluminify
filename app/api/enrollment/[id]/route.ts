import { NextRequest, NextResponse } from "next/server";
import {
  enrollmentService,
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  EnrollmentValidationError,
} from "@/app/[tenant]/(modules)/usuario/services/enrollment";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";

const serializeEnrollment = (
  enrollment: Awaited<ReturnType<typeof enrollmentService.getById>>,
) => ({
  id: enrollment.id,
  studentId: enrollment.studentId,
  courseId: enrollment.courseId,
  enrollmentDate: enrollment.enrollmentDate.toISOString(),
  accessStartDate: enrollment.accessStartDate.toISOString().split("T")[0],
  accessEndDate: enrollment.accessEndDate.toISOString().split("T")[0],
  active: enrollment.active,
  createdAt: enrollment.createdAt.toISOString(),
  updatedAt: enrollment.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof EnrollmentValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof EnrollmentConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof EnrollmentNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - RLS filtra automaticamente (alunos veem apenas suas próprias matrículas)
async function getHandler(
  _request: AuthenticatedRequest,
  params: { id: string },
) {
  try {
    const enrollment = await enrollmentService.getById(params.id);
    return NextResponse.json({ data: serializeEnrollment(enrollment) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT - RLS verifica permissões (professor ou superadmin)
async function putHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const enrollment = await enrollmentService.update(params.id, {
      accessStartDate: body?.accessStartDate,
      accessEndDate: body?.accessEndDate,
      active: body?.active,
    });
    return NextResponse.json({ data: serializeEnrollment(enrollment) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - RLS verifica permissões (professor ou superadmin)
async function deleteHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await enrollmentService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => getHandler(req, params))(request);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => putHandler(req, params))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}
