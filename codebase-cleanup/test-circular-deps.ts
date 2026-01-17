/**
 * Test for circular dependency detection in ServicePatternAnalyzer
 * 
 * This script creates mock service files with circular dependencies
 * and verifies that the analyzer detects them correctly.
 */

import { Project } from 'ts-morph';
import { ServicePatternAnalyzer } from './src/analyzers/service-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

async function testCircularDependencyDetection() {
  console.log('=== Testing Circular Dependency Detection ===\n');

  // Create a ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  // Create analyzer instance
  const analyzer = new ServicePatternAnalyzer();

  // Create mock service files with circular dependencies
  // Service A depends on Service B
  const serviceA = project.createSourceFile(
    'backend/services/serviceA/index.ts',
    `
import { functionB } from '../serviceB';

export function functionA() {
  return functionB();
}
    `.trim()
  );

  // Service B depends on Service C
  const serviceB = project.createSourceFile(
    'backend/services/serviceB/index.ts',
    `
import { functionC } from '../serviceC';

export function functionB() {
  return functionC();
}
    `.trim()
  );

  // Service C depends on Service A (creates a cycle: A → B → C → A)
  const serviceC = project.createSourceFile(
    'backend/services/serviceC/index.ts',
    `
import { functionA } from '../serviceA';

export function functionC() {
  return functionA();
}
    `.trim()
  );

  // Create FileInfo objects
  const fileInfoA: FileInfo = {
    path: '/project/backend/services/serviceA/index.ts',
    relativePath: 'backend/services/serviceA/index.ts',
    extension: '.ts',
    size: 100,
    category: 'service',
    lastModified: new Date(),
  };

  const fileInfoB: FileInfo = {
    path: '/project/backend/services/serviceB/index.ts',
    relativePath: 'backend/services/serviceB/index.ts',
    extension: '.ts',
    size: 100,
    category: 'service',
    lastModified: new Date(),
  };

  const fileInfoC: FileInfo = {
    path: '/project/backend/services/serviceC/index.ts',
    relativePath: 'backend/services/serviceC/index.ts',
    extension: '.ts',
    size: 100,
    category: 'service',
    lastModified: new Date(),
  };

  // Analyze all services (this builds the dependency graph)
  console.log('Analyzing services...\n');
  
  const issuesA = await analyzer.analyze(fileInfoA, serviceA);
  const issuesB = await analyzer.analyze(fileInfoB, serviceB);
  const issuesC = await analyzer.analyze(fileInfoC, serviceC);

  // Combine all issues
  const allIssues = [...issuesA, ...issuesB, ...issuesC];

  // Display discovered services
  console.log('=== Discovered Services ===');
  const services = analyzer.getDiscoveredServices();
  console.log(`Total services: ${services.size}\n`);

  for (const [name, service] of services.entries()) {
    console.log(`Service: ${name}`);
    console.log(`  Imports: ${service.imports.join(', ') || 'none'}`);
    console.log(`  Exports: ${service.exports.join(', ') || 'none'}`);
  }

  // Display dependencies
  console.log('\n=== Service Dependencies ===');
  const dependencies = analyzer.getServiceDependencies();
  console.log(`Total dependencies: ${dependencies.length}\n`);

  for (const dep of dependencies) {
    console.log(`  ${dep.from} → ${dep.to}`);
  }

  // Display circular dependency issues
  console.log('\n=== Circular Dependency Issues ===');
  const circularDepIssues = allIssues.filter(
    issue => issue.tags.includes('circular-dependency')
  );

  console.log(`Found ${circularDepIssues.length} circular dependency issue(s)\n`);

  for (const issue of circularDepIssues) {
    console.log(`[${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`File: ${issue.file}`);
    console.log(`Description: ${issue.description}`);
    console.log(`Recommendation: ${issue.recommendation.substring(0, 200)}...`);
    console.log();
  }

  // Verify the test
  if (circularDepIssues.length > 0) {
    console.log('✓ Test PASSED: Circular dependency detected successfully!');
  } else {
    console.log('✗ Test FAILED: Circular dependency was not detected!');
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testCircularDependencyDetection().catch(console.error);
