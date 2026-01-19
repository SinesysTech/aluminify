/**
 * Proper test for rate limiting detection with actual middleware
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';

async function testRateLimitProper() {
  console.log('Testing Rate Limit Detection with Proper Middleware...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Create middleware with proper names
  const middlewareLib = `
    export function authMiddleware(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function validateMiddleware(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
      next();
    }
  `;

  const libFile = project.createSourceFile('middleware/lib.ts', middlewareLib);
  await analyzer.analyze({
    path: '/test/middleware/lib.ts',
    relativePath: 'middleware/lib.ts',
    extension: '.ts',
    size: middlewareLib.length,
    category: 'middleware',
    lastModified: new Date(),
  }, libFile);

  // Create route with rate limit at the end (WRONG!)
  const badRouteCode = `
    import { authMiddleware, validateMiddleware, loggerMiddleware, rateLimitMiddleware } from '../middleware/lib';

    export async function POST(req: Request) {
      authMiddleware(req, res, next);
      validateMiddleware(req, res, next);
      loggerMiddleware(req, res, next);
      rateLimitMiddleware(req, res, next);  // Position 3 - should trigger warning!
      
      return Response.json({ data: 'created' });
    }
  `;

  const badRouteFile = project.createSourceFile('app/api/bad/route.ts', badRouteCode);
  const badRouteIssues = await analyzer.analyze({
    path: '/test/app/api/bad/route.ts',
    relativePath: 'app/api/bad/route.ts',
    extension: '.ts',
    size: badRouteCode.length,
    category: 'api-route',
    lastModified: new Date(),
  }, badRouteFile);

  console.log('Bad Route (rate limit at position 3):');
  const rateLimitIssues = badRouteIssues.filter(i => 
    i.description.toLowerCase().includes('rate limit')
  );
  if (rateLimitIssues.length > 0) {
    console.log(`  ✅ Found ${rateLimitIssues.length} rate limiting issue(s):`);
    rateLimitIssues.forEach(issue => {
      console.log(`    - [${issue.severity}] ${issue.description}`);
    });
  } else {
    console.log('  ⚠️  No rate limiting issues detected');
  }
  console.log();

  // Create good route with rate limit first
  const goodRouteCode = `
    import { rateLimitMiddleware, authMiddleware, validateMiddleware, loggerMiddleware } from '../middleware/lib';

    export async function GET(req: Request) {
      rateLimitMiddleware(req, res, next);  // Position 0 - correct!
      authMiddleware(req, res, next);
      validateMiddleware(req, res, next);
      loggerMiddleware(req, res, next);
      
      return Response.json({ data: 'success' });
    }
  `;

  const goodRouteFile = project.createSourceFile('app/api/good/route.ts', goodRouteCode);
  const goodRouteIssues = await analyzer.analyze({
    path: '/test/app/api/good/route.ts',
    relativePath: 'app/api/good/route.ts',
    extension: '.ts',
    size: goodRouteCode.length,
    category: 'api-route',
    lastModified: new Date(),
  }, goodRouteFile);

  console.log('Good Route (rate limit at position 0):');
  const goodRateLimitIssues = goodRouteIssues.filter(i => 
    i.description.toLowerCase().includes('rate limit')
  );
  if (goodRateLimitIssues.length > 0) {
    console.log(`  Found ${goodRateLimitIssues.length} rate limiting issue(s) (unexpected!):`);
    goodRateLimitIssues.forEach(issue => {
      console.log(`    - [${issue.severity}] ${issue.description}`);
    });
  } else {
    console.log('  ✅ No rate limiting issues (correct!)');
  }
  console.log();

  console.log('Summary:');
  const summary = analyzer.getMiddlewareSummary();
  console.log(`  Total usages: ${summary.totalUsages}`);
  console.log(`  Routes: ${Array.from(summary.usagesByRoute.keys()).join(', ')}`);
}

testRateLimitProper().catch(console.error);
