/**
 * Manual test for database adapter detection (Task 6.3)
 * Run with: node --loader ts-node/esm test-adapter-detection.ts
 */

import { Project } from 'ts-morph';
import { DatabasePatternAnalyzer } from './src/analyzers/database-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

const analyzer = new DatabasePatternAnalyzer();
const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    target: 99, // ESNext
    module: 99, // ESNext
  },
});

const createFileInfo = (relativePath: string): FileInfo => ({
  path: `/test/${relativePath}`,
  relativePath,
  extension: '.ts',
  size: 1000,
  category: 'service',
  lastModified: new Date(),
});

async function testAdapterDetection() {
  console.log('=== Testing Database Adapter Detection (Task 6.3) ===\n');

  // Test 1: Simple pass-through wrapper
  console.log('Test 1: Simple pass-through wrapper');
  const code1 = `
    async function getUser(id: string) {
      return supabase.from('users').select().eq('id', id).single();
    }
  `;
  const ast1 = project.createSourceFile('test1.ts', code1, { overwrite: true });
  const issues1 = await analyzer.analyze(createFileInfo('services/users.ts'), ast1);
  const adapterIssues1 = issues1.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues1.length} adapter issue(s)`);
  if (adapterIssues1.length > 0) {
    console.log(`  ✓ PASS: Detected unnecessary adapter`);
    console.log(`  Description: ${adapterIssues1[0].description}`);
  } else {
    console.log(`  ✗ FAIL: Should have detected unnecessary adapter`);
  }
  console.log();

  // Test 2: Arrow function pass-through
  console.log('Test 2: Arrow function pass-through');
  const code2 = `
    const getUsers = async () => {
      return supabase.from('users').select('*');
    };
  `;
  const ast2 = project.createSourceFile('test2.ts', code2, { overwrite: true });
  const issues2 = await analyzer.analyze(createFileInfo('services/users.ts'), ast2);
  const adapterIssues2 = issues2.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues2.length} adapter issue(s)`);
  if (adapterIssues2.length > 0) {
    console.log(`  ✓ PASS: Detected unnecessary adapter`);
  } else {
    console.log(`  ✗ FAIL: Should have detected unnecessary adapter`);
  }
  console.log();

  // Test 3: Function with error handling (should NOT flag)
  console.log('Test 3: Function with error handling (should NOT flag)');
  const code3 = `
    async function getUser(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
      }
      
      return data;
    }
  `;
  const ast3 = project.createSourceFile('test3.ts', code3, { overwrite: true });
  const issues3 = await analyzer.analyze(createFileInfo('services/users.ts'), ast3);
  const adapterIssues3 = issues3.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues3.length} adapter issue(s)`);
  if (adapterIssues3.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag function with error handling`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged function with error handling`);
  }
  console.log();

  // Test 4: Function with try-catch (should NOT flag)
  console.log('Test 4: Function with try-catch (should NOT flag)');
  const code4 = `
    async function getUsers() {
      try {
        return await supabase.from('users').select('*');
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  `;
  const ast4 = project.createSourceFile('test4.ts', code4, { overwrite: true });
  const issues4 = await analyzer.analyze(createFileInfo('services/users.ts'), ast4);
  const adapterIssues4 = issues4.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues4.length} adapter issue(s)`);
  if (adapterIssues4.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag function with try-catch`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged function with try-catch`);
  }
  console.log();

  // Test 5: Function with validation (should NOT flag)
  console.log('Test 5: Function with validation (should NOT flag)');
  const code5 = `
    async function getUser(id: string) {
      if (!id) {
        throw new Error('User ID is required');
      }
      
      return supabase.from('users').select().eq('id', id).single();
    }
  `;
  const ast5 = project.createSourceFile('test5.ts', code5, { overwrite: true });
  const issues5 = await analyzer.analyze(createFileInfo('services/users.ts'), ast5);
  const adapterIssues5 = issues5.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues5.length} adapter issue(s)`);
  if (adapterIssues5.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag function with validation`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged function with validation`);
  }
  console.log();

  // Test 6: Function with data transformation (should NOT flag)
  console.log('Test 6: Function with data transformation (should NOT flag)');
  const code6 = `
    async function getUsers() {
      const { data } = await supabase.from('users').select('*');
      return data?.map(user => ({
        ...user,
        fullName: \`\${user.firstName} \${user.lastName}\`
      }));
    }
  `;
  const ast6 = project.createSourceFile('test6.ts', code6, { overwrite: true });
  const issues6 = await analyzer.analyze(createFileInfo('services/users.ts'), ast6);
  const adapterIssues6 = issues6.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues6.length} adapter issue(s)`);
  if (adapterIssues6.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag function with data transformation`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged function with data transformation`);
  }
  console.log();

  // Test 7: Function with logging (should NOT flag)
  console.log('Test 7: Function with logging (should NOT flag)');
  const code7 = `
    async function getUser(id: string) {
      console.log('Fetching user:', id);
      return supabase.from('users').select().eq('id', id).single();
    }
  `;
  const ast7 = project.createSourceFile('test7.ts', code7, { overwrite: true });
  const issues7 = await analyzer.analyze(createFileInfo('services/users.ts'), ast7);
  const adapterIssues7 = issues7.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues7.length} adapter issue(s)`);
  if (adapterIssues7.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag function with logging`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged function with logging`);
  }
  console.log();

  // Test 8: Pass-through with parameters
  console.log('Test 8: Pass-through with parameters');
  const code8 = `
    async function getUserById(userId: string) {
      return supabase.from('users').select().eq('id', userId);
    }
  `;
  const ast8 = project.createSourceFile('test8.ts', code8, { overwrite: true });
  const issues8 = await analyzer.analyze(createFileInfo('services/users.ts'), ast8);
  const adapterIssues8 = issues8.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues8.length} adapter issue(s)`);
  if (adapterIssues8.length > 0) {
    console.log(`  ✓ PASS: Detected unnecessary adapter with parameters`);
  } else {
    console.log(`  ✗ FAIL: Should have detected unnecessary adapter`);
  }
  console.log();

  // Test 9: Non-database function (should NOT flag)
  console.log('Test 9: Non-database function (should NOT flag)');
  const code9 = `
    function calculateTotal(items: Item[]) {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `;
  const ast9 = project.createSourceFile('test9.ts', code9, { overwrite: true });
  const issues9 = await analyzer.analyze(createFileInfo('utils/math.ts'), ast9);
  const adapterIssues9 = issues9.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues9.length} adapter issue(s)`);
  if (adapterIssues9.length === 0) {
    console.log(`  ✓ PASS: Correctly did not flag non-database function`);
  } else {
    console.log(`  ✗ FAIL: Should not have flagged non-database function`);
  }
  console.log();

  // Test 10: Multiple unnecessary adapters
  console.log('Test 10: Multiple unnecessary adapters in same file');
  const code10 = `
    const getUser = (id: string) => {
      return supabase.from('users').select().eq('id', id);
    };
    
    const getPost = (id: string) => {
      return supabase.from('posts').select().eq('id', id);
    };
    
    const getComment = (id: string) => {
      return supabase.from('comments').select().eq('id', id);
    };
  `;
  const ast10 = project.createSourceFile('test10.ts', code10, { overwrite: true });
  const issues10 = await analyzer.analyze(createFileInfo('services/data.ts'), ast10);
  const adapterIssues10 = issues10.filter(i => i.type === 'unnecessary-adapter');
  console.log(`  Found ${adapterIssues10.length} adapter issue(s)`);
  if (adapterIssues10.length === 3) {
    console.log(`  ✓ PASS: Detected all 3 unnecessary adapters`);
  } else {
    console.log(`  ✗ FAIL: Should have detected 3 unnecessary adapters, found ${adapterIssues10.length}`);
  }
  console.log();

  console.log('=== Test Summary ===');
  console.log('All manual tests completed. Review results above.');
}

testAdapterDetection().catch(console.error);
