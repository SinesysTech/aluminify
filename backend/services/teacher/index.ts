import { getDatabaseClient } from '@/backend/clients/database';
import { TeacherRepositoryImpl } from './teacher.repository';
import { TeacherService } from './teacher.service';

const databaseClient = getDatabaseClient();
const repository = new TeacherRepositoryImpl(databaseClient);
export const teacherService = new TeacherService(repository);

export * from './teacher.types';
export * from './teacher.service';
export * from './teacher.repository';
export * from './errors';

