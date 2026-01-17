/**
 * Manual test for AnalysisEngine
 */

import { createAnalysisEngine } from './src/engine/analysis-engine';
import { CodeQualityAnalyzer } from './src/analyzers/code-quality-analyzer';
import type { FileInfo } from './src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testAnalysisEngine() {
  console.log('Testing AnalysisEngine...\n');

  // Create temporary test files
  const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
  console.log(`Created temp directory: ${tmpDir}\n`);

  try {
    // Create test files with known issues
    const testFiles = [
      {
        name: 'confusing-logic.ts',
        content: `
function complexFunction(user: any) {
  if (user) {
    if (user.role) {
      if (user.role === 'admin') {
        if (user.permissions) {
          if (user.permissions.includes('delete')) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
        `,
      },
      {
        name: 'poor-naming.ts',
        content: `
const x = 1;
const y = 2;
function proc(d: any) {
  const a = d.filter((u: any) => u.a);
  return a;
}
        `,
      },
      {
        name: 'commented-code.ts',
        content: `
const active = true;

// function oldImplementation() {
//   const data = fetchData();
//   return processData(data);
// }

function newImplementation() {
  return 'new';
}
        `,
      },
    ];

    // Write test files
    const fileInfos: FileInfo[] = [];
    for (const testFile of testFiles) {
      const filePath = path.join(tmpDir, testFile.name);
      await fs.writeFile(filePath, testFile.content);
      
      fileInfos.push({
        path: filePath,
        relativePath: testFile.name,
        extension: '.ts',
        size: testFile.content.length,
        category: 'util',
        lastModified: new Date(),
      });
      
      console.log(`Created test file: ${testFile.name}`);
    }

    console.log('\nStarting analysis...\n');

    // Create analysis engine with progress callback
    const engine = createAnalysisEngine({
      onProgress: (progress) => {
        console.log(
          `Progress: ${progress.currentFile}/${progress.totalFiles} - ${progress.fileName} (${progress.issuesFound} issues found)`
        );
      },
    });

    // Create analyzer
    const analyzer = new CodeQualityAnalyzer();

    // Run analysis
    const result = await engine.analyze(fileInfos, [analyzer]);

    // Display results
    console.log('\n=== Analysis Results ===\n');
    console.log(`Total files: ${result.totalFiles}`);
    console.log(`Analyzed files: ${result.analyzedFiles}`);
    console.log(`Total issues: ${result.totalIssues}`);
    console.log(`Analysis duration: ${result.analysisDuration}ms`);
    console.log(`Analysis timestamp: ${result.analysisTimestamp.toISOString()}`);

    console.log('\n=== Issues by Type ===\n');
    for (const [type, issues] of result.issuesByType.entries()) {
      console.log(`${type}: ${issues.length} issues`);
    }

    console.log('\n=== Issues by Severity ===\n');
    for (const [severity, issues] of result.issuesBySeverity.entries()) {
      console.log(`${severity}: ${issues.length} issues`);
    }

    console.log('\n=== Issues by Category ===\n');
    for (const [category, issues] of result.issuesByCategory.entries()) {
      console.log(`${category}: ${issues.length} issues`);
    }

    // Display some sample issues
    if (result.totalIssues > 0) {
      console.log('\n=== Sample Issues ===\n');
      const allIssues = Array.from(result.issuesByType.values()).flat();
      
      for (let i = 0; i < Math.min(3, allIssues.length); i++) {
        const issue = allIssues[i];
        console.log(`Issue ${i + 1}:`);
        console.log(`  Type: ${issue.type}`);
        console.log(`  Severity: ${issue.severity}`);
        console.log(`  File: ${issue.file}`);
        console.log(`  Location: Line ${issue.location.startLine}-${issue.location.endLine}`);
        console.log(`  Description: ${issue.description}`);
        console.log(`  Recommendation: ${issue.recommendation}`);
        console.log('');
      }
    }

    console.log('\n✅ AnalysisEngine test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
    console.log(`Cleaned up temp directory: ${tmpDir}`);
  }
}

// Run the test
testAnalysisEngine().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
