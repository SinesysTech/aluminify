/**
 * Analysis Engine
 * 
 * Coordinates pattern analyzers and aggregates findings across the codebase.
 * Handles file parsing, analyzer execution, and issue collection.
 */

import { SourceFile } from 'ts-morph';
import type {
  AnalysisEngine,
  AnalysisResult,
  FileInfo,
  Issue,
  IssueCollection,
  IssueType,
  IssueCategory,
  Severity,
  PatternAnalyzer,
} from '../types';
import { ASTParser, ParseError } from '../utils/ast-parser';

/**
 * Error thrown when analysis fails
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Progress callback for tracking analysis progress
 */
export type ProgressCallback = (progress: {
  currentFile: number;
  totalFiles: number;
  fileName: string;
  issuesFound: number;
  elapsedTime: number;
  averageTimePerFile: number;
}) => void;

/**
 * Performance metrics for a single file
 */
export interface FilePerformanceMetrics {
  filePath: string;
  parseTime: number;
  analysisTime: number;
  totalTime: number;
  issuesFound: number;
  analyzersRun: number;
}

/**
 * Overall performance metrics for the analysis
 */
export interface PerformanceMetrics {
  totalDuration: number;
  averageTimePerFile: number;
  fastestFile: FilePerformanceMetrics | null;
  slowestFile: FilePerformanceMetrics | null;
  totalParseTime: number;
  totalAnalysisTime: number;
  fileMetrics: FilePerformanceMetrics[];
}

/**
 * Options for configuring the analysis engine
 */
export interface AnalysisEngineOptions {
  /**
   * Optional callback for progress updates
   */
  onProgress?: ProgressCallback;

  /**
   * Whether to continue analysis if a file fails to parse
   * @default true
   */
  continueOnError?: boolean;

  /**
   * Maximum number of parsing errors before stopping
   * @default Infinity
   */
  maxErrors?: number;

  /**
   * Whether to log warnings for parsing errors
   * @default true
   */
  logWarnings?: boolean;

  /**
   * Whether to log performance metrics during analysis
   * @default false
   */
  logPerformance?: boolean;
}

/**
 * Implementation of the Analysis Engine
 * 
 * Coordinates the analysis process:
 * 1. Parses files into ASTs
 * 2. Runs applicable analyzers based on file category
 * 3. Aggregates issues from all analyzers
 * 4. Handles errors gracefully
 * 5. Tracks performance metrics
 */
export class AnalysisEngineImpl implements AnalysisEngine {
  private parser: ASTParser;
  private options: Required<AnalysisEngineOptions>;
  private errorCount: number = 0;
  private parseErrors: Map<string, Error> = new Map();
  private fileMetrics: FilePerformanceMetrics[] = [];
  private analysisStartTime: number = 0;

  constructor(options: AnalysisEngineOptions = {}) {
    this.parser = new ASTParser();
    this.options = {
      onProgress: options.onProgress || (() => {}),
      continueOnError: options.continueOnError ?? true,
      maxErrors: options.maxErrors ?? Infinity,
      logWarnings: options.logWarnings ?? true,
      logPerformance: options.logPerformance ?? false,
    };
  }

  /**
   * Analyze a collection of files using the provided analyzers
   * 
   * @param files Files to analyze
   * @param analyzers Pattern analyzers to run
   * @returns Analysis result with aggregated issues
   */
  async analyze(files: FileInfo[], analyzers: PatternAnalyzer[]): Promise<AnalysisResult> {
    const startTime = Date.now();
    this.analysisStartTime = startTime;
    const allIssues: Issue[] = [];
    let analyzedFiles = 0;

    // Reset error tracking and metrics
    this.errorCount = 0;
    this.parseErrors.clear();
    this.fileMetrics = [];

    if (this.options.logPerformance) {
      console.log(`\n🔍 Starting analysis of ${files.length} files with ${analyzers.length} analyzers...`);
    }

    // Analyze each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileStartTime = Date.now();

      try {
        // Parse the file
        const parseStartTime = Date.now();
        const ast = await this.parseFile(file);
        const parseTime = Date.now() - parseStartTime;

        // Run applicable analyzers
        const analysisStartTime = Date.now();
        const fileIssues = await this.analyzeFile(file, ast, analyzers);
        const analysisTime = Date.now() - analysisStartTime;

        allIssues.push(...fileIssues);
        analyzedFiles++;

        // Record performance metrics for this file
        const totalFileTime = Date.now() - fileStartTime;
        const applicableAnalyzers = analyzers.filter(analyzer =>
          analyzer.getSupportedFileTypes().includes(file.category)
        );

        const metrics: FilePerformanceMetrics = {
          filePath: file.relativePath,
          parseTime,
          analysisTime,
          totalTime: totalFileTime,
          issuesFound: fileIssues.length,
          analyzersRun: applicableAnalyzers.length,
        };
        this.fileMetrics.push(metrics);

        // Log performance for slow files
        if (this.options.logPerformance && totalFileTime > 1000) {
          console.log(`⚠️  Slow file: ${file.relativePath} (${totalFileTime}ms)`);
        }

        // Report progress
        const elapsedTime = Date.now() - startTime;
        const averageTimePerFile = analyzedFiles > 0 ? elapsedTime / analyzedFiles : 0;
        
        this.options.onProgress({
          currentFile: i + 1,
          totalFiles: files.length,
          fileName: file.relativePath,
          issuesFound: allIssues.length,
          elapsedTime,
          averageTimePerFile,
        });

        // Clean up AST to free memory
        this.parser.removeFile(ast);
      } catch (error) {
        // Handle parsing/analysis errors
        this.handleError(file, error);

        // Check if we should stop due to too many errors
        if (this.errorCount >= this.options.maxErrors) {
          throw new AnalysisError(
            `Analysis stopped after ${this.errorCount} errors. Last error: ${file.relativePath}`,
            error instanceof Error ? error : undefined
          );
        }

        // Continue to next file if continueOnError is true
        if (!this.options.continueOnError) {
          throw new AnalysisError(
            `Analysis failed on file: ${file.relativePath}`,
            error instanceof Error ? error : undefined
          );
        }
      }
    }

