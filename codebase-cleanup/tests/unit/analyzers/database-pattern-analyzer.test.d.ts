/**
 * Unit tests for DatabasePatternAnalyzer
 */
import { Database } from './database.types';
type DbUser = Database['public']['Tables']['users']['Row'];
export declare function getUsers(): Promise<DbUser[]>;
export declare function GET(req: Request): Promise<void>;
export {};
//# sourceMappingURL=database-pattern-analyzer.test.d.ts.map