import { NextResponse } from 'next/server';
import { getOpenApiSpec } from '@/app/shared/swagger';

export async function GET() {
  const spec = getOpenApiSpec();
  return NextResponse.json(spec);
}


