import { NextResponse, type NextRequest } from "next/server";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";
import { createClient } from "@/app/shared/core/server";
import { createStudentOrganizationsService } from "@/app/[tenant]/(modules)/usuario/services";

function handleError(error: unknown) {
  console.error("Student Courses by Org API Error:", error);
  let errorMessage = "Internal server error";
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  } else if (typeof error === "string") {
    errorMessage = error;
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

/**
 * GET /api/student/courses-by-org
 *
 * Returns all courses for the current student, grouped by organization.
 * Only accessible by authenticated students (role: "aluno").
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    // Only students can access this endpoint
    if (!request.user || request.user.role !== "aluno") {
      return NextResponse.json(
        { error: "Forbidden: This endpoint is only for students" },
        { status: 403 },
      );
    }

    // Create Supabase client with user context for RLS
    const supabase = await createClient();

    // Create service and fetch courses grouped by organization
    const service = createStudentOrganizationsService(supabase);
    const result = await service.getCoursesByOrganization();

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  return requireAuth(getHandler)(request);
}
