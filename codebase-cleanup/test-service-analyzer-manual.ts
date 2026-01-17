/**
 * Manual test for ServicePatternAnalyzer
 * 
 * This script tests the ServicePatternAnalyzer by analyzing actual service files
 * from the codebase.
 */

import { Project } from 'ts-morph';
import { ServicePatternAnalyzer } from './src/analyzers/service-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testServiceAnalyzer() {
  console.log('=== Testing ServicePatternAnalyzer ===\n');

  // Create a ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  // Create analyzer instance
  const analyzer = new ServicePatternAnalyzer();

  console.log('Analyzer name:', analyzer.name);
  console.log('Supported file types:', analyzer.getSupportedFileTypes());
  console.log();

  // Test with a real service file
  const testFiles = [
    path.join(__dirname, '../backend/services/user/index.ts'),
    path.join(__dirname, '../backend/services/cache/index.ts'),
  ];

  for (const filePath of testFiles) {
    try {
      console.log(`\n--- Analyzing: ${path.basename(path.dirname(filePath))} service ---`);
      
      // Add the file to the project
      const sourceFile = project.addSourceFileAtPath(filePath);
      
      // Create FileInfo
      const fileInfo: FileInfo = {
        path: filePath,
        relativePath: path.relative(path.join(__dirname, '..'), filePath),
        extension: '.ts',
        size: 1000,
        category: 'service',
        lastModified: new Date(),
      };

      // Analyze the file
      const issues = await analyzer.analyze(fileInfo, sourceFile);

      console.log(`Found ${issues.length} issues:`);
      
      for (const issue of issues) {
        console.log(`\n  [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`  Description: ${issue.description}`);
        console.log(`  Location: Line ${issue.location.startLine}-${issue.location.endLine}`);
        console.log(`  Recommendation: ${issue.recommendation.substring(0, 100)}...`);
        console.log(`  Tags: ${issue.tags.join(', ')}`);
      }

      if (issues.length === 0) {
        console.log('  ✓ No issues found');
      }

    } catch (error) {
      console.error(`  ✗ Error analyzing ${filePath}:`, (error as Error).message);
    }
  }

  // Display discovered services
  console.log('\n\n=== Discovered Services ===');
  const services = analyzer.getDiscoveredServices();
  console.log(`Total services discovered: ${services.size}\n`);

  for (const [name, service] of services.entries()) {
    console.log(`Service: ${name}`);
    console.log(`  Path: ${service.path}`);
    console.log(`  Imports: ${service.imports.length > 0 ? service.imports.join(', ') : 'none'}`);
    console.log(`  Exports: ${service.exports.length > 0 ? service.exports.join(', ') : 'none'}`);
    console.log();
  }

  // Display service dependencies
  console.log('=== Service Dependencies ===');
  const dependencies = analyzer.getServiceDependencies();
  console.log(`Total dependencies: ${dependencies.length}\n`);

  for (const dep of dependencies) {
    console.log(`${dep.from} → ${dep.to}`);
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testServiceAnalyzer().catch(console.error);