    // Calculate duration
    const analysisDuration = Date.now() - startTime;

    // Log performance summary
    if (this.options.logPerformance) {
      this.logPerformanceSummary(analysisDuration, analyzedFiles, allIssues.length);
    }

    // Aggregate issues
    const issueCollection = this.aggregateIssues(allIssues);

    // Build result
    const result: AnalysisResult = {
      totalFiles: files.length,
      analyzedFiles,
      totalIssues: allIssues.length,
      issuesByType: issueCollection.groupedByType,
      issuesByCategory: issueCollection.groupedByCategory,
      issuesBySeverity: this.groupBySeverity(allIssues),
      analysisTimestamp: new Date(),
      analysisDuration,
    };

    return result;
  }

  /**
   * Parse a file into an AST
   * 
   * @param file File to parse
   * @returns Parsed AST
   * @throws ParseError if parsing fails
   */
  async parseFile(file: FileInfo): Promise<SourceFile> {
    try {
      return await this.parser.parseFile(file);
    } catch (error) {
      // Re-throw ParseError as-is
      if (error instanceof ParseError) {
        throw error;
      }

      // Wrap other errors
      throw new ParseError(
        `Failed to parse file: ${file.relativePath}`,
        file.path,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze a single file with applicable analyzers
   * 
   * @param file File information
   * @param ast Parsed AST
   * @param analyzers Available analyzers
   * @returns Issues found in the file
   */
  private async analyzeFile(
    file: FileInfo,
    ast: SourceFile,
    analyzers: PatternAnalyzer[]
  ): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Filter analyzers that support this file type
    const applicableAnalyzers = analyzers.filter(analyzer =>
      analyzer.getSupportedFileTypes().includes(file.category)
    );

    // Run each applicable analyzer
    for (const analyzer of applicableAnalyzers) {
      try {
        const analyzerIssues = await analyzer.analyze(file, ast);
        issues.push(...analyzerIssues);
      } catch (error) {
        // Log analyzer errors but continue with other analyzers
        if (this.options.logWarnings) {
          console.warn(
            `Analyzer "${analyzer.name}" failed on ${file.relativePath}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }

    return issues;
  }

  /**
   * Aggregate issues into various groupings
   * 
   * @param issues All detected issues
   * @returns Issue collection with groupings
   */
  aggregateIssues(issues: Issue[]): IssueCollection {
    const groupedByFile = new Map<string, Issue[]>();
    const groupedByType = new Map<IssueType, Issue[]>();
    const groupedByCategory = new Map<IssueCategory, Issue[]>();

    for (const issue of issues) {
      // Group by file
      const fileIssues = groupedByFile.get(issue.file) || [];
      fileIssues.push(issue);
      groupedByFile.set(issue.file, fileIssues);

      // Group by type
      const typeIssues = groupedByType.get(issue.type) || [];
      typeIssues.push(issue);
      groupedByType.set(issue.type, typeIssues);

      // Group by category
      const categoryIssues = groupedByCategory.get(issue.category) || [];
      categoryIssues.push(issue);
      groupedByCategory.set(issue.category, categoryIssues);
    }

    return {
      issues,
      groupedByFile,
      groupedByType,
      groupedByCategory,
    };
  }

  /**
   * Group issues by severity
   * 
   * @param issues All issues
   * @returns Map of severity to issues
   */
  private groupBySeverity(issues: Issue[]): Map<Severity, Issue[]> {
    const grouped = new Map<Severity, Issue[]>();

    for (const issue of issues) {
      const severityIssues = grouped.get(issue.severity) || [];
      severityIssues.push(issue);
      grouped.set(issue.severity, severityIssues);
    }

    return grouped;
  }

  /**
   * Handle an error during file analysis
   * 
   * @param file File that caused the error
   * @param error Error that occurred
   */
  private handleError(file: FileInfo, error: unknown): void {
    this.errorCount++;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.parseErrors.set(file.path, errorObj);

    if (this.options.logWarnings) {
      console.warn(
        `Error analyzing ${file.relativePath}:`,
        errorObj.message
      );
    }
  }

  /**
   * Get the number of errors encountered during analysis
   * 
   * @returns Error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Get all parsing errors encountered
   * 
   * @returns Map of file path to error
   */
  getParseErrors(): Map<string, Error> {
    return new Map(this.parseErrors);
  }

  /**
   * Clear all cached data and reset the parser
   */
  reset(): void {
    this.parser.clearAll();
    this.errorCount = 0;
    this.parseErrors.clear();
    this.fileMetrics = [];
    this.analysisStartTime = 0;
  }

  /**
   * Get the underlying AST parser
   * 
   * @returns AST parser instance
   */
  getParser(): ASTParser {
    return this.parser;
  }

  /**
   * Get performance metrics for all analyzed files
   * 
   * @returns Array of file performance metrics
   */
  getFileMetrics(): FilePerformanceMetrics[] {
    return [...this.fileMetrics];
  }

  /**
   * Get aggregated performance metrics
   * 
   * @returns Overall performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.fileMetrics.length === 0) {
      return {
        totalDuration: 0,
        averageTimePerFile: 0,
        fastestFile: null,
        slowestFile: null,
        totalParseTime: 0,
        totalAnalysisTime: 0,
        fileMetrics: [],
      };
    }

    const totalParseTime = this.fileMetrics.reduce((sum, m) => sum + m.parseTime, 0);
    const totalAnalysisTime = this.fileMetrics.reduce((sum, m) => sum + m.analysisTime, 0);
    const totalDuration = this.fileMetrics.reduce((sum, m) => sum + m.totalTime, 0);

    // Find fastest and slowest files
    let fastestFile = this.fileMetrics[0];
    let slowestFile = this.fileMetrics[0];

    for (const metric of this.fileMetrics) {
      if (metric.totalTime < fastestFile.totalTime) {
        fastestFile = metric;
      }
      if (metric.totalTime > slowestFile.totalTime) {
        slowestFile = metric;
      }
    }

    return {
      totalDuration,
      averageTimePerFile: totalDuration / this.fileMetrics.length,
      fastestFile,
      slowestFile,
      totalParseTime,
      totalAnalysisTime,
      fileMetrics: [...this.fileMetrics],
    };
  }

  /**
   * Log performance summary to console
   * 
   * @param totalDuration Total analysis duration in milliseconds
   * @param filesAnalyzed Number of files successfully analyzed
   * @param issuesFound Total number of issues found
   */
  private logPerformanceSummary(
    totalDuration: number,
    filesAnalyzed: number,
    issuesFound: number
  ): void {
    const metrics = this.getPerformanceMetrics();

    console.log('\n📊 Performance Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Duration:        ${this.formatDuration(totalDuration)}`);
    console.log(`Files Analyzed:        ${filesAnalyzed}`);
    console.log(`Issues Found:          ${issuesFound}`);
    console.log(`Average Time/File:     ${this.formatDuration(metrics.averageTimePerFile)}`);
    console.log(`Total Parse Time:      ${this.formatDuration(metrics.totalParseTime)}`);
    console.log(`Total Analysis Time:   ${this.formatDuration(metrics.totalAnalysisTime)}`);
    
    if (metrics.fastestFile) {
      console.log(`\n⚡ Fastest File:        ${metrics.fastestFile.filePath}`);
      console.log(`   Time:               ${this.formatDuration(metrics.fastestFile.totalTime)}`);
    }
    
    if (metrics.slowestFile) {
      console.log(`\n🐌 Slowest File:        ${metrics.slowestFile.filePath}`);
      console.log(`   Time:               ${this.formatDuration(metrics.slowestFile.totalTime)}`);
      console.log(`   Parse Time:         ${this.formatDuration(metrics.slowestFile.parseTime)}`);
      console.log(`   Analysis Time:      ${this.formatDuration(metrics.slowestFile.analysisTime)}`);
      console.log(`   Issues Found:       ${metrics.slowestFile.issuesFound}`);
      console.log(`   Analyzers Run:      ${metrics.slowestFile.analyzersRun}`);
    }

    // Show top 5 slowest files if there are more than 5
    if (this.fileMetrics.length > 5) {
      const sortedByTime = [...this.fileMetrics].sort((a, b) => b.totalTime - a.totalTime);
      const top5 = sortedByTime.slice(0, 5);
      
      console.log('\n🔝 Top 5 Slowest Files:');
      top5.forEach((metric, index) => {
        console.log(`   ${index + 1}. ${metric.filePath} (${this.formatDuration(metric.totalTime)})`);
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Format duration in milliseconds to human-readable string
   * 
   * @param ms Duration in milliseconds
   * @returns Formatted duration string
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }
}

/**
 * Create a new analysis engine instance
 * 
 * @param options Configuration options
 * @returns Analysis engine instance
 */
export function createAnalysisEngine(options?: AnalysisEngineOptions): AnalysisEngine {
  return new AnalysisEngineImpl(options);
}
