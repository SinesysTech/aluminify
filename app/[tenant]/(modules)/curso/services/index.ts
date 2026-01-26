import { SupabaseClient } from "@supabase/supabase-js";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { CursoRepositoryImpl } from "./curso.repository";
import { CursoService } from "./curso.service";

/**
 * Factory function para criar CourseService com cliente Supabase específico.
 * Use esta função quando precisar que as RLS policies sejam aplicadas.
 *
 * @param client - Cliente Supabase com contexto do usuário autenticado
 * @returns Instância de CourseService que respeita RLS
 */
export function createCursoService(client: SupabaseClient): CursoService {
  const repository = new CursoRepositoryImpl(client);
  return new CursoService(repository);
}

// === ADMIN SERVICE (bypassa RLS - usar apenas em contextos seguros) ===

let _adminCursoService: CursoService | null = null;

/**
 * @deprecated Use createCursoService(client) com cliente do usuário para respeitar RLS.
 * Este service usa admin client e BYPASSA todas as RLS policies.
 */
function getAdminCursoService(): CursoService {
  if (!_adminCursoService) {
    const databaseClient = getDatabaseClient();
    const repository = new CursoRepositoryImpl(databaseClient);
    _adminCursoService = new CursoService(repository);
  }
  return _adminCursoService;
}

/**
 * @deprecated Use createCourseService(client) com cliente do usuário para respeitar RLS.
 * Este proxy usa admin client e BYPASSA todas as RLS policies.
 */
export const cursoService = new Proxy({} as CursoService, {
  get(_target, prop) {
    return getAdminCursoService()[prop as keyof CursoService];
  },
});

/**
 * @deprecated Alias for cursoService. Use cursoService or createCursoService instead.
 */
export { cursoService as courseService };

export * from "./curso.types";
export * from "./curso.service";
export * from "./curso.repository";
export * from "./errors";

// Material service exports
export * from "./material.service";
export * from "./material.repository";
export * from "./material.types";

// Turma service exports
export * from "./turma";
