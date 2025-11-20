import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/backend/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await authService.signUp({
      email: body?.email,
      password: body?.password,
      fullName: body?.fullName,
      role: body?.role,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

