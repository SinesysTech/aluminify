/**
 * Unit tests for APIRoutePatternAnalyzer - Task 9.2 Inconsistency Detection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from 'ts-morph';
import { APIRoutePatternAnalyzer } from '../../../src/analyzers/api-route-pattern-analyzer';
describe('APIRoutePatternAnalyzer - Task 9.2', () => {
    let analyzer;
    let project;
    beforeEach(() => {
        analyzer = new APIRoutePatternAnalyzer();
        project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                target: 99, // ESNext
                module: 99, // ESNext
            },
        });
    });
    const createFileInfo = (relativePath) => ({
        path: `/test/${relativePath}`,
        relativePath,
        extension: '.ts',
        size: 1000,
        category: 'api-route',
        lastModified: new Date(),
    });
    const parseCode = (code) => {
        return project.createSourceFile('test.ts', code, { overwrite: true });
    };
    describe('Inconsistent Request Validation Detection (Requirement 4.2)', () => {
        it('should detect POST route without validation', async () => {
            const code = `
        export async function POST(request: Request) {
          const body = await request.json();
          // No validation
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/users/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const validationIssues = issues.filter(issue => issue.description.includes('lacks request validation'));
            expect(validationIssues.length).toBeGreaterThan(0);
            expect(validationIssues[0].severity).toBe('high');
            expect(validationIssues[0].category).toBe('api-routes');
            expect(validationIssues[0].tags).toContain('validation');
        });
        it('should detect PUT route without validation', async () => {
            const code = `
        export async function PUT(request: Request) {
          const body = await request.json();
          await updateData(body);
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/items/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const validationIssues = issues.filter(issue => issue.description.includes('lacks request validation'));
            expect(validationIssues.length).toBeGreaterThan(0);
        });
        it('should detect PATCH route without validation', async () => {
            const code = `
        export async function PATCH(request: Request) {
          const body = await request.json();
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/update/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const validationIssues = issues.filter(issue => issue.description.includes('lacks request validation'));
            expect(validationIssues.length).toBeGreaterThan(0);
        });
        it('should detect multiple validation approaches in same file', async () => {
            const code = `
        export async function POST(request: Request) {
          const body = await request.json();
          const validated = z.object({ name: z.string() }).parse(body); // Zod
          return NextResponse.json({ success: true });
        }

        export async function PUT(request: Request) {
          const body = await request.json();
          if (!body.name) { // Manual validation
            throw new Error('Name required');
          }
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/mixed/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const inconsistentValidation = issues.filter(issue => issue.description.includes('Multiple validation approaches'));
            expect(inconsistentValidation.length).toBeGreaterThan(0);
            expect(inconsistentValidation[0].severity).toBe('medium');
            expect(inconsistentValidation[0].tags).toContain('inconsistent-pattern');
        });
        it('should not flag GET routes without validation', async () => {
            const code = `
        export async function GET(request: Request) {
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/data/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const validationIssues = issues.filter(issue => issue.description.includes('lacks request validation'));
            expect(validationIssues.length).toBe(0);
        });
        it('should not flag routes with Zod validation', async () => {
            const code = `
        export async function POST(request: Request) {
          const body = await request.json();
          const validated = z.object({ name: z.string() }).parse(body);
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/validated/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const validationIssues = issues.filter(issue => issue.description.includes('lacks request validation'));
            expect(validationIssues.length).toBe(0);
        });
    });
    describe('Inconsistent Error Handling Detection (Requirement 4.3)', () => {
        it('should detect route without error handling', async () => {
            const code = `
        export async function GET(request: Request) {
          const data = await fetchData();
          return NextResponse.json(data);
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/unsafe/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const errorHandlingIssues = issues.filter(issue => issue.description.includes('lacks error handling'));
            expect(errorHandlingIssues.length).toBeGreaterThan(0);
            expect(errorHandlingIssues[0].severity).toBe('high');
            expect(errorHandlingIssues[0].type).toBe('missing-error-handling');
        });
        it('should detect inconsistent error response patterns', async () => {
            const code = `
        export async function GET(request: Request) {
          try {
            const data = await fetchData();
            return NextResponse.json(data);
          } catch (error) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
          }
        }

        export async function POST(request: Request) {
          try {
            const data = await processData();
            return new Response(JSON.stringify(data));
          } catch (error) {
            throw new Error('Processing failed');
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/inconsistent-errors/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const inconsistentErrors = issues.filter(issue => issue.description.includes('Multiple error handling patterns'));
            expect(inconsistentErrors.length).toBeGreaterThan(0);
            expect(inconsistentErrors[0].severity).toBe('medium');
        });
        it('should not flag routes with try-catch blocks', async () => {
            const code = `
        export async function GET(request: Request) {
          try {
            const data = await fetchData();
            return NextResponse.json(data);
          } catch (error) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/safe/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const errorHandlingIssues = issues.filter(issue => issue.description.includes('lacks error handling'));
            expect(errorHandlingIssues.length).toBe(0);
        });
    });
    describe('Inconsistent Response Format Detection (Requirement 4.4)', () => {
        it('should detect multiple response formats in same file', async () => {
            const code = `
        export async function GET(request: Request) {
          return NextResponse.json({ data: 'test' });
        }

        export async function POST(request: Request) {
          return new Response(JSON.stringify({ data: 'test' }));
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/mixed-responses/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const responseFormatIssues = issues.filter(issue => issue.description.includes('Multiple response format patterns'));
            expect(responseFormatIssues.length).toBeGreaterThan(0);
            expect(responseFormatIssues[0].severity).toBe('medium');
            expect(responseFormatIssues[0].tags).toContain('response-format');
        });
        it('should detect missing response format', async () => {
            const code = `
        export async function GET(request: Request) {
          const data = await fetchData();
          // No return statement
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/no-response/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const noResponseIssues = issues.filter(issue => issue.description.includes('does not have a clear response format'));
            expect(noResponseIssues.length).toBeGreaterThan(0);
            expect(noResponseIssues[0].severity).toBe('high');
        });
        it('should not flag consistent NextResponse.json usage', async () => {
            const code = `
        export async function GET(request: Request) {
          return NextResponse.json({ data: 'test' });
        }

        export async function POST(request: Request) {
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/consistent/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const responseFormatIssues = issues.filter(issue => issue.description.includes('Multiple response format patterns'));
            expect(responseFormatIssues.length).toBe(0);
        });
    });
    describe('Duplicate Middleware Detection (Requirement 4.5)', () => {
        it('should detect duplicate inline authentication logic', async () => {
            const code = `
        export async function GET(request: Request) {
          const session = await auth();
          if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          return NextResponse.json({ data: 'test' });
        }

        export async function POST(request: Request) {
          const session = await auth();
          if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          return NextResponse.json({ success: true });
        }

        export async function DELETE(request: Request) {
          const session = await auth();
          if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/duplicate-auth/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const duplicateMiddleware = issues.filter(issue => issue.type === 'code-duplication' &&
                issue.description.includes('authentication'));
            expect(duplicateMiddleware.length).toBeGreaterThan(0);
            expect(duplicateMiddleware[0].category).toBe('api-routes');
            expect(duplicateMiddleware[0].tags).toContain('authentication');
        });
        it('should detect repeated middleware usage', async () => {
            const code = `
        export async function GET(request: Request) {
          await authenticate(request);
          return NextResponse.json({ data: 'test' });
        }

        export async function POST(request: Request) {
          await authenticate(request);
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/repeated-middleware/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const middlewareIssues = issues.filter(issue => issue.description.includes('Middleware') &&
                issue.description.includes('used') &&
                issue.description.includes('times'));
            expect(middlewareIssues.length).toBeGreaterThan(0);
            expect(middlewareIssues[0].severity).toBe('low');
        });
        it('should detect duplicate authorization checks', async () => {
            const code = `
        export async function PUT(request: Request) {
          const user = await getUser();
          if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          return NextResponse.json({ success: true });
        }

        export async function DELETE(request: Request) {
          const user = await getUser();
          if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/duplicate-authz/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            const authzIssues = issues.filter(issue => issue.type === 'code-duplication' &&
                issue.description.includes('authorization'));
            expect(authzIssues.length).toBeGreaterThan(0);
        });
    });
    describe('Integration - Multiple Inconsistencies', () => {
        it('should detect all types of inconsistencies in a complex file', async () => {
            const code = `
        export async function GET(request: Request) {
          // No error handling
          const data = await fetchData();
          return NextResponse.json(data);
        }

        export async function POST(request: Request) {
          // No validation
          const body = await request.json();
          try {
            const result = await processData(body);
            return new Response(JSON.stringify(result)); // Different response format
          } catch (error) {
            throw new Error('Failed'); // Different error pattern
          }
        }

        export async function PUT(request: Request) {
          const session = await auth(); // Inline auth
          if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          
          const body = await request.json();
          if (!body.id) throw new Error('ID required'); // Manual validation
          
          return NextResponse.json({ success: true });
        }

        export async function DELETE(request: Request) {
          const session = await auth(); // Duplicate inline auth
          if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          
          return NextResponse.json({ success: true });
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('api/complex/route.ts');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect multiple types of issues
            expect(issues.length).toBeGreaterThan(5);
            // Check for different issue types
            const hasValidationIssue = issues.some(i => i.description.includes('validation'));
            const hasErrorHandlingIssue = issues.some(i => i.description.includes('error handling'));
            const hasResponseFormatIssue = issues.some(i => i.description.includes('response format'));
            const hasMiddlewareIssue = issues.some(i => i.description.includes('authentication'));
            expect(hasValidationIssue).toBe(true);
            expect(hasErrorHandlingIssue).toBe(true);
            expect(hasResponseFormatIssue).toBe(true);
            expect(hasMiddlewareIssue).toBe(true);
        });
    });
});
//# sourceMappingURL=api-route-pattern-analyzer.test.js.map