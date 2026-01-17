/**
 * Manual test for type safety issue detection (Task 8.3)
 * Tests detection of excessive 'any' usage and unnecessary type assertions
 * Run with: npx ts-node test-type-safety-detection.ts
 */

import { Project } from 'ts-morph';
import { TypePatternAnalyzer } from './src/analyzers/type-pattern-analyzer';
import type { FileInfo } from './src/types';

const analyzer = new TypePatternAnalyzer();

// Create a ts-morph project
const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    target: 99, // ESNext
    module: 99, // ESNext
  },
});

const createFileInfo = (name: string, code: string): FileInfo => ({
  path: `/test/${name}.ts`,
  relativePath: `test/${name}.ts`,
  extension: '.ts',
  size: code.length,
  category: 'other',
  lastModified: new Date(),
});

async function testExcessiveAnyUsage() {
  console.log('\n=== Testing Excessive Any Usage Detection ===\n');

  const code = `
// Test case 1: any in function parameter
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// Test case 2: any in variable declaration
const result: any = fetchData();

// Test case 3: any in return type
function getData(): any {
  return { id: 1, name: 'test' };
}

// Test case 4: any in interface property
interface User {
  id: string;
  metadata: any;
}

// Test case 5: any in type alias
type Config = {
  settings: any;
};
  `;

  const sourceFile = project.createSourceFile('test-any-usage.ts', code);
  const fileInfo = createFileInfo('test-any-usage', code);
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  const anyIssues = issues.filter(i => i.tags.includes('any-type'));
  
  console.log(`Found ${anyIssues.length} 'any' type issues:`);
  anyIssues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.description}`);
    console.log(`   Location: Line ${issue.location.startLine}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Tags: ${issue.tags.join(', ')}`);
  });

  project.removeSourceFile(sourceFile);

  if (anyIssues.length >= 5) {
    console.log('\n✅ PASS: Detected multiple any type usages');
    return true;
  } else {
    console.log(`\n❌ FAIL: Expected at least 5 any type issues, found ${anyIssues.length}`);
    return false;
  }
}

async function testUnnecessaryTypeAssertions() {
  console.log('\n=== Testing Unnecessary Type Assertions Detection ===\n');

  const code = `
// Test case 1: String literal to string (unnecessary)
const name = "John" as string;

// Test case 2: Number literal to number (unnecessary)
const age = 25 as number;

// Test case 3: Boolean literal to boolean (unnecessary)
const isActive = true as boolean;

// Test case 4: Non-null assertion on optional chaining (potentially unnecessary)
const value = obj?.prop!;

// Test case 5: Necessary assertion (should not be flagged)
const data = JSON.parse(jsonString) as UserData;

// Test case 6: Double assertion (intentional, should not be flagged)
const element = document.getElementById('test') as any as HTMLElement;
  `;

  const sourceFile = project.createSourceFile('test-assertions.ts', code);
  const fileInfo = createFileInfo('test-assertions', code);
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  const assertionIssues = issues.filter(i => i.tags.includes('type-assertion'));
  
  console.log(`Found ${assertionIssues.length} unnecessary type assertion issues:`);
  assertionIssues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.description}`);
    console.log(`   Location: Line ${issue.location.startLine}`);
    console.log(`   Severity: ${issue.severity}`);
    console.log(`   Code: ${issue.codeSnippet}`);
  });

  project.removeSourceFile(sourceFile);

  if (assertionIssues.length >= 3) {
    console.log('\n✅ PASS: Detected unnecessary type assertions');
    return true;
  } else {
    console.log(`\n❌ FAIL: Expected at least 3 assertion issues, found ${assertionIssues.length}`);
    return false;
  }
}

async function testMixedTypeSafetyIssues() {
  console.log('\n=== Testing Mixed Type Safety Issues ===\n');

  const code = `
// Mixed issues in a realistic scenario
class DataService {
  private cache: any = {};

  async fetchUser(id: string): Promise<any> {
    const cached = this.cache[id] as any;
    if (cached) {
      return cached;
    }

    const response = await fetch(\`/api/users/\${id}\`);
    const data: any = await response.json();
    
    this.cache[id] = data;
    return data as any;
  }

  processData(input: any): any {
    return input.map((item: any) => ({
      id: item.id as string,
      value: item.value as number,
    }));
  }
}
  `;

  const sourceFile = project.createSourceFile('test-mixed.ts', code);
  const fileInfo = createFileInfo('test-mixed', code);
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  const typeSafetyIssues = issues.filter(i => i.type === 'type-safety');
  
  console.log(`Found ${typeSafetyIssues.length} total type safety issues:`);
  
  const anyIssues = typeSafetyIssues.filter(i => i.tags.includes('any-type'));
  const assertionIssues = typeSafetyIssues.filter(i => i.tags.includes('type-assertion'));
  
  console.log(`  - ${anyIssues.length} 'any' type issues`);
  console.log(`  - ${assertionIssues.length} type assertion issues`);

  project.removeSourceFile(sourceFile);

  if (typeSafetyIssues.length >= 8) {
    console.log('\n✅ PASS: Detected multiple type safety issues in realistic code');
    return true;
  } else {
    console.log(`\n❌ FAIL: Expected at least 8 type safety issues, found ${typeSafetyIssues.length}`);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Type Safety Issue Detection Test (Task 8.3)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    const results = [];
    results.push(await testExcessiveAnyUsage());
    results.push(await testUnnecessaryTypeAssertions());
    results.push(await testMixedTypeSafetyIssues());

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Test Results Summary                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`Tests Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('\n✅ All tests passed! Task 8.3 implementation is working correctly.\n');
    } else {
      console.log(`\n❌ ${total - passed} test(s) failed. Please review the implementation.\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runAllTests();
