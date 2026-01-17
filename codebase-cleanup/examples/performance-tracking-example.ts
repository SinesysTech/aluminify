/**
 * Example: Using Performance Tracking and Monitoring
 * 
 * This example demonstrates how to use the enhanced AnalysisEngine
 * with progress tracking and performance monitoring features.
 */

import { createAnalysisEngine } from '../src/engine';
import { createFileScanner } from '../src/scanner';
import { CodeQualityAnalyzer } from '../src/analyzers/code-quality-analyzer';

async function main() {
  console.log('🚀 Performance Tracking Example\n');

  // Create scanner
  const scanner = createFileScanner();

  // Scan a directory (adjust path as needed)
  const files = await scanner.scanDirectory(process.cwd(), {
    includePatterns: ['**/*.ts', '**/*.tsx'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    maxDepth: 3,
  });

  console.log(`Found ${files.length} files to analyze\n`);

  // Create analysis engine with progress tracking and performance logging
  const engine = createAnalysisEngine({
    // Enable performance logging to see detailed metrics
    logPerformance: true,
    
    // Track progress with a callback
    onProgress: (progress) => {
      const percent = Math.round((progress.currentFile / progress.totalFiles) * 100);
      const avgTime = Math.round(progress.averageTimePerFile);
      
      console.log(
        `[${percent}%] ${progress.fileName} ` +
        `(${progress.issuesFound} issues, avg ${avgTime}ms/file)`
      );
    },
    
    // Continue on errors
    continueOnError: true,
    
    // Log warnings
    logWarnings: true,
  });

  // Create analyzers
  const analyzers = [
    new CodeQualityAnalyzer(),
  ];

  console.log('Starting analysis...\n');

  // Run analysis
  const result = await engine.analyze(files, analyzers);

  // The performance summary is automatically logged when logPerformance is true
  console.log('\n✅ Analysis Complete!\n');

  // You can also access performance metrics programmatically
  const metrics = engine.getPerformanceMetrics();

  console.log('📈 Programmatic Access to Metrics:');
  console.log(`   Total Duration: ${metrics.totalDuration}ms`);
  console.log(`   Average Time/File: ${Math.round(metrics.averageTimePerFile)}ms`);
  console.log(`   Total Parse Time: ${metrics.totalParseTime}ms`);
  console.log(`   Total Analysis Time: ${metrics.totalAnalysisTime}ms`);

  if (metrics.slowestFile) {
    console.log(`\n   Slowest File: ${metrics.slowestFile.filePath}`);
    console.log(`   - Total Time: ${metrics.slowestFile.totalTime}ms`);
    console.log(`   - Parse Time: ${metrics.slowestFile.parseTime}ms`);
    console.log(`   - Analysis Time: ${metrics.slowestFile.analysisTime}ms`);
    console.log(`   - Issues Found: ${metrics.slowestFile.issuesFound}`);
  }

  // Access individual file metrics
  console.log(`\n📊 Per-File Metrics (showing top 5 slowest):`);
  const fileMetrics = engine.getFileMetrics();
  const sortedMetrics = [...fileMetrics].sort((a, b) => b.totalTime - a.totalTime);
  
  sortedMetrics.slice(0, 5).forEach((metric, index) => {
    console.log(`   ${index + 1}. ${metric.filePath}`);
    console.log(`      Time: ${metric.totalTime}ms (parse: ${metric.parseTime}ms, analysis: ${metric.analysisTime}ms)`);
    console.log(`      Issues: ${metric.issuesFound}, Analyzers: ${metric.analyzersRun}`);
  });

  console.log(`\n📋 Analysis Results:`);
  console.log(`   Files Analyzed: ${result.analyzedFiles}/${result.totalFiles}`);
  console.log(`   Total Issues: ${result.totalIssues}`);
  console.log(`   Duration: ${result.analysisDuration}ms`);
}

// Run the example
main().catch(console.error);
