import { getDatabaseClient } from '@/backend/clients/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CourseMaterialRepositoryImpl } from './course-material.repository';
import { CourseMaterialService } from './course-material.service';

let _courseMaterialService: CourseMaterialService | null = null;

export function createCourseMaterialService(client: SupabaseClient): CourseMaterialService {
  const repository = new CourseMaterialRepositoryImpl(client);
  return new CourseMaterialService(repository);
}

function getCourseMaterialService(): CourseMaterialService {
  if (!_courseMaterialService) {
    const databaseClient = getDatabaseClient();
    _courseMaterialService = createCourseMaterialService(databaseClient);
  }
  return _courseMaterialService;
}

export const courseMaterialService = new Proxy({} as CourseMaterialService, {
  get(_target, prop) {
    return getCourseMaterialService()[prop as keyof CourseMaterialService];
  },
});

export * from './course-material.types';
export * from './course-material.service';
export * from './course-material.repository';
export * from './errors';

