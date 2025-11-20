import { getDatabaseClient } from '@/backend/clients/database';
import { CourseMaterialRepositoryImpl } from './course-material.repository';
import { CourseMaterialService } from './course-material.service';

const databaseClient = getDatabaseClient();
const repository = new CourseMaterialRepositoryImpl(databaseClient);
export const courseMaterialService = new CourseMaterialService(repository);

export * from './course-material.types';
export * from './course-material.service';
export * from './course-material.repository';
export * from './errors';

