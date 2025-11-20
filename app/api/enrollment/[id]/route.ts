import { NextRequest, NextResponse } from 'next/server';
import {
  enrollmentService,
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  EnrollmentValidationError,
} from '@/backend/services/enrollment';

const serializeEnrollment = (enrollment: Awaited<ReturnType<typeof enrollmentService.getById>>) => ({
  id: enrollment.id,
  studentId: enrollment.studentId,
  courseId: enrollment.courseId,
  enrollmentDate: enrollment.enrollmentDate.toISOString(),
  accessStartDate: enrollment.accessStartDate.toISOString().split('T')[0],
  accessEndDate: enrollment.accessEndDate.toISOString().split('T')[0],
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
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const enrollment = await enrollmentService.getById(params.id);
    return NextResponse.json({ data: serializeEnrollment(enrollment) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await enrollmentService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

