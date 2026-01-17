/**
 * Quick test to verify ServicePatternAnalyzer implementation
 */

import { Project } from 'ts-morph';
import { ServicePatternAnalyzer } from './src/analyzers/service-pattern-analyzer';
import type { FileInfo } from './src/types';

// Create a test service file with various patterns
const testServiceCode = `
// Service with mixed initialization patterns
export class UserService {
  constructor(private db: Database, private auth: Auth, private logger: Logger) {}
  
  async getUser(id: string) {
    return this.db.users.findById(id);
  }
}

export function initUserService() {
  return new UserService(db, auth, logger);
}

export const createUserService = () => {
  return new UserService(db, auth, logger);
};

// Pass-through wrapper function
export function getUserById(id: string) {
  return userRepository.findById(id);
}

// Simple property access wrapper
export function getConfig() {
  return config.settings;
}

// Pass-through with intermediate variable
export async function fetchUser(id: string) {
  const result = await api.getUser(id);
  return result;
}
`;

async function testServicePatternAnalyzer() {
  console.log('Testing ServicePatternAnalyzer...\n');

  // Create a ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
    },
  });

  // Add test file
  const sourceFile = project.createSourceFile(
    'backend/services/user/user-service.ts',
    testServiceCode
  );

  // Create analyzer
  const analyzer = new ServicePatternAnalyzer();

  // Create file info
  const fileInfo: FileInfo = {
    path: '/test/backend/services/user/user-service.ts',
    relativePath: 'backend/services/user/user-service.ts',
    extension: '.ts',
    size: testServiceCode.length,
    category: 'service',
  };

  // Analyze the file
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  console.log(`Found ${issues.length} issues:\n`);

  for (const issue of issues) {
    console.log(`[${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`  Description: ${issue.description}`);
    console.log(`  Location: ${issue.file}:${issue.location.startLine}`);
    console.log(`  Tags: ${issue.tags.join(', ')}`);
    console.log('');
  }

  // Verify we detected the expected patterns
  const hasInconsistentInit = issues.some(i => 
    i.description.includes('multiple initialization patterns')
  );
  const hasPassThrough = issues.some(i => 
    i.type === 'unnecessary-adapter' && i.description.includes('pass-through')
  );
  const hasPropertyAccess = issues.some(i => 
    i.type === 'unnecessary-adapter' && i.description.includes('property access')
  );

  console.log('Verification:');
  console.log(`  ✓ Detected inconsistent initialization: ${hasInconsistentInit}`);
  console.log(`  ✓ Detected pass-through wrappers: ${hasPassThrough}`);
  console.log(`  ✓ Detected property access wrappers: ${hasPropertyAccess}`);

  if (hasInconsistentInit && hasPassThrough && hasPropertyAccess) {
    console.log('\n✅ All patterns detected successfully!');
  } else {
    console.log('\n❌ Some patterns were not detected');
  }
}

testServicePatternAnalyzer().catch(console.error);
