import { NextRequest, NextResponse } from 'next/server';
import {
  courseMaterialService,
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

  console.error(error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    let materials;
    if (courseId) {
      materials = await courseMaterialService.listByCourse(courseId);
    } else {
      materials = await courseMaterialService.list();
    }

    return NextResponse.json({ data: materials.map(serializeCourseMaterial) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const material = await courseMaterialService.create({
      courseId: body?.courseId,
      title: body?.title,
      description: body?.description,
      type: body?.type,
      fileUrl: body?.fileUrl,
      order: body?.order,
    });
    return NextResponse.json({ data: serializeCourseMaterial(material) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

