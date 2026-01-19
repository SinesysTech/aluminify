/**
 * Backward Compatibility Analyzer
 *
 * Analyzes code for backward compatibility patterns that may no longer be needed.
 *
 * Detects:
 * - Version checks and feature flags for deprecated features
 * - Polyfills and shims that are no longer needed
 * - Migration code that has completed its purpose
 * - Dual implementations supporting old and new patterns
 *
 * Validates Requirements: 1.2, 13.1, 13.2, 13.3, 13.4
 */

import { SourceFile, Node } from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Pattern for tracking backward compatibility code
 */
interface CompatibilityPattern {
  type:
    | "version-check"
    | "feature-flag"
    | "polyfill"
    | "migration"
    | "dual-implementation";
  node: Node;
  file: string;
  description: string;
}

/**
 * Analyzer for backward compatibility patterns
 */
export class BackwardCompatibilityAnalyzer extends BasePatternAnalyzer {
  readonly name = "BackwardCompatibilityAnalyzer";

  private compatibilityPatterns: CompatibilityPattern[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["component", "api-route", "service", "util", "middleware", "other"];
  }

  /**
   * Analyze a file for backward compatibility patterns
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Detect version checks and feature flags (Requirement 13.1)
    issues.push(...this.detectVersionChecks(file, ast));
    issues.push(...this.detectFeatureFlags(file, ast));

    // Detect polyfills and shims (Requirement 13.2)
    issues.push(...this.detectPolyfills(file, ast));

    // Detect migration code patterns (Requirement 13.3)
    issues.push(...this.detectMigrationCode(file, ast));

    // Detect dual implementations (Requirement 13.4)
    issues.push(...this.detectDualImplementations(file, ast));

    return issues;
  }

  // ============================================================================
  // Version Checks and Feature Flags (Requirement 13.1)
  // ============================================================================

  /**
   * Detect version checks for deprecated features
   * Validates Requirement: 13.1
   */
  private detectVersionChecks(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Find all if statements and conditional expressions
    const conditionals = [
      ...this.getIfStatements(ast),
      ...this.findNodesByKind(ast, SyntaxKind.ConditionalExpression),
    ];

    for (const conditional of conditionals) {
      const conditionText = conditional.getText().toLowerCase();

      // Look for version-related checks
      const versionPatterns = [
        /version\s*[<>=!]+/,
        /v\d+\s*[<>=!]+/,
        /semver/,
        /compareversion/,
        /versioncompare/,
        /process\.version/,
        /node\.version/,
        /browser\.version/,
        /\blegacy\b.*version/,
        /\bold.*version/,
        /deprecated.*version/,
      ];

      const hasVersionCheck = versionPatterns.some((pattern) =>
        pattern.test(conditionText),
      );

      if (hasVersionCheck) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "version-check",
          node: conditional,
          file: file.relativePath,
          description: "Version check detected",
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: conditional,
            description:
              "Version check detected. This may be supporting an old version that is no longer needed.",
            recommendation:
              "Review if this version check is still necessary. If the minimum supported version has been updated, this check can be removed. Document the reason if the check must remain.",
            estimatedEffort: "small",
            tags: ["backward-compatibility", "version-check", "legacy"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Detect feature flags for deprecated features
   * Validates Requirement: 13.1
   */
  private detectFeatureFlags(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Find all if statements and conditional expressions
    const conditionals = [
      ...this.getIfStatements(ast),
      ...this.findNodesByKind(ast, SyntaxKind.ConditionalExpression),
    ];

    for (const conditional of conditionals) {
      const conditionText = conditional.getText().toLowerCase();

      // Look for feature flag patterns
      const featureFlagPatterns = [
        /feature.*flag/,
        /flag.*feature/,
        /enable.*feature/,
        /feature.*enabled/,
        /use.*legacy/,
        /legacy.*mode/,
        /old.*implementation/,
        /new.*implementation/,
        /experimental/,
        /beta.*feature/,
        /deprecated.*feature/,
        /\bff_/, // Common feature flag prefix
        /feature_/,
        /flag_/,
      ];

      const hasFeatureFlag = featureFlagPatterns.some((pattern) =>
        pattern.test(conditionText),
      );

      if (hasFeatureFlag) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "feature-flag",
          node: conditional,
          file: file.relativePath,
          description: "Feature flag detected",
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: conditional,
            description:
              "Feature flag detected. This may be controlling a feature that should now be permanently enabled or removed.",
            recommendation:
              "Review if this feature flag is still needed. If the feature is stable and should be permanently enabled, remove the flag and the conditional logic. If the feature is deprecated, remove both branches.",
            estimatedEffort: "small",
            tags: ["backward-compatibility", "feature-flag", "conditional"],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Polyfills and Shims (Requirement 13.2)
  // ============================================================================

  /**
   * Detect polyfills and shims that may no longer be needed
   * Validates Requirement: 13.2
   */
  private detectPolyfills(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Check imports for polyfill libraries
    const imports = this.getImportDeclarations(ast);

    for (const importDecl of imports) {
      const importText = importDecl.getText().toLowerCase();

      // Common polyfill patterns
      const polyfillPatterns = [
        /polyfill/,
        /shim/,
        /core-js/,
        /babel-polyfill/,
        /regenerator-runtime/,
        /whatwg-fetch/,
        /promise-polyfill/,
        /es6-promise/,
        /object-assign/,
        /array-includes/,
        /string-includes/,
        /array\.prototype/,
        /object\.entries/,
        /object\.values/,
      ];

      const isPolyfill = polyfillPatterns.some((pattern) =>
        pattern.test(importText),
      );

      if (isPolyfill) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "polyfill",
          node: importDecl,
          file: file.relativePath,
          description: "Polyfill import detected",
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: importDecl,
            description:
              "Polyfill or shim import detected. This may no longer be needed if the minimum supported environment has been updated.",
            recommendation:
              "Check if this polyfill is still necessary based on your target browsers/Node.js versions. Modern environments may natively support these features. Use tools like caniuse.com or node.green to verify.",
            estimatedEffort: "small",
            tags: ["backward-compatibility", "polyfill", "modernization"],
          }),
        );
      }
    }

    // Check for manual polyfill implementations
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getArrowFunctions(ast),
    ];

    for (const func of functions) {
      const funcText = func.getText();
      const funcName = this.getNodeName(func) || "";

      // Look for polyfill-style implementations
      const polyfillIndicators = [
        /if\s*\(\s*!.*\.prototype\./, // if (!Array.prototype.includes)
        /typeof.*===\s*['"]undefined['"]/, // typeof Promise === 'undefined'
        /\|\|\s*function/, // window.Promise || function
        /window\.\w+\s*=\s*window\.\w+\s*\|\|/, // window.Promise = window.Promise ||
      ];

      const looksLikePolyfill = polyfillIndicators.some((pattern) =>
        pattern.test(funcText),
      );

      if (
        looksLikePolyfill ||
        funcName.toLowerCase().includes("polyfill") ||
        funcName.toLowerCase().includes("shim")
      ) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "polyfill",
          node: func,
          file: file.relativePath,
          description: "Manual polyfill implementation detected",
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: func,
            description: `Manual polyfill implementation detected${funcName ? ` in '${funcName}'` : ""}. This may no longer be needed for modern environments.`,
            recommendation:
              "Verify if this polyfill is still necessary. If supporting only modern browsers/Node.js versions, native implementations should be available. Consider removing or documenting why it must remain.",
            estimatedEffort: "small",
            tags: [
              "backward-compatibility",
              "polyfill",
              "manual-implementation",
            ],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Migration Code (Requirement 13.3)
  // ============================================================================

  /**
   * Detect migration code that has completed its purpose
   * Validates Requirement: 13.3
   */
  private detectMigrationCode(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Look for migration-related comments
    const allComments = this.getAllComments(ast);

    for (const comment of allComments) {
      const commentText = comment.text.toLowerCase();

      const migrationPatterns = [
        /migration/,
        /migrate/,
        /migrating/,
        /temporary.*until/,
        /todo.*remove/,
        /fixme.*remove/,
        /deprecated.*remove/,
        /legacy.*remove/,
        /transitional/,
        /backwards.*compat/,
        /backward.*compat/,
      ];

      const isMigrationComment = migrationPatterns.some((pattern) =>
        pattern.test(commentText),
      );

      if (isMigrationComment) {
        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: comment.node,
            description:
              "Migration-related comment detected. This suggests temporary code that may be ready for removal.",
            recommendation:
              "Review if the migration is complete. If the old system is no longer in use, remove the migration code. If still needed, update the comment with a clear timeline or condition for removal.",
            estimatedEffort: "medium",
            tags: ["backward-compatibility", "migration", "temporary"],
          }),
        );
      }
    }

    // Look for functions with migration-related names
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      const funcName = this.getNodeName(func) || "";
      const funcNameLower = funcName.toLowerCase();

      const migrationNamePatterns = [
        "migrate",
        "migration",
        "legacy",
        "deprecated",
        "old",
        "temporary",
        "transitional",
        "compat",
        "compatibility",
        "fallback",
      ];

      const hasMigrationName = migrationNamePatterns.some((pattern) =>
        funcNameLower.includes(pattern),
      );

      if (hasMigrationName) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "migration",
          node: func,
          file: file.relativePath,
          description: `Migration function '${funcName}' detected`,
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: func,
            description: `Function '${funcName}' appears to be migration-related code. This may be temporary code that can be removed.`,
            recommendation:
              "Verify if this migration function is still needed. Check if all data/code has been migrated to the new system. If complete, remove this function and its callers.",
            estimatedEffort: "medium",
            tags: ["backward-compatibility", "migration", "function"],
          }),
        );
      }
    }

    // Look for variables with migration-related names
    const variables = this.getVariableDeclarations(ast);

    for (const variable of variables) {
      const varName = this.getNodeName(variable) || "";
      const varNameLower = varName.toLowerCase();

      const migrationNamePatterns = [
        "migrate",
        "migration",
        "legacy",
        "deprecated",
        "old",
        "temporary",
        "temp",
        "transitional",
      ];

      const hasMigrationName = migrationNamePatterns.some((pattern) =>
        varNameLower.includes(pattern),
      );

      if (hasMigrationName && this.isExported(variable)) {
        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: variable,
            description: `Exported variable '${varName}' appears to be migration-related. This may be temporary code.`,
            recommendation:
              "Review if this variable is still needed. If the migration is complete, remove it and update all references.",
            estimatedEffort: "small",
            tags: ["backward-compatibility", "migration", "variable"],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Dual Implementations (Requirement 13.4)
  // ============================================================================

  /**
   * Detect dual implementations supporting old and new patterns
   * Validates Requirement: 13.4
   */
  private detectDualImplementations(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Look for functions with "old" and "new" variants
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getMethodDeclarations(ast),
    ];

    // Group functions by base name (without old/new/legacy/v1/v2 suffixes)
    const functionGroups = new Map<string, Node[]>();

    for (const func of functions) {
      const funcName = this.getNodeName(func);
      if (!funcName) continue;

      // Extract base name by removing common suffixes
      const baseName = funcName
        .replace(/Old$/i, "")
        .replace(/New$/i, "")
        .replace(/Legacy$/i, "")
        .replace(/V\d+$/i, "")
        .replace(/Version\d+$/i, "")
        .replace(/Deprecated$/i, "");

      if (baseName !== funcName) {
        if (!functionGroups.has(baseName)) {
          functionGroups.set(baseName, []);
        }
        functionGroups.get(baseName)!.push(func);
      }
    }

    // Check for groups with multiple implementations
    for (const [_baseName, funcs] of functionGroups) {
      if (funcs.length > 1) {
        const funcNames = funcs.map((f) => this.getNodeName(f)).filter(Boolean);

        // Track this pattern
        this.compatibilityPatterns.push({
          type: "dual-implementation",
          node: funcs[0],
          file: file.relativePath,
          description: `Dual implementation detected: ${funcNames.join(", ")}`,
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "high",
            category: "general",
            file: file.relativePath,
            node: funcs[0],
            description: `Dual implementation detected: ${funcNames.join(", ")}. Multiple versions of the same functionality suggest backward compatibility code.`,
            recommendation:
              "Consolidate to a single implementation. If the old version is no longer needed, remove it and update all callers. If both are needed, document why and when the old version can be removed.",
            estimatedEffort: "medium",
            tags: [
              "backward-compatibility",
              "dual-implementation",
              "consolidation",
            ],
          }),
        );
      }
    }

    // Look for conditional logic that switches between implementations
    const conditionals = this.getIfStatements(ast);

    for (const conditional of conditionals) {
      const conditionText = conditional.getText().toLowerCase();

      // Look for patterns that suggest dual implementation switching
      const dualImplPatterns = [
        /use.*old/,
        /use.*new/,
        /use.*legacy/,
        /old.*implementation/,
        /new.*implementation/,
        /legacy.*path/,
        /modern.*path/,
        /fallback.*to/,
        /prefer.*new/,
        /prefer.*old/,
      ];

      const hasDualImplPattern = dualImplPatterns.some((pattern) =>
        pattern.test(conditionText),
      );

      if (hasDualImplPattern) {
        // Track this pattern
        this.compatibilityPatterns.push({
          type: "dual-implementation",
          node: conditional,
          file: file.relativePath,
          description: "Conditional dual implementation detected",
        });

        issues.push(
          this.createIssue({
            type: "backward-compatibility",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: conditional,
            description:
              "Conditional logic switching between old and new implementations detected. This adds complexity and may no longer be needed.",
            recommendation:
              "Review if both code paths are still necessary. If the old implementation is no longer used, remove it and simplify the logic. Document the reason if both paths must remain.",
            estimatedEffort: "medium",
            tags: [
              "backward-compatibility",
              "dual-implementation",
              "conditional",
            ],
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
   * Get all comments in the source file
   */
  private getAllComments(ast: SourceFile): Array<{ text: string; node: Node }> {
    const comments: Array<{ text: string; node: Node }> = [];
    const fullText = ast.getFullText();

    // Traverse all nodes to find comments
    ast.forEachDescendant((node) => {
      const leadingComments = node.getLeadingCommentRanges();
      for (const range of leadingComments) {
        const text = fullText.substring(range.getPos(), range.getEnd());
        comments.push({ text, node });
      }

      const trailingComments = node.getTrailingCommentRanges();
      for (const range of trailingComments) {
        const text = fullText.substring(range.getPos(), range.getEnd());
        comments.push({ text, node });
      }
    });

    return comments;
  }

  /**
   * Get function body as a node
   */
  private getFunctionBody(func: Node): Node | undefined {
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isMethodDeclaration(func) ||
      Node.isArrowFunction(func) ||
      Node.isFunctionExpression(func)
    ) {
      return func.getBody();
    }
    return undefined;
  }
}
