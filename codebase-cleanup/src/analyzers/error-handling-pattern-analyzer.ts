/**
 * Error Handling Pattern Analyzer
 *
 * Analyzes error handling patterns in the codebase to identify
 * inconsistencies, missing error handling, and opportunities for improvement.
 *
 * Detects:
 * - All error handling patterns (try-catch, error returns, etc.)
 * - Error response formats
 * - Missing error handling
 * - Inconsistent error logging
 * - Missing error recovery mechanisms
 * - Opportunities to use typed error classes
 */

import {
  SourceFile,
  Node,
  SyntaxKind,
  TryStatement,
  CatchClause,
  CallExpression,
} from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Pattern for tracking error handling approaches
 */
interface ErrorHandlingPattern {
  type:
    | "try-catch"
    | "error-return"
    | "error-callback"
    | "promise-catch"
    | "none";
  node: Node;
  file: string;
  hasLogging: boolean;
  hasRecovery: boolean;
  errorType: string | null; // Type of error being caught/handled
}

/**
 * Pattern for tracking error response formats
 */
interface ErrorResponsePattern {
  format: string; // JSON structure or pattern
  node: Node;
  file: string;
  statusCode?: number;
}

/**
 * Analyzer for error handling patterns
 */
export class ErrorHandlingPatternAnalyzer extends BasePatternAnalyzer {
  readonly name = "ErrorHandlingPatternAnalyzer";

  private errorHandlingPatterns: ErrorHandlingPattern[] = [];
  private errorResponsePatterns: ErrorResponsePattern[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["api-route", "service", "util", "middleware"];
  }

  /**
   * Analyze a file for error handling issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 12.1: Find all error handling patterns
    issues.push(...this.detectErrorHandlingPatterns(file, ast));
    issues.push(...this.trackErrorResponseFormats(file, ast));

    // Task 12.2: Detect inconsistencies across files (analyzed during pattern accumulation)
    issues.push(...this.detectCrossFileInconsistencies(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 12.2: Error Handling Inconsistency Detection (Cross-File Analysis)
  // ============================================================================

  /**
   * Detect inconsistencies in error handling patterns across files
   * This method analyzes accumulated patterns to find cross-file inconsistencies
   * Validates Requirements: 9.2, 9.3, 9.4, 9.5
   */
  private detectCrossFileInconsistencies(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // 1. Detect inconsistent error response formats across API routes
    issues.push(...this.detectInconsistentErrorResponseFormats(file));

    // 2. Detect missing error logging patterns
    issues.push(...this.detectMissingErrorLoggingPattern(file));

    // 3. Detect missing error recovery patterns
    issues.push(...this.detectMissingErrorRecoveryPattern(file));

    // 4. Identify opportunities for typed errors
    issues.push(...this.detectTypedErrorOpportunities(file));

    return issues;
  }

