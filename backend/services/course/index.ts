import { getDatabaseClient } from '@/backend/clients/database';
import { CourseRepositoryImpl } from './course.repository';
import { CourseService } from './course.service';

const databaseClient = getDatabaseClient();
const repository = new CourseRepositoryImpl(databaseClient);
export const courseService = new CourseService(repository);

export * from './course.types';
export * from './course.service';
export * from './course.repository';
export * from './errors';

