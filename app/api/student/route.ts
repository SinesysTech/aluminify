import { NextResponse } from 'next/server';
import {
  studentService,
  StudentConflictError,
  StudentValidationError,
} from '@/backend/services/student';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeStudent = (student: Awaited<ReturnType<typeof studentService.getById>>) => ({
  id: student.id,
  fullName: student.fullName,
  email: student.email,
  cpf: student.cpf,
  phone: student.phone,
  birthDate: student.birthDate?.toISOString().split('T')[0] ?? null,
  address: student.address,
  zipCode: student.zipCode,
  enrollmentNumber: student.enrollmentNumber,
  instagram: student.instagram,
  twitter: student.twitter,
  createdAt: student.createdAt.toISOString(),
  updatedAt: student.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof StudentValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof StudentConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// GET - RLS filtra automaticamente (alunos veem apenas seu próprio perfil, superadmin vê todos)
async function getHandler() {
  try {
    const students = await studentService.list();
    return NextResponse.json({ data: students.map(serializeStudent) });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Criação de aluno (geralmente via signup, mas pode ser manual por superadmin)
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const student = await studentService.create({
      id: body?.id,
      fullName: body?.fullName,
      email: body?.email,
      cpf: body?.cpf,
      phone: body?.phone,
      birthDate: body?.birthDate,
      address: body?.address,
      zipCode: body?.zipCode,
      enrollmentNumber: body?.enrollmentNumber,
      instagram: body?.instagram,
      twitter: body?.twitter,
    });
    return NextResponse.json({ data: serializeStudent(student) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);

