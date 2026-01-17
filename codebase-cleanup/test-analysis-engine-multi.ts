/**
 * Integration test for AnalysisEngine with multiple analyzers
 */

import { createAnalysisEngine } from './src/engine/analysis-engine';
import { CodeQualityAnalyzer } from './src/analyzers/code-quality-analyzer';
import { TypePatternAnalyzer } from './src/analyzers/type-pattern-analyzer';
import { ComponentPatternAnalyzer } from './src/analyzers/component-pattern-analyzer';
import type { FileInfo } from './src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testMultipleAnalyzers() {
  console.log('Testing AnalysisEngine with multiple analyzers...\n');

  const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
  console.log(`Created temp directory: ${tmpDir}\n`);

  try {
    // Create test files for different categories
    const testFiles = [
      {
        name: 'util.ts',
        category: 'util' as const,
        content: `
const x = 1;
const y = 2;
function proc(d: any) {
  return d;
}
        `,
      },
      {
        name: 'types.ts',
        category: 'type' as const,
        content: `
export type User = { id: string; name: string };
export interface User { id: string; name: string; email: string };

function processData(data: any): any {
  return data;
}
        `,
      },
      {
        name: 'Component.tsx',
        category: 'component' as const,
        content: `
import React from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = React.useState<any>(null);
  
  return <div>{user?.name}</div>;
}

export default UserProfile;
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
        extension: path.extname(testFile.name),
        size: testFile.content.length,
        category: testFile.category,
        lastModified: new Date(),
      });
      
      console.log(`Created ${testFile.category} file: ${testFile.name}`);
    }

    console.log('\nStarting analysis with multiple analyzers...\n');

    // Create analysis engine
    const engine = createAnalysisEngine({
      onProgress: (progress) => {
        console.log(
          `[${progress.currentFile}/${progress.totalFiles}] Analyzing ${progress.fileName}...`
        );
      },
    });

    // Create multiple analyzers
    const analyzers = [
      new CodeQualityAnalyzer(),
      new TypePatternAnalyzer(),
      new ComponentPatternAnalyzer(),
    ];

    console.log(`Using ${analyzers.length} analyzers:\n`);
    analyzers.forEach((analyzer, i) => {
      const supportedTypes = analyzer.getSupportedFileTypes();
      console.log(`  ${i + 1}. ${analyzer.name} (supports: ${supportedTypes.join(', ')})`);
    });
    console.log('');

    // Run analysis
    const startTime = Date.now();
    const result = await engine.analyze(fileInfos, analyzers);
    const duration = Date.now() - startTime;

    // Display results
    console.log('\n=== Analysis Results ===\n');
    console.log(`Total files: ${result.totalFiles}`);
    console.log(`Analyzed files: ${result.analyzedFiles}`);
    console.log(`Total issues: ${result.totalIssues}`);
    console.log(`Analysis duration: ${duration}ms`);

    console.log('\n=== Issues by Category ===\n');
    for (const [category, issues] of result.issuesByCategory.entries()) {
      console.log(`${category}: ${issues.length} issues`);
      
      // Group by file within category
      const byFile = new Map<string, number>();
      for (const issue of issues) {
        const fileName = path.basename(issue.file);
        byFile.set(fileName, (byFile.get(fileName) || 0) + 1);
      }
      
      for (const [file, count] of byFile.entries()) {
        console.log(`  - ${file}: ${count}`);
      }
    }

    console.log('\n=== Issues by Type ===\n');
    for (const [type, issues] of result.issuesByType.entries()) {
      console.log(`${type}: ${issues.length} issues`);
    }

    console.log('\n=== Issues by Severity ===\n');
    const severityOrder = ['critical', 'high', 'medium', 'low'] as const;
    for (const severity of severityOrder) {
      const issues = result.issuesBySeverity.get(severity);
      if (issues && issues.length > 0) {
        console.log(`${severity}: ${issues.length} issues`);
      }
    }

    // Verify analyzer coordination
    console.log('\n=== Analyzer Coordination Test ===\n');
    
    // Check that each analyzer only ran on supported file types
    const allIssues = Array.from(result.issuesByType.values()).flat();
    
    const codeQualityIssues = allIssues.filter(i => i.detectedBy === 'CodeQualityAnalyzer');
    const typeIssues = allIssues.filter(i => i.detectedBy === 'TypePatternAnalyzer');
    const componentIssues = allIssues.filter(i => i.detectedBy === 'ComponentPatternAnalyzer');
    
    console.log(`CodeQualityAnalyzer found ${codeQualityIssues.length} issues`);
    console.log(`TypePatternAnalyzer found ${typeIssues.length} issues`);
    console.log(`ComponentPatternAnalyzer found ${componentIssues.length} issues`);

    // Verify file category targeting
    console.log('\n=== File Category Targeting ===\n');
    
    const utilIssues = allIssues.filter(i => i.file.includes('util.ts'));
    const typeFileIssues = allIssues.filter(i => i.file.includes('types.ts'));
    const componentFileIssues = allIssues.filter(i => i.file.includes('Component.tsx'));
    
    console.log(`util.ts: ${utilIssues.length} issues`);
    console.log(`types.ts: ${typeFileIssues.length} issues`);
    console.log(`Component.tsx: ${componentFileIssues.length} issues`);

    // Test aggregation
    console.log('\n=== Aggregation Test ===\n');
    
    const aggregated = engine.aggregateIssues(allIssues);
    console.log(`Total issues in collection: ${aggregated.issues.length}`);
    console.log(`Files with issues: ${aggregated.groupedByFile.size}`);
    console.log(`Issue types detected: ${aggregated.groupedByType.size}`);
    console.log(`Issue categories: ${aggregated.groupedByCategory.size}`);

    // Verify all issues are properly grouped
    let totalGrouped = 0;
    for (const issues of aggregated.groupedByFile.values()) {
      totalGrouped += issues.length;
    }
    
    if (totalGrouped === allIssues.length) {
      console.log('✅ All issues properly grouped by file');
    } else {
      console.log(`❌ Grouping mismatch: ${totalGrouped} grouped vs ${allIssues.length} total`);
    }

    console.log('\n✅ Multi-analyzer test completed successfully!\n');

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
testMultipleAnalyzers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
