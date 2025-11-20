import { NextResponse } from 'next/server';
import { getOpenApiSpec } from '@/backend/swagger';

export async function GET() {
  const spec = getOpenApiSpec();
  return NextResponse.json(spec);
}


