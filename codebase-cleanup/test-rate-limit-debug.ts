/**
 * Debug rate limiting detection
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';

interface MiddlewareUsage {
  middlewareName: string;
  routeFile: string;
  order: number;
}

class DebugMiddlewareAnalyzer extends MiddlewarePatternAnalyzer {
  public getMiddlewareUsages(): MiddlewareUsage[] {
    return (this as unknown as { middlewareUsages: MiddlewareUsage[] }).middlewareUsages;
  }
}

async function debugRateLimit() {
  console.log('Debugging Rate Limit Detection...\n');

  const analyzer = new DebugMiddlewareAnalyzer();
  const project = new Project();

  // Create middleware
  const middlewareLib = `
    export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function businessLogic1(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function businessLogic2(req: Request, res: Response, next: NextFunction) {
      next();
    }
    export function businessLogic3(req: Request, res: Response, next: NextFunction) {
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

  // Create route with rate limit at the end
  const routeCode = `
    import { businessLogic1, businessLogic2, businessLogic3, rateLimitMiddleware } from '../middleware/lib';

    export async function POST(req: Request) {
      businessLogic1(req, res, next);
      businessLogic2(req, res, next);
      businessLogic3(req, res, next);
      rateLimitMiddleware(req, res, next);
      
      return Response.json({ data: 'created' });
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

  console.log('Usages tracked:');
  const usages = analyzer.getMiddlewareUsages();
  usages.forEach((u: MiddlewareUsage) => {
    console.log(`  ${u.order}: ${u.middlewareName}`);
  });
  console.log();

  const routeUsages = usages.filter((u: MiddlewareUsage) => u.routeFile === 'app/api/test/route.ts');
  const order = routeUsages
    .sort((a: MiddlewareUsage, b: MiddlewareUsage) => a.order - b.order)
    .map((u: MiddlewareUsage) => u.middlewareName.toLowerCase());
  
  console.log(`Order array: [${order.join(', ')}]`);
  
  const rateLimitIndex = order.findIndex((name: string) => 
    name.includes('ratelimit') || name.includes('rate-limit') || name.includes('throttle')
  );
  
  console.log(`Rate limit index: ${rateLimitIndex}`);
  console.log(`Should trigger (index > 2): ${rateLimitIndex > 2}`);
  console.log();

  console.log('Issues found:');
  if (routeIssues.length === 0) {
    console.log('  ⚠️  No issues!');
  } else {
    routeIssues.forEach(issue => {
      console.log(`  - [${issue.severity}] ${issue.description.substring(0, 100)}`);
    });
  }
}

debugRateLimit().catch(console.error);
