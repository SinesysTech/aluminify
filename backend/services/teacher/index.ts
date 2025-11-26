import { getDatabaseClient } from '@/backend/clients/database';
import { TeacherRepositoryImpl } from './teacher.repository';
import { TeacherService } from './teacher.service';

let _teacherService: TeacherService | null = null;

function getTeacherService(): TeacherService {
  if (!_teacherService) {
    const databaseClient = getDatabaseClient();
    const repository = new TeacherRepositoryImpl(databaseClient);
    _teacherService = new TeacherService(repository);
  }
  return _teacherService;
}

export const teacherService = new Proxy({} as TeacherService, {
  get(_target, prop) {
    return getTeacherService()[prop as keyof TeacherService];
  },
});

export * from './teacher.types';
export * from './teacher.service';
export * from './teacher.repository';
export * from './errors';

