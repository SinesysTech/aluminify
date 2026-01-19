/**
 * Debug test to understand middleware usage tracking
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';

async function debugMiddlewareTracking() {
  console.log('Debugging Middleware Usage Tracking...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Create middleware library
  const middlewareLib = `
    export function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
      console.log('Authenticating...');
      next();
    }

    export function authorizeMiddleware(req: Request, res: Response, next: NextFunction) {
      console.log('Authorizing...');
      next();
    }
  `;

  const libFile = project.createSourceFile('middleware/auth.ts', middlewareLib);
  const libIssues = await analyzer.analyze({
    path: '/test/middleware/auth.ts',
    relativePath: 'middleware/auth.ts',
    extension: '.ts',
    size: middlewareLib.length,
    category: 'middleware',
    lastModified: new Date(),
  }, libFile);

  console.log('Middleware library analysis:');
  console.log(`  Found ${libIssues.length} issues`);
  libIssues.forEach(i => console.log(`    - ${i.description.substring(0, 80)}`));
  console.log();

  // Create route with wrong order
  const routeCode = `
    import { authenticateMiddleware, authorizeMiddleware } from '../middleware/auth';

    export async function GET(req: Request) {
      // Wrong order: authorize before authenticate
      authorizeMiddleware(req, res, next);
      authenticateMiddleware(req, res, next);
      
      return Response.json({ data: 'success' });
    }
  `;

  const routeFile = project.createSourceFile('app/api/test/route.ts', routeCode);
  const routeIssues = await analyzer.analyze({
    path: '/test/app/api/test/route.ts',
    relativePath: 'app/api/test/route.ts',
    extension: '.ts',
    size: routeCode.length,
    category: 'api-route',
    lastModified: new Date(),
  }, routeFile);

  console.log('Route analysis:');
  console.log(`  Found ${routeIssues.length} issues`);
  routeIssues.forEach(i => {
    console.log(`    - [${i.severity}] ${i.type}: ${i.description.substring(0, 100)}`);
  });
  console.log();

  // Get summary to see what was tracked
  const summary = analyzer.getMiddlewareSummary();
  console.log('Summary:');
  console.log(`  Total implementations: ${summary.totalImplementations}`);
  console.log(`  Total usages: ${summary.totalUsages}`);
  console.log(`  Implementation files: ${Array.from(summary.implementationsByFile.keys()).join(', ')}`);
  console.log(`  Usage routes: ${Array.from(summary.usagesByRoute.keys()).join(', ')}`);
  console.log();

  // Check if usages were tracked
  if (summary.totalUsages === 0) {
    console.log('⚠️  No middleware usages were tracked!');
    console.log('This explains why ordering anti-patterns are not detected.');
    console.log('The trackMiddlewareUsage method may need adjustment.');
  } else {
    console.log('✅ Middleware usages were tracked successfully.');
  }
}

debugMiddlewareTracking().catch(console.error);
