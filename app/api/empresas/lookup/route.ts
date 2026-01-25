import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/shared/core/server';

// GET /api/empresas/lookup?slug=xxx - Lookup público de empresa por slug (para onboarding)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Parâmetro slug é obrigatório' },
        { status: 400 }
      );
    }

    // Usar cliente anônimo para bypass de RLS (vamos criar policy específica)
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome, ativo')
      .eq('slug', slug)
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching empresa by slug:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar empresa' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou inativa' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in empresa lookup:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresa' },
      { status: 500 }
    );
  }
}

