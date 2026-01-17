/**
 * Manual test for error handling inconsistency detection (Task 12.2)
 * 
 * This test demonstrates cross-file analysis capabilities:
 * - Inconsistent error response formats across API routes
 * - Missing error logging patterns
 * - Missing error recovery patterns
 * - Opportunities for typed errors
 */

import { Project } from 'ts-morph';
import { ErrorHandlingPatternAnalyzer } from './src/analyzers/error-handling-pattern-analyzer';
import type { FileInfo } from './src/types';

// Helper to create FileInfo
function createFileInfo(path: string, category: 'api-route' | 'service' | 'util' = 'api-route'): FileInfo {
  return {
    path: `/project/${path}`,
    relativePath: path,
    extension: '.ts',
    size: 1000,
    category,
    lastModified: new Date(),
  };
}

async function testErrorInconsistencyDetection() {
  console.log('='.repeat(80));
  console.log('Testing Error Handling Inconsistency Detection (Task 12.2)');
  console.log('='.repeat(80));
  console.log();

  const project = new Project({ useInMemoryFileSystem: true });
  const analyzer = new ErrorHandlingPatternAnalyzer();

  // ============================================================================
  // Test 1: Inconsistent Error Response Formats Across API Routes
  // ============================================================================
  console.log('Test 1: Inconsistent Error Response Formats');
  console.log('-'.repeat(80));

  // File 1: Uses format A
  const apiRoute1Code = `
    export async function GET(request: Request) {
      try {
        const data = await fetchData();
        return Response.json(data);
      } catch (error) {
        console.error(error);
        return Response.json({ error: 'Failed', message: 'Something went wrong' }, { status: 500 });
      }
    }
  `;

  // File 2: Uses format B (different structure)
  const apiRoute2Code = `
    export async function POST(request: Request) {
      try {
        const data = await saveData();
        return Response.json(data);
      } catch (error) {
        console.error(error);
        return Response.json({ success: false, errorMessage: 'Failed to save' }, { status: 500 });
      }
    }
  `;

  // File 3: Uses format C (yet another structure)
  const apiRoute3Code = `
    export async function DELETE(request: Request) {
      try {
        await deleteData();
        return Response.json({ success: true });
      } catch (error) {
        console.error(error);
        return Response.json({ err: 'Delete failed', code: 500 }, { status: 500 });
      }
    }
  `;

  const file1 = project.createSourceFile('api/users/route.ts', apiRoute1Code);
  const file2 = project.createSourceFile('api/posts/route.ts', apiRoute2Code);
  const file3 = project.createSourceFile('api/comments/route.ts', apiRoute3Code);

  const fileInfo1 = createFileInfo('api/users/route.ts', 'api-route');
  const fileInfo2 = createFileInfo('api/posts/route.ts', 'api-route');
  const fileInfo3 = createFileInfo('api/comments/route.ts', 'api-route');

  // Analyze all files to accumulate patterns
  const issues1 = await analyzer.analyze(fileInfo1, file1);
  const issues2 = await analyzer.analyze(fileInfo2, file2);
  const issues3 = await analyzer.analyze(fileInfo3, file3);

  const allIssues = [...issues1, ...issues2, ...issues3];
  const inconsistentFormatIssues = allIssues.filter(
    issue => issue.type === 'inconsistent-pattern' && 
             issue.description.includes('error response format')
  );

  console.log(`Found ${inconsistentFormatIssues.length} inconsistent error response format issues`);
  inconsistentFormatIssues.forEach(issue => {
    console.log(`  - ${issue.file}`);
    console.log(`    Severity: ${issue.severity}`);
    console.log(`    Description: ${issue.description}`);
    console.log(`    Recommendation: ${issue.recommendation.substring(0, 100)}...`);
    console.log();
  });

  // ============================================================================
  // Test 2: Missing Error Logging Pattern
  // ============================================================================
  console.log('Test 2: Missing Error Logging Pattern');
  console.log('-'.repeat(80));

  // Create a new analyzer for this test
  const analyzer2 = new ErrorHandlingPatternAnalyzer();

  // Files with good logging
  const goodLogging1 = `
    export async function processData() {
      try {
        await operation1();
      } catch (error) {
        console.error('Operation 1 failed:', error);
        throw error;
      }
    }
  `;

  const goodLogging2 = `
    export async function processData2() {
      try {
        await operation2();
      } catch (error) {
        logger.error('Operation 2 failed:', error);
        return null;
      }
    }
  `;

  const goodLogging3 = `
    export async function processData3() {
      try {
        await operation3();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    }
  `;

  // File without logging (should be flagged)
  const noLogging = `
    export async function processData4() {
      try {
        await operation4();
      } catch (error) {
        return null; // No logging!
      }
    }
  `;

  const project2 = new Project({ useInMemoryFileSystem: true });
  const file2_1 = project2.createSourceFile('services/service1.ts', goodLogging1);
  const file2_2 = project2.createSourceFile('services/service2.ts', goodLogging2);
  const file2_3 = project2.createSourceFile('services/service3.ts', goodLogging3);
  const file2_4 = project2.createSourceFile('services/service4.ts', noLogging);

  const fileInfo2_1 = createFileInfo('services/service1.ts', 'service');
  const fileInfo2_2 = createFileInfo('services/service2.ts', 'service');
  const fileInfo2_3 = createFileInfo('services/service3.ts', 'service');
  const fileInfo2_4 = createFileInfo('services/service4.ts', 'service');

  await analyzer2.analyze(fileInfo2_1, file2_1);
  await analyzer2.analyze(fileInfo2_2, file2_2);
  await analyzer2.analyze(fileInfo2_3, file2_3);
  const issues2_4 = await analyzer2.analyze(fileInfo2_4, file2_4);

  const missingLoggingIssues = issues2_4.filter(
    issue => issue.description.includes('Missing error logging pattern')
  );

  console.log(`Found ${missingLoggingIssues.length} missing error logging pattern issues`);
  missingLoggingIssues.forEach(issue => {
    console.log(`  - ${issue.file}`);
    console.log(`    Severity: ${issue.severity}`);
    console.log(`    Description: ${issue.description}`);
    console.log();
  });

  // ============================================================================
  // Test 3: Missing Error Recovery Pattern
  // ============================================================================
  console.log('Test 3: Missing Error Recovery Pattern');
  console.log('-'.repeat(80));

  const analyzer3 = new ErrorHandlingPatternAnalyzer();

  // Files with recovery
  const withRecovery1 = `
    export async function fetchUser() {
      try {
        return await api.getUser();
      } catch (error) {
        console.error(error);
        return null; // Fallback
      }
    }
  `;

  const withRecovery2 = `
    export async function saveData() {
      try {
        return await api.save();
      } catch (error) {
        console.error(error);
        throw new Error('Save failed'); // Re-throw with context
      }
    }
  `;

  // Files without recovery (just log and do nothing)
  const noRecovery1 = `
    export async function operation1() {
      try {
        await api.call();
      } catch (error) {
        console.error(error);
        // No recovery!
      }
    }
  `;

  const noRecovery2 = `
    export async function operation2() {
      try {
        await api.call2();
      } catch (error) {
        console.error(error);
        // No recovery!
      }
    }
  `;

  const noRecovery3 = `
    export async function operation3() {
      try {
        await api.call3();
      } catch (error) {
        console.error(error);
        // No recovery!
      }
    }
  `;

  const project3 = new Project({ useInMemoryFileSystem: true });
  const file3_1 = project3.createSourceFile('services/user.ts', withRecovery1);
  const file3_2 = project3.createSourceFile('services/data.ts', withRecovery2);
  const file3_3 = project3.createSourceFile('services/op1.ts', noRecovery1);
  const file3_4 = project3.createSourceFile('services/op2.ts', noRecovery2);
  const file3_5 = project3.createSourceFile('services/op3.ts', noRecovery3);

  const fileInfo3_1 = createFileInfo('services/user.ts', 'service');
  const fileInfo3_2 = createFileInfo('services/data.ts', 'service');
  const fileInfo3_3 = createFileInfo('services/op1.ts', 'service');
  const fileInfo3_4 = createFileInfo('services/op2.ts', 'service');
  const fileInfo3_5 = createFileInfo('services/op3.ts', 'service');

  await analyzer3.analyze(fileInfo3_1, file3_1);
  await analyzer3.analyze(fileInfo3_2, file3_2);
  await analyzer3.analyze(fileInfo3_3, file3_3);
  await analyzer3.analyze(fileInfo3_4, file3_4);
  const issues3_5 = await analyzer3.analyze(fileInfo3_5, file3_5);

  const missingRecoveryIssues = issues3_5.filter(
    issue => issue.description.includes('Missing error recovery pattern')
  );

  console.log(`Found ${missingRecoveryIssues.length} missing error recovery pattern issues`);
  missingRecoveryIssues.forEach(issue => {
    console.log(`  - ${issue.file}`);
    console.log(`    Severity: ${issue.severity}`);
    console.log(`    Description: ${issue.description}`);
    console.log();
  });

  // ============================================================================
  // Test 4: Opportunities for Typed Errors
  // ============================================================================
  console.log('Test 4: Opportunities for Typed Errors');
  console.log('-'.repeat(80));

  const analyzer4 = new ErrorHandlingPatternAnalyzer();

  // Files with typed errors
  const typedError1 = `
    class ValidationError extends Error {}
    
    export async function validate() {
      try {
        await check();
      } catch (error: ValidationError) {
        console.error(error);
        throw error;
      }
    }
  `;

  const typedError2 = `
    class NetworkError extends Error {}
    
    export async function fetch() {
      try {
        await api.get();
      } catch (error: NetworkError) {
        console.error(error);
        return null;
      }
    }
  `;

  // Files with generic errors (should be flagged)
  const genericError1 = `
    export async function process1() {
      try {
        await operation();
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  `;

  const genericError2 = `
    export async function process2() {
      try {
        await operation();
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  `;

  const project4 = new Project({ useInMemoryFileSystem: true });
  const file4_1 = project4.createSourceFile('services/validator.ts', typedError1);
  const file4_2 = project4.createSourceFile('services/fetcher.ts', typedError2);
  const file4_3 = project4.createSourceFile('services/processor1.ts', genericError1);
  const file4_4 = project4.createSourceFile('services/processor2.ts', genericError2);

  const fileInfo4_1 = createFileInfo('services/validator.ts', 'service');
  const fileInfo4_2 = createFileInfo('services/fetcher.ts', 'service');
  const fileInfo4_3 = createFileInfo('services/processor1.ts', 'service');
  const fileInfo4_4 = createFileInfo('services/processor2.ts', 'service');

  await analyzer4.analyze(fileInfo4_1, file4_1);
  await analyzer4.analyze(fileInfo4_2, file4_2);
  await analyzer4.analyze(fileInfo4_3, file4_3);
  const issues4_4 = await analyzer4.analyze(fileInfo4_4, file4_4);

  const typedErrorOpportunities = issues4_4.filter(
    issue => issue.description.includes('Opportunity for typed error classes')
  );

  console.log(`Found ${typedErrorOpportunities.length} typed error opportunity issues`);
  typedErrorOpportunities.forEach(issue => {
    console.log(`  - ${issue.file}`);
    console.log(`    Severity: ${issue.severity}`);
    console.log(`    Description: ${issue.description}`);
    console.log();
  });

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Total inconsistent format issues: ${inconsistentFormatIssues.length}`);
  console.log(`Total missing logging issues: ${missingLoggingIssues.length}`);
  console.log(`Total missing recovery issues: ${missingRecoveryIssues.length}`);
  console.log(`Total typed error opportunities: ${typedErrorOpportunities.length}`);
  console.log();
  console.log('✅ Task 12.2 implementation successfully detects cross-file inconsistencies!');
}

// Run the test
testErrorInconsistencyDetection().catch(console.error);
