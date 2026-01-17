/**
 * Manual test for database inconsistency detection (Task 6.2)
 */

import { Project } from 'ts-morph';
import { DatabasePatternAnalyzer } from './src/analyzers/database-pattern-analyzer';
import type { FileInfo } from './src/types';

const analyzer = new DatabasePatternAnalyzer();
const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    target: 99, // ESNext
    module: 99, // ESNext
  },
});

const createFileInfo = (relativePath: string, category: 'service' | 'api-route' | 'component' = 'service'): FileInfo => ({
  path: `/test/${relativePath}`,
  relativePath,
  extension: '.ts',
  size: 1000,
  category,
  lastModified: new Date(),
});

async function testMissingErrorHandling() {
  console.log('\n=== Test 1: Missing Error Handling ===');
  
  const code = `
    const { data } = await supabase
      .from('users')
      .select('*');
    
    return data;
  `;

  const ast = project.createSourceFile('test1.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const errorHandlingIssues = issues.filter(i => i.type === 'missing-error-handling');
  console.log(`Found ${errorHandlingIssues.length} missing error handling issues`);
  if (errorHandlingIssues.length > 0) {
    console.log('✓ PASS: Detected missing error handling');
    console.log(`  - ${errorHandlingIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect missing error handling');
  }
}

async function testProperErrorHandling() {
  console.log('\n=== Test 2: Proper Error Handling (Should Not Flag) ===');
  
  const code = `
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return data;
  `;

  const ast = project.createSourceFile('test2.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const errorHandlingIssues = issues.filter(i => i.type === 'missing-error-handling');
  console.log(`Found ${errorHandlingIssues.length} missing error handling issues`);
  if (errorHandlingIssues.length === 0) {
    console.log('✓ PASS: Did not flag proper error handling');
  } else {
    console.log('✗ FAIL: Should not flag proper error handling');
  }
}

async function testInconsistentErrorHandling() {
  console.log('\n=== Test 3: Inconsistent Error Handling ===');
  
  const code = `
    // Operation 1: Has error handling
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;
    
    // Operation 2: No error handling
    const { data: posts } = await supabase
      .from('posts')
      .select('*');
    
    // Operation 3: No error handling
    const { data: comments } = await supabase
      .from('comments')
      .select('*');
  `;

  const ast = project.createSourceFile('test3.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/data.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const inconsistentIssues = issues.filter(
    i => i.type === 'inconsistent-pattern' && i.description.includes('Inconsistent error handling')
  );
  console.log(`Found ${inconsistentIssues.length} inconsistent error handling issues`);
  if (inconsistentIssues.length > 0) {
    console.log('✓ PASS: Detected inconsistent error handling');
    console.log(`  - ${inconsistentIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect inconsistent error handling');
  }
}

async function testAnyTypeUsage() {
  console.log('\n=== Test 4: Any Type Usage ===');
  
  const code = `
    const users: any = await supabase
      .from('users')
      .select('*');
  `;

  const ast = project.createSourceFile('test4.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const typeSafetyIssues = issues.filter(i => i.type === 'type-safety');
  console.log(`Found ${typeSafetyIssues.length} type safety issues`);
  if (typeSafetyIssues.length > 0) {
    console.log('✓ PASS: Detected any type usage');
    console.log(`  - ${typeSafetyIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect any type usage');
  }
}

async function testManualTypeConflict() {
  console.log('\n=== Test 5: Manual Type Conflict with Supabase Types ===');
  
  const code = `
    import { Database } from './database.types';
    
    type User = {
      id: string;
      name: string;
    };
    
    const getUser = async (id: string): Promise<User> => {
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      return data;
    };
  `;

  const ast = project.createSourceFile('test5.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const conflictingTypeIssues = issues.filter(
    i => i.description.includes('may conflict with Supabase generated types')
  );
  console.log(`Found ${conflictingTypeIssues.length} type conflict issues`);
  if (conflictingTypeIssues.length > 0) {
    console.log('✓ PASS: Detected manual type conflict');
    console.log(`  - ${conflictingTypeIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect manual type conflict');
  }
}

async function testDirectDatabaseAccessInComponent() {
  console.log('\n=== Test 6: Direct Database Access in Component ===');
  
  const code = `
    export default function UserProfile() {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      return <div>{user.name}</div>;
    }
  `;

  const ast = project.createSourceFile('test6.tsx', code, { overwrite: true });
  const fileInfo = createFileInfo('components/UserProfile.tsx', 'component');
  const issues = await analyzer.analyze(fileInfo, ast);

  const architecturalIssues = issues.filter(
    i => i.type === 'architectural' && i.description.includes('Direct database access in component')
  );
  console.log(`Found ${architecturalIssues.length} architectural issues`);
  if (architecturalIssues.length > 0) {
    console.log('✓ PASS: Detected direct database access in component');
    console.log(`  - ${architecturalIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect direct database access in component');
  }
}

async function testSQLInjection() {
  console.log('\n=== Test 7: SQL Injection Vulnerability ===');
  
  const code = `
    const userId = req.query.userId;
    const { data } = await supabase.rpc('get_user_data', {
      query: \`SELECT * FROM users WHERE id = \${userId}\`
    });
  `;

  const ast = project.createSourceFile('test7.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const sqlInjectionIssues = issues.filter(
    i => i.type === 'architectural' && i.description.includes('SQL injection')
  );
  console.log(`Found ${sqlInjectionIssues.length} SQL injection issues`);
  if (sqlInjectionIssues.length > 0) {
    console.log('✓ PASS: Detected SQL injection vulnerability');
    console.log(`  - ${sqlInjectionIssues[0].description}`);
    console.log(`  - Severity: ${sqlInjectionIssues[0].severity}`);
  } else {
    console.log('✗ FAIL: Should detect SQL injection vulnerability');
  }
}

async function testExcessiveDatabaseOperationsInAPIRoute() {
  console.log('\n=== Test 8: Excessive Database Operations in API Route ===');
  
  const code = `
    export async function GET(req: Request) {
      const { data: users } = await supabase.from('users').select('*');
      const { data: posts } = await supabase.from('posts').select('*');
      const { data: comments } = await supabase.from('comments').select('*');
      const { data: likes } = await supabase.from('likes').select('*');
      const { data: follows } = await supabase.from('follows').select('*');
      
      return Response.json({ users, posts, comments, likes, follows });
    }
  `;

  const ast = project.createSourceFile('test8.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('app/api/data/route.ts', 'api-route');
  const issues = await analyzer.analyze(fileInfo, ast);

  const serviceLayerIssues = issues.filter(
    i => i.type === 'architectural' && i.description.includes('service layer')
  );
  console.log(`Found ${serviceLayerIssues.length} service layer issues`);
  if (serviceLayerIssues.length > 0) {
    console.log('✓ PASS: Detected excessive database operations');
    console.log(`  - ${serviceLayerIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect excessive database operations');
  }
}

async function testMultipleClientImports() {
  console.log('\n=== Test 9: Multiple Client Creation Method Imports ===');
  
  const code = `
    import { 
      createClient, 
      createServerClient, 
      createBrowserClient,
      createRouteHandlerClient,
      createMiddlewareClient 
    } from '@supabase/ssr';
    
    const client = createClient(url, key);
  `;

  const ast = project.createSourceFile('test9.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('lib/supabase.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const multipleImportsIssues = issues.filter(
    i => i.type === 'inconsistent-pattern' && i.description.includes('Multiple database client creation methods imported')
  );
  console.log(`Found ${multipleImportsIssues.length} multiple import issues`);
  if (multipleImportsIssues.length > 0) {
    console.log('✓ PASS: Detected multiple client creation method imports');
    console.log(`  - ${multipleImportsIssues[0].description}`);
  } else {
    console.log('✗ FAIL: Should detect multiple client creation method imports');
  }
}

async function testCleanCode() {
  console.log('\n=== Test 10: Clean Code (Should Have No Critical Issues) ===');
  
  const code = `
    import { Database } from './database.types';
    
    type DbUser = Database['public']['Tables']['users']['Row'];
    
    export async function getUsers(): Promise<DbUser[]> {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) throw error;
        
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
  `;

  const ast = project.createSourceFile('test10.ts', code, { overwrite: true });
  const fileInfo = createFileInfo('services/users.ts');
  const issues = await analyzer.analyze(fileInfo, ast);

  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  console.log(`Found ${criticalIssues.length} critical/high severity issues`);
  if (criticalIssues.length === 0) {
    console.log('✓ PASS: No critical issues in clean code');
  } else {
    console.log('✗ FAIL: Should not flag clean code with critical issues');
    criticalIssues.forEach(issue => {
      console.log(`  - ${issue.severity}: ${issue.description}`);
    });
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('DATABASE INCONSISTENCY DETECTION TESTS (Task 6.2)');
  console.log('='.repeat(60));

  await testMissingErrorHandling();
  await testProperErrorHandling();
  await testInconsistentErrorHandling();
  await testAnyTypeUsage();
  await testManualTypeConflict();
  await testDirectDatabaseAccessInComponent();
  await testSQLInjection();
  await testExcessiveDatabaseOperationsInAPIRoute();
  await testMultipleClientImports();
  await testCleanCode();

  console.log('\n' + '='.repeat(60));
  console.log('TESTS COMPLETE');
  console.log('='.repeat(60));
}

runAllTests().catch(console.error);
