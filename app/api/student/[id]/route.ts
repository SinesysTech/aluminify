import { NextRequest, NextResponse } from 'next/server';
import {
  studentService,
  StudentConflictError,
  StudentNotFoundError,
  StudentValidationError,
} from '@/backend/services/student';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeStudent = (student: Awaited<ReturnType<typeof studentService.getById>>) => ({
  id: student.id,
  empresaId: student.empresaId,
  fullName: student.fullName,
  email: student.email,
  cpf: student.cpf,
  phone: student.phone,
  birthDate: student.birthDate?.toISOString().split('T')[0] ?? null,
  address: student.address,
  zipCode: student.zipCode,
  cidade: student.cidade,
  estado: student.estado,
  bairro: student.bairro,
  pais: student.pais,
  numeroEndereco: student.numeroEndereco,
  complemento: student.complemento,
  enrollmentNumber: student.enrollmentNumber,
  instagram: student.instagram,
  twitter: student.twitter,
  hotmartId: student.hotmartId,
  origemCadastro: student.origemCadastro,
  courses: student.courses,
  courseIds: student.courses.map((course) => course.id),
  mustChangePassword: student.mustChangePassword,
  temporaryPassword: student.temporaryPassword,
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

  if (error instanceof StudentNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - RLS filtra automaticamente (alunos veem apenas seu próprio perfil)
async function getHandler(_request: AuthenticatedRequest, params: { id: string }) {
  try {
    const student = await studentService.getById(params.id);
    return NextResponse.json({ data: serializeStudent(student) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT - RLS verifica se é o próprio aluno ou superadmin
async function putHandler(request: AuthenticatedRequest, params: { id: string }) {
  try {
    const body = await request.json();
    const student = await studentService.update(params.id, {
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
      courseIds: body?.courseIds,
      temporaryPassword: body?.temporaryPassword,
      mustChangePassword: body?.mustChangePassword,
    });
    return NextResponse.json({ data: serializeStudent(student) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - RLS verifica se é o próprio aluno ou superadmin
async function deleteHandler(_request: AuthenticatedRequest, params: { id: string }) {
  try {
    await studentService.delete(params.id);
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

