import { getDatabaseClient } from '@/backend/clients/database';
import { StudentRepositoryImpl } from './student.repository';
import { StudentService } from './student.service';
import { StudentImportService } from './student-import.service';

let _studentService: StudentService | null = null;
let _studentImportService: StudentImportService | null = null;

function getStudentService(): StudentService {
  if (!_studentService) {
    const databaseClient = getDatabaseClient();
    const repository = new StudentRepositoryImpl(databaseClient);
    _studentService = new StudentService(repository);
  }
  return _studentService;
}

function getStudentImportService(): StudentImportService {
  if (!_studentImportService) {
    _studentImportService = new StudentImportService(getStudentService());
  }
  return _studentImportService;
}

export const studentService = new Proxy({} as StudentService, {
  get(_target, prop) {
    return getStudentService()[prop as keyof StudentService];
  },
});

export const studentImportService = new Proxy({} as StudentImportService, {
  get(_target, prop) {
    return getStudentImportService()[prop as keyof StudentImportService];
  },
});

export * from './student.types';
export * from './student.service';
export * from './student.repository';
export * from './errors';
export * from './student-import.service';

