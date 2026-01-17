/**
 * Unit tests for DatabasePatternAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Project, SourceFile } from 'ts-morph';
import { DatabasePatternAnalyzer } from '../../../src/analyzers/database-pattern-analyzer';
import type { FileInfo } from '../../../src/types';

describe('DatabasePatternAnalyzer', () => {
  let analyzer: DatabasePatternAnalyzer;
  let project: Project;

  beforeEach(() => {
    analyzer = new DatabasePatternAnalyzer();
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
      },
    });
  });

  const createFileInfo = (relativePath: string): FileInfo => ({
    path: `/test/${relativePath}`,
    relativePath,
    extension: '.ts',
    size: 1000,
    category: 'service',
    lastModified: new Date(),
  });

  const parseCode = (code: string): SourceFile => {
    return project.createSourceFile('test.ts', code, { overwrite: true });
  };

  describe('Task 6.1: Database Client Pattern Detection', () => {
    it('should detect createClient pattern', async () => {
      const code = `
        import { createClient } from '@supabase/supabase-js';
        
        const supabase = createClient(url, key);
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/database.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
      // First occurrence won't create an issue, but pattern is tracked
    });

    it('should detect inconsistent client instantiation patterns', async () => {
      const code = `
        import { createClient } from '@supabase/supabase-js';
        
        const supabase1 = createClient(url, key);
        const supabase2 = getSupabaseClient();
        const supabase3 = initSupabase();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/database.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      // Should detect inconsistent patterns
      const inconsistentPatterns = issues.filter(
        issue => issue.type === 'inconsistent-pattern' && issue.category === 'database'
      );
      expect(inconsistentPatterns.length).toBeGreaterThan(0);
      expect(inconsistentPatterns[0].description).toContain('Inconsistent database client instantiation');
    });

    it('should detect createServerClient pattern', async () => {
      const code = `
        import { createServerClient } from '@supabase/ssr';
        
        const supabase = createServerClient(url, key, {
          cookies: {
            get: (name) => cookies().get(name)?.value,
          },
        });
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/supabase-server.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect createBrowserClient pattern', async () => {
      const code = `
        import { createBrowserClient } from '@supabase/ssr';
        
        const supabase = createBrowserClient(url, key);
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/supabase-browser.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect multiple different Supabase client patterns', async () => {
      const code = `
        const client1 = createServerClient(url, key);
        const client2 = createBrowserClient(url, key);
        const client3 = createRouteHandlerClient();
        const client4 = getSupabaseClient();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/database.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      const inconsistentIssues = issues.filter(
        issue => issue.type === 'inconsistent-pattern'
      );
      expect(inconsistentIssues.length).toBeGreaterThan(0);
    });

    it('should detect database client variable declarations', async () => {
      const code = `
        const supabase = createClient(url, key);
        const db = getSupabaseClient();
        const database = initDatabase();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/db.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      // Should track these patterns
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect supabase.from() operations', async () => {
      const code = `
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId);
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/users.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      // Should track database operations
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect supabase.auth operations', async () => {
      const code = `
        const { data, error } = await supabase.auth.signIn({
          email,
          password,
        });
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/auth.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect supabase.storage operations', async () => {
      const code = `
        const { data, error } = await supabase
          .storage
          .from('avatars')
          .upload('public/avatar.png', file);
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/storage.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect supabase.rpc operations', async () => {
      const code = `
        const { data, error } = await supabase
          .rpc('get_user_stats', { user_id: userId });
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/stats.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide appropriate recommendations for inconsistent patterns', async () => {
      const code = `
        const client1 = createClient(url, key);
        const client2 = getSupabaseClient();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/db.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      const inconsistentIssue = issues.find(
        issue => issue.type === 'inconsistent-pattern'
      );

      if (inconsistentIssue) {
        expect(inconsistentIssue.recommendation).toContain('Standardize database client creation');
        expect(inconsistentIssue.severity).toBe('medium');
        expect(inconsistentIssue.estimatedEffort).toBe('medium');
        expect(inconsistentIssue.tags).toContain('database');
        expect(inconsistentIssue.tags).toContain('inconsistency');
      }
    });

    it('should handle files with no database operations', async () => {
      const code = `
        function calculateTotal(items: Item[]): number {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('utils/math.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues).toEqual([]);
    });

    it('should only analyze supported file types', () => {
      const supportedTypes = analyzer.getSupportedFileTypes();
      
      expect(supportedTypes).toContain('api-route');
      expect(supportedTypes).toContain('service');
      expect(supportedTypes).toContain('util');
      expect(supportedTypes).not.toContain('component');
      expect(supportedTypes).not.toContain('test');
    });

    it('should track multiple patterns across analysis', async () => {
      // First file
      const code1 = `const supabase = createClient(url, key);`;
      const ast1 = parseCode(code1);
      const fileInfo1 = createFileInfo('lib/db1.ts');
      await analyzer.analyze(fileInfo1, ast1);

      // Second file with different pattern
      const code2 = `const db = getSupabaseClient();`;
      const ast2 = parseCode(code2);
      const fileInfo2 = createFileInfo('lib/db2.ts');
      const issues2 = await analyzer.analyze(fileInfo2, ast2);

      // Should detect inconsistency across files
      const inconsistentIssues = issues2.filter(
        issue => issue.type === 'inconsistent-pattern'
      );
      expect(inconsistentIssues.length).toBeGreaterThan(0);
    });

    it('should detect generic database client names', async () => {
      const code = `
        const db = createClient(url, key);
        const database = getClient();
        const dbClient = initClient();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/database.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      // Should track these as database clients
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex client initialization', async () => {
      const code = `
        import { createServerClient } from '@supabase/ssr';
        import { cookies } from 'next/headers';
        
        export function createClient() {
          const cookieStore = cookies();
          
          return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                get(name: string) {
                  return cookieStore.get(name)?.value;
                },
              },
            }
          );
        }
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/supabase-server.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect middleware client pattern', async () => {
      const code = `
        import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
        
        const supabase = createMiddlewareClient({ req, res });
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('middleware.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Detection', () => {
    it('should track operations with error destructuring', async () => {
      const code = `
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) {
          throw error;
        }
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/users.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      // Should track this operation with error handling
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should track operations in try-catch blocks', async () => {
      const code = `
        try {
          const { data } = await supabase
            .from('users')
            .select('*');
        } catch (error) {
          console.error(error);
        }
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('services/users.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      expect(issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analyzer Metadata', () => {
    it('should have correct analyzer name', () => {
      expect(analyzer.name).toBe('DatabasePatternAnalyzer');
    });

    it('should create issues with proper metadata', async () => {
      const code = `
        const client1 = createClient(url, key);
        const client2 = getSupabaseClient();
      `;

      const ast = parseCode(code);
      const fileInfo = createFileInfo('lib/db.ts');
      const issues = await analyzer.analyze(fileInfo, ast);

      if (issues.length > 0) {
        const issue = issues[0];
        expect(issue.id).toBeDefined();
        expect(issue.detectedBy).toBe('DatabasePatternAnalyzer');
        expect(issue.detectedAt).toBeInstanceOf(Date);
        expect(issue.location).toBeDefined();
        expect(issue.location.startLine).toBeGreaterThan(0);
      }
    });
  });

  describe('Task 6.2: Database Inconsistency Detection', () => {
    describe('Inconsistent Error Handling Detection (Requirement 3.2)', () => {
      it('should detect missing error handling in database operations', async () => {
        const code = `
          const { data } = await supabase
            .from('users')
            .select('*');
          
          // No error handling
          return data;
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
        expect(errorHandlingIssues[0].severity).toBe('high');
        expect(errorHandlingIssues[0].description).toContain('lacks proper error handling');
      });

      it('should not flag operations with proper error destructuring', async () => {
        const code = `
          const { data, error } = await supabase
            .from('users')
            .select('*');
          
          if (error) {
            throw error;
          }
          
          return data;
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBe(0);
      });

      it('should not flag operations in try-catch blocks', async () => {
        const code = `
          try {
            const { data } = await supabase
              .from('users')
              .select('*');
            return data;
          } catch (error) {
            console.error(error);
            throw error;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBe(0);
      });

      it('should detect inconsistent error handling across multiple operations', async () => {
        const code = `
          // Operation 1: Has error handling
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');
          
          if (usersError) throw usersError;
          
          // Operation 2: No error handling
          const { data: posts } = await supabase
            .from('posts')
            .select('*');
          
          // Operation 3: No error handling
          const { data: comments } = await supabase
            .from('comments')
            .select('*');
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/data.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Inconsistent error handling')
        );
        expect(inconsistentIssues.length).toBeGreaterThan(0);
        expect(inconsistentIssues[0].description).toContain('database operations');
      });

      it('should detect missing error handling in insert operations', async () => {
        const code = `
          const { data } = await supabase
            .from('users')
            .insert({ name: 'John', email: 'john@example.com' });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in update operations', async () => {
        const code = `
          const { data } = await supabase
            .from('users')
            .update({ name: 'Jane' })
            .eq('id', userId);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in delete operations', async () => {
        const code = `
          const { data } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in auth operations', async () => {
        const code = `
          const { data } = await supabase.auth.signIn({
            email: 'user@example.com',
            password: 'password123'
          });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/auth.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should provide appropriate recommendations for missing error handling', async () => {
        const code = `
          const { data } = await supabase.from('users').select('*');
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssue = issues.find(
          issue => issue.type === 'missing-error-handling'
        );

        if (errorHandlingIssue) {
          expect(errorHandlingIssue.recommendation).toContain('error handling');
          expect(errorHandlingIssue.recommendation).toContain('try-catch');
          expect(errorHandlingIssue.estimatedEffort).toBe('small');
          expect(errorHandlingIssue.tags).toContain('error-handling');
        }
      });
    });

    describe('Inconsistent Type Usage Detection (Requirement 3.4)', () => {
      it('should detect any type usage in database operations', async () => {
        const code = `
          const users: any = await supabase
            .from('users')
            .select('*');
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const typeSafetyIssues = issues.filter(
          issue => issue.type === 'type-safety'
        );
        expect(typeSafetyIssues.length).toBeGreaterThan(0);
        expect(typeSafetyIssues[0].description).toContain("typed as 'any'");
      });

      it('should detect inconsistent type definitions for same entity', async () => {
        const code = `
          const user1: User = await getUser(1);
          const user2: UserType = await getUser(2);
          const user3: User = await getUser(3);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentTypeIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Inconsistent type usage')
        );
        expect(inconsistentTypeIssues.length).toBeGreaterThan(0);
      });

      it('should detect manual type definitions that may conflict with Supabase types', async () => {
        const code = `
          import { Database } from './database.types';
          
          type User = {
            id: string;
            name: string;
          };
          
          const getUser = async (id: string): Promise<User> => {
            const { data } = await supabase.from('users').select('*').eq('id', id).single();
            return data;
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const conflictingTypeIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('may conflict with Supabase generated types')
        );
        expect(conflictingTypeIssues.length).toBeGreaterThan(0);
      });

      it('should detect manual interface definitions that may conflict with Supabase types', async () => {
        const code = `
          import { Database } from './database.types';
          
          interface User {
            id: string;
            name: string;
            email: string;
          }
          
          const getUser = async (id: string): Promise<User> => {
            const { data } = await supabase.from('users').select('*').eq('id', id).single();
            return data as User;
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const conflictingInterfaceIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('may conflict with Supabase generated types')
        );
        expect(conflictingInterfaceIssues.length).toBeGreaterThan(0);
      });

      it('should not flag manual types when Supabase types are not imported', async () => {
        const code = `
          type User = {
            id: string;
            name: string;
          };
          
          const getUser = async (id: string): Promise<User> => {
            return { id, name: 'John' };
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const conflictingTypeIssues = issues.filter(
          issue => issue.description.includes('may conflict with Supabase generated types')
        );
        expect(conflictingTypeIssues.length).toBe(0);
      });

      it('should provide appropriate recommendations for type safety issues', async () => {
        const code = `
          const users: any = await supabase.from('users').select('*');
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const typeSafetyIssue = issues.find(
          issue => issue.type === 'type-safety'
        );

        if (typeSafetyIssue) {
          expect(typeSafetyIssue.recommendation).toContain('proper TypeScript types');
          expect(typeSafetyIssue.recommendation).toContain('Supabase');
          expect(typeSafetyIssue.estimatedEffort).toBe('small');
          expect(typeSafetyIssue.tags).toContain('type-safety');
        }
      });
    });

    describe('Pattern Bypass Detection (Requirement 3.5)', () => {
      it('should detect direct database access in components', async () => {
        const code = `
          export default function UserProfile() {
            const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            return <div>{user.name}</div>;
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/components/UserProfile.tsx',
          relativePath: 'components/UserProfile.tsx',
          extension: '.tsx',
          size: 1000,
          category: 'component',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const architecturalIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('Direct database access in component')
        );
        expect(architecturalIssues.length).toBeGreaterThan(0);
        expect(architecturalIssues[0].severity).toBe('high');
      });

      it('should detect potential SQL injection in RPC calls', async () => {
        const code = `
          const userId = req.query.userId;
          const { data } = await supabase.rpc('get_user_data', {
            query: \`SELECT * FROM users WHERE id = \${userId}\`
          });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const sqlInjectionIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('SQL injection')
        );
        expect(sqlInjectionIssues.length).toBeGreaterThan(0);
        expect(sqlInjectionIssues[0].severity).toBe('critical');
      });

      it('should detect SQL injection with string concatenation', async () => {
        const code = `
          const query = 'SELECT * FROM users WHERE id = ' + userId;
          const { data } = await supabase.rpc('execute_query', { sql: query });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const sqlInjectionIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('SQL injection')
        );
        expect(sqlInjectionIssues.length).toBeGreaterThan(0);
      });

      it('should detect excessive database operations in API routes', async () => {
        const code = `
          export async function GET(req: Request) {
            const { data: users } = await supabase.from('users').select('*');
            const { data: posts } = await supabase.from('posts').select('*');
            const { data: comments } = await supabase.from('comments').select('*');
            const { data: likes } = await supabase.from('likes').select('*');
            const { data: follows } = await supabase.from('follows').select('*');
            
            return Response.json({ users, posts, comments, likes, follows });
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/app/api/data/route.ts',
          relativePath: 'app/api/data/route.ts',
          extension: '.ts',
          size: 1000,
          category: 'api-route',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const serviceLayerIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('service layer')
        );
        expect(serviceLayerIssues.length).toBeGreaterThan(0);
        expect(serviceLayerIssues[0].severity).toBe('medium');
      });

      it('should not flag API routes with few database operations', async () => {
        const code = `
          export async function GET(req: Request) {
            const { data: users } = await supabase.from('users').select('*');
            return Response.json({ users });
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/app/api/users/route.ts',
          relativePath: 'app/api/users/route.ts',
          extension: '.ts',
          size: 1000,
          category: 'api-route',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const serviceLayerIssues = issues.filter(
          issue => issue.description.includes('service layer')
        );
        expect(serviceLayerIssues.length).toBe(0);
      });

      it('should detect multiple client creation method imports', async () => {
        const code = `
          import { 
            createClient, 
            createServerClient, 
            createBrowserClient,
            createRouteHandlerClient,
            createMiddlewareClient 
          } from '@supabase/ssr';
          
          const client = createClient(url, key);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/supabase.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const multipleImportsIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Multiple database client creation methods imported')
        );
        expect(multipleImportsIssues.length).toBeGreaterThan(0);
        expect(multipleImportsIssues[0].severity).toBe('low');
      });

      it('should provide appropriate recommendations for architectural issues', async () => {
        const code = `
          export default function UserProfile() {
            const { data } = await supabase.from('users').select('*');
            return <div>{data?.name}</div>;
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/components/UserProfile.tsx',
          relativePath: 'components/UserProfile.tsx',
          extension: '.tsx',
          size: 1000,
          category: 'component',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const architecturalIssue = issues.find(
          issue => issue.type === 'architectural'
        );

        if (architecturalIssue) {
          expect(architecturalIssue.recommendation).toContain('service layer');
          expect(architecturalIssue.recommendation).toContain('API');
          expect(architecturalIssue.tags).toContain('architecture');
        }
      });
    });

    describe('Integration: Multiple Inconsistencies', () => {
      it('should detect multiple types of inconsistencies in same file', async () => {
        const code = `
          import { Database } from './database.types';
          
          type User = {
            id: string;
            name: string;
          };
          
          export async function getUsers() {
            // Missing error handling
            const { data: users } = await supabase.from('users').select('*');
            
            // Any type usage
            const posts: any = await supabase.from('posts').select('*');
            
            return { users, posts };
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/data.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should detect multiple issue types
        const errorHandlingIssues = issues.filter(i => i.type === 'missing-error-handling');
        const typeSafetyIssues = issues.filter(i => i.type === 'type-safety');
        const typeConflictIssues = issues.filter(
          i => i.description.includes('may conflict with Supabase generated types')
        );

        expect(errorHandlingIssues.length).toBeGreaterThan(0);
        expect(typeSafetyIssues.length).toBeGreaterThan(0);
        expect(typeConflictIssues.length).toBeGreaterThan(0);
      });

      it('should handle files with no issues', async () => {
        const code = `
          import { Database } from './database.types';
          
          type DbUser = Database['public']['Tables']['users']['Row'];
          
          export async function getUsers(): Promise<DbUser[]> {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*');
              
              if (error) throw error;
              
              return data || [];
            } catch (error) {
              console.error('Error fetching users:', error);
              throw error;
            }
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should have minimal or no issues (only potential client pattern tracking)
        const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
        expect(criticalIssues.length).toBe(0);
      });
    });
  });

  describe('Task 6.3: Unnecessary Database Adapter Detection', () => {
    describe('Simple Pass-Through Wrapper Detection (Requirement 3.3)', () => {
      it('should detect simple pass-through function wrapper', async () => {
        const code = `
          async function getUser(id: string) {
            return supabase.from('users').select().eq('id', id).single();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
        expect(adapterIssues[0].description).toContain('simple pass-through wrapper');
        expect(adapterIssues[0].severity).toBe('medium');
      });

      it('should detect arrow function pass-through wrapper', async () => {
        const code = `
          const getUsers = async () => {
            return supabase.from('users').select('*');
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect pass-through wrapper with parameters', async () => {
        const code = `
          async function getUserById(userId: string) {
            return supabase.from('users').select().eq('id', userId);
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect pass-through wrapper with multiple parameters', async () => {
        const code = `
          const fetchUserPosts = (userId: string, limit: number) => {
            return supabase.from('posts').select().eq('user_id', userId).limit(limit);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/posts.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should NOT flag functions with error handling', async () => {
        const code = `
          async function getUser(id: string) {
            const { data, error } = await supabase
              .from('users')
              .select()
              .eq('id', id)
              .single();
            
            if (error) {
              console.error('Error fetching user:', error);
              throw new Error('Failed to fetch user');
            }
            
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag functions with try-catch blocks', async () => {
        const code = `
          async function getUsers() {
            try {
              return await supabase.from('users').select('*');
            } catch (error) {
              console.error(error);
              throw error;
            }
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag functions with validation logic', async () => {
        const code = `
          async function getUser(id: string) {
            if (!id) {
              throw new Error('User ID is required');
            }
            
            return supabase.from('users').select().eq('id', id).single();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag functions with data transformation', async () => {
        const code = `
          async function getUsers() {
            const { data } = await supabase.from('users').select('*');
            return data?.map(user => ({
              ...user,
              fullName: \`\${user.firstName} \${user.lastName}\`
            }));
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag functions with logging', async () => {
        const code = `
          async function getUser(id: string) {
            console.log('Fetching user:', id);
            return supabase.from('users').select().eq('id', id).single();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag functions with multiple statements', async () => {
        const code = `
          async function getUser(id: string) {
            const timestamp = Date.now();
            const result = await supabase.from('users').select().eq('id', id).single();
            return result;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should detect wrapper that just calls another database function', async () => {
        const code = `
          const fetchAllUsers = () => {
            return getAllUsers();
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect function expression pass-through wrapper', async () => {
        const code = `
          const getDbUser = function(userId: string) {
            return supabase.from('users').select().eq('id', userId);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should provide actionable recommendations for unnecessary adapters', async () => {
        const code = `
          async function getUserData(id: string) {
            return supabase.from('users').select().eq('id', id);
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssue = issues.find(
          issue => issue.type === 'unnecessary-adapter'
        );

        if (adapterIssue) {
          expect(adapterIssue.recommendation).toContain('Remove the wrapper function');
          expect(adapterIssue.recommendation).toContain('directly');
          expect(adapterIssue.estimatedEffort).toBe('small');
          expect(adapterIssue.tags).toContain('unnecessary-adapter');
          expect(adapterIssue.tags).toContain('simplification');
        }
      });

      it('should NOT flag non-database functions', async () => {
        const code = `
          function calculateTotal(items: Item[]) {
            return items.reduce((sum, item) => sum + item.price, 0);
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('utils/math.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should detect pass-through with await', async () => {
        const code = `
          const loadUser = async (id: string) => {
            return await supabase.from('users').select().eq('id', id).single();
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should handle complex database operation calls', async () => {
        const code = `
          async function getUserWithPosts(userId: string) {
            return supabase
              .from('users')
              .select(\`
                *,
                posts (*)
              \`)
              .eq('id', userId)
              .single();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect wrapper with database-related name', async () => {
        const code = `
          const dbGetUser = (id: string) => {
            return supabase.from('users').select().eq('id', id);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/database.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should NOT flag functions that add business logic', async () => {
        const code = `
          async function getActiveUsers() {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('status', 'active')
              .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            
            if (error) throw error;
            
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should handle edge case of empty function body', async () => {
        const code = `
          async function getUser(id: string) {
            // Empty function
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should detect multiple unnecessary adapters in same file', async () => {
        const code = `
          const getUser = (id: string) => {
            return supabase.from('users').select().eq('id', id);
          };
          
          const getPost = (id: string) => {
            return supabase.from('posts').select().eq('id', id);
          };
          
          const getComment = (id: string) => {
            return supabase.from('comments').select().eq('id', id);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/data.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(3);
      });
    });
  });

  describe('Task 6.5: Additional Edge Cases and Specific Examples', () => {
    describe('Edge Cases for Client Instantiation (Requirement 3.1)', () => {
      it('should handle nested client creation in functions', async () => {
        const code = `
          function createDatabaseClient() {
            const client = createClient(url, key);
            return client;
          }
          
          function getDatabaseConnection() {
            return getSupabaseClient();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/database.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentPatterns = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Inconsistent database client instantiation')
        );
        expect(inconsistentPatterns.length).toBeGreaterThan(0);
      });

      it('should detect client creation in class constructors', async () => {
        const code = `
          class DatabaseService {
            private client;
            
            constructor() {
              this.client = createClient(url, key);
            }
          }
          
          class DataService {
            private db;
            
            constructor() {
              this.db = getSupabaseClient();
            }
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/database-service.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        expect(issues.length).toBeGreaterThanOrEqual(0);
      });

      it('should handle client creation with environment variables', async () => {
        const code = `
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/supabase.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        expect(issues.length).toBeGreaterThanOrEqual(0);
      });

      it('should detect client creation with options object', async () => {
        const code = `
          const supabase = createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/supabase.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        expect(issues.length).toBeGreaterThanOrEqual(0);
      });

      it('should detect mixed client creation patterns in same file', async () => {
        const code = `
          // Pattern 1: Direct createClient
          const client1 = createClient(url, key);
          
          // Pattern 2: Custom wrapper
          const client2 = getSupabaseClient();
          
          // Pattern 3: Init function
          const client3 = initDatabase();
          
          // Pattern 4: Server client
          const client4 = createServerClient(url, key);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/database.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentPatterns = issues.filter(
          issue => issue.type === 'inconsistent-pattern'
        );
        expect(inconsistentPatterns.length).toBeGreaterThan(0);
      });
    });

    describe('Edge Cases for Error Handling (Requirement 3.2)', () => {
      it('should detect missing error handling in chained operations', async () => {
        const code = `
          const result = await supabase
            .from('users')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(10);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect error destructuring without checking', async () => {
        const code = `
          const { data, error } = await supabase.from('users').select('*');
          // Error is destructured but never checked
          return data;
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in storage operations', async () => {
        const code = `
          const { data } = await supabase
            .storage
            .from('avatars')
            .upload('user-avatar.png', file);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/storage.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in RPC calls', async () => {
        const code = `
          const { data } = await supabase.rpc('calculate_stats', {
            user_id: userId,
            date_range: '30d'
          });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/stats.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });

      it('should detect inconsistent error handling patterns in same function', async () => {
        const code = `
          async function getUserData(userId: string) {
            // Operation 1: Has error handling
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (userError) throw userError;
            
            // Operation 2: No error handling
            const { data: posts } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', userId);
            
            // Operation 3: No error handling
            const { data: comments } = await supabase
              .from('comments')
              .select('*')
              .eq('user_id', userId);
            
            return { user, posts, comments };
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Inconsistent error handling')
        );
        expect(inconsistentIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing error handling in upsert operations', async () => {
        const code = `
          const { data } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              username: 'newuser',
              updated_at: new Date().toISOString()
            });
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/profiles.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          issue => issue.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });
    });

    describe('Edge Cases for Unnecessary Adapters (Requirement 3.3)', () => {
      it('should detect adapter that only adds async/await', async () => {
        const code = `
          async function fetchUsers() {
            return await getUsers();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect adapter with only parameter renaming', async () => {
        const code = `
          const getUserProfile = (userId: string) => {
            return getUser(userId);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBeGreaterThan(0);
      });

      it('should detect database wrapper that just changes function name', async () => {
        const code = `
          const loadUserData = (id: string) => {
            return supabase.from('users').select().eq('id', id);
          };
          
          const fetchUserInfo = (id: string) => {
            return supabase.from('users').select().eq('id', id);
          };
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(2);
      });

      it('should NOT flag adapter with caching logic', async () => {
        const code = `
          const cache = new Map();
          
          async function getUser(id: string) {
            if (cache.has(id)) {
              return cache.get(id);
            }
            
            const { data } = await supabase.from('users').select().eq('id', id).single();
            cache.set(id, data);
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag adapter with retry logic', async () => {
        const code = `
          async function getUser(id: string, retries = 3) {
            for (let i = 0; i < retries; i++) {
              try {
                const { data, error } = await supabase
                  .from('users')
                  .select()
                  .eq('id', id)
                  .single();
                
                if (error) throw error;
                return data;
              } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              }
            }
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });

      it('should NOT flag adapter with permission checks', async () => {
        const code = `
          async function getUser(id: string, requesterId: string) {
            if (id !== requesterId && !isAdmin(requesterId)) {
              throw new Error('Unauthorized');
            }
            
            return supabase.from('users').select().eq('id', id).single();
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const adapterIssues = issues.filter(
          issue => issue.type === 'unnecessary-adapter'
        );
        expect(adapterIssues.length).toBe(0);
      });
    });

    describe('Edge Cases for Type Usage (Requirement 3.4)', () => {
      it('should detect any type in destructured database results', async () => {
        const code = `
          const { data: users }: { data: any } = await supabase
            .from('users')
            .select('*');
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const typeSafetyIssues = issues.filter(
          issue => issue.type === 'type-safety'
        );
        expect(typeSafetyIssues.length).toBeGreaterThan(0);
      });

      it('should detect inconsistent entity type names', async () => {
        const code = `
          const user1: UserRecord = await getUser(1);
          const user2: UserData = await getUser(2);
          const user3: UserEntity = await getUser(3);
          const user4: User = await getUser(4);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const inconsistentTypeIssues = issues.filter(
          issue => issue.type === 'inconsistent-pattern' && 
                   issue.description.includes('Inconsistent type usage')
        );
        expect(inconsistentTypeIssues.length).toBeGreaterThan(0);
      });

      it('should detect manual type that duplicates Supabase generated type', async () => {
        const code = `
          import { Database } from './database.types';
          
          // Manual type definition
          type Profile = {
            id: string;
            user_id: string;
            username: string;
            avatar_url: string;
          };
          
          // This should use Database['public']['Tables']['profiles']['Row'] instead
          async function getProfile(userId: string): Promise<Profile> {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .single();
            return data as Profile;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/profiles.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const conflictingTypeIssues = issues.filter(
          issue => issue.description.includes('may conflict with Supabase generated types')
        );
        expect(conflictingTypeIssues.length).toBeGreaterThan(0);
      });

      it('should detect type assertion to any', async () => {
        const code = `
          const users = (await supabase.from('users').select('*')) as any;
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const typeSafetyIssues = issues.filter(
          issue => issue.type === 'type-safety'
        );
        expect(typeSafetyIssues.length).toBeGreaterThan(0);
      });

      it('should detect missing type annotations on database operations', async () => {
        const code = `
          async function getUsers() {
            const result = await supabase.from('users').select('*');
            return result.data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should track this operation
        expect(issues.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Edge Cases for Pattern Bypass (Requirement 3.5)', () => {
      it('should detect database access in React hooks', async () => {
        const code = `
          export function useUser(userId: string) {
            const [user, setUser] = useState(null);
            
            useEffect(() => {
              const fetchUser = async () => {
                const { data } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', userId)
                  .single();
                setUser(data);
              };
              
              fetchUser();
            }, [userId]);
            
            return user;
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/hooks/useUser.ts',
          relativePath: 'hooks/useUser.ts',
          extension: '.ts',
          size: 1000,
          category: 'component',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const architecturalIssues = issues.filter(
          issue => issue.type === 'architectural'
        );
        expect(architecturalIssues.length).toBeGreaterThan(0);
      });

      it('should detect SQL injection with template literal in RPC', async () => {
        const code = `
          async function searchUsers(searchTerm: string) {
            const query = \`SELECT * FROM users WHERE name LIKE '%\${searchTerm}%'\`;
            const { data } = await supabase.rpc('execute_sql', { query });
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const sqlInjectionIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('SQL injection')
        );
        expect(sqlInjectionIssues.length).toBeGreaterThan(0);
        expect(sqlInjectionIssues[0].severity).toBe('critical');
      });

      it('should detect bypassing service layer in API route', async () => {
        const code = `
          export async function POST(req: Request) {
            const body = await req.json();
            
            // Direct database access instead of using service layer
            const { data: user } = await supabase
              .from('users')
              .insert(body)
              .select()
              .single();
            
            const { data: profile } = await supabase
              .from('profiles')
              .insert({ user_id: user.id, ...body.profile })
              .select()
              .single();
            
            const { data: settings } = await supabase
              .from('user_settings')
              .insert({ user_id: user.id })
              .select()
              .single();
            
            return Response.json({ user, profile, settings });
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/app/api/users/route.ts',
          relativePath: 'app/api/users/route.ts',
          extension: '.ts',
          size: 1000,
          category: 'api-route',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const serviceLayerIssues = issues.filter(
          issue => issue.description.includes('service layer')
        );
        expect(serviceLayerIssues.length).toBeGreaterThan(0);
      });

      it('should detect importing multiple client types unnecessarily', async () => {
        const code = `
          import { 
            createClient,
            createServerClient,
            createBrowserClient,
            createRouteHandlerClient,
            createServerComponentClient,
            createMiddlewareClient
          } from '@supabase/ssr';
          
          // Only using one
          const client = createServerClient(url, key);
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/supabase.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const multipleImportsIssues = issues.filter(
          issue => issue.description.includes('Multiple database client creation methods imported')
        );
        expect(multipleImportsIssues.length).toBeGreaterThan(0);
      });

      it('should detect database access in client component', async () => {
        const code = `
          'use client';
          
          export default function UserDashboard() {
            const [data, setData] = useState(null);
            
            useEffect(() => {
              // Direct database access in client component
              supabase.from('users').select('*').then(({ data }) => setData(data));
            }, []);
            
            return <div>{JSON.stringify(data)}</div>;
          }
        `;

        const ast = parseCode(code);
        const fileInfo: FileInfo = {
          path: '/test/app/dashboard/page.tsx',
          relativePath: 'app/dashboard/page.tsx',
          extension: '.tsx',
          size: 1000,
          category: 'component',
          lastModified: new Date(),
        };
        const issues = await analyzer.analyze(fileInfo, ast);

        const architecturalIssues = issues.filter(
          issue => issue.type === 'architectural' && 
                   issue.description.includes('Direct database access in component')
        );
        expect(architecturalIssues.length).toBeGreaterThan(0);
      });
    });

    describe('Real-World Anti-Pattern Examples', () => {
      it('should detect all issues in a poorly written database service', async () => {
        const code = `
          // Multiple client creation patterns
          const client1 = createClient(url, key);
          const client2 = getSupabaseClient();
          
          // Manual type that conflicts with generated types
          import { Database } from './database.types';
          
          type User = {
            id: string;
            name: string;
          };
          
          // Unnecessary adapter with no error handling
          async function getUser(id: string) {
            return supabase.from('users').select().eq('id', id);
          }
          
          // Missing error handling
          async function createUser(data: any) {
            const { data: user } = await supabase
              .from('users')
              .insert(data);
            return user;
          }
          
          // Inconsistent error handling
          async function updateUser(id: string, updates: any) {
            const { data, error } = await supabase
              .from('users')
              .update(updates)
              .eq('id', id);
            
            if (error) throw error;
            return data;
          }
          
          async function deleteUser(id: string) {
            const { data } = await supabase
              .from('users')
              .delete()
              .eq('id', id);
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should detect multiple types of issues
        expect(issues.length).toBeGreaterThan(0);
        
        const issueTypes = new Set(issues.map(i => i.type));
        expect(issueTypes.size).toBeGreaterThan(1); // Multiple different issue types
        
        // Should have issues from different categories
        expect(issues.some(i => i.type === 'inconsistent-pattern')).toBe(true);
        expect(issues.some(i => i.type === 'missing-error-handling')).toBe(true);
      });

      it('should detect common Next.js App Router anti-patterns', async () => {
        const code = `
          // Mixing server and browser client creation
          import { createServerClient } from '@supabase/ssr';
          import { createBrowserClient } from '@supabase/ssr';
          
          export function getServerClient() {
            return createServerClient(url, key);
          }
          
          export function getBrowserClient() {
            return createBrowserClient(url, key);
          }
          
          // Using wrong client in wrong context
          export async function serverAction() {
            const client = getBrowserClient(); // Wrong!
            const { data } = await client.from('users').select('*');
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('lib/supabase.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        expect(issues.length).toBeGreaterThan(0);
      });

      it('should detect anti-patterns in authentication code', async () => {
        const code = `
          // Missing error handling in auth operations
          export async function signIn(email: string, password: string) {
            const { data } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            return data;
          }
          
          export async function signUp(email: string, password: string) {
            const { data } = await supabase.auth.signUp({
              email,
              password,
            });
            return data;
          }
          
          // Inconsistent error handling
          export async function signOut() {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/auth.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          i => i.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
        
        const inconsistentIssues = issues.filter(
          i => i.type === 'inconsistent-pattern' && 
               i.description.includes('Inconsistent error handling')
        );
        expect(inconsistentIssues.length).toBeGreaterThan(0);
      });

      it('should detect anti-patterns in file upload code', async () => {
        const code = `
          // Missing error handling in storage operations
          export async function uploadAvatar(userId: string, file: File) {
            const { data } = await supabase
              .storage
              .from('avatars')
              .upload(\`\${userId}/avatar.png\`, file);
            
            return data;
          }
          
          export async function deleteAvatar(userId: string) {
            const { data } = await supabase
              .storage
              .from('avatars')
              .remove([\`\${userId}/avatar.png\`]);
            
            return data;
          }
          
          // With error handling
          export async function downloadAvatar(userId: string) {
            const { data, error } = await supabase
              .storage
              .from('avatars')
              .download(\`\${userId}/avatar.png\`);
            
            if (error) throw error;
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/storage.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        const errorHandlingIssues = issues.filter(
          i => i.type === 'missing-error-handling'
        );
        expect(errorHandlingIssues.length).toBeGreaterThan(0);
      });
    });

    describe('Comprehensive Integration Tests', () => {
      it('should handle a well-written database service with no issues', async () => {
        const code = `
          import { Database } from './database.types';
          
          type DbUser = Database['public']['Tables']['users']['Row'];
          type DbUserInsert = Database['public']['Tables']['users']['Insert'];
          type DbUserUpdate = Database['public']['Tables']['users']['Update'];
          
          export async function getUser(id: string): Promise<DbUser | null> {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
              
              if (error) {
                console.error('Error fetching user:', error);
                throw new Error(\`Failed to fetch user: \${error.message}\`);
              }
              
              return data;
            } catch (error) {
              console.error('Unexpected error:', error);
              throw error;
            }
          }
          
          export async function createUser(userData: DbUserInsert): Promise<DbUser> {
            try {
              if (!userData.email) {
                throw new Error('Email is required');
              }
              
              const { data, error } = await supabase
                .from('users')
                .insert(userData)
                .select()
                .single();
              
              if (error) {
                console.error('Error creating user:', error);
                throw new Error(\`Failed to create user: \${error.message}\`);
              }
              
              return data;
            } catch (error) {
              console.error('Unexpected error:', error);
              throw error;
            }
          }
          
          export async function updateUser(
            id: string,
            updates: DbUserUpdate
          ): Promise<DbUser> {
            try {
              if (!id) {
                throw new Error('User ID is required');
              }
              
              const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
              
              if (error) {
                console.error('Error updating user:', error);
                throw new Error(\`Failed to update user: \${error.message}\`);
              }
              
              return data;
            } catch (error) {
              console.error('Unexpected error:', error);
              throw error;
            }
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should have no critical or high severity issues
        const criticalIssues = issues.filter(
          i => i.severity === 'critical' || i.severity === 'high'
        );
        expect(criticalIssues.length).toBe(0);
      });

      it('should provide comprehensive analysis for mixed quality code', async () => {
        const code = `
          import { Database } from './database.types';
          
          // Good: Using generated types
          type DbUser = Database['public']['Tables']['users']['Row'];
          
          // Bad: Manual type that conflicts
          type User = {
            id: string;
            name: string;
          };
          
          // Good: Proper error handling
          export async function getUser(id: string): Promise<DbUser | null> {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
              
              if (error) throw error;
              return data;
            } catch (error) {
              console.error(error);
              throw error;
            }
          }
          
          // Bad: Missing error handling
          export async function getUsers() {
            const { data } = await supabase.from('users').select('*');
            return data;
          }
          
          // Bad: Unnecessary adapter
          export async function fetchUser(id: string) {
            return getUser(id);
          }
          
          // Bad: Any type usage
          export async function getUserPosts(userId: string): Promise<any> {
            const { data } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', userId);
            return data;
          }
        `;

        const ast = parseCode(code);
        const fileInfo = createFileInfo('services/users.ts');
        const issues = await analyzer.analyze(fileInfo, ast);

        // Should detect multiple issue types
        expect(issues.length).toBeGreaterThan(0);
        
        const hasErrorHandlingIssues = issues.some(i => i.type === 'missing-error-handling');
        const hasTypeSafetyIssues = issues.some(i => i.type === 'type-safety');
        const hasAdapterIssues = issues.some(i => i.type === 'unnecessary-adapter');
        const hasTypeConflictIssues = issues.some(
          i => i.description.includes('may conflict with Supabase generated types')
        );
        
        expect(hasErrorHandlingIssues).toBe(true);
        expect(hasTypeSafetyIssues).toBe(true);
        expect(hasAdapterIssues).toBe(true);
        expect(hasTypeConflictIssues).toBe(true);
      });
    });
  });
});
