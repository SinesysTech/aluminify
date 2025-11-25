import { getDatabaseClient } from '@/backend/clients/database';
import { StudentRepositoryImpl } from './student.repository';
import { StudentService } from './student.service';
import { StudentImportService } from './student-import.service';

const databaseClient = getDatabaseClient();
const repository = new StudentRepositoryImpl(databaseClient);
export const studentService = new StudentService(repository);
export const studentImportService = new StudentImportService(studentService);

export * from './student.types';
export * from './student.service';
export * from './student.repository';
export * from './errors';
export * from './student-import.service';

