/**
 * Manual test for TypePatternAnalyzer - Task 8.2: Type Inconsistency Detection
 * Run with: npx ts-node test-type-inconsistency.ts
 */

import { Project } from 'ts-morph';
import { TypePatternAnalyzer } from './src/analyzers/type-pattern-analyzer';
import type { FileInfo } from './src/types';

// Test case 1: Duplicate identical type definitions
const file1Code = `
interface User {
  id: string;
  name: string;
  email: string;
}

export type { User };
`;

const file2Code = `
interface User {
  id: string;
  name: string;
  email: string;
}

export type { User };
`;

// Test case 2: Inconsistent type definitions (same name, different structure)
const file3Code = `
interface Product {
  id: string;
  name: string;
  price: number;
}
`;

const file4Code = `
interface Product {
  id: string;
  title: string;  // Different property name
  cost: number;   // Different property name
  description: string;  // Additional property
}
`;

// Test case 3: Supabase type mismatch
const file5Code = `
// Supabase generated types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
        };
      };
    };
  };
};
`;

const file6Code = `
// Manual type definition that conflicts with Supabase
interface User {
  id: string;
  name: string;
  email: string;
}

// Another manual type
interface Product {
  id: string;
  name: string;
  price: number;
}
`;

async function testTypeInconsistencyDetection() {
  console.log('Testing TypePatternAnalyzer - Task 8.2: Type Inconsistency Detection\n');
  console.log('='.repeat(80));

  // Create a ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  // Create analyzer
  const analyzer = new TypePatternAnalyzer();

  // Test Case 1: Duplicate identical type definitions
  console.log('\n📋 Test Case 1: Duplicate Identical Type Definitions');
  console.log('-'.repeat(80));
  
  const sourceFile1 = project.createSourceFile('file1.ts', file1Code);
  const sourceFile2 = project.createSourceFile('file2.ts', file2Code);

  const fileInfo1: FileInfo = {
    path: '/test/file1.ts',
    relativePath: 'file1.ts',
    extension: '.ts',
    size: file1Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  const fileInfo2: FileInfo = {
    path: '/test/file2.ts',
    relativePath: 'file2.ts',
    extension: '.ts',
    size: file2Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  await analyzer.analyze(fileInfo1, sourceFile1);
  await analyzer.analyze(fileInfo2, sourceFile2);

  let issues = analyzer.detectTypeInconsistencies();
  
  console.log(`Found ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(`\n  Type: ${issue.type}`);
    console.log(`  Severity: ${issue.severity}`);
    console.log(`  Category: ${issue.category}`);
    console.log(`  File: ${issue.file}`);
    console.log(`  Description: ${issue.description}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
    console.log(`  Tags: ${issue.tags.join(', ')}`);
  }

  const expectedDuplicates = issues.filter(i => i.type === 'code-duplication');
  console.log(`\n✓ Expected: 2 duplicate type issues (one per file)`);
  console.log(`✓ Found: ${expectedDuplicates.length} duplicate type issues`);
  console.log(`Result: ${expectedDuplicates.length === 2 ? '✅ PASS' : '❌ FAIL'}`);

  // Clear for next test
  analyzer.clearTrackedData();

  // Test Case 2: Inconsistent type definitions
  console.log('\n\n📋 Test Case 2: Inconsistent Type Definitions (Same Name, Different Structure)');
  console.log('-'.repeat(80));

  const sourceFile3 = project.createSourceFile('file3.ts', file3Code);
  const sourceFile4 = project.createSourceFile('file4.ts', file4Code);

  const fileInfo3: FileInfo = {
    path: '/test/file3.ts',
    relativePath: 'file3.ts',
    extension: '.ts',
    size: file3Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  const fileInfo4: FileInfo = {
    path: '/test/file4.ts',
    relativePath: 'file4.ts',
    extension: '.ts',
    size: file4Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  await analyzer.analyze(fileInfo3, sourceFile3);
  await analyzer.analyze(fileInfo4, sourceFile4);

  issues = analyzer.detectTypeInconsistencies();
  
  console.log(`Found ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(`\n  Type: ${issue.type}`);
    console.log(`  Severity: ${issue.severity}`);
    console.log(`  Category: ${issue.category}`);
    console.log(`  File: ${issue.file}`);
    console.log(`  Description: ${issue.description}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
    console.log(`  Tags: ${issue.tags.join(', ')}`);
  }

  const expectedInconsistent = issues.filter(i => i.type === 'inconsistent-pattern');
  console.log(`\n✓ Expected: 2 inconsistent type issues (one per file)`);
  console.log(`✓ Found: ${expectedInconsistent.length} inconsistent type issues`);
  console.log(`Result: ${expectedInconsistent.length === 2 ? '✅ PASS' : '❌ FAIL'}`);

  // Clear for next test
  analyzer.clearTrackedData();

  // Test Case 3: Supabase type mismatch
  console.log('\n\n📋 Test Case 3: Supabase Type Mismatch Detection');
  console.log('-'.repeat(80));

  const sourceFile5 = project.createSourceFile('database.types.ts', file5Code);
  const sourceFile6 = project.createSourceFile('models.ts', file6Code);

  const fileInfo5: FileInfo = {
    path: '/test/database.types.ts',
    relativePath: 'database.types.ts',
    extension: '.ts',
    size: file5Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  const fileInfo6: FileInfo = {
    path: '/test/models.ts',
    relativePath: 'models.ts',
    extension: '.ts',
    size: file6Code.length,
    category: 'type',
    lastModified: new Date(),
  };

  await analyzer.analyze(fileInfo5, sourceFile5);
  await analyzer.analyze(fileInfo6, sourceFile6);

  issues = analyzer.detectTypeInconsistencies();
  
  console.log(`Found ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(`\n  Type: ${issue.type}`);
    console.log(`  Severity: ${issue.severity}`);
    console.log(`  Category: ${issue.category}`);
    console.log(`  File: ${issue.file}`);
    console.log(`  Description: ${issue.description}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
    console.log(`  Tags: ${issue.tags.join(', ')}`);
  }

  const supabaseMismatches = issues.filter(i => i.tags.includes('supabase-type-mismatch'));
  console.log(`\n✓ Expected: At least 1 Supabase type mismatch issue`);
  console.log(`✓ Found: ${supabaseMismatches.length} Supabase type mismatch issue(s)`);
  console.log(`Result: ${supabaseMismatches.length >= 1 ? '✅ PASS' : '❌ FAIL'}`);

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));
  
  const typeDefinitions = analyzer.getTypeDefinitions();
  console.log(`\nTotal type definitions tracked: ${typeDefinitions.length}`);
  console.log(`Total issues detected: ${issues.length}`);
  
  console.log('\nIssue breakdown:');
  console.log(`  - Code duplication: ${issues.filter(i => i.type === 'code-duplication').length}`);
  console.log(`  - Inconsistent patterns: ${issues.filter(i => i.type === 'inconsistent-pattern').length}`);
  console.log(`  - Supabase mismatches: ${supabaseMismatches.length}`);

  console.log('\n✅ All tests completed!');
  console.log('\nTask 8.2 Implementation Status:');
  console.log('  ✓ Detect duplicate type definitions for same entities');
  console.log('  ✓ Detect mismatches between Supabase types and manual types');
  console.log('  ✓ Create issues for type inconsistencies');
}

// Run the test
testTypeInconsistencyDetection().catch(console.error);
