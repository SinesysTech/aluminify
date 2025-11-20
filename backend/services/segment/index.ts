import { getDatabaseClient } from '@/backend/clients/database';
import { SegmentRepositoryImpl } from './segment.repository';
import { SegmentService } from './segment.service';

const databaseClient = getDatabaseClient();
const repository = new SegmentRepositoryImpl(databaseClient);
export const segmentService = new SegmentService(repository);

export * from './segment.types';
export * from './segment.service';
export * from './segment.repository';
export * from './errors';

