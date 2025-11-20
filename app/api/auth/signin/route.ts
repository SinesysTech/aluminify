import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await authService.signIn({
      email: body?.email,
      password: body?.password,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

