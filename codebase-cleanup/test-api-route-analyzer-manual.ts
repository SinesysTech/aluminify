/**
 * Manual test for API Route Pattern Analyzer
 * 
 * This test verifies that the analyzer can:
 * 1. Discover Next.js App Router route handlers (GET, POST, etc.)
 * 2. Discover Next.js Pages Router API handlers
 * 3. Categorize routes by pattern
 * 4. Detect route characteristics
 */

import { Project } from 'ts-morph';
import { APIRoutePatternAnalyzer } from './src/analyzers/api-route-pattern-analyzer';
import type { FileInfo } from './src/types';

// Create test files
const testFiles = {
  // Next.js App Router - route.ts
  appRouterRoute: `
    import { NextResponse } from 'next/server';
    
    // GET handler
    export async function GET(request: Request) {
      try {
        const data = await fetchData();
        return NextResponse.json({ data });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
      }
    }
    
    // POST handler
    export async function POST(request: Request) {
      const body = await request.json();
      
      // Validation
      if (!body.name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      
      return NextResponse.json({ success: true });
    }
  `,
  
  // Next.js App Router - dynamic route
  dynamicRoute: `
    import { NextResponse } from 'next/server';
    
    export async function GET(
      request: Request,
      { params }: { params: { id: string } }
    ) {
      const { id } = params;
      return NextResponse.json({ id });
    }
    
    export async function DELETE(
      request: Request,
      { params }: { params: { id: string } }
    ) {
      const { id } = params;
      return NextResponse.json({ deleted: id });
    }
  `,
  
  // Next.js Pages Router - API handler
  pagesRouterAPI: `
    import type { NextApiRequest, NextApiResponse } from 'next';
    
    export default async function handler(
      req: NextApiRequest,
      res: NextApiResponse
    ) {
      if (req.method === 'GET') {
        return res.status(200).json({ message: 'GET request' });
      }
      
      if (req.method === 'POST') {
        const { data } = req.body;
        return res.status(201).json({ data });
      }
      
      return res.status(405).json({ error: 'Method not allowed' });
    }
  `,
  
  // Arrow function route handler
  arrowFunctionRoute: `
    import { NextResponse } from 'next/server';
    
    export const GET = async (request: Request) => {
      return NextResponse.json({ message: 'Hello' });
    };
    
    export const POST = async (request: Request) => {
      const body = await request.json();
      return NextResponse.json({ received: body });
    };
  `,
};

async function runTest() {
  console.log('🧪 Testing API Route Pattern Analyzer\n');
  
  const analyzer = new APIRoutePatternAnalyzer();
  const project = new Project();
  
  // Test 1: App Router route.ts
  console.log('Test 1: App Router route.ts');
  console.log('=' .repeat(50));
  
  const appRouterFile = project.createSourceFile(
    'app/api/users/route.ts',
    testFiles.appRouterRoute,
    { overwrite: true }
  );
  
  const fileInfo1: FileInfo = {
    path: '/project/app/api/users/route.ts',
    relativePath: 'app/api/users/route.ts',
    extension: '.ts',
    size: 1000,
    category: 'api-route',
    lastModified: new Date(),
  };
  
  const issues1 = await analyzer.analyze(fileInfo1, appRouterFile);
  console.log(`Found ${issues1.length} issue(s):`);
  issues1.forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.description}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Tags: ${issue.tags.join(', ')}`);
  });
  
  // Test 2: Dynamic route
  console.log('\n\nTest 2: Dynamic Route [id]/route.ts');
  console.log('=' .repeat(50));
  
  const dynamicRouteFile = project.createSourceFile(
    'app/api/users/[id]/route.ts',
    testFiles.dynamicRoute,
    { overwrite: true }
  );
  
  const fileInfo2: FileInfo = {
    path: '/project/app/api/users/[id]/route.ts',
    relativePath: 'app/api/users/[id]/route.ts',
    extension: '.ts',
    size: 800,
    category: 'api-route',
    lastModified: new Date(),
  };
  
  const issues2 = await analyzer.analyze(fileInfo2, dynamicRouteFile);
  console.log(`Found ${issues2.length} issue(s):`);
  issues2.forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.description}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Tags: ${issue.tags.join(', ')}`);
  });
  
  // Test 3: Pages Router API
  console.log('\n\nTest 3: Pages Router API Handler');
  console.log('=' .repeat(50));
  
  const pagesRouterFile = project.createSourceFile(
    'pages/api/users.ts',
    testFiles.pagesRouterAPI,
    { overwrite: true }
  );
  
  const fileInfo3: FileInfo = {
    path: '/project/pages/api/users.ts',
    relativePath: 'pages/api/users.ts',
    extension: '.ts',
    size: 900,
    category: 'api-route',
    lastModified: new Date(),
  };
  
  const issues3 = await analyzer.analyze(fileInfo3, pagesRouterFile);
  console.log(`Found ${issues3.length} issue(s):`);
  issues3.forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.description}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Tags: ${issue.tags.join(', ')}`);
  });
  
  // Test 4: Arrow function route handlers
  console.log('\n\nTest 4: Arrow Function Route Handlers');
  console.log('=' .repeat(50));
  
  const arrowFunctionFile = project.createSourceFile(
    'app/api/hello/route.ts',
    testFiles.arrowFunctionRoute,
    { overwrite: true }
  );
  
  const fileInfo4: FileInfo = {
    path: '/project/app/api/hello/route.ts',
    relativePath: 'app/api/hello/route.ts',
    extension: '.ts',
    size: 600,
    category: 'api-route',
    lastModified: new Date(),
  };
  
  const issues4 = await analyzer.analyze(fileInfo4, arrowFunctionFile);
  console.log(`Found ${issues4.length} issue(s):`);
  issues4.forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.description}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Tags: ${issue.tags.join(', ')}`);
  });
  
  console.log('\n\n✅ All tests completed!');
  console.log('\nSummary:');
  console.log(`- Test 1 (App Router): ${issues1.length} issue(s)`);
  console.log(`- Test 2 (Dynamic Route): ${issues2.length} issue(s)`);
  console.log(`- Test 3 (Pages Router): ${issues3.length} issue(s)`);
  console.log(`- Test 4 (Arrow Functions): ${issues4.length} issue(s)`);
}

// Run the test
runTest().catch(console.error);
