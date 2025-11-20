import { NextRequest, NextResponse } from 'next/server';
import {
  courseMaterialService,
  CourseMaterialNotFoundError,
  CourseMaterialValidationError,
} from '@/backend/services/course-material';

const serializeCourseMaterial = (
  material: Awaited<ReturnType<typeof courseMaterialService.getById>>,
) => ({
  id: material.id,
  courseId: material.courseId,
  title: material.title,
  description: material.description,
  type: material.type,
  fileUrl: material.fileUrl,
  order: material.order,
  createdAt: material.createdAt.toISOString(),
  updatedAt: material.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof CourseMaterialValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof CourseMaterialNotFoundError) {
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
    const material = await courseMaterialService.getById(params.id);
    return NextResponse.json({ data: serializeCourseMaterial(material) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const material = await courseMaterialService.update(params.id, {
      title: body?.title,
      description: body?.description,
      type: body?.type,
      fileUrl: body?.fileUrl,
      order: body?.order,
    });
    return NextResponse.json({ data: serializeCourseMaterial(material) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await courseMaterialService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

