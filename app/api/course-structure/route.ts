import { NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/app/[tenant]/auth/middleware';
import { courseStructureCacheService } from '@/backend/services/cache';

/**
 * GET /api/course-structure
 * Obter estrutura hierárquica de um curso (com cache)
 * 
 * Query params:
 * - courseId: ID do curso
 * - disciplinaId: ID da disciplina (opcional)
 * - frenteId: ID da frente (opcional)
 * - moduloId: ID do módulo (opcional)
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const disciplinaId = searchParams.get('disciplinaId');
    const frenteId = searchParams.get('frenteId');
    const moduloId = searchParams.get('moduloId');

    if (moduloId) {
      // Buscar aulas do módulo
      const aulas = await courseStructureCacheService.getModuloAulas(moduloId);
      return NextResponse.json({ data: aulas });
    }

    if (frenteId) {
      // Buscar módulos da frente
      const modulos = await courseStructureCacheService.getFrenteModulos(frenteId);
      return NextResponse.json({ data: modulos });
    }

    if (disciplinaId) {
      // Buscar frentes da disciplina
      const frentes = await courseStructureCacheService.getDisciplineFrentes(disciplinaId);
      return NextResponse.json({ data: frentes });
    }

    if (courseId) {
      // Buscar estrutura completa do curso
      const estrutura = await courseStructureCacheService.getCourseStructure(courseId);
      if (!estrutura) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ data: estrutura });
    }

    return NextResponse.json(
      { error: 'Parâmetro courseId, disciplinaId, frenteId ou moduloId é obrigatório' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Course Structure API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getHandler);
