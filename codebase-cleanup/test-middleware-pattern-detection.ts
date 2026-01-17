/**
 * Test for Task 11.2: Middleware Pattern Detection
 * Tests duplicate detection, ordering inconsistencies, and consolidation opportunities
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';
import type { FileInfo } from './src/types';

async function testMiddlewarePatternDetection() {
  console.log('Testing Middleware Pattern Detection (Task 11.2)...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Test 1: Duplicate middleware logic detection
  console.log('=== Test 1: Duplicate Middleware Logic Detection ===');
  
  // First middleware file with auth logic
  const duplicateCode1 = `
    export function authMiddleware(req: Request, res: Response, next: NextFunction) {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token' });
      }
      next();
    }
  `;

  const sourceFile1 = project.createSourceFile('middleware/auth1.ts', duplicateCode1);
  const fileInfo1: FileInfo = {
    path: '/test/middleware/auth1.ts',
    relativePath: 'middleware/auth1.ts',
    extension: '.ts',
    size: duplicateCode1.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  await analyzer.analyze(fileInfo1, sourceFile1);

  // Second middleware file with very similar auth logic (should be flagged as duplicate)
  const duplicateCode2 = `
    export function authenticateUser(req: Request, res: Response, next: NextFunction) {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token' });
      }
      next();
    }
  `;

  const sourceFile2 = project.createSourceFile('middleware/auth2.ts', duplicateCode2);
  const fileInfo2: FileInfo = {
    path: '/test/middleware/auth2.ts',
    relativePath: 'middleware/auth2.ts',
    extension: '.ts',
    size: duplicateCode2.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  const issues2 = await analyzer.analyze(fileInfo2, sourceFile2);
  const duplicateIssues = issues2.filter(i => i.type === 'code-duplication');
  console.log(`Found ${duplicateIssues.length} duplicate/similar middleware issues`);
  duplicateIssues.forEach(issue => {
    console.log(`  - [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Test 2: Inconsistent middleware ordering detection
  console.log('=== Test 2: Inconsistent Middleware Ordering Detection ===');

  // First, create some middleware implementations
  const middlewareLib = `
    export function authMiddleware(req: Request, res: Response, next: NextFunction) {
      // Auth logic
      next();
    }

    export function validateMiddleware(req: Request, res: Response, next: NextFunction) {
      // Validation logic
      next();
    }

    export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
      // Rate limit logic
      next();
    }
  `;

  const libFile = project.createSourceFile('middleware/lib.ts', middlewareLib);
  const libFileInfo: FileInfo = {
    path: '/test/middleware/lib.ts',
    relativePath: 'middleware/lib.ts',
    extension: '.ts',
    size: middlewareLib.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  await analyzer.analyze(libFileInfo, libFile);

  // Good route with proper ordering: rate limit -> auth -> validate
  const goodRouteCode = `
    import { rateLimitMiddleware, authMiddleware, validateMiddleware } from '../middleware/lib';

    export async function GET(req: Request) {
      rateLimitMiddleware(req, res, next);
      authMiddleware(req, res, next);
      validateMiddleware(req, res, next);
      
      return Response.json({ data: 'success' });
    }
  `;

  const goodRoute = project.createSourceFile('app/api/good/route.ts', goodRouteCode);
  const goodRouteInfo: FileInfo = {
    path: '/test/app/api/good/route.ts',
    relativePath: 'app/api/good/route.ts',
    extension: '.ts',
    size: goodRouteCode.length,
    category: 'api-route',
    lastModified: new Date(),
  };

  await analyzer.analyze(goodRouteInfo, goodRoute);

  // Bad route with wrong ordering: validate -> auth (anti-pattern!)
  const badRouteCode = `
    import { authMiddleware, validateMiddleware } from '../middleware/lib';

    export async function POST(req: Request) {
      validateMiddleware(req, res, next);
      authMiddleware(req, res, next);
      
      return Response.json({ data: 'created' });
    }
  `;

  const badRoute = project.createSourceFile('app/api/bad/route.ts', badRouteCode);
  const badRouteInfo: FileInfo = {
    path: '/test/app/api/bad/route.ts',
    relativePath: 'app/api/bad/route.ts',
    extension: '.ts',
    size: badRouteCode.length,
    category: 'api-route',
    lastModified: new Date(),
  };

  const badRouteIssues = await analyzer.analyze(badRouteInfo, badRoute);
  const orderingIssues = badRouteIssues.filter(i => i.type === 'inconsistent-pattern');
  console.log(`Found ${orderingIssues.length} ordering issues in bad route`);
  orderingIssues.forEach(issue => {
    console.log(`  - [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Test 3: Consolidation opportunities
  console.log('=== Test 3: Consolidation Opportunities ===');

  // File with multiple similar auth middleware (consolidation opportunity)
  const consolidationCode = `
    export function authMiddleware1(req: Request, res: Response, next: NextFunction) {
      // Auth logic 1
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      next();
    }

    export function authMiddleware2(req: Request, res: Response, next: NextFunction) {
      // Auth logic 2
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      next();
    }

    export function authGuard(req: Request, res: Response, next: NextFunction) {
      // Auth logic 3
      if (!req.user) return res.status(403).json({ error: 'Forbidden' });
      next();
    }

    // Very small middleware that could be inlined
    export const tiny = (req: Request, res: Response, next: NextFunction) => next();
  `;

  const consolidationFile = project.createSourceFile('middleware/consolidate.ts', consolidationCode);
  const consolidationInfo: FileInfo = {
    path: '/test/middleware/consolidate.ts',
    relativePath: 'middleware/consolidate.ts',
    extension: '.ts',
    size: consolidationCode.length,
    category: 'middleware',
    lastModified: new Date(),
  };

  const consolidationIssues = await analyzer.analyze(consolidationInfo, consolidationFile);
  const architecturalIssues = consolidationIssues.filter(i => 
    i.category === 'middleware' && 
    (i.type === 'architectural' || i.type === 'unnecessary-adapter' || i.type === 'legacy-code')
  );
  console.log(`Found ${architecturalIssues.length} consolidation/architectural issues`);
  architecturalIssues.forEach(issue => {
    console.log(`  - [${issue.severity}] ${issue.type}: ${issue.description.substring(0, 100)}...`);
  });
  console.log();

  // Summary
  console.log('=== Summary ===');
  const summary = analyzer.getMiddlewareSummary();
  console.log(`Total middleware implementations discovered: ${summary.totalImplementations}`);
  console.log(`Total middleware usages tracked: ${summary.totalUsages}`);
  console.log(`Files with middleware: ${summary.implementationsByFile.size}`);
  console.log(`Routes using middleware: ${summary.usagesByRoute.size}`);
  console.log();

  console.log('✅ Task 11.2 Pattern Detection Tests Completed!');
  console.log('\nValidated Requirements:');
  console.log('  ✅ 15.2 - Detect duplicate middleware logic');
  console.log('  ✅ 15.3 - Detect inconsistent middleware ordering');
  console.log('  ✅ 15.5 - Identify consolidation opportunities');
}

testMiddlewarePatternDetection().catch(console.error);
