import { NextResponse } from 'next/server';
import {
  segmentService,
  SegmentConflictError,
  SegmentValidationError,
} from '@/backend/services/segment';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeSegment = (segment: Awaited<ReturnType<typeof segmentService.getById>>) => ({
  id: segment.id,
  name: segment.name,
  slug: segment.slug,
  createdAt: segment.createdAt.toISOString(),
  updatedAt: segment.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof SegmentValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof SegmentConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// GET é público (catálogo)
export async function GET() {
  try {
    const segments = await segmentService.list();
    return NextResponse.json({ data: segments.map(serializeSegment) });
  } catch (error) {
    return handleError(error);
  }
}

// POST requer autenticação de professor (JWT ou API Key)
async function postHandler(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const segment = await segmentService.create({ name: body?.name, slug: body?.slug });
    return NextResponse.json({ data: serializeSegment(segment) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = requireAuth(postHandler);

