import { NextRequest, NextResponse } from 'next/server';
import {
  studentService,
  StudentConflictError,
  StudentValidationError,
} from '@/backend/services/student';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import type { PaginationParams } from '@/types/shared/dtos/api-responses';

const serializeStudent = (student: Awaited<ReturnType<typeof studentService.getById>>) => ({
  id: student.id,
  fullName: student.fullName ?? null,
  email: student.email,
  cpf: student.cpf ?? null,
  phone: student.phone ?? null,
  birthDate: student.birthDate?.toISOString().split('T')[0] ?? null,
  address: student.address ?? null,
  zipCode: student.zipCode ?? null,
  enrollmentNumber: student.enrollmentNumber ?? null,
  instagram: student.instagram ?? null,
  twitter: student.twitter ?? null,
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

  // Log detalhado do erro
  console.error('Student API Error:', error);
  
  // Extrair mensagem de erro mais detalhada
  let errorMessage = 'Internal server error';
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    console.error('Error stack:', error.stack);
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }
  
  return NextResponse.json({ 
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
  }, { status: 500 });
}

// GET - RLS filtra automaticamente (alunos veem apenas seu próprio perfil, superadmin vê todos)
async function getHandler(request: AuthenticatedRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: PaginationParams = {};
    
    const page = searchParams.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        params.page = pageNum;
      }
    }
    
    const perPage = searchParams.get('perPage');
    if (perPage) {
      const perPageNum = parseInt(perPage, 10);
      if (!isNaN(perPageNum) && perPageNum > 0) {
        params.perPage = perPageNum;
      }
    }
    
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      params.sortBy = sortBy;
    }
    
    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      params.sortOrder = sortOrder;
    }
    
    const { data, meta } = await studentService.list(params);
    return NextResponse.json({ 
      data: data.map(serializeStudent),
      meta 
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Criação de aluno (geralmente via signup, mas pode ser manual por superadmin)
async function postHandler(request: AuthenticatedRequest) {
  console.log('[Student POST] Auth check:', {
    hasUser: !!request.user,
    hasApiKey: !!request.apiKey,
    userRole: request.user?.role,
    userIsSuperAdmin: request.user?.isSuperAdmin,
  });

  try {
    const body = await request.json();
    console.log('[Student POST] Request body:', body);
    
    if (!body?.email) {
      return NextResponse.json({ 
        error: 'Campo obrigatório: email é necessário' 
      }, { status: 400 });
    }
    
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
      courseIds: body?.courseIds ?? [],
      temporaryPassword: body?.temporaryPassword,
    });
    console.log('[Student POST] Student created:', student.id);
    return NextResponse.json({ data: serializeStudent(student) }, { status: 201 });
  } catch (error) {
    console.error('[Student POST] Error creating student:', error);
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);

