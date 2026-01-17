/**
 * Manual test for MiddlewarePatternAnalyzer
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';
import type { FileInfo } from './src/types';

async function testMiddlewareAnalyzer() {
  console.log('Testing MiddlewarePatternAnalyzer...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Test 1: Middleware function with standard signature
  console.log('Test 1: Standard middleware function');
  const middlewareCode1 = `
    export function authMiddleware(req: Request, res: Response, next: NextFunction) {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    }

    export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
      if (!req.body) {
        return res.status(400).json({ error: 'Bad Request' });
      }
      next();
    };
  `;

  const sourceFile1 = project.createSourceFile('middleware/auth.ts', middlewareCode1);
  const fileInfo1: FileInfo = {
    path: '/test/middleware/auth.ts',
    relativePath: 'middleware/auth.ts',
    extension: '.ts',
    size: middlewareCode1.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  const issues1 = await analyzer.analyze(fileInfo1, sourceFile1);
  console.log(`Found ${issues1.length} issues`);
  issues1.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
  console.log();

  // Test 2: Next.js middleware
  console.log('Test 2: Next.js middleware');
  const middlewareCode2 = `
    import { NextRequest, NextResponse } from 'next/server';

    export function middleware(request: NextRequest) {
      const token = request.cookies.get('token');
      
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      return NextResponse.next();
    }
  `;

  const sourceFile2 = project.createSourceFile('middleware.ts', middlewareCode2);
  const fileInfo2: FileInfo = {
    path: '/test/middleware.ts',
    relativePath: 'middleware.ts',
    extension: '.ts',
    size: middlewareCode2.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  const issues2 = await analyzer.analyze(fileInfo2, sourceFile2);
  console.log(`Found ${issues2.length} issues`);
  issues2.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
  console.log();

  // Test 3: API route with middleware usage
  console.log('Test 3: API route with middleware usage');
  const apiRouteCode = `
    import { authMiddleware } from '../middleware/auth';
    import { validateRequest } from '../middleware/validate';

    export async function GET(req: Request) {
      // Middleware usage
      authMiddleware(req, res, next);
      validateRequest(req, res, next);
      
      return Response.json({ data: 'success' });
    }
  `;

  const sourceFile3 = project.createSourceFile('app/api/users/route.ts', apiRouteCode);
  const fileInfo3: FileInfo = {
    path: '/test/app/api/users/route.ts',
    relativePath: 'app/api/users/route.ts',
    extension: '.ts',
    size: apiRouteCode.length,
    category: 'api-route',
    lastModified: new Date(),
  };

  const issues3 = await analyzer.analyze(fileInfo3, sourceFile3);
  console.log(`Found ${issues3.length} issues`);
  issues3.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
  console.log();

  // Test 4: Middleware class
  console.log('Test 4: Middleware class');
  const middlewareCode4 = `
    export class AuthGuard {
      async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        return !!request.user;
      }
    }

    export class RateLimitMiddleware {
      use(req: Request, res: Response, next: NextFunction) {
        // Rate limiting logic
        next();
      }
    }
  `;

  const sourceFile4 = project.createSourceFile('middleware/guards.ts', middlewareCode4);
  const fileInfo4: FileInfo = {
    path: '/test/middleware/guards.ts',
    relativePath: 'middleware/guards.ts',
    extension: '.ts',
    size: middlewareCode4.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  const issues4 = await analyzer.analyze(fileInfo4, sourceFile4);
  console.log(`Found ${issues4.length} issues`);
  issues4.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
  console.log();

  // Get summary
  console.log('Middleware Discovery Summary:');
  const summary = analyzer.getMiddlewareSummary();
  console.log(`  Total implementations: ${summary.totalImplementations}`);
  console.log(`  Total usages: ${summary.totalUsages}`);
  console.log(`  Files with implementations: ${summary.implementationsByFile.size}`);
  console.log(`  Routes using middleware: ${summary.usagesByRoute.size}`);
  console.log();

  console.log('✅ All tests completed successfully!');
}

testMiddlewareAnalyzer().catch(console.error);
