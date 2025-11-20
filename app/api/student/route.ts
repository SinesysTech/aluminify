import { NextRequest, NextResponse } from 'next/server';
import {
  studentService,
  StudentConflictError,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const students = await studentService.list();
    return NextResponse.json({ data: students.map(serializeStudent) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
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

