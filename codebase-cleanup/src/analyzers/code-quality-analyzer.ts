/**
 * CodeQualityAnalyzer
 * 
 * Analyzes code quality issues including:
 * - Confusing logic (deeply nested conditionals, complex boolean expressions)
 * - Code duplication (duplicate functions, similar code blocks, duplicate constants)
 * - Naming conventions (single-letter variables, inconsistent naming, unclear names)
 * - Legacy code (commented-out code blocks, unused exports)
 * 
 * Validates Requirements: 1.3, 1.5, 1.6, 6.5, 8.1, 8.2, 8.4, 8.5, 10.1, 10.4, 15.2
 */

import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { BasePatternAnalyzer } from './pattern-analyzer';
import { ASTQueryHelper } from '../utils/ast-parser';
import type { FileInfo, Issue, FileCategory } from '../types';

export class CodeQualityAnalyzer extends BasePatternAnalyzer {
  readonly name = 'CodeQualityAnalyzer';

  /**
   * Get supported file types - all TypeScript/JavaScript files
   */
  getSupportedFileTypes(): FileCategory[] {
    return ['component', 'api-route', 'service', 'type', 'util', 'middleware', 'config', 'other'];
  }

  /**
   * Analyze a file for code quality issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // 4.1: Detect confusing logic
    issues.push(...this.detectConfusingLogic(file, ast));

    // 4.2: Detect code duplication
    issues.push(...this.detectCodeDuplication(file, ast));

    // 4.3: Detect naming convention issues
    issues.push(...this.detectNamingIssues(file, ast));

    // 4.4: Detect legacy code
    issues.push(...this.detectLegacyCode(file, ast));

    return issues;
  }
