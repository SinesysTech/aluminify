import { getDatabaseClient } from '@/backend/clients/database';
import { CourseMaterialRepositoryImpl } from './course-material.repository';
import { CourseMaterialService } from './course-material.service';

let _courseMaterialService: CourseMaterialService | null = null;

function getCourseMaterialService(): CourseMaterialService {
  if (!_courseMaterialService) {
    const databaseClient = getDatabaseClient();
    const repository = new CourseMaterialRepositoryImpl(databaseClient);
    _courseMaterialService = new CourseMaterialService(repository);
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

