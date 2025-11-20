import { NextRequest, NextResponse } from 'next/server';
import {
  enrollmentService,
  EnrollmentConflictError,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    let enrollments;
    if (studentId) {
      enrollments = await enrollmentService.listByStudent(studentId);
    } else if (courseId) {
      enrollments = await enrollmentService.listByCourse(courseId);
    } else {
      enrollments = await enrollmentService.list();
    }

    return NextResponse.json({ data: enrollments.map(serializeEnrollment) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enrollment = await enrollmentService.create({
      studentId: body?.studentId,
      courseId: body?.courseId,
      accessStartDate: body?.accessStartDate,
      accessEndDate: body?.accessEndDate,
      active: body?.active,
    });
    return NextResponse.json({ data: serializeEnrollment(enrollment) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

