import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/backend/clients/database';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import { courseStructureCacheService, activityCacheService } from '@/backend/services/cache';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function handleError(error: unknown) {
  console.error('[Frente API] Error:', error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

async function deleteHandler(request: AuthenticatedRequest, params: { id: string }) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar se o usuário é professor
  if (request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden. Only professors can delete fronts.' }, { status: 403 });
  }

  const client = getDatabaseClient();
  const frenteId = params.id;
  const userId = request.user.id;

  try {
    // 1. Buscar a frente e verificar se existe
    const { data: frente, error: frenteError } = await client
      .from('frentes')
      .select('id, nome, curso_id, disciplina_id')
      .eq('id', frenteId)
      .maybeSingle();

    if (frenteError) {
      console.error('[Frente API] Error fetching frente:', frenteError);
      return NextResponse.json(
        { error: 'Failed to fetch frente' },
        { status: 500 }
      );
    }

    if (!frente) {
      return NextResponse.json(
        { error: 'Frente not found' },
        { status: 404 }
      );
    }

    // 2. Validar que o curso pertence ao professor
    if (frente.curso_id) {
      const { data: curso, error: cursoError } = await client
        .from('cursos')
        .select('id, created_by')
        .eq('id', frente.curso_id)
        .maybeSingle();

      if (cursoError) {
        console.error('[Frente API] Error fetching curso:', cursoError);
        return NextResponse.json(
          { error: 'Failed to verify course ownership' },
          { status: 500 }
        );
      }

      if (!curso) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Verificar se o curso pertence ao professor (ou se é superadmin)
      if (curso.created_by !== userId && request.user.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Forbidden. You can only delete fronts from your own courses.' },
          { status: 403 }
        );
      }
    } else {
      // Se a frente não tem curso_id, verificar se o professor tem permissão
      // (pode ser uma frente antiga sem curso associado)
      // Por segurança, apenas superadmin pode deletar frentes sem curso
      if (request.user.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Forbidden. Cannot delete front without course association.' },
          { status: 403 }
        );
      }
    }

    // 3. Buscar módulos da frente
    const { data: modulos, error: modulosError } = await client
      .from('modulos')
      .select('id')
      .eq('frente_id', frenteId);

    if (modulosError) {
      console.error('[Frente API] Error fetching modulos:', modulosError);
      return NextResponse.json(
        { error: 'Failed to fetch modules' },
        { status: 500 }
      );
    }

    const moduloIds = modulos?.map(m => m.id) || [];

    // 4. Verificar se há cronogramas que referenciam aulas desta frente
    let cronogramasCount = 0;
    if (moduloIds.length > 0) {
      // Buscar aulas dos módulos
      const { data: aulas, error: aulasError } = await client
        .from('aulas')
        .select('id')
        .in('modulo_id', moduloIds);

      if (aulasError) {
        console.error('[Frente API] Error fetching aulas:', aulasError);
        // Continuar mesmo com erro, pois pode não haver aulas
      } else {
        const aulaIds = aulas?.map(a => a.id) || [];
        
        if (aulaIds.length > 0) {
          // Verificar se há cronogramas que referenciam essas aulas
          // Buscar todos os cronograma_ids (sem limit para contar todos)
          const { data: cronogramas, error: cronogramasError } = await client
            .from('cronograma_itens')
            .select('cronograma_id')
            .in('aula_id', aulaIds);

          if (!cronogramasError && cronogramas && cronogramas.length > 0) {
            // Contar cronogramas únicos
            const cronogramaIds = new Set(cronogramas.map(c => c.cronograma_id));
            cronogramasCount = cronogramaIds.size;
          }
        }
      }
    }

    // 5. Deletar em cascata: aulas → módulos → frente
    // Primeiro, deletar todas as aulas dos módulos
    if (moduloIds.length > 0) {
      const { error: deleteAulasError } = await client
        .from('aulas')
        .delete()
        .in('modulo_id', moduloIds);

      if (deleteAulasError) {
        console.error('[Frente API] Error deleting aulas:', deleteAulasError);
        return NextResponse.json(
          { error: 'Failed to delete aulas' },
          { status: 500 }
        );
      }
    }

    // Depois, deletar todos os módulos
    if (moduloIds.length > 0) {
      const { error: deleteModulosError } = await client
        .from('modulos')
        .delete()
        .in('id', moduloIds);

      if (deleteModulosError) {
        console.error('[Frente API] Error deleting modulos:', deleteModulosError);
        return NextResponse.json(
          { error: 'Failed to delete modulos' },
          { status: 500 }
        );
      }
    }

    // Por fim, deletar a frente
    const { error: deleteFrenteError } = await client
      .from('frentes')
      .delete()
      .eq('id', frenteId);

    if (deleteFrenteError) {
      console.error('[Frente API] Error deleting frente:', deleteFrenteError);
      return NextResponse.json(
        { error: 'Failed to delete frente' },
        { status: 500 }
      );
    }

    console.log(`[Frente API] Frente ${frenteId} deleted successfully by user ${userId}`);

    // Invalidar cache de estrutura hierárquica e atividades
    if (frente.disciplina_id) {
      await courseStructureCacheService.invalidateDisciplines([frente.disciplina_id]);
    }
    if (moduloIds.length > 0) {
      await activityCacheService.invalidateModulos(moduloIds);
    }

    return NextResponse.json({
      success: true,
      message: 'Frente deleted successfully',
      hasCronogramas: cronogramasCount > 0,
      cronogramasCount,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireUserAuth((req) => deleteHandler(req, params))(request);
}

