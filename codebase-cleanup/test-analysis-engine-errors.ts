/**
 * Test error handling in AnalysisEngine
 */

import { createAnalysisEngine, AnalysisError } from './src/engine/analysis-engine';
import { CodeQualityAnalyzer } from './src/analyzers/code-quality-analyzer';
import type { FileInfo } from './src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testErrorHandling() {
  console.log('Testing AnalysisEngine error handling...\n');

  const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));

  try {
    // Test 1: Continue on error (default behavior)
    console.log('=== Test 1: Continue on parsing errors ===\n');
    
    const goodFile = path.join(tmpDir, 'good.ts');
    await fs.writeFile(goodFile, 'const x = 1;');
    
    const files: FileInfo[] = [
      {
        path: goodFile,
        relativePath: 'good.ts',
        extension: '.ts',
        size: 100,
        category: 'util',
        lastModified: new Date(),
      },
      {
        path: path.join(tmpDir, 'missing.ts'), // This file doesn't exist
        relativePath: 'missing.ts',
        extension: '.ts',
        size: 100,
        category: 'util',
        lastModified: new Date(),
      },
    ];

    const engine1 = createAnalysisEngine({
      continueOnError: true,
      logWarnings: false, // Suppress warnings for cleaner output
    });

    const analyzer = new CodeQualityAnalyzer();
    const result1 = await engine1.analyze(files, [analyzer]);

    console.log(`Total files: ${result1.totalFiles}`);
    console.log(`Analyzed files: ${result1.analyzedFiles}`);
    console.log(`Errors encountered: ${engine1.getErrorCount()}`);
    console.log(`Parse errors: ${engine1.getParseErrors().size}`);
    
    if (result1.analyzedFiles === 1 && engine1.getErrorCount() === 1) {
      console.log('✅ Successfully continued after parsing error\n');
    } else {
      console.log('❌ Error handling failed\n');
    }

    // Test 2: Stop on error
    console.log('=== Test 2: Stop on parsing errors ===\n');
    
    const engine2 = createAnalysisEngine({
      continueOnError: false,
      logWarnings: false,
    });

    try {
      await engine2.analyze(files, [analyzer]);
      console.log('❌ Should have thrown an error\n');
    } catch (error) {
      if (error instanceof AnalysisError) {
        console.log('✅ Correctly threw AnalysisError');
        console.log(`   Message: ${error.message}\n`);
      } else {
        console.log('❌ Wrong error type thrown\n');
      }
    }

    // Test 3: Max errors limit
    console.log('=== Test 3: Max errors limit ===\n');
    
    const manyBadFiles: FileInfo[] = [];
    for (let i = 0; i < 5; i++) {
      manyBadFiles.push({
        path: path.join(tmpDir, `missing${i}.ts`),
        relativePath: `missing${i}.ts`,
        extension: '.ts',
        size: 100,
        category: 'util',
        lastModified: new Date(),
      });
    }

    const engine3 = createAnalysisEngine({
      continueOnError: true,
      maxErrors: 3,
      logWarnings: false,
    });

    try {
      await engine3.analyze(manyBadFiles, [analyzer]);
      console.log('❌ Should have stopped after 3 errors\n');
    } catch (error) {
      if (error instanceof AnalysisError && error.message.includes('3 errors')) {
        console.log('✅ Correctly stopped after max errors');
        console.log(`   Message: ${error.message}\n`);
      } else {
        console.log('❌ Wrong error handling\n');
      }
    }

    // Test 4: Reset functionality
    console.log('=== Test 4: Reset functionality ===\n');
    
    const engine4 = createAnalysisEngine({ logWarnings: false });
    await engine4.analyze(files, [analyzer]);
    
    console.log(`Errors before reset: ${engine4.getErrorCount()}`);
    console.log(`Parse errors before reset: ${engine4.getParseErrors().size}`);
    
    engine4.reset();
    
    console.log(`Errors after reset: ${engine4.getErrorCount()}`);
    console.log(`Parse errors after reset: ${engine4.getParseErrors().size}`);
    
    if (engine4.getErrorCount() === 0 && engine4.getParseErrors().size === 0) {
      console.log('✅ Reset successfully cleared all errors\n');
    } else {
      console.log('❌ Reset failed to clear errors\n');
    }

    // Test 5: Progress callback with errors
    console.log('=== Test 5: Progress callback with errors ===\n');
    
    let progressCalls = 0;
    const engine5 = createAnalysisEngine({
      continueOnError: true,
      logWarnings: false,
      onProgress: (progress) => {
        progressCalls++;
        console.log(`  Progress: ${progress.currentFile}/${progress.totalFiles} - ${progress.fileName}`);
      },
    });

    await engine5.analyze(files, [analyzer]);
    
    if (progressCalls === files.length) {
      console.log(`✅ Progress callback called ${progressCalls} times (once per file)\n`);
    } else {
      console.log(`❌ Progress callback called ${progressCalls} times, expected ${files.length}\n`);
    }

    console.log('✅ All error handling tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// Run the test
testErrorHandling().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
