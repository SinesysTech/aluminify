import { getDatabaseClient } from '@/backend/clients/database';
import { SegmentRepositoryImpl } from './segment.repository';
import { SegmentService } from './segment.service';

let _segmentService: SegmentService | null = null;

function getSegmentService(): SegmentService {
  if (!_segmentService) {
    const databaseClient = getDatabaseClient();
    const repository = new SegmentRepositoryImpl(databaseClient);
    _segmentService = new SegmentService(repository);
  }
  return _segmentService;
}

export const segmentService = new Proxy({} as SegmentService, {
  get(_target, prop) {
    return getSegmentService()[prop as keyof SegmentService];
  },
});

export * from './segment.types';
export * from './segment.service';
export * from './segment.repository';
export * from './errors';

