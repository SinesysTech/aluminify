import { NextRequest, NextResponse } from 'next/server';
import {
  teacherService,
  TeacherConflictError,
  TeacherNotFoundError,
  TeacherValidationError,
} from '@/backend/services/teacher';

const serializeTeacher = (teacher: Awaited<ReturnType<typeof teacherService.getById>>) => ({
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const teacher = await teacherService.getById(params.id);
    return NextResponse.json({ data: serializeTeacher(teacher) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const teacher = await teacherService.update(params.id, {
      fullName: body?.fullName,
      email: body?.email,
      cpf: body?.cpf,
      phone: body?.phone,
      biography: body?.biography,
      photoUrl: body?.photoUrl,
      specialty: body?.specialty,
    });
    return NextResponse.json({ data: serializeTeacher(teacher) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await teacherService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

