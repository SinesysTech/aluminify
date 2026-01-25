import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/[tenant]/auth/middleware';
import { getDatabaseClient } from '@/app/shared/core/database/database';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Buscar informações completas do usuário do Supabase para debug
  const authHeader = request.headers.get('authorization');
  let userMetadata = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const client = getDatabaseClient();
    try {
      const { data: { user: supabaseUser } } = await client.auth.getUser(token);
      userMetadata = {
        id: supabaseUser?.id,
        email: supabaseUser?.email,
        user_metadata: supabaseUser?.user_metadata,
        app_metadata: supabaseUser?.app_metadata,
      };
    } catch (error) {
      console.error('Error getting user metadata:', error);
    }
  }
  
  return NextResponse.json({ 
    data: user,
    debug: process.env.NODE_ENV === 'development' ? {
      userMetadata,
      note: 'Se user_metadata.role não for "superadmin" ou is_superadmin não for true, você não terá acesso de superadmin. Atualize o metadata no Supabase ou faça logout e login novamente para atualizar o token.'
    } : undefined
  });
}

