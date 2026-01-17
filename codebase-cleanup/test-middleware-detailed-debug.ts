/**
 * Detailed debug test to trace middleware usage extraction
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';
import type { FileInfo } from './src/types';

// Extend the analyzer to expose internal state for debugging
class DebugMiddlewareAnalyzer extends MiddlewarePatternAnalyzer {
  public getMiddlewareUsages() {
    return (this as any).middlewareUsages;
  }
}

async function detailedDebug() {
  console.log('Detailed Middleware Usage Debug...\n');

  const analyzer = new DebugMiddlewareAnalyzer();
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
  await analyzer.analyze({
    path: '/test/middleware/auth.ts',
    relativePath: 'middleware/auth.ts',
    extension: '.ts',
    size: middlewareLib.length,
    category: 'middleware',
    lastModified: new Date(),
  }, libFile);

  console.log('After analyzing middleware library:');
  console.log('Usages:', analyzer.getMiddlewareUsages());
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
  
  console.log('Analyzing route file...');
  const routeIssues = await analyzer.analyze({
    path: '/test/app/api/test/route.ts',
    relativePath: 'app/api/test/route.ts',
    extension: '.ts',
    size: routeCode.length,
    category: 'api-route',
    lastModified: new Date(),
  }, routeFile);

  console.log('\nAfter analyzing route:');
  const usages = analyzer.getMiddlewareUsages();
  console.log(`Total usages tracked: ${usages.length}`);
  usages.forEach((usage: any, idx: number) => {
    console.log(`  Usage ${idx + 1}:`);
    console.log(`    Middleware name: "${usage.middlewareName}"`);
    console.log(`    Route file: ${usage.routeFile}`);
    console.log(`    Order: ${usage.order}`);
  });
  console.log();

  console.log('Route issues found:');
  if (routeIssues.length === 0) {
    console.log('  ⚠️  No issues found!');
    console.log('\nLet me check what the ordering detection sees:');
    
    const routeUsages = usages.filter((u: any) => u.routeFile === 'app/api/test/route.ts');
    console.log(`  Usages for this route: ${routeUsages.length}`);
    
    if (routeUsages.length > 0) {
      const order = routeUsages
        .sort((a: any, b: any) => a.order - b.order)
        .map((u: any) => u.middlewareName.toLowerCase());
      
      console.log(`  Order array: [${order.join(', ')}]`);
      
      const authIndex = order.findIndex((name: string) => 
        name.includes('auth') || name.includes('authenticate')
      );
      const authorizeIndex = order.findIndex((name: string) => 
        name.includes('authorize') || name.includes('permission')
      );
      
      console.log(`  Auth index: ${authIndex} (looking for 'auth' or 'authenticate')`);
      console.log(`  Authorize index: ${authorizeIndex} (looking for 'authorize' or 'permission')`);
      console.log(`  Should trigger anti-pattern: ${authIndex > authorizeIndex && authIndex >= 0 && authorizeIndex >= 0}`);
    }
  } else {
    routeIssues.forEach(issue => {
      console.log(`  - [${issue.severity}] ${issue.description}`);
    });
  }
}

detailedDebug().catch(console.error);
