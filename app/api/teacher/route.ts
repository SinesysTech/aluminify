import { NextRequest, NextResponse } from 'next/server';
import {
  teacherService,
  TeacherConflictError,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const teachers = await teacherService.list();
    return NextResponse.json({ data: teachers.map(serializeTeacher) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const teacher = await teacherService.create({
      id: body?.id,
      fullName: body?.fullName,
      email: body?.email,
      cpf: body?.cpf,
      phone: body?.phone,
      biography: body?.biography,
      photoUrl: body?.photoUrl,
      specialty: body?.specialty,
    });
    return NextResponse.json({ data: serializeTeacher(teacher) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

