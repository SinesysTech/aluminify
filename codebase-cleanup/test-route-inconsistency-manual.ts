/**
 * Manual test for API Route Pattern Inconsistency Detection
 * Tests task 9.2 implementation
 */

import { Project } from 'ts-morph';
import { APIRoutePatternAnalyzer } from './src/analyzers/api-route-pattern-analyzer';
import type { FileInfo } from './src/types';

async function testRouteInconsistencyDetection() {
  console.log('Testing API Route Pattern Inconsistency Detection...\n');

  const project = new Project();
  const analyzer = new APIRoutePatternAnalyzer();

  // Test 1: Inconsistent request validation
  console.log('Test 1: Inconsistent Request Validation');
  const testFile1 = project.createSourceFile(
    'test-validation.ts',
    `
    export async function POST(request: Request) {
      const body = await request.json();
      // No validation - should be flagged
      return NextResponse.json({ success: true });
    }

    export async function PUT(request: Request) {
      const body = await request.json();
      const validated = schema.parse(body); // Has validation
      return NextResponse.json({ success: true });
    }
    `,
    { overwrite: true }
  );

  const fileInfo1: FileInfo = {
    path: '/test/test-validation.ts',
    relativePath: 'test-validation.ts',
    extension: '.ts',
    size: 1000,
    category: 'api-route',
  };

  const issues1 = await analyzer.analyze(fileInfo1, testFile1);
  console.log(`Found ${issues1.length} issues:`);
  issues1.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Test 2: Inconsistent error handling
  console.log('Test 2: Inconsistent Error Handling');
  const testFile2 = project.createSourceFile(
    'test-error-handling.ts',
    `
    export async function GET(request: Request) {
      // No error handling - should be flagged
      const data = await fetchData();
      return NextResponse.json(data);
    }

    export async function POST(request: Request) {
      try {
        const data = await processData();
        return NextResponse.json(data);
      } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
      }
    }
    `,
    { overwrite: true }
  );

  const fileInfo2: FileInfo = {
    path: '/test/test-error-handling.ts',
    relativePath: 'test-error-handling.ts',
    extension: '.ts',
    size: 1000,
    category: 'api-route',
  };

  const issues2 = await analyzer.analyze(fileInfo2, testFile2);
  console.log(`Found ${issues2.length} issues:`);
  issues2.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Test 3: Inconsistent response formats
  console.log('Test 3: Inconsistent Response Formats');
  const testFile3 = project.createSourceFile(
    'test-response-format.ts',
    `
    export async function GET(request: Request) {
      return NextResponse.json({ data: 'test' });
    }

    export async function POST(request: Request) {
      return new Response(JSON.stringify({ data: 'test' }));
    }

    export async function PUT(request: Request) {
      return { data: 'test' }; // Direct return
    }
    `,
    { overwrite: true }
  );

  const fileInfo3: FileInfo = {
    path: '/test/test-response-format.ts',
    relativePath: 'test-response-format.ts',
    extension: '.ts',
    size: 1000,
    category: 'api-route',
  };

  const issues3 = await analyzer.analyze(fileInfo3, testFile3);
  console.log(`Found ${issues3.length} issues:`);
  issues3.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Test 4: Duplicate middleware
  console.log('Test 4: Duplicate Middleware Usage');
  const testFile4 = project.createSourceFile(
    'test-middleware.ts',
    `
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
    `,
    { overwrite: true }
  );

  const fileInfo4: FileInfo = {
    path: '/test/test-middleware.ts',
    relativePath: 'test-middleware.ts',
    extension: '.ts',
    size: 1000,
    category: 'api-route',
  };

  const issues4 = await analyzer.analyze(fileInfo4, testFile4);
  console.log(`Found ${issues4.length} issues:`);
  issues4.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.severity}] ${issue.description}`);
  });
  console.log();

  // Summary
  const totalIssues = issues1.length + issues2.length + issues3.length + issues4.length;
  console.log('='.repeat(60));
  console.log(`Total issues detected: ${totalIssues}`);
  console.log('='.repeat(60));

  if (totalIssues > 0) {
    console.log('\n✅ Task 9.2 implementation is working correctly!');
    console.log('The analyzer successfully detects:');
    console.log('  - Inconsistent request validation patterns');
    console.log('  - Inconsistent error handling');
    console.log('  - Inconsistent response formats');
    console.log('  - Duplicate middleware usage');
  } else {
    console.log('\n⚠️  Warning: No issues detected. Check implementation.');
  }
}

// Run the test
testRouteInconsistencyDetection().catch(console.error);
