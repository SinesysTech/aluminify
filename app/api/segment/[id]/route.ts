import { NextRequest, NextResponse } from 'next/server';
import {
  segmentService,
  SegmentConflictError,
  SegmentNotFoundError,
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

  if (error instanceof SegmentNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

interface RouteContext {
  params: { id: string };
}

// GET é público (catálogo)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const segment = await segmentService.getById(params.id);
    return NextResponse.json({ data: serializeSegment(segment) });
  } catch (error) {
    return handleError(error);
  }
}

// PUT requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function putHandler(request: AuthenticatedRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const segment = await segmentService.update(params.id, { name: body?.name, slug: body?.slug });
    return NextResponse.json({ data: serializeSegment(segment) });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE requer autenticação (JWT ou API Key) - RLS verifica se é o criador ou superadmin
async function deleteHandler(_request: AuthenticatedRequest, { params }: RouteContext) {
  try {
    await segmentService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return requireAuth((req) => putHandler(req, context))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return requireAuth((req) => deleteHandler(req, context))(request);
}