  /**
   * Detect inconsistent error response formats across API routes
   * Validates Requirement: 9.2
   */
  private detectInconsistentErrorResponseFormats(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    // Only analyze API routes
    if (file.category !== "api-route") {
      return issues;
    }

    // Get all unique error response formats across all files
    const allFormats = new Set(this.errorResponsePatterns.map((p) => p.format));

    // If we have multiple different formats, this indicates inconsistency
    if (allFormats.size > 1) {
      // Get the formats used in this specific file
      const fileFormats = this.errorResponsePatterns
        .filter((p) => p.file === file.relativePath)
        .map((p) => p.format);

      if (fileFormats.length > 0) {
        // Group patterns by file to show which files use which formats
        const formatsByFile = new Map<string, Set<string>>();
        for (const pattern of this.errorResponsePatterns) {
          if (!formatsByFile.has(pattern.file)) {
            formatsByFile.set(pattern.file, new Set());
          }
          formatsByFile.get(pattern.file)!.add(pattern.format);
        }

        // Get the most common format (the one that should be standardized to)
        const formatCounts = new Map<string, number>();
        for (const pattern of this.errorResponsePatterns) {
          formatCounts.set(
            pattern.format,
            (formatCounts.get(pattern.format) || 0) + 1,
          );
        }
        const mostCommonFormat = Array.from(formatCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0][0];

        // Check if this file uses a non-standard format
        const fileUsesNonStandardFormat = fileFormats.some(
          (f) => f !== mostCommonFormat,
        );

        if (fileUsesNonStandardFormat) {
          const firstErrorResponse = this.errorResponsePatterns.find(
            (p) => p.file === file.relativePath,
          );

          if (firstErrorResponse) {
            const affectedFiles = Array.from(formatsByFile.keys()).slice(0, 5);
            const moreFiles =
              formatsByFile.size > 5
                ? ` and ${formatsByFile.size - 5} more`
                : "";

            issues.push(
              this.createIssue({
                type: "inconsistent-pattern",
                severity: "medium",
                category: "error-handling",
                file: file.relativePath,
                node: firstErrorResponse.node,
                description: `Inconsistent error response format detected across API routes. Found ${allFormats.size} different formats across ${formatsByFile.size} files. This file uses a format that differs from the most common pattern.`,
                recommendation: `Standardize error response format across all API routes. The most common format is: ${mostCommonFormat}. Consider creating a shared error response utility function to ensure consistency. Affected files: ${affectedFiles.join(", ")}${moreFiles}`,
                estimatedEffort: "medium",
                tags: [
                  "error-handling",
                  "api-routes",
                  "consistency",
                  "cross-file",
                ],
              }),
            );
          }
        }
      }
    }

    return issues;
  }

  /**
   * Detect missing error logging patterns
   * Validates Requirement: 9.3
   */
  private detectMissingErrorLoggingPattern(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    // Analyze error handling patterns in this file
    const filePatternsWithoutLogging = this.errorHandlingPatterns.filter(
      (p) => p.file === file.relativePath && !p.hasLogging,
    );

    // Calculate the percentage of error handlers with logging across all files
    const totalPatterns = this.errorHandlingPatterns.length;
    const patternsWithLogging = this.errorHandlingPatterns.filter(
      (p) => p.hasLogging,
    ).length;
    const loggingPercentage =
      totalPatterns > 0 ? (patternsWithLogging / totalPatterns) * 100 : 0;

    // If most files have logging but this file doesn't, flag it
    if (loggingPercentage > 60 && filePatternsWithoutLogging.length > 0) {
      // Group by error handling type
      const byType = new Map<string, number>();
      for (const pattern of filePatternsWithoutLogging) {
        byType.set(pattern.type, (byType.get(pattern.type) || 0) + 1);
      }

      const firstPattern = filePatternsWithoutLogging[0];
      const typeBreakdown = Array.from(byType.entries())
        .map(([type, count]) => `${count} ${type}`)
        .join(", ");

      issues.push(
        this.createIssue({
          type: "missing-error-handling",
          severity: "medium",
          category: "error-handling",
          file: file.relativePath,
          node: firstPattern.node,
          description: `Missing error logging pattern detected. This file has ${filePatternsWithoutLogging.length} error handlers without logging, while ${loggingPercentage.toFixed(0)}% of error handlers across the codebase include logging. Types: ${typeBreakdown}`,
          recommendation:
            "Add error logging to all error handlers for debugging and monitoring. Use console.error, a logging library, or error monitoring service (e.g., Sentry). Consistent logging helps track issues in production.",
          estimatedEffort: "small",
          tags: ["error-handling", "logging", "observability", "cross-file"],
        }),
      );
    }

    return issues;
  }

