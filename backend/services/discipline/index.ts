import { getDatabaseClient } from '@/backend/clients/database';
import { DisciplineRepositoryImpl } from './discipline.repository';
import { DisciplineService } from './discipline.service';

const databaseClient = getDatabaseClient();
const repository = new DisciplineRepositoryImpl(databaseClient);
export const disciplineService = new DisciplineService(repository);

export * from './discipline.types';
export * from './discipline.service';
export * from './discipline.repository';
export * from './errors';


