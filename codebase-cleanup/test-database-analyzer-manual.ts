/**
 * Manual test script for DatabasePatternAnalyzer
 * Run with: node --loader ts-node/esm test-database-analyzer-manual.ts
 */

import { Project } from 'ts-morph';
import { DatabasePatternAnalyzer } from './src/analyzers/database-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

async function testDatabasePatternAnalyzer() {
  console.log('=== Testing DatabasePatternAnalyzer ===\n');

  const analyzer = new DatabasePatternAnalyzer();
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  console.log('Analyzer name:', analyzer.name);
  console.log('Supported file types:', analyzer.getSupportedFileTypes().join(', '));
  console.log();

  // Test 1: Single client pattern
  console.log('Test 1: Single client pattern (should not create issues)');
  const code1 = `
    import { createClient } from '@supabase/supabase-js';
    const supabase = createClient(url, key);
  `;
  const ast1 = project.createSourceFile('test1.ts', code1, { overwrite: true });
  const fileInfo1: FileInfo = {
    path: '/test/test1.ts',
    relativePath: 'test1.ts',
    extension: '.ts',
    size: 1000,
    category: 'service',
    lastModified: new Date(),
  };
  const issues1 = await analyzer.analyze(fileInfo1, ast1);
  console.log(`  Issues found: ${issues1.length}`);
  console.log();

  // Test 2: Multiple different patterns (should create issues)
  console.log('Test 2: Multiple different patterns (should detect inconsistency)');
  const code2 = `
    const client1 = createClient(url, key);
    const client2 = getSupabaseClient();
    const client3 = initSupabase();
  `;
  const ast2 = project.createSourceFile('test2.ts', code2, { overwrite: true });
  const fileInfo2: FileInfo = {
    path: '/test/test2.ts',
    relativePath: 'test2.ts',
    extension: '.ts',
    size: 1000,
    category: 'service',
    lastModified: new Date(),
  };
  const issues2 = await analyzer.analyze(fileInfo2, ast2);
  console.log(`  Issues found: ${issues2.length}`);
  if (issues2.length > 0) {
    issues2.forEach((issue, index) => {
      console.log(`  Issue ${index + 1}:`);
      console.log(`    Type: ${issue.type}`);
      console.log(`    Severity: ${issue.severity}`);
      console.log(`    Category: ${issue.category}`);
      console.log(`    Description: ${issue.description}`);
      console.log(`    Recommendation: ${issue.recommendation.substring(0, 100)}...`);
      console.log(`    Tags: ${issue.tags.join(', ')}`);
    });
  }
  console.log();

  // Test 3: Supabase operations
  console.log('Test 3: Supabase database operations');
  const code3 = `
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (error) throw error;
  `;
  const ast3 = project.createSourceFile('test3.ts', code3, { overwrite: true });
  const fileInfo3: FileInfo = {
    path: '/test/test3.ts',
    relativePath: 'test3.ts',
    extension: '.ts',
    size: 1000,
    category: 'service',
    lastModified: new Date(),
  };
  const issues3 = await analyzer.analyze(fileInfo3, ast3);
  console.log(`  Issues found: ${issues3.length}`);
  console.log();

  // Test 4: Server client pattern
  console.log('Test 4: Server client pattern');
  const code4 = `
    import { createServerClient } from '@supabase/ssr';
    const supabase = createServerClient(url, key, { cookies });
  `;
  const ast4 = project.createSourceFile('test4.ts', code4, { overwrite: true });
  const fileInfo4: FileInfo = {
    path: '/test/test4.ts',
    relativePath: 'test4.ts',
    extension: '.ts',
    size: 1000,
    category: 'service',
    lastModified: new Date(),
  };
  const issues4 = await analyzer.analyze(fileInfo4, ast4);
  console.log(`  Issues found: ${issues4.length}`);
  console.log();

  // Test 5: No database code
  console.log('Test 5: File with no database code');
  const code5 = `
    function calculateTotal(items: any[]): number {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `;
  const ast5 = project.createSourceFile('test5.ts', code5, { overwrite: true });
  const fileInfo5: FileInfo = {
    path: '/test/test5.ts',
    relativePath: 'test5.ts',
    extension: '.ts',
    size: 1000,
    category: 'util',
    lastModified: new Date(),
  };
  const issues5 = await analyzer.analyze(fileInfo5, ast5);
  console.log(`  Issues found: ${issues5.length}`);
  console.log();

  console.log('=== All tests completed ===');
}

testDatabasePatternAnalyzer().catch(console.error);