  /**
   * Detect missing error recovery patterns
   * Validates Requirement: 9.4
   */
  private detectMissingErrorRecoveryPattern(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    // Analyze error handling patterns in this file
    const filePatternsWithoutRecovery = this.errorHandlingPatterns.filter(
      (p) => p.file === file.relativePath && !p.hasRecovery,
    );

    // Calculate the percentage of error handlers with recovery across all files
    const totalPatterns = this.errorHandlingPatterns.length;
    const patternsWithRecovery = this.errorHandlingPatterns.filter(
      (p) => p.hasRecovery,
    ).length;
    const recoveryPercentage =
      totalPatterns > 0 ? (patternsWithRecovery / totalPatterns) * 100 : 0;

    // If most files have recovery but this file doesn't, flag it
    if (recoveryPercentage > 50 && filePatternsWithoutRecovery.length > 2) {
      const firstPattern = filePatternsWithoutRecovery[0];

      issues.push(
        this.createIssue({
          type: "missing-error-handling",
          severity: "medium",
          category: "error-handling",
          file: file.relativePath,
          node: firstPattern.node,
          description: `Missing error recovery pattern detected. This file has ${filePatternsWithoutRecovery.length} error handlers without recovery logic, while ${recoveryPercentage.toFixed(0)}% of error handlers across the codebase include recovery mechanisms.`,
          recommendation:
            "Add error recovery logic to error handlers. Consider: retry logic for transient failures, fallback values for non-critical operations, graceful degradation, or proper error propagation to callers.",
          estimatedEffort: "medium",
          tags: ["error-handling", "recovery", "resilience", "cross-file"],
        }),
      );
    }

    return issues;
  }

  /**
   * Identify opportunities for typed errors
   * Validates Requirement: 9.5
   */
  private detectTypedErrorOpportunities(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    // Count how many error handlers use typed errors vs generic errors
    const filePatternsWithGenericErrors = this.errorHandlingPatterns.filter(
      (p) =>
        p.file === file.relativePath &&
        p.type === "try-catch" &&
        (!p.errorType || p.errorType === "any" || p.errorType === "unknown"),
    );

    // Calculate the percentage of typed errors across all files
    const totalTryCatchPatterns = this.errorHandlingPatterns.filter(
      (p) => p.type === "try-catch",
    ).length;
    const typedErrorPatterns = this.errorHandlingPatterns.filter(
      (p) =>
        p.type === "try-catch" &&
        p.errorType &&
        p.errorType !== "any" &&
        p.errorType !== "unknown",
    ).length;
    const typedErrorPercentage =
      totalTryCatchPatterns > 0
        ? (typedErrorPatterns / totalTryCatchPatterns) * 100
        : 0;

    // If there's a trend toward typed errors in the codebase, suggest it for this file
    if (typedErrorPercentage > 30 && filePatternsWithGenericErrors.length > 1) {
      const firstPattern = filePatternsWithGenericErrors[0];

      // Get examples of typed errors used in the codebase
      const typedErrorExamples = this.errorHandlingPatterns
        .filter(
          (p) =>
            p.errorType && p.errorType !== "any" && p.errorType !== "unknown",
        )
        .map((p) => p.errorType)
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .slice(0, 3);

      const examplesText =
        typedErrorExamples.length > 0
          ? ` Examples used in the codebase: ${typedErrorExamples.join(", ")}`
          : "";

      issues.push(
        this.createIssue({
          type: "type-safety",
          severity: "low",
          category: "error-handling",
          file: file.relativePath,
          node: firstPattern.node,
          description: `Opportunity for typed error classes detected. This file has ${filePatternsWithGenericErrors.length} catch blocks using generic error types, while ${typedErrorPercentage.toFixed(0)}% of catch blocks across the codebase use typed errors.${examplesText}`,
          recommendation:
            "Define custom error classes that extend Error for different error scenarios. This enables better error handling logic based on error type, improves type safety, and makes error handling more maintainable. Example: class ValidationError extends Error { constructor(field: string) { super(\`Invalid \${field}\`); } }",
          estimatedEffort: "medium",
          tags: ["error-handling", "type-safety", "typescript", "cross-file"],
        }),
      );
    }

    return issues;
  }

