/**
 * Test for small middleware detection
 */

import { Project } from 'ts-morph';
import { MiddlewarePatternAnalyzer } from './src/analyzers/middleware-pattern-analyzer';

async function testSmallMiddleware() {
  console.log('Testing Small Middleware Detection...\n');

  const analyzer = new MiddlewarePatternAnalyzer();
  const project = new Project();

  // Create file with very small middleware
  const smallMiddlewareCode = `
    // Very small middleware - should be flagged for inlining
    export const passthrough = (req: Request, res: Response, next: NextFunction) => next();
    
    // Another small one
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

  console.log('Small middleware file analysis:');
  console.log(`  Total issues: ${issues.length}`);
  
  const inlineIssues = issues.filter(i => 
    i.description.includes('very small') || i.description.includes('inlin')
  );
  
  console.log(`  Inline candidate issues: ${inlineIssues.length}`);
  inlineIssues.forEach(issue => {
    console.log(`    - [${issue.severity}] ${issue.description}`);
  });
  
  if (inlineIssues.length === 0) {
    console.log('\n  Checking why no inline issues were found:');
    
    // Check each issue type
    const issueTypes = new Map<string, number>();
    issues.forEach(i => {
      issueTypes.set(i.type, (issueTypes.get(i.type) || 0) + 1);
    });
    
    console.log('  Issue types found:');
    issueTypes.forEach((count, type) => {
      console.log(`    - ${type}: ${count}`);
    });
    
    // Check if middleware were detected
    const summary = analyzer.getMiddlewareSummary();
    console.log(`\n  Middleware implementations found: ${summary.totalImplementations}`);
    console.log(`  Middleware usages found: ${summary.totalUsages}`);
    
    console.log('\n  Note: Small middleware detection only triggers for:');
    console.log('    1. Middleware < 150 characters');
    console.log('    2. Exported middleware');
    console.log('    3. Used in 2 or fewer places');
  }
}

testSmallMiddleware().catch(console.error);
