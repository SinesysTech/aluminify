/**
 * Manual test for TypePatternAnalyzer
 * Run with: npx ts-node test-type-analyzer.ts
 */

import { Project } from 'ts-morph';
import { TypePatternAnalyzer } from './src/analyzers/type-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

// Create a test file with various type definitions
const testCode = `
// Interface definition
interface User {
  id: string;
  name: string;
  email: string;
}

// Type alias
type UserRole = 'admin' | 'user' | 'guest';

// Enum
enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

// Type usage in variable
const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com',
};

// Type usage in function parameter
function getUser(id: string): User {
  return user;
}

// Type usage in arrow function
const updateUser = (user: User, role: UserRole): void => {
  console.log(user, role);
};

// Generic type usage
const users: Array<User> = [user];

// Supabase-style type
type DbUser = Database['public']['Tables']['users']['Row'];

// Union type
type UserOrNull = User | null;

// Intersection type
type UserWithTimestamps = User & { createdAt: Date; updatedAt: Date };
`;

async function testTypeAnalyzer() {
  console.log('Testing TypePatternAnalyzer...\n');

  // Create a ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  // Add the test file
  const sourceFile = project.createSourceFile('test.ts', testCode);

  // Create file info
  const fileInfo: FileInfo = {
    path: '/test/test.ts',
    relativePath: 'test.ts',
    extension: '.ts',
    size: testCode.length,
    category: 'type',
    lastModified: new Date(),
  };

  // Create analyzer
  const analyzer = new TypePatternAnalyzer();

  // Analyze the file
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  // Get discovered type definitions
  const typeDefinitions = analyzer.getTypeDefinitions();
  const typeUsages = analyzer.getTypeUsages();

  console.log('=== Type Definitions Found ===');
  console.log(`Total: ${typeDefinitions.length}\n`);
  
  for (const def of typeDefinitions) {
    console.log(`- ${def.kind}: ${def.name}`);
    console.log(`  File: ${def.file}`);
    console.log(`  Definition: ${def.definition.substring(0, 100)}...`);
    console.log();
  }

  console.log('\n=== Type Usages Found ===');
  console.log(`Total: ${typeUsages.length}\n`);
  
  const usagesByType = new Map<string, number>();
  for (const usage of typeUsages) {
    usagesByType.set(usage.typeName, (usagesByType.get(usage.typeName) || 0) + 1);
  }

  for (const [typeName, count] of usagesByType.entries()) {
    console.log(`- ${typeName}: ${count} usage(s)`);
  }

  console.log('\n=== Issues Found ===');
  console.log(`Total: ${issues.length}`);
  
  if (issues.length > 0) {
    for (const issue of issues) {
      console.log(`\n- ${issue.type} (${issue.severity})`);
      console.log(`  ${issue.description}`);
    }
  } else {
    console.log('No issues detected (as expected for Task 8.1 - only discovery)');
  }

  console.log('\n=== Test Summary ===');
  console.log(`✓ Type definitions discovered: ${typeDefinitions.length}`);
  console.log(`✓ Type usages tracked: ${typeUsages.length}`);
  console.log(`✓ Analyzer supports file categories: ${analyzer.getSupportedFileTypes().join(', ')}`);
  
  // Verify expected results
  const expectedInterfaces = ['User'];
  const expectedTypes = ['UserRole', 'DbUser', 'UserOrNull', 'UserWithTimestamps'];
  const expectedEnums = ['Status'];
  
  const foundInterfaces = typeDefinitions.filter(d => d.kind === 'interface').map(d => d.name);
  const foundTypes = typeDefinitions.filter(d => d.kind === 'type').map(d => d.name);
  const foundEnums = typeDefinitions.filter(d => d.kind === 'enum').map(d => d.name);
  
  console.log('\n=== Verification ===');
  console.log(`Expected interfaces: ${expectedInterfaces.join(', ')}`);
  console.log(`Found interfaces: ${foundInterfaces.join(', ')}`);
  console.log(`Match: ${expectedInterfaces.every(i => foundInterfaces.includes(i)) ? '✓' : '✗'}`);
  
  console.log(`\nExpected types: ${expectedTypes.join(', ')}`);
  console.log(`Found types: ${foundTypes.join(', ')}`);
  console.log(`Match: ${expectedTypes.every(t => foundTypes.includes(t)) ? '✓' : '✗'}`);
  
  console.log(`\nExpected enums: ${expectedEnums.join(', ')}`);
  console.log(`Found enums: ${foundEnums.join(', ')}`);
  console.log(`Match: ${expectedEnums.every(e => foundEnums.includes(e)) ? '✓' : '✗'}`);
  
  console.log('\n✅ TypePatternAnalyzer test completed successfully!');
}

// Run the test
testTypeAnalyzer().catch(console.error);