  // ============================================================================
  // Task 12.1: Error Handling Pattern Discovery
  // ============================================================================

  /**
   * Find all error handling patterns (try-catch, error returns, etc.)
   * Validates Requirements: 9.1
   */
  private detectErrorHandlingPatterns(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // 1. Detect try-catch blocks
    issues.push(...this.detectTryCatchPatterns(file, ast));

    // 2. Detect error return patterns (Supabase-style { data, error })
    issues.push(...this.detectErrorReturnPatterns(file, ast));

    // 3. Detect promise .catch() patterns
    issues.push(...this.detectPromiseCatchPatterns(file, ast));

    // 4. Detect error callback patterns
    issues.push(...this.detectErrorCallbackPatterns(file, ast));

    // 5. Detect functions/operations without error handling
    issues.push(...this.detectMissingErrorHandling(file, ast));

    return issues;
  }

  /**
   * Detect try-catch error handling patterns
   */
  private detectTryCatchPatterns(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const tryStatements = this.findNodesByKind(ast, SyntaxKind.TryStatement);

    for (const tryStmt of tryStatements) {
      const tryStatement = tryStmt as TryStatement;
      const catchClause = tryStatement.getCatchClause();

      if (catchClause) {
        const catchBlock = catchClause.getBlock();
        const catchText = catchBlock.getText();

        // Check if error is logged
        const hasLogging = this.hasErrorLogging(catchText);

        // Check if there's error recovery logic
        const hasRecovery = this.hasErrorRecovery(catchText);

        // Get error type if specified
        const errorType = this.getErrorType(catchClause);

        // Track this pattern
        this.errorHandlingPatterns.push({
          type: "try-catch",
          node: tryStmt,
          file: file.relativePath,
          hasLogging,
          hasRecovery,
          errorType,
        });

        // Check for empty catch blocks
        if (catchText.trim() === "{}" || catchText.trim() === "{\n}") {
          issues.push(
            this.createIssue({
              type: "missing-error-handling",
              severity: "high",
              category: "error-handling",
              file: file.relativePath,
              node: catchClause,
              description:
                "Empty catch block detected. Errors are being silently swallowed without any handling, logging, or recovery.",
              recommendation:
                "Add proper error handling in the catch block: log the error, notify monitoring systems, provide user feedback, or implement recovery logic.",
              estimatedEffort: "small",
              tags: ["error-handling", "empty-catch", "reliability"],
            }),
          );
        }

        // Check for missing error logging
        if (!hasLogging && catchText.length > 10) {
          issues.push(
            this.createIssue({
              type: "missing-error-handling",
              severity: "medium",
              category: "error-handling",
              file: file.relativePath,
              node: catchClause,
              description:
                "Catch block lacks error logging. Errors should be logged for debugging and monitoring purposes.",
              recommendation:
                "Add error logging using console.error, a logging library, or error monitoring service (e.g., Sentry, LogRocket).",
              estimatedEffort: "trivial",
              tags: ["error-handling", "logging", "observability"],
            }),
          );
        }

        // Check for generic error type (should use typed errors)
        if (!errorType || errorType === "any" || errorType === "unknown") {
          issues.push(
            this.createIssue({
              type: "type-safety",
              severity: "low",
              category: "error-handling",
              file: file.relativePath,
              node: catchClause,
              description:
                "Catch clause uses generic error type. Consider using typed error classes for better type safety and error handling.",
              recommendation:
                "Define custom error classes that extend Error and catch specific error types. This enables better error handling logic based on error type.",
              estimatedEffort: "small",
              tags: ["error-handling", "type-safety", "typescript"],
            }),
          );
        }

        // Check for catch-and-rethrow without adding context
        if (
          this.isCatchAndRethrow(catchText) &&
          !this.addsErrorContext(catchText)
        ) {
          issues.push(
            this.createIssue({
              type: "confusing-logic",
              severity: "low",
              category: "error-handling",
              file: file.relativePath,
              node: catchClause,
              description:
                "Catch block re-throws error without adding context. If not adding value, consider removing the try-catch or add contextual information.",
              recommendation:
                "Either remove the unnecessary try-catch or wrap the error with additional context before re-throwing.",
              estimatedEffort: "trivial",
              tags: ["error-handling", "code-quality"],
            }),
          );
        }
      } else {
        // Try without catch (only finally)
        issues.push(
          this.createIssue({
            type: "missing-error-handling",
            severity: "medium",
            category: "error-handling",
            file: file.relativePath,
            node: tryStmt,
            description:
              "Try statement without catch clause. Errors will propagate without being handled.",
            recommendation:
              "Add a catch clause to handle potential errors, or ensure errors are handled by a caller.",
            estimatedEffort: "small",
            tags: ["error-handling", "try-catch"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Detect error return patterns (e.g., { data, error } from Supabase)
   */
  private detectErrorReturnPatterns(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const variableDeclarations = this.getVariableDeclarations(ast);

    for (const varDecl of variableDeclarations) {
      const varText = varDecl.getText();

      // Check for destructuring pattern with 'error' property
      if (varText.includes("{") && varText.includes("error")) {
        // This looks like an error return pattern
        const hasErrorCheck = this.hasErrorCheckAfterDeclaration(varDecl);

        // Track this pattern
        this.errorHandlingPatterns.push({
          type: "error-return",
          node: varDecl,
          file: file.relativePath,
          hasLogging: false, // Will be checked in error check
          hasRecovery: hasErrorCheck,
          errorType: null,
        });

        // Check if error is actually checked
        if (!hasErrorCheck) {
          issues.push(
            this.createIssue({
              type: "missing-error-handling",
              severity: "high",
              category: "error-handling",
              file: file.relativePath,
              node: varDecl,
              description:
                "Error property destructured but never checked. This can lead to silent failures and unexpected behavior.",
              recommendation:
                "Add error checking after the operation: if (error) { /* handle error */ }",
              estimatedEffort: "trivial",
              tags: ["error-handling", "error-return", "reliability"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect promise .catch() patterns
   */
  private detectPromiseCatchPatterns(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    for (const call of callExpressions) {
      const callText = call.getText();

      // Check if this is a .catch() call
      if (callText.includes(".catch(")) {
        const catchHandler = this.extractCatchHandler(call);

        if (catchHandler) {
          const hasLogging = this.hasErrorLogging(catchHandler);
          const hasRecovery = this.hasErrorRecovery(catchHandler);

          // Track this pattern
          this.errorHandlingPatterns.push({
            type: "promise-catch",
            node: call,
            file: file.relativePath,
            hasLogging,
            hasRecovery,
            errorType: null,
          });

          // Check for empty catch handler
          if (
            catchHandler.trim() === "{}" ||
            catchHandler.trim() === "() => {}"
          ) {
            issues.push(
              this.createIssue({
                type: "missing-error-handling",
                severity: "high",
                category: "error-handling",
                file: file.relativePath,
                node: call,
                description:
                  "Empty .catch() handler detected. Errors are being silently swallowed.",
                recommendation:
                  "Add proper error handling in the .catch() handler: log the error, notify users, or implement recovery logic.",
                estimatedEffort: "small",
                tags: ["error-handling", "promise", "reliability"],
              }),
            );
          }

          // Check for missing logging
          if (!hasLogging && catchHandler.length > 10) {
            issues.push(
              this.createIssue({
                type: "missing-error-handling",
                severity: "medium",
                category: "error-handling",
                file: file.relativePath,
                node: call,
                description: ".catch() handler lacks error logging.",
                recommendation:
                  "Add error logging in the .catch() handler for debugging and monitoring.",
                estimatedEffort: "trivial",
                tags: ["error-handling", "logging", "promise"],
              }),
            );
          }
        }
      }

      // Check for promises without .catch() or try-catch
      if (this.isPromiseCall(call) && !this.hasErrorHandling(call)) {
        issues.push(
          this.createIssue({
            type: "missing-error-handling",
            severity: "high",
            category: "error-handling",
            file: file.relativePath,
            node: call,
            description:
              "Promise-based operation without error handling. This can lead to unhandled promise rejections.",
            recommendation:
              "Add .catch() handler or wrap in try-catch block if using async/await.",
            estimatedEffort: "small",
            tags: ["error-handling", "promise", "unhandled-rejection"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Detect error callback patterns (Node.js style)
   */
  private detectErrorCallbackPatterns(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    for (const call of callExpressions) {
      if (!Node.isCallExpression(call)) continue;
      const callExpr = call as CallExpression;
      const args = callExpr.getArguments();

      // Check for callback pattern: function(err, result)
      for (const arg of args) {
        if (Node.isArrowFunction(arg) || Node.isFunctionExpression(arg)) {
          const params = arg.getParameters();

          // Check if first parameter looks like an error parameter
          if (params.length > 0) {
            const firstParam = params[0];
            const paramName = firstParam.getName();

            if (
              paramName.toLowerCase().includes("err") ||
              paramName.toLowerCase().includes("error")
            ) {
              const body = arg.getBody();
              const bodyText = body?.getText() || "";

              const hasErrorCheck =
                bodyText.includes("if") && bodyText.includes(paramName);
              const hasLogging = this.hasErrorLogging(bodyText);

              // Track this pattern
              this.errorHandlingPatterns.push({
                type: "error-callback",
                node: arg,
                file: file.relativePath,
                hasLogging,
                hasRecovery: hasErrorCheck,
                errorType: null,
              });

              // Check if error parameter is checked
              if (!hasErrorCheck) {
                issues.push(
                  this.createIssue({
                    type: "missing-error-handling",
                    severity: "high",
                    category: "error-handling",
                    file: file.relativePath,
                    node: arg,
                    description: `Error callback parameter '${paramName}' is not checked. This can lead to silent failures.`,
                    recommendation: `Add error checking at the start of the callback: if (${paramName}) { /* handle error */ }`,
                    estimatedEffort: "trivial",
                    tags: ["error-handling", "callback", "node-style"],
                  }),
                );
              }
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Detect functions/operations without error handling
   */
  private detectMissingErrorHandling(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Check async functions without try-catch
    const functions = [
      ...ast.getFunctions(),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      // Check if function is async
      const isAsync = this.isAsyncFunction(func);

      if (isAsync) {
        const body = this.getFunctionBody(func);
        if (!body) continue;

        const bodyText = body.getText();

        // Check if function has any error handling
        const hasTryCatch =
          bodyText.includes("try") && bodyText.includes("catch");
        const hasErrorReturn =
          bodyText.includes("error") && bodyText.includes("return");
        const hasCatchCall = bodyText.includes(".catch(");

        if (!hasTryCatch && !hasErrorReturn && !hasCatchCall) {
          // Check if function contains risky operations
          const hasRiskyOperations = this.hasRiskyOperations(bodyText);

          if (hasRiskyOperations) {
            const funcName = this.getFunctionName(func) || "anonymous";

            issues.push(
              this.createIssue({
                type: "missing-error-handling",
                severity: "medium",
                category: "error-handling",
                file: file.relativePath,
                node: func,
                description: `Async function '${funcName}' contains operations that may fail but lacks error handling.`,
                recommendation:
                  "Add try-catch block or ensure errors are properly propagated to callers.",
                estimatedEffort: "small",
                tags: ["error-handling", "async", "reliability"],
              }),
            );
          }
        }
      }
    }

    return issues;
  }

  /**
   * Track error response formats in API routes
   */
  private trackErrorResponseFormats(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Only analyze API routes
    if (file.category !== "api-route") {
      return issues;
    }

    const returnStatements = this.findNodesByKind(
      ast,
      SyntaxKind.ReturnStatement,
    );
    const errorResponses: Array<{
      format: string;
      node: Node;
      statusCode?: number;
    }> = [];

    for (const returnStmt of returnStatements) {
      const returnText = returnStmt.getText();

      // Check if this looks like an error response
      if (this.isErrorResponse(returnText)) {
        const format = this.extractResponseFormat(returnText);
        const statusCode = this.extractStatusCode(returnText);

        errorResponses.push({
          format,
          node: returnStmt,
          statusCode,
        });

        // Track this pattern
        this.errorResponsePatterns.push({
          format,
          node: returnStmt,
          file: file.relativePath,
          statusCode,
        });
      }
    }

    // Check for inconsistent error response formats
    if (errorResponses.length > 1) {
      const uniqueFormats = new Set(errorResponses.map((r) => r.format));

      if (uniqueFormats.size > 1) {
        issues.push(
          this.createIssue({
            type: "inconsistent-pattern",
            severity: "medium",
            category: "error-handling",
            file: file.relativePath,
            node: errorResponses[0].node,
            description: `Inconsistent error response formats detected. Found ${uniqueFormats.size} different formats in this file.`,
            recommendation:
              "Standardize error response format across all API routes. Use a consistent structure like { error: string, message: string, statusCode: number }.",
            estimatedEffort: "small",
            tags: ["error-handling", "api-routes", "consistency"],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if text contains error logging
   */
  private hasErrorLogging(text: string): boolean {
    const loggingPatterns = [
      "console.error",
      "console.log",
      "logger.error",
      "logger.warn",
      "log.error",
      "log.warn",
      "Sentry.captureException",
      "captureException",
      "trackError",
      "logError",
    ];

    return loggingPatterns.some((pattern) => text.includes(pattern));
  }

  /**
   * Check if text contains error recovery logic
   */
  private hasErrorRecovery(text: string): boolean {
    const recoveryPatterns = [
      "retry",
      "fallback",
      "default",
      "alternative",
      "recover",
      "return",
      "throw",
    ];

    return recoveryPatterns.some((pattern) =>
      text.toLowerCase().includes(pattern),
    );
  }

  /**
   * Get error type from catch clause
   */
  private getErrorType(catchClause: CatchClause): string | null {
    const variableDecl = catchClause.getVariableDeclaration();
    if (!variableDecl) return null;

    const typeNode = variableDecl.getTypeNode();
    if (!typeNode) return null;

    return typeNode.getText();
  }

  /**
   * Check if catch block re-throws error
   */
  private isCatchAndRethrow(catchText: string): boolean {
    return catchText.includes("throw");
  }

  /**
   * Check if error context is added before re-throwing
   */
  private addsErrorContext(catchText: string): boolean {
    // Look for patterns that add context
    return (
      catchText.includes("new Error") ||
      catchText.includes("Error(") ||
      catchText.includes("message") ||
      catchText.includes("wrap")
    );
  }

  /**
   * Check if error is checked after declaration
   */
  private hasErrorCheckAfterDeclaration(varDecl: Node): boolean {
    const parent = varDecl.getParent()?.getParent(); // Get the statement's parent block
    if (!parent) return false;

    const siblings = parent.getChildren();
    const declIndex = siblings.indexOf(varDecl.getParent()!);

    // Check next few statements for error check
    for (
      let i = declIndex + 1;
      i < Math.min(declIndex + 5, siblings.length);
      i++
    ) {
      const sibling = siblings[i];
      const siblingText = sibling.getText();

      if (siblingText.includes("if") && siblingText.includes("error")) {
        return true;
      }
      if (siblingText.includes("throw") && siblingText.includes("error")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract catch handler code from .catch() call
   */
  private extractCatchHandler(call: Node): string | null {
    const callText = call.getText();
    // Use non-greedy match and handle multiline
    const catchMatch = callText.match(/\.catch\(([\s\S]*?)\)(?:\.|;|$)/);

    if (catchMatch && catchMatch[1]) {
      return catchMatch[1];
    }

    return null;
  }

  /**
   * Check if call expression is a promise
   */
  private isPromiseCall(call: Node): boolean {
    const callText = call.getText();

    // Check for common promise-returning patterns
    return (
      callText.includes("await") ||
      callText.includes(".then(") ||
      callText.includes("Promise.") ||
      callText.includes("async") ||
      callText.includes("fetch(") ||
      callText.includes(".json()") ||
      callText.includes("supabase.")
    );
  }

  /**
   * Check if node has error handling (try-catch or .catch())
   */
  private hasErrorHandling(node: Node): boolean {
    // Check if inside try-catch
    let current: Node | undefined = node;
    while (current) {
      if (Node.isTryStatement(current)) {
        return true;
      }
      current = current.getParent();
    }

    // Check if has .catch() in the call chain
    const nodeText = node.getText();
    if (nodeText.includes(".catch(")) {
      return true;
    }

    return false;
  }

  /**
   * Check if function is async
   */
  private isAsyncFunction(func: Node): boolean {
    const funcText = func.getText();
    return (
      funcText.startsWith("async ") ||
      funcText.includes("async(") ||
      funcText.includes("async ")
    );
  }

  /**
   * Get function body
   */
  private getFunctionBody(func: Node): Node | null {
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isFunctionExpression(func) ||
      Node.isMethodDeclaration(func)
    ) {
      return func.getBody() || null;
    }
    if (Node.isArrowFunction(func)) {
      return func.getBody();
    }
    return null;
  }

  /**
   * Get function name
   */
  private getFunctionName(func: Node): string | null {
    return this.getNodeName(func) || null;
  }

  /**
   * Check if function body contains risky operations
   */
  private hasRiskyOperations(bodyText: string): boolean {
    const riskyPatterns = [
      "fetch(",
      "axios.",
      "http.",
      "https.",
      "supabase.",
      "db.",
      "database.",
      "fs.",
      "readFile",
      "writeFile",
      "JSON.parse",
      "JSON.stringify",
      "parseInt",
      "parseFloat",
    ];

    return riskyPatterns.some((pattern) => bodyText.includes(pattern));
  }

  /**
   * Check if return statement is an error response
   */
  private isErrorResponse(returnText: string): boolean {
    const errorIndicators = [
      "error",
      "Error",
      "status: 4",
      "status: 5",
      "statusCode: 4",
      "statusCode: 5",
      "NextResponse.json",
      "Response.json",
    ];

    return errorIndicators.some((indicator) => returnText.includes(indicator));
  }

  /**
   * Extract response format structure
   */
  private extractResponseFormat(returnText: string): string {
    // Try to extract the JSON structure
    const jsonMatch = returnText.match(/\{[^}]+\}/);
    if (jsonMatch) {
      // Normalize the format by removing values
      return jsonMatch[0]
        .replace(/"[^"]*"/g, '"..."')
        .replace(/\d+/g, "N")
        .replace(/\s+/g, " ");
    }

    return "unknown";
  }

  /**
   * Extract HTTP status code from response
   */
  private extractStatusCode(returnText: string): number | undefined {
    const statusMatch = returnText.match(/status:\s*(\d+)/);
    if (statusMatch) {
      return parseInt(statusMatch[1], 10);
    }

    const statusCodeMatch = returnText.match(/statusCode:\s*(\d+)/);
    if (statusCodeMatch) {
      return parseInt(statusCodeMatch[1], 10);
    }

    return undefined;
  }
}
