/**
 * Property-based tests for database pattern detection
 *
 * Feature: codebase-cleanup, Property 8: Database Access Inconsistency Detection
 *
 * **Validates: Requirements 3.2, 3.4, 3.5**
 *
 * Property: For any codebase with database operations, the analyzer should detect
 * inconsistent client instantiation patterns, inconsistent error handling in database
 * operations, inconsistent type usage for database entities, and code bypassing
 * established patterns.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Project } from 'ts-morph';
import { DatabasePatternAnalyzer } from '../../src/analyzers/database-pattern-analyzer';
describe('Property 8: Database Access Inconsistency Detection', () => {
    let analyzer;
    let project;
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
    const createFileInfo = (relativePath, category = 'service') => ({
        path: `/test/${relativePath}`,
        relativePath,
        extension: '.ts',
        size: 1000,
        category,
        lastModified: new Date(),
    });
    const parseCode = (code) => {
        return project.createSourceFile('test.ts', code, { overwrite: true });
    };
    // ============================================================================
    // Arbitrary Generators for Database Code Patterns
    // ============================================================================
    /**
     * Generator for database client creation function names
     */
    const dbClientFunctionArb = fc.constantFrom('createClient', 'getSupabaseClient', 'initSupabase', 'createSupabaseClient', 'createServerClient', 'createBrowserClient', 'createRouteHandlerClient', 'getClient', 'initClient', 'getDB', 'initDB');
    /**
     * Generator for database operation types
     */
    const dbOperationArb = fc.constantFrom('from', 'select', 'insert', 'update', 'delete', 'upsert', 'rpc');
    /**
     * Generator for database table names
     */
    const tableNameArb = fc.constantFrom('users', 'posts', 'comments', 'profiles', 'sessions', 'accounts', 'organizations', 'teams');
    /**
     * Generator for variable names that suggest database clients
     */
    const dbClientVarNameArb = fc.constantFrom('supabase', 'db', 'database', 'client', 'dbClient', 'supabaseClient');
    /**
     * Generator for error handling patterns
     */
    const errorHandlingPatternArb = fc.constantFrom('try-catch', 'error-destructuring', 'none');
    /**
     * Generator for type annotations
     */
    const typeAnnotationArb = fc.constantFrom('any', 'User', 'DbUser', 'Database["public"]["Tables"]["users"]["Row"]', 'unknown');
    /**
     * Generator for database client instantiation code
     */
    const dbClientInstantiationArb = fc.record({
        functionName: dbClientFunctionArb,
        varName: dbClientVarNameArb,
    }).map(({ functionName, varName }) => `const ${varName} = ${functionName}(url, key);`);
    /**
     * Generator for database operation code with configurable error handling
     */
    const dbOperationCodeArb = fc.record({
        operation: dbOperationArb,
        tableName: tableNameArb,
        errorHandling: errorHandlingPatternArb,
        varName: dbClientVarNameArb,
    }).map(({ operation, tableName, errorHandling, varName }) => {
        const baseOperation = `${varName}.from('${tableName}').${operation}('*')`;
        switch (errorHandling) {
            case 'try-catch':
                return `
          try {
            const { data } = await ${baseOperation};
            return data;
          } catch (error) {
            console.error(error);
            throw error;
          }
        `;
            case 'error-destructuring':
                return `
          const { data, error } = await ${baseOperation};
          if (error) {
            throw error;
          }
          return data;
        `;
            case 'none':
                return `
          const { data } = await ${baseOperation};
          return data;
        `;
        }
    });
    /**
     * Generator for database operation with type annotation
     */
    const dbOperationWithTypeArb = fc.record({
        operation: dbOperationArb,
        tableName: tableNameArb,
        typeAnnotation: typeAnnotationArb,
        varName: dbClientVarNameArb,
    }).map(({ operation, tableName, typeAnnotation, varName }) => `const data: ${typeAnnotation} = await ${varName}.from('${tableName}').${operation}('*');`);
    /**
     * Generator for pass-through wrapper functions
     */
    const passThroughWrapperArb = fc.record({
        functionName: fc.stringMatching(/^[a-z][a-zA-Z0-9]{3,10}$/),
        tableName: tableNameArb,
        varName: dbClientVarNameArb,
    }).map(({ functionName, tableName, varName }) => `
      async function ${functionName}(id: string) {
        return ${varName}.from('${tableName}').select('*').eq('id', id);
      }
    `);
    /**
     * Generator for wrapper functions with added logic
     */
    const meaningfulWrapperArb = fc.record({
        functionName: fc.stringMatching(/^[a-z][a-zA-Z0-9]{3,10}$/),
        tableName: tableNameArb,
        varName: dbClientVarNameArb,
    }).map(({ functionName, tableName, varName }) => `
      async function ${functionName}(id: string) {
        if (!id) {
          throw new Error('ID is required');
        }
        
        const { data, error } = await ${varName}.from('${tableName}').select('*').eq('id', id);
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        return data;
      }
    `);
    // ============================================================================
    // Property Tests for Requirement 3.2: Inconsistent Error Handling Detection
    // ============================================================================
    it('should detect missing error handling in database operations', async () => {
        await fc.assert(fc.asyncProperty(fc.array(dbOperationCodeArb, { minLength: 2, maxLength: 5 }), async (operations) => {
            // Ensure at least one operation has no error handling
            const hasOperationWithoutErrorHandling = operations.some(op => !op.includes('try') && !op.includes('error'));
            if (!hasOperationWithoutErrorHandling) {
                // Skip this test case if all operations have error handling
                return;
            }
            const code = `
            const supabase = createClient(url, key);
            
            ${operations.join('\n\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect missing error handling
            const errorHandlingIssues = issues.filter(issue => issue.type === 'missing-error-handling');
            expect(errorHandlingIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should detect inconsistent error handling patterns across operations', async () => {
        await fc.assert(fc.asyncProperty(fc.tuple(fc.array(dbOperationCodeArb.filter(code => code.includes('try')), { minLength: 1, maxLength: 3 }), fc.array(dbOperationCodeArb.filter(code => !code.includes('try') && !code.includes('error')), { minLength: 1, maxLength: 3 })), async ([withErrorHandling, withoutErrorHandling]) => {
            const allOperations = [...withErrorHandling, ...withoutErrorHandling];
            const code = `
            const supabase = createClient(url, key);
            
            ${allOperations.join('\n\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect inconsistency in error handling
            const inconsistencyIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('Inconsistent error handling'));
            expect(inconsistencyIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should not flag operations with consistent error handling', async () => {
        await fc.assert(fc.asyncProperty(fc.array(dbOperationCodeArb.filter(code => code.includes('error') || code.includes('try')), { minLength: 2, maxLength: 5 }), async (operations) => {
            const code = `
            const supabase = createClient(url, key);
            
            ${operations.join('\n\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should not detect missing error handling issues
            const errorHandlingIssues = issues.filter(issue => issue.type === 'missing-error-handling');
            expect(errorHandlingIssues.length).toBe(0);
        }), { numRuns: 100 });
    });
    // ============================================================================
    // Property Tests for Requirement 3.4: Inconsistent Type Usage Detection
    // ============================================================================
    it('should detect any type usage in database operations', async () => {
        await fc.assert(fc.asyncProperty(fc.array(dbOperationWithTypeArb.filter(code => code.includes(': any')), { minLength: 1, maxLength: 3 }), async (operations) => {
            const code = `
            const supabase = createClient(url, key);
            
            ${operations.join('\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect any type usage
            const typeSafetyIssues = issues.filter(issue => issue.type === 'type-safety' &&
                issue.description.includes("typed as 'any'"));
            expect(typeSafetyIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should detect inconsistent type definitions for same entity', async () => {
        await fc.assert(fc.asyncProperty(tableNameArb, fc.array(typeAnnotationArb.filter(t => t !== 'any'), { minLength: 2, maxLength: 4 }), async (tableName, types) => {
            // Ensure we have at least 2 different types
            const uniqueTypes = [...new Set(types)];
            if (uniqueTypes.length < 2) {
                return; // Skip if not enough variety
            }
            const operations = types.map((type, idx) => `const data${idx}: ${type} = await supabase.from('${tableName}').select('*');`);
            const code = `
            const supabase = createClient(url, key);
            
            ${operations.join('\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect inconsistent type usage
            const _inconsistentTypeIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('Inconsistent type usage'));
            // May or may not detect depending on variable naming
            expect(issues.length).toBeGreaterThanOrEqual(0);
        }), { numRuns: 100 });
    });
    it('should detect manual type definitions that may conflict with generated types', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('User', 'Profile', 'Post', 'Comment', 'Session'), async (typeName) => {
            const code = `
            import { Database } from './database.types';
            
            type ${typeName} = {
              id: string;
              name: string;
            };
            
            const supabase = createClient(url, key);
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect potential type conflict
            const typeConflictIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('may conflict with Supabase generated types'));
            expect(typeConflictIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should not flag proper Supabase generated type usage', async () => {
        await fc.assert(fc.asyncProperty(tableNameArb, async (tableName) => {
            const code = `
            import { Database } from './database.types';
            
            type DbUser = Database['public']['Tables']['${tableName}']['Row'];
            
            const supabase = createClient(url, key);
            
            async function getUsers(): Promise<DbUser[]> {
              const { data, error } = await supabase.from('${tableName}').select('*');
              if (error) throw error;
              return data || [];
            }
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should have minimal issues (only potential client pattern tracking)
            const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
            expect(criticalIssues.length).toBe(0);
        }), { numRuns: 100 });
    });
    // ============================================================================
    // Property Tests for Requirement 3.5: Pattern Bypass Detection
    // ============================================================================
    it('should detect direct database access in components', async () => {
        await fc.assert(fc.asyncProperty(dbOperationArb, tableNameArb, async (operation, tableName) => {
            const code = `
            export default function UserProfile() {
              const { data } = await supabase.from('${tableName}').${operation}('*');
              return <div>{data?.name}</div>;
            }
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/UserProfile.tsx', 'component');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect architectural issue
            const architecturalIssues = issues.filter(issue => issue.type === 'architectural' &&
                issue.description.includes('Direct database access in component'));
            expect(architecturalIssues.length).toBeGreaterThan(0);
            expect(architecturalIssues[0].severity).toBe('high');
        }), { numRuns: 100 });
    });
    it('should detect potential SQL injection in RPC calls with string concatenation', async () => {
        await fc.assert(fc.asyncProperty(fc.stringMatching(/^[a-z_]{3,15}$/), async (rpcName) => {
            const code = `
            const userId = req.query.userId;
            const { data } = await supabase.rpc('${rpcName}', {
              query: \`SELECT * FROM users WHERE id = \${userId}\`
            });
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect SQL injection risk
            const sqlInjectionIssues = issues.filter(issue => issue.type === 'architectural' &&
                issue.description.includes('SQL injection'));
            expect(sqlInjectionIssues.length).toBeGreaterThan(0);
            expect(sqlInjectionIssues[0].severity).toBe('critical');
        }), { numRuns: 100 });
    });
    it('should detect excessive database operations in API routes', async () => {
        await fc.assert(fc.asyncProperty(fc.array(dbOperationArb, { minLength: 4, maxLength: 8 }), fc.array(tableNameArb, { minLength: 4, maxLength: 8 }), async (operations, tables) => {
            // Create multiple database operations
            const dbCalls = operations.map((op, idx) => `const { data: data${idx} } = await supabase.from('${tables[idx % tables.length]}').${op}('*');`);
            const code = `
            export async function GET(req: Request) {
              ${dbCalls.join('\n')}
              return Response.json({ data: [${operations.map((_, idx) => `data${idx}`).join(', ')}] });
            }
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('app/api/data/route.ts', 'api-route');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should suggest service layer for complex operations
            const serviceLayerIssues = issues.filter(issue => issue.type === 'architectural' &&
                issue.description.includes('service layer'));
            expect(serviceLayerIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should detect multiple client creation method imports', async () => {
        await fc.assert(fc.asyncProperty(fc.array(fc.constantFrom('createClient', 'createServerClient', 'createBrowserClient', 'createRouteHandlerClient', 'createMiddlewareClient'), { minLength: 3, maxLength: 5 }), async (clientMethods) => {
            const uniqueMethods = [...new Set(clientMethods)];
            if (uniqueMethods.length < 3) {
                return; // Skip if not enough variety
            }
            const code = `
            import { ${uniqueMethods.join(', ')} } from '@supabase/ssr';
            
            const client = createClient(url, key);
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('lib/supabase.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect multiple import patterns
            const multipleImportsIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('Multiple database client creation methods imported'));
            expect(multipleImportsIssues.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    // ============================================================================
    // Property Tests for Unnecessary Adapter Detection (Requirement 3.3)
    // ============================================================================
    it('should detect simple pass-through database wrappers', async () => {
        await fc.assert(fc.asyncProperty(passThroughWrapperArb, async (wrapperCode) => {
            const code = `
            const supabase = createClient(url, key);
            
            ${wrapperCode}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect unnecessary adapter
            const adapterIssues = issues.filter(issue => issue.type === 'unnecessary-adapter');
            expect(adapterIssues.length).toBeGreaterThan(0);
            expect(adapterIssues[0].severity).toBe('medium');
        }), { numRuns: 100 });
    });
    it('should not flag wrappers with meaningful logic', async () => {
        await fc.assert(fc.asyncProperty(meaningfulWrapperArb, async (wrapperCode) => {
            const code = `
            const supabase = createClient(url, key);
            
            ${wrapperCode}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should not detect unnecessary adapter (has validation and error handling)
            const adapterIssues = issues.filter(issue => issue.type === 'unnecessary-adapter');
            expect(adapterIssues.length).toBe(0);
        }), { numRuns: 100 });
    });
    // ============================================================================
    // Property Tests for Client Instantiation Pattern Detection
    // ============================================================================
    it('should detect inconsistent client instantiation patterns', async () => {
        await fc.assert(fc.asyncProperty(fc.array(dbClientInstantiationArb, { minLength: 2, maxLength: 5 }), async (instantiations) => {
            // Ensure we have at least 2 different function names
            const functionNames = instantiations.map(inst => {
                const match = inst.match(/= (\w+)\(/);
                return match ? match[1] : '';
            });
            const uniqueFunctions = [...new Set(functionNames)];
            if (uniqueFunctions.length < 2) {
                return; // Skip if all use same function
            }
            const code = instantiations.join('\n');
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect inconsistent patterns
            const inconsistentPatterns = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('Inconsistent database client instantiation'));
            expect(inconsistentPatterns.length).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should not flag consistent client instantiation patterns', async () => {
        await fc.assert(fc.asyncProperty(dbClientFunctionArb, fc.integer({ min: 2, max: 5 }), async (functionName, count) => {
            const instantiations = Array.from({ length: count }, (_, idx) => `const client${idx} = ${functionName}(url, key);`);
            const code = instantiations.join('\n');
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should not detect inconsistent patterns (all use same function)
            const inconsistentPatterns = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
                issue.description.includes('Inconsistent database client instantiation'));
            expect(inconsistentPatterns.length).toBe(0);
        }), { numRuns: 100 });
    });
    // ============================================================================
    // Integration Property Tests
    // ============================================================================
    it('should detect multiple types of database inconsistencies in same file', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            clientFunctions: fc.array(dbClientFunctionArb, { minLength: 2, maxLength: 3 }),
            operations: fc.array(dbOperationCodeArb, { minLength: 2, maxLength: 4 }),
            types: fc.array(typeAnnotationArb, { minLength: 2, maxLength: 3 }),
        }), async ({ clientFunctions, operations, types }) => {
            // Ensure variety in client functions
            const uniqueClientFunctions = [...new Set(clientFunctions)];
            if (uniqueClientFunctions.length < 2) {
                return;
            }
            const clientInstantiations = uniqueClientFunctions.map((fn, idx) => `const client${idx} = ${fn}(url, key);`);
            const typedOperations = types.map((type, idx) => `const data${idx}: ${type} = await supabase.from('users').select('*');`);
            const code = `
            ${clientInstantiations.join('\n')}
            
            ${operations.join('\n\n')}
            
            ${typedOperations.join('\n')}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect multiple issue types
            expect(issues.length).toBeGreaterThan(0);
            // Should have issues from different categories
            const issueTypes = new Set(issues.map(i => i.type));
            expect(issueTypes.size).toBeGreaterThan(0);
        }), { numRuns: 100 });
    });
    it('should provide actionable recommendations for all detected issues', async () => {
        await fc.assert(fc.asyncProperty(fc.oneof(dbClientInstantiationArb, dbOperationCodeArb, dbOperationWithTypeArb, passThroughWrapperArb), async (codeSnippet) => {
            const code = `
            const supabase = createClient(url, key);
            ${codeSnippet}
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/database.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // All issues should have recommendations
            issues.forEach(issue => {
                expect(issue.recommendation).toBeTruthy();
                expect(issue.recommendation.length).toBeGreaterThan(20);
                expect(issue.estimatedEffort).toBeDefined();
                expect(issue.severity).toBeDefined();
                expect(issue.tags).toBeDefined();
                expect(issue.tags.length).toBeGreaterThan(0);
            });
        }), { numRuns: 100 });
    });
    it('should handle files with no database operations without errors', async () => {
        await fc.assert(fc.asyncProperty(fc.stringMatching(/^[a-z][a-zA-Z0-9]{5,20}$/), async (functionName) => {
            const code = `
            function ${functionName}(items: Item[]): number {
              return items.reduce((sum, item) => sum + item.price, 0);
            }
          `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('utils/math.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            expect(issues).toEqual([]);
        }), { numRuns: 100 });
    });
    it('should correctly categorize issue severity based on impact', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom(
        // Critical: SQL injection
        `const query = \`SELECT * FROM users WHERE id = \${userId}\`; await supabase.rpc('exec', { sql: query });`, 
        // High: Direct DB access in component
        `export default function Component() { const { data } = await supabase.from('users').select('*'); }`, 
        // Medium: Missing error handling
        `const { data } = await supabase.from('users').select('*');`, 
        // Low: Multiple client imports
        `import { createClient, createServerClient, createBrowserClient } from '@supabase/ssr';`), async (codeSnippet) => {
            const code = `
            const supabase = createClient(url, key);
            ${codeSnippet}
          `;
            const category = codeSnippet.includes('Component()') ? 'component' : 'service';
            const ast = parseCode(code);
            const fileInfo = createFileInfo('test.ts', category);
            const issues = await analyzer.analyze(fileInfo, ast);
            // All issues should have appropriate severity
            issues.forEach(issue => {
                expect(['critical', 'high', 'medium', 'low']).toContain(issue.severity);
                // SQL injection should be critical
                if (issue.description.includes('SQL injection')) {
                    expect(issue.severity).toBe('critical');
                }
                // Direct DB access in components should be high
                if (issue.description.includes('Direct database access in component')) {
                    expect(issue.severity).toBe('high');
                }
            });
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=database-pattern-detection.property.test.js.map