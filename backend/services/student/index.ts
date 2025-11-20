import { getDatabaseClient } from '@/backend/clients/database';
import { StudentRepositoryImpl } from './student.repository';
import { StudentService } from './student.service';

const databaseClient = getDatabaseClient();
const repository = new StudentRepositoryImpl(databaseClient);
export const studentService = new StudentService(repository);

export * from './student.types';
export * from './student.service';
export * from './student.repository';
export * from './errors';

