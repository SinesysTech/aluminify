import { getDatabaseClient } from '@/backend/clients/database';
import { CourseRepositoryImpl } from './course.repository';
import { CourseService } from './course.service';

let _courseService: CourseService | null = null;

function getCourseService(): CourseService {
  if (!_courseService) {
    const databaseClient = getDatabaseClient();
    const repository = new CourseRepositoryImpl(databaseClient);
    _courseService = new CourseService(repository);
  }
  return _courseService;
}

export const courseService = new Proxy({} as CourseService, {
  get(_target, prop) {
    return getCourseService()[prop as keyof CourseService];
  },
});

export * from './course.types';
export * from './course.service';
export * from './course.repository';
export * from './errors';

