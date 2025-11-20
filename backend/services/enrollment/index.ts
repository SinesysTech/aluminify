import { getDatabaseClient } from '@/backend/clients/database';
import { EnrollmentRepositoryImpl } from './enrollment.repository';
import { EnrollmentService } from './enrollment.service';

const databaseClient = getDatabaseClient();
const repository = new EnrollmentRepositoryImpl(databaseClient);
export const enrollmentService = new EnrollmentService(repository);

export * from './enrollment.types';
export * from './enrollment.service';
export * from './enrollment.repository';
export * from './errors';

