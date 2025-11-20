import { NextRequest, NextResponse } from 'next/server';
import {
  studentService,
  StudentConflictError,
  StudentNotFoundError,
  StudentValidationError,
} from '@/backend/services/student';

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

  if (error instanceof StudentNotFoundError) {
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
    const student = await studentService.getById(params.id);
    return NextResponse.json({ data: serializeStudent(student) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    });
    return NextResponse.json({ data: serializeStudent(student) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await studentService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

