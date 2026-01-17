/**
 * Unit tests for AnalysisEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisEngineImpl, createAnalysisEngine, AnalysisError } from '../../../src/engine/analysis-engine';
import type { FileInfo, PatternAnalyzer, Issue, FileCategory } from '../../../src/types';
import { SourceFile } from 'ts-morph';

// Mock analyzer for testing
class MockAnalyzer implements PatternAnalyzer {
  name = 'MockAnalyzer';
  private supportedTypes: FileCategory[];
  private issueGenerator: (file: FileInfo, ast: SourceFile) => Promise<Issue[]>;

  constructor(
    supportedTypes: FileCategory[],
    issueGenerator: (file: FileInfo, ast: SourceFile) => Promise<Issue[]>
  ) {
    this.supportedTypes = supportedTypes;
    this.issueGenerator = issueGenerator;
  }

  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    return this.issueGenerator(file, ast);
  }

  getSupportedFileTypes(): FileCategory[] {
    return this.supportedTypes;
  }
}

// Helper to create a mock FileInfo
function createMockFile(
  relativePath: string,
  category: FileCategory = 'util',
  content: string = 'const x = 1;'
): FileInfo {
  return {
    path: `/test/${relativePath}`,
    relativePath,
    extension: '.ts',
    size: content.length,
    category,
    lastModified: new Date(),
  };
}

// Helper to create a mock Issue
function createMockIssue(file: string, overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'test-issue-' + Math.random(),
    type: 'code-duplication',
    severity: 'medium',
    category: 'general',
    file,
    location: {
      startLine: 1,
      endLine: 1,
      startColumn: 0,
      endColumn: 10,
    },
    description: 'Test issue',
    codeSnippet: 'const x = 1;',
    recommendation: 'Fix it',
    estimatedEffort: 'small',
    tags: [],
    detectedBy: 'MockAnalyzer',
    detectedAt: new Date(),
    relatedIssues: [],
    ...overrides,
  };
}

describe('AnalysisEngine', () => {
  let engine: AnalysisEngineImpl;

  beforeEach(() => {
    engine = new AnalysisEngineImpl();
  });

  describe('createAnalysisEngine', () => {
    it('should create an analysis engine instance', () => {
      const engine = createAnalysisEngine();
      expect(engine).toBeDefined();
      expect(engine.analyze).toBeDefined();
      expect(engine.parseFile).toBeDefined();
      expect(engine.aggregateIssues).toBeDefined();
    });

    it('should accept options', () => {
      const onProgress = vi.fn();
      const engine = createAnalysisEngine({ onProgress });
      expect(engine).toBeDefined();
    });
  });

  describe('parseFile', () => {
    it('should parse a valid TypeScript file', async () => {
      const file = createMockFile('test.ts', 'util', 'const x: number = 1;');
      
      // Create a temporary file for testing
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      const tmpFile = path.join(tmpDir, 'test.ts');
      await fs.writeFile(tmpFile, 'const x: number = 1;');
      
      file.path = tmpFile;

      try {
        const ast = await engine.parseFile(file);
        expect(ast).toBeDefined();
        expect(ast.getText()).toContain('const x');
      } finally {
        // Cleanup
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should parse a valid JavaScript file', async () => {
      const file = createMockFile('test.js', 'util', 'const x = 1;');
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      const tmpFile = path.join(tmpDir, 'test.js');
      await fs.writeFile(tmpFile, 'const x = 1;');
      
      file.path = tmpFile;

      try {
        const ast = await engine.parseFile(file);
        expect(ast).toBeDefined();
        expect(ast.getText()).toContain('const x');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should handle files with syntax warnings gracefully', async () => {
      const file = createMockFile('test.ts', 'util', 'const x: any = 1;');
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      const tmpFile = path.join(tmpDir, 'test.ts');
      await fs.writeFile(tmpFile, 'const x: any = 1;');
      
      file.path = tmpFile;

      try {
        const ast = await engine.parseFile(file);
        expect(ast).toBeDefined();
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('analyze', () => {
    it('should analyze files with no issues', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      // Create temporary files
      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        const result = await engine.analyze(files, [analyzer]);

        expect(result.totalFiles).toBe(2);
        expect(result.analyzedFiles).toBe(2);
        expect(result.totalIssues).toBe(0);
        expect(result.analysisTimestamp).toBeInstanceOf(Date);
        expect(result.analysisDuration).toBeGreaterThanOrEqual(0);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should analyze files and detect issues', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const analyzer = new MockAnalyzer(['util'], async (file) => [
        createMockIssue(file.path),
      ]);

      try {
        const result = await engine.analyze(files, [analyzer]);

        expect(result.totalFiles).toBe(2);
        expect(result.analyzedFiles).toBe(2);
        expect(result.totalIssues).toBe(2);
        expect(result.issuesByType.size).toBeGreaterThan(0);
        expect(result.issuesByCategory.size).toBeGreaterThan(0);
        expect(result.issuesBySeverity.size).toBeGreaterThan(0);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should only run analyzers that support the file type', async () => {
      const files = [
        createMockFile('component.tsx', 'component'),
        createMockFile('util.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const componentAnalyzer = new MockAnalyzer(['component'], async (file) => [
        createMockIssue(file.path, { category: 'components' }),
      ]);

      const utilAnalyzer = new MockAnalyzer(['util'], async (file) => [
        createMockIssue(file.path, { category: 'general' }),
      ]);

      try {
        const result = await engine.analyze(files, [componentAnalyzer, utilAnalyzer]);

        expect(result.totalIssues).toBe(2);
        
        // Check that component analyzer only ran on component file
        const componentIssues = result.issuesByCategory.get('components') || [];
        expect(componentIssues.length).toBe(1);
        expect(componentIssues[0].file).toContain('component.tsx');

        // Check that util analyzer only ran on util file
        const generalIssues = result.issuesByCategory.get('general') || [];
        expect(generalIssues.length).toBe(1);
        expect(generalIssues[0].file).toContain('util.ts');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should call progress callback during analysis', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const onProgress = vi.fn();
      const engineWithProgress = new AnalysisEngineImpl({ onProgress });
      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engineWithProgress.analyze(files, [analyzer]);

        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            currentFile: 1,
            totalFiles: 2,
            fileName: 'file1.ts',
            issuesFound: expect.any(Number),
          })
        );
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should continue on error by default', async () => {
      const files = [
        createMockFile('good.ts', 'util'),
        createMockFile('bad.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      // Create only the good file
      const goodFile = path.join(tmpDir, 'good.ts');
      await fs.writeFile(goodFile, 'const x = 1;');
      files[0].path = goodFile;
      
      // Bad file doesn't exist
      files[1].path = path.join(tmpDir, 'bad.ts');

      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        const result = await engine.analyze(files, [analyzer]);

        // Should have analyzed the good file
        expect(result.analyzedFiles).toBe(1);
        expect(result.totalFiles).toBe(2);
        expect(engine.getErrorCount()).toBe(1);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should stop on error when continueOnError is false', async () => {
      const files = [
        createMockFile('good.ts', 'util'),
        createMockFile('bad.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      const goodFile = path.join(tmpDir, 'good.ts');
      await fs.writeFile(goodFile, 'const x = 1;');
      files[0].path = goodFile;
      files[1].path = path.join(tmpDir, 'bad.ts');

      const engineStopOnError = new AnalysisEngineImpl({ continueOnError: false });
      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await expect(
          engineStopOnError.analyze(files, [analyzer])
        ).rejects.toThrow(AnalysisError);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should handle analyzer errors gracefully', async () => {
      const files = [createMockFile('file.ts', 'util')];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      const tmpFile = path.join(tmpDir, 'file.ts');
      await fs.writeFile(tmpFile, 'const x = 1;');
      files[0].path = tmpFile;

      const failingAnalyzer = new MockAnalyzer(['util'], async () => {
        throw new Error('Analyzer failed');
      });

      try {
        const result = await engine.analyze(files, [failingAnalyzer]);

        // Should complete analysis despite analyzer failure
        expect(result.analyzedFiles).toBe(1);
        expect(result.totalIssues).toBe(0);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('aggregateIssues', () => {
    it('should group issues by file', () => {
      const issues = [
        createMockIssue('/test/file1.ts'),
        createMockIssue('/test/file1.ts'),
        createMockIssue('/test/file2.ts'),
      ];

      const collection = engine.aggregateIssues(issues);

      expect(collection.groupedByFile.size).toBe(2);
      expect(collection.groupedByFile.get('/test/file1.ts')?.length).toBe(2);
      expect(collection.groupedByFile.get('/test/file2.ts')?.length).toBe(1);
    });

    it('should group issues by type', () => {
      const issues = [
        createMockIssue('/test/file.ts', { type: 'code-duplication' }),
        createMockIssue('/test/file.ts', { type: 'code-duplication' }),
        createMockIssue('/test/file.ts', { type: 'confusing-logic' }),
      ];

      const collection = engine.aggregateIssues(issues);

      expect(collection.groupedByType.size).toBe(2);
      expect(collection.groupedByType.get('code-duplication')?.length).toBe(2);
      expect(collection.groupedByType.get('confusing-logic')?.length).toBe(1);
    });

    it('should group issues by category', () => {
      const issues = [
        createMockIssue('/test/file.ts', { category: 'general' }),
        createMockIssue('/test/file.ts', { category: 'components' }),
        createMockIssue('/test/file.ts', { category: 'components' }),
      ];

      const collection = engine.aggregateIssues(issues);

      expect(collection.groupedByCategory.size).toBe(2);
      expect(collection.groupedByCategory.get('general')?.length).toBe(1);
      expect(collection.groupedByCategory.get('components')?.length).toBe(2);
    });

    it('should handle empty issue array', () => {
      const collection = engine.aggregateIssues([]);

      expect(collection.issues.length).toBe(0);
      expect(collection.groupedByFile.size).toBe(0);
      expect(collection.groupedByType.size).toBe(0);
      expect(collection.groupedByCategory.size).toBe(0);
    });
  });

  describe('error tracking', () => {
    it('should track error count', async () => {
      const files = [
        createMockFile('bad1.ts', 'util'),
        createMockFile('bad2.ts', 'util'),
      ];

      // Don't create the files so they fail to parse
      const analyzer = new MockAnalyzer(['util'], async () => []);

      await engine.analyze(files, [analyzer]);

      expect(engine.getErrorCount()).toBe(2);
    });

    it('should track parse errors', async () => {
      const files = [createMockFile('bad.ts', 'util')];
      const analyzer = new MockAnalyzer(['util'], async () => []);

      await engine.analyze(files, [analyzer]);

      const errors = engine.getParseErrors();
      expect(errors.size).toBe(1);
      expect(errors.has(files[0].path)).toBe(true);
    });

    it('should stop after maxErrors', async () => {
      const files = [
        createMockFile('bad1.ts', 'util'),
        createMockFile('bad2.ts', 'util'),
        createMockFile('bad3.ts', 'util'),
      ];

      const engineWithMaxErrors = new AnalysisEngineImpl({ maxErrors: 2 });
      const analyzer = new MockAnalyzer(['util'], async () => []);

      await expect(
        engineWithMaxErrors.analyze(files, [analyzer])
      ).rejects.toThrow(AnalysisError);
    });
  });

  describe('reset', () => {
    it('should clear all cached data', async () => {
      const files = [createMockFile('bad.ts', 'util')];
      const analyzer = new MockAnalyzer(['util'], async () => []);

      await engine.analyze(files, [analyzer]);
      expect(engine.getErrorCount()).toBeGreaterThan(0);

      engine.reset();

      expect(engine.getErrorCount()).toBe(0);
      expect(engine.getParseErrors().size).toBe(0);
    });

    it('should clear performance metrics', async () => {
      const files = [createMockFile('file.ts', 'util')];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      const tmpFile = path.join(tmpDir, 'file.ts');
      await fs.writeFile(tmpFile, 'const x = 1;');
      files[0].path = tmpFile;

      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engine.analyze(files, [analyzer]);
        expect(engine.getFileMetrics().length).toBe(1);

        engine.reset();

        expect(engine.getFileMetrics().length).toBe(0);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('performance tracking', () => {
    it('should track performance metrics for each file', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const analyzer = new MockAnalyzer(['util'], async (file) => [
        createMockIssue(file.path),
      ]);

      try {
        await engine.analyze(files, [analyzer]);

        const metrics = engine.getFileMetrics();
        expect(metrics.length).toBe(2);

        for (const metric of metrics) {
          expect(metric.filePath).toBeDefined();
          expect(metric.parseTime).toBeGreaterThanOrEqual(0);
          expect(metric.analysisTime).toBeGreaterThanOrEqual(0);
          expect(metric.totalTime).toBeGreaterThanOrEqual(0);
          expect(metric.issuesFound).toBe(1);
          expect(metric.analyzersRun).toBe(1);
        }
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should calculate aggregated performance metrics', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engine.analyze(files, [analyzer]);

        const metrics = engine.getPerformanceMetrics();
        
        expect(metrics.totalDuration).toBeGreaterThanOrEqual(0);
        expect(metrics.averageTimePerFile).toBeGreaterThanOrEqual(0);
        expect(metrics.totalParseTime).toBeGreaterThanOrEqual(0);
        expect(metrics.totalAnalysisTime).toBeGreaterThanOrEqual(0);
        expect(metrics.fastestFile).toBeDefined();
        expect(metrics.slowestFile).toBeDefined();
        expect(metrics.fileMetrics.length).toBe(2);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should identify fastest and slowest files', async () => {
      const files = [
        createMockFile('fast.ts', 'util'),
        createMockFile('slow.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      // Slow analyzer that takes longer on the second file
      const analyzer = new MockAnalyzer(['util'], async (file) => {
        if (file.relativePath === 'slow.ts') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return [];
      });

      try {
        await engine.analyze(files, [analyzer]);

        const metrics = engine.getPerformanceMetrics();
        
        expect(metrics.fastestFile).toBeDefined();
        expect(metrics.slowestFile).toBeDefined();
        
        // The slowest file should have taken more time than the fastest
        expect(metrics.slowestFile!.totalTime).toBeGreaterThan(metrics.fastestFile!.totalTime);
        
        // With a 100ms delay, slow.ts should be significantly slower
        expect(metrics.slowestFile!.totalTime).toBeGreaterThan(50);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should return empty metrics when no files analyzed', () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics.totalDuration).toBe(0);
      expect(metrics.averageTimePerFile).toBe(0);
      expect(metrics.fastestFile).toBeNull();
      expect(metrics.slowestFile).toBeNull();
      expect(metrics.totalParseTime).toBe(0);
      expect(metrics.totalAnalysisTime).toBe(0);
      expect(metrics.fileMetrics.length).toBe(0);
    });

    it('should include elapsed time and average in progress callback', async () => {
      const files = [
        createMockFile('file1.ts', 'util'),
        createMockFile('file2.ts', 'util'),
      ];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      for (const file of files) {
        const tmpFile = path.join(tmpDir, file.relativePath);
        await fs.writeFile(tmpFile, 'const x = 1;');
        file.path = tmpFile;
      }

      const onProgress = vi.fn();
      const engineWithProgress = new AnalysisEngineImpl({ onProgress });
      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engineWithProgress.analyze(files, [analyzer]);

        expect(onProgress).toHaveBeenCalledTimes(2);
        
        // Check that progress includes new fields
        expect(onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            currentFile: expect.any(Number),
            totalFiles: 2,
            fileName: expect.any(String),
            issuesFound: expect.any(Number),
            elapsedTime: expect.any(Number),
            averageTimePerFile: expect.any(Number),
          })
        );

        // Verify elapsed time increases
        const firstCall = onProgress.mock.calls[0][0];
        const secondCall = onProgress.mock.calls[1][0];
        expect(secondCall.elapsedTime).toBeGreaterThanOrEqual(firstCall.elapsedTime);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should log performance summary when logPerformance is enabled', async () => {
      const files = [createMockFile('file.ts', 'util')];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      const tmpFile = path.join(tmpDir, 'file.ts');
      await fs.writeFile(tmpFile, 'const x = 1;');
      files[0].path = tmpFile;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const engineWithLogging = new AnalysisEngineImpl({ logPerformance: true });
      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engineWithLogging.analyze(files, [analyzer]);

        // Should have logged performance summary
        expect(consoleSpy).toHaveBeenCalled();
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '));
        const hasPerformanceLogs = logCalls.some(log => 
          log.includes('Performance Summary') || 
          log.includes('Starting analysis')
        );
        expect(hasPerformanceLogs).toBe(true);
      } finally {
        consoleSpy.mockRestore();
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should not log performance when logPerformance is disabled', async () => {
      const files = [createMockFile('file.ts', 'util')];

      const fs = await import('fs/promises');
      const path = await import('path');
      const tmpDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-test-'));
      
      const tmpFile = path.join(tmpDir, 'file.ts');
      await fs.writeFile(tmpFile, 'const x = 1;');
      files[0].path = tmpFile;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const analyzer = new MockAnalyzer(['util'], async () => []);

      try {
        await engine.analyze(files, [analyzer]);

        // Should not have logged performance summary
        const logCalls = consoleSpy.mock.calls.map(call => call.join(' '));
        const hasPerformanceLogs = logCalls.some(log => 
          log.includes('Performance Summary') || 
          log.includes('Starting analysis')
        );
        expect(hasPerformanceLogs).toBe(false);
      } finally {
        consoleSpy.mockRestore();
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
