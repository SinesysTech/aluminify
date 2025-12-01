import { NextResponse } from 'next/server';
import {
  studentImportService,
  StudentValidationError,
  StudentImportInputRow,
} from '@/backend/services/student';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

function handleError(error: unknown) {
  if (error instanceof StudentValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error('Student Import API Error:', error);

  const message =
    error instanceof Error ? error.message : 'Erro interno ao importar alunos.';

  return NextResponse.json({ error: message }, { status: 500 });
}

function normalizeRowPayload(
  rows: unknown[],
): StudentImportInputRow[] {
  return rows.map((rawRow, index) => {
    const row = rawRow as Record<string, unknown>;
    const courses = Array.isArray(row?.courses)
      ? (row.courses as unknown[])
          .map((value) => (typeof value === 'string' ? value : ''))
          .filter(Boolean)
      : [];

    return {
      rowNumber:
        typeof row?.rowNumber === 'number' && Number.isFinite(row.rowNumber)
          ? row.rowNumber
          : index + 1,
      fullName: String(row?.fullName ?? '').trim(),
      email: String(row?.email ?? '').trim().toLowerCase(),
      cpf: String(row?.cpf ?? '').trim(),
      phone: String(row?.phone ?? '').trim(),
      enrollmentNumber: String(row?.enrollmentNumber ?? '').trim(),
      temporaryPassword: String(row?.temporaryPassword ?? '').trim(),
      courses,
    };
  });
}

async function postHandler(request: AuthenticatedRequest) {
  if (
    !request.user ||
    (request.user.role !== 'professor' && !request.user.isSuperAdmin)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: 'Envie uma lista de alunos no formato correto.' },
        { status: 400 },
      );
    }

    const rows = normalizeRowPayload(body.rows);
    const result = await studentImportService.import(rows);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);









