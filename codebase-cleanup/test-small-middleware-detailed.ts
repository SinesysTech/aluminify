/**
 * Detailed test for small middleware detection
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';

async function testSmallMiddlewareDetailed() {
  console.log('Testing Small Middleware Detection (Detailed)...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Create file with very small middleware
  const smallMiddlewareCode = `
    export const passthrough = (req: Request, res: Response, next: NextFunction) => next();
    export const noop = (req: any, res: any, next: any) => next();
  `;

  const smallFile = project.createSourceFile('middleware/small.ts', smallMiddlewareCode);
  const issues = await analyzer.analyze({
    path: '/test/middleware/small.ts',
    relativePath: 'middleware/small.ts',
    extension: '.ts',
    size: smallMiddlewareCode.length,
    category: 'middleware',
    lastModified: new Date(),
  }, smallFile);

  console.log('All issues found:');
  issues.forEach((issue, idx) => {
    console.log(`\n${idx + 1}. [${issue.severity}] ${issue.type}`);
    console.log(`   ${issue.description.substring(0, 150)}...`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('Looking for unused/legacy-code issues:');
  const unusedIssues = issues.filter(i => i.type === 'legacy-code');
  console.log(`Found ${unusedIssues.length} legacy-code issues`);
  unusedIssues.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('Looking for unnecessary-adapter issues:');
  const adapterIssues = issues.filter(i => i.type === 'unnecessary-adapter');
  console.log(`Found ${adapterIssues.length} unnecessary-adapter issues`);
  adapterIssues.forEach(issue => {
    console.log(`  - ${issue.description.substring(0, 150)}...`);
  });
}

testSmallMiddlewareDetailed().catch(console.error);
