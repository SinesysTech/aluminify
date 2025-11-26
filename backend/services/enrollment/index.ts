import { getDatabaseClient } from '@/backend/clients/database';
import { EnrollmentRepositoryImpl } from './enrollment.repository';
import { EnrollmentService } from './enrollment.service';

let _enrollmentService: EnrollmentService | null = null;

function getEnrollmentService(): EnrollmentService {
  if (!_enrollmentService) {
    const databaseClient = getDatabaseClient();
    const repository = new EnrollmentRepositoryImpl(databaseClient);
    _enrollmentService = new EnrollmentService(repository);
  }
  return _enrollmentService;
}

export const enrollmentService = new Proxy({} as EnrollmentService, {
  get(_target, prop) {
    return getEnrollmentService()[prop as keyof EnrollmentService];
  },
});

export * from './enrollment.types';
export * from './enrollment.service';
export * from './enrollment.repository';
export * from './errors';

