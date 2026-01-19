/**
 * CodeQualityAnalyzer
 *
 * Analyzes code quality issues including:
 * - Confusing logic (deeply nested conditionals, complex boolean expressions)
 * - Code duplication
 * - Poor naming conventions
 * - Legacy code patterns
 *
 * Validates Requirements: 1.3, 1.5, 1.6, 6.5, 8.1, 8.2, 8.4, 8.5, 10.1, 10.4, 15.2
 */

import { SourceFile, Node, SyntaxKind, ParameterDeclaration } from "ts-morph";
import { randomUUID } from "node:crypto";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Analyzer for code quality issues
 */
export class CodeQualityAnalyzer extends BasePatternAnalyzer {
  readonly name = "CodeQualityAnalyzer";

  /**
   * Get supported file types - all code files
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["component", "api-route", "service", "util", "middleware", "other"];
  }

  // Store functions and constants across files for cross-file duplication detection
  private allFunctions: Map<
    string,
    { file: string; node: Node; signature: string }[]
  > = new Map();
  private allConstants: Map<
    string,
    { file: string; node: Node; value: string }[]
  > = new Map();

  /**
   * Analyze a file for code quality issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Detect confusing logic patterns
    issues.push(...this.detectDeeplyNestedConditionals(file, ast));
    issues.push(...this.detectComplexBooleanExpressions(file, ast));
    issues.push(...this.detectUnclearControlFlow(file, ast));

    // Detect code duplication patterns
    issues.push(...this.detectDuplicateFunctions(file, ast));
    issues.push(...this.detectSimilarCodeBlocks(file, ast));
    issues.push(...this.detectDuplicateConstants(file, ast));

    // Detect naming convention issues
    issues.push(...this.detectSingleLetterVariables(file, ast));
    issues.push(...this.detectInconsistentNaming(file, ast));
    issues.push(...this.detectUnclearNames(file, ast));

    // Detect legacy code patterns
    issues.push(...this.detectCommentedOutCode(file, ast));
    issues.push(...this.detectUnusedExports(file, ast));

    return issues;
  }

  // ============================================================================
  // Confusing Logic Detection (Requirement 1.5)
  // ============================================================================

  /**
   * Detect deeply nested conditionals (>3 levels)
   * Validates: Requirements 1.5
   */
  private detectDeeplyNestedConditionals(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const MAX_NESTING_DEPTH = 3;

    // Find all if statements
    const ifStatements = this.getIfStatements(ast);

    for (const ifStatement of ifStatements) {
      const depth = this.calculateConditionalNestingDepth(ifStatement);

      if (depth > MAX_NESTING_DEPTH) {
        issues.push(
          this.createIssue({
            type: "confusing-logic",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: ifStatement,
            description: `Deeply nested conditional detected (${depth} levels deep). This makes the code hard to understand and maintain.`,
            recommendation:
              `Refactor this nested conditional by:\n` +
              `1. Extracting nested logic into separate functions\n` +
              `2. Using early returns to reduce nesting\n` +
              `3. Combining conditions where appropriate\n` +
              `4. Consider using guard clauses or strategy pattern`,
            estimatedEffort: "small",
            tags: ["confusing-logic", "nested-conditionals", "maintainability"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Calculate the nesting depth of conditionals within a node
   * Only counts if/else statements, not other block structures
   */
  private calculateConditionalNestingDepth(node: Node): number {
    let maxDepth = 0;

    const traverse = (n: Node, currentDepth: number) => {
      const kind = n.getKind();

      // Only count if statements for conditional nesting
      if (kind === SyntaxKind.IfStatement) {
        const newDepth = currentDepth + 1;
        maxDepth = Math.max(maxDepth, newDepth);

        // Continue traversing children with increased depth
        n.forEachChild((child) => traverse(child, newDepth));
      } else {
        // For non-if statements, continue with same depth
        n.forEachChild((child) => traverse(child, currentDepth));
      }
    };

    traverse(node, 0);
    return maxDepth;
  }

  /**
   * Detect complex boolean expressions (>3 operators)
   * Validates: Requirements 1.5
   */
  private detectComplexBooleanExpressions(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const MAX_BOOLEAN_OPERATORS = 3;

    // Find all binary expressions (which include boolean operations)
    const binaryExpressions = this.findNodesByKind(
      ast,
      SyntaxKind.BinaryExpression,
    );

    for (const expr of binaryExpressions) {
      const operatorCount = this.countBooleanOperators(expr);

      if (operatorCount > MAX_BOOLEAN_OPERATORS) {
        issues.push(
          this.createIssue({
            type: "confusing-logic",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: expr,
            description: `Complex boolean expression with ${operatorCount} operators. This makes the logic difficult to understand and test.`,
            recommendation:
              `Simplify this boolean expression by:\n` +
              `1. Breaking it into smaller, named boolean variables\n` +
              `2. Extracting complex conditions into well-named functions\n` +
              `3. Using De Morgan's laws to simplify logic\n` +
              `4. Consider using a truth table to verify correctness`,
            estimatedEffort: "small",
            tags: ["confusing-logic", "complex-boolean", "readability"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Count boolean operators (&&, ||, !) in an expression tree
   */
  private countBooleanOperators(node: Node): number {
    let count = 0;

    const traverse = (n: Node) => {
      const kind = n.getKind();

      // Count logical operators
      if (kind === SyntaxKind.BinaryExpression) {
        const text = n.getText();
        // Check if it's a logical operator (not comparison or arithmetic)
        if (text.includes("&&") || text.includes("||")) {
          count++;
        }
      } else if (kind === SyntaxKind.PrefixUnaryExpression) {
        const text = n.getText();
        if (text.startsWith("!")) {
          count++;
        }
      }

      n.forEachChild(traverse);
    };

    traverse(node);
    return count;
  }

  /**
   * Detect unclear control flow patterns
   * Validates: Requirements 1.5
   *
   * Detects patterns like:
   * - Multiple return statements in complex functions
   * - Deeply nested loops
   * - Complex switch statements with fall-through
   * - Mixed control flow (break/continue in nested structures)
   */
  private detectUnclearControlFlow(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all functions (declarations, expressions, arrow functions)
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getArrowFunctions(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      // Check for multiple return statements in complex functions
      const returnStatements = this.findNodesByKind(
        func as SourceFile,
        SyntaxKind.ReturnStatement,
      );
      const functionComplexity = this.calculateFunctionComplexity(func);

      if (returnStatements.length > 3 && functionComplexity > 5) {
        issues.push(
          this.createIssue({
            type: "confusing-logic",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: func,
            description: `Function has ${returnStatements.length} return statements with complexity ${functionComplexity}. Multiple returns in complex functions make control flow hard to follow.`,
            recommendation:
              `Refactor to improve control flow:\n` +
              `1. Use early returns for error cases at the start\n` +
              `2. Consolidate multiple returns into a single return with a result variable\n` +
              `3. Consider breaking the function into smaller functions\n` +
              `4. Use guard clauses to handle edge cases early`,
            estimatedEffort: "small",
            tags: ["confusing-logic", "control-flow", "multiple-returns"],
          }),
        );
      }

      // Check for deeply nested loops
      const loops = [
        ...this.findNodesByKind(func as SourceFile, SyntaxKind.ForStatement),
        ...this.findNodesByKind(func as SourceFile, SyntaxKind.WhileStatement),
        ...this.findNodesByKind(func as SourceFile, SyntaxKind.DoStatement),
      ];

      for (const loop of loops) {
        const loopNestingDepth = this.calculateLoopNestingDepth(loop);
        if (loopNestingDepth > 2) {
          issues.push(
            this.createIssue({
              type: "confusing-logic",
              severity: "medium",
              category: "general",
              file: file.relativePath,
              node: loop,
              description: `Deeply nested loop (${loopNestingDepth} levels). This makes the code difficult to understand and may indicate algorithmic complexity issues.`,
              recommendation:
                `Refactor nested loops by:\n` +
                `1. Extracting inner loops into separate functions\n` +
                `2. Using array methods (map, filter, reduce) instead of nested loops\n` +
                `3. Consider if a different data structure would simplify the logic\n` +
                `4. Look for opportunities to use early breaks/continues`,
              estimatedEffort: "medium",
              tags: ["confusing-logic", "nested-loops", "performance"],
            }),
          );
        }
      }

      // Check for complex switch statements with fall-through
      const switchStatements = this.findNodesByKind(
        func as SourceFile,
        SyntaxKind.SwitchStatement,
      );
      for (const switchStmt of switchStatements) {
        const hasFallThrough = this.detectSwitchFallThrough(switchStmt);
        if (hasFallThrough) {
          issues.push(
            this.createIssue({
              type: "confusing-logic",
              severity: "low",
              category: "general",
              file: file.relativePath,
              node: switchStmt,
              description: `Switch statement with fall-through cases detected. Fall-through behavior can be confusing and error-prone.`,
              recommendation:
                `Make switch statement clearer by:\n` +
                `1. Add explicit break statements to all cases\n` +
                `2. Add comments if fall-through is intentional\n` +
                `3. Consider using if-else or a lookup table instead\n` +
                `4. Extract complex case logic into functions`,
              estimatedEffort: "trivial",
              tags: ["confusing-logic", "switch-fall-through", "clarity"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Calculate function complexity (simplified cyclomatic complexity)
   */
  private calculateFunctionComplexity(node: Node): number {
    let complexity = 1; // Base complexity

    const decisionPoints = [
      SyntaxKind.IfStatement,
      SyntaxKind.ConditionalExpression,
      SyntaxKind.CaseClause,
      SyntaxKind.ForStatement,
      SyntaxKind.WhileStatement,
      SyntaxKind.DoStatement,
      SyntaxKind.CatchClause,
    ];

    node.forEachDescendant((child) => {
      if (decisionPoints.includes(child.getKind())) {
        complexity++;
      }
      // Count logical operators in conditions
      if (child.getKind() === SyntaxKind.BinaryExpression) {
        const text = child.getText();
        if (text.includes("&&") || text.includes("||")) {
          complexity++;
        }
      }
    });

    return complexity;
  }

  /**
   * Calculate loop nesting depth
   */
  private calculateLoopNestingDepth(node: Node): number {
    let maxDepth = 0;

    const traverse = (n: Node, currentDepth: number) => {
      const kind = n.getKind();

      // Count loop structures
      if (
        kind === SyntaxKind.ForStatement ||
        kind === SyntaxKind.WhileStatement ||
        kind === SyntaxKind.DoStatement ||
        kind === SyntaxKind.ForInStatement ||
        kind === SyntaxKind.ForOfStatement
      ) {
        const newDepth = currentDepth + 1;
        maxDepth = Math.max(maxDepth, newDepth);
        n.forEachChild((child) => traverse(child, newDepth));
      } else {
        n.forEachChild((child) => traverse(child, currentDepth));
      }
    };

    traverse(node, 0);
    return maxDepth;
  }

  /**
   * Detect switch fall-through (cases without break/return)
   */
  private detectSwitchFallThrough(switchNode: Node): boolean {
    const caseClauses = this.findNodesByKind(
      switchNode as SourceFile,
      SyntaxKind.CaseClause,
    );

    for (const caseClause of caseClauses) {
      const statements = caseClause.getChildrenOfKind(SyntaxKind.SyntaxList);

      if (statements.length === 0) {
        continue; // Empty case, might be intentional grouping
      }

      // Check if the case has a break or return statement
      let hasBreakOrReturn = false;

      caseClause.forEachDescendant((child) => {
        const kind = child.getKind();
        if (
          kind === SyntaxKind.BreakStatement ||
          kind === SyntaxKind.ReturnStatement ||
          kind === SyntaxKind.ThrowStatement
        ) {
          hasBreakOrReturn = true;
        }
      });

      // If case has statements but no break/return, it's a fall-through
      if (statements.length > 0 && !hasBreakOrReturn) {
        // Check if it's the last case (which doesn't need a break)
        const parent = caseClause.getParent();
        if (parent) {
          const allCases = parent.getChildrenOfKind(SyntaxKind.CaseClause);
          const isLastCase = allCases[allCases.length - 1] === caseClause;

          if (!isLastCase) {
            return true; // Found fall-through
          }
        }
      }
    }

    return false;
  }

  // ============================================================================
  // Code Duplication Detection (Requirements 6.5, 8.1, 8.2, 8.4, 8.5, 15.2)
  // ============================================================================

  /**
   * Detect duplicate function implementations using AST similarity
   * Validates: Requirements 6.5, 8.1, 15.2
   */
  private detectDuplicateFunctions(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all functions in this file
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getArrowFunctions(ast),
      ...this.getMethodDeclarations(ast),
    ];

    // Build function signatures for comparison
    for (const func of functions) {
      const signature = this.getFunctionSignature(func);
      const body = this.getFunctionBody(func);

      if (!body || body.length < 50) {
        // Skip very small functions (likely not worth flagging)
        continue;
      }

      const normalizedBody = this.normalizeCode(body);
      const key = this.hashCode(normalizedBody);

      if (!this.allFunctions.has(key)) {
        this.allFunctions.set(key, []);
      }

      const existing = this.allFunctions.get(key)!;

      // Check if we already have a similar function
      for (const existingFunc of existing) {
        const similarity = this.calculateSimilarity(
          normalizedBody,
          this.normalizeCode(this.getFunctionBody(existingFunc.node) || ""),
        );

        if (similarity > 0.85) {
          // 85% similar
          const funcName = this.getNodeName(func) || "anonymous function";
          const existingName =
            this.getNodeName(existingFunc.node) || "anonymous function";

          issues.push(
            this.createIssue({
              type: "code-duplication",
              severity: "medium",
              category: "general",
              file: file.relativePath,
              node: func,
              description: `Duplicate function detected: '${funcName}' is ${Math.round(similarity * 100)}% similar to '${existingName}' in ${existingFunc.file}`,
              recommendation:
                `Consolidate duplicate functions by:\n` +
                `1. Extract common logic into a shared utility function\n` +
                `2. Use function parameters to handle variations\n` +
                `3. Consider using a strategy pattern for different behaviors\n` +
                `4. Move the shared function to a common utilities module`,
              estimatedEffort: "small",
              tags: [
                "code-duplication",
                "duplicate-function",
                "maintainability",
              ],
            }),
          );
        }
      }

      // Add this function to the collection
      existing.push({
        file: file.relativePath,
        node: func,
        signature,
      });
    }

    return issues;
  }

  /**
   * Detect similar code blocks with minor differences
   * Validates: Requirements 8.2
   */
  private detectSimilarCodeBlocks(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all block statements (function bodies, if blocks, etc.)
    const blocks = this.findNodesByKind(ast, SyntaxKind.Block);

    for (const block of blocks) {
      const blockText = block.getText();

      // Skip small blocks
      if (blockText.length < 100) {
        continue;
      }

      const normalizedBlock = this.normalizeCode(blockText);

      // Compare with other blocks in the same file
      for (const otherBlock of blocks) {
        if (block === otherBlock) continue;

        const otherText = otherBlock.getText();
        if (otherText.length < 100) continue;

        const normalizedOther = this.normalizeCode(otherText);
        const similarity = this.calculateSimilarity(
          normalizedBlock,
          normalizedOther,
        );

        if (similarity > 0.8 && similarity < 1.0) {
          // 80-99% similar (not identical)
          const blockLocation = this.getNodeLocation(block);
          const otherLocation = this.getNodeLocation(otherBlock);

          // Only report once per pair (report the first occurrence)
          if (blockLocation.startLine < otherLocation.startLine) {
            issues.push(
              this.createIssue({
                type: "code-duplication",
                severity: "low",
                category: "general",
                file: file.relativePath,
                node: block,
                description: `Similar code block detected (${Math.round(similarity * 100)}% similar to code at line ${otherLocation.startLine}). These blocks differ only in minor details.`,
                recommendation:
                  `Refactor similar code blocks by:\n` +
                  `1. Extract common logic into a shared function\n` +
                  `2. Use parameters to handle the differences\n` +
                  `3. Consider using a template method pattern\n` +
                  `4. Look for opportunities to use higher-order functions`,
                estimatedEffort: "small",
                tags: ["code-duplication", "similar-blocks", "refactoring"],
              }),
            );
          }
        }
      }
    }

    return issues;
  }

  /**
   * Detect duplicate constants across files
   * Validates: Requirements 8.4
   */
  private detectDuplicateConstants(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all variable declarations
    const variables = this.getVariableDeclarations(ast);

    for (const variable of variables) {
      const varName = this.getNodeName(variable);
      if (!varName) continue;

      // Check if it looks like a constant (uppercase or const declaration)
      const isConstant = this.isConstantVariable(variable);
      if (!isConstant) continue;

      // Get the initializer value
      if (Node.isVariableDeclaration(variable)) {
        const initializer = variable.getInitializer();
        if (!initializer) continue;

        const value = initializer.getText();

        // Skip very simple values (single numbers, booleans)
        if (value.length < 5) continue;

        const key = `${varName}:${value}`;

        if (!this.allConstants.has(key)) {
          this.allConstants.set(key, []);
        }

        const existing = this.allConstants.get(key)!;

        // Check if we already have this constant in another file
        for (const existingConst of existing) {
          if (existingConst.file !== file.relativePath) {
            issues.push(
              this.createIssue({
                type: "code-duplication",
                severity: "low",
                category: "general",
                file: file.relativePath,
                node: variable,
                description: `Duplicate constant detected: '${varName}' with value ${value} is also defined in ${existingConst.file}`,
                recommendation:
                  `Consolidate duplicate constants by:\n` +
                  `1. Create a shared constants file (e.g., constants.ts)\n` +
                  `2. Export the constant from a single location\n` +
                  `3. Import the constant where needed\n` +
                  `4. Consider grouping related constants into objects or enums`,
                estimatedEffort: "trivial",
                tags: [
                  "code-duplication",
                  "duplicate-constant",
                  "maintainability",
                ],
              }),
            );
          }
        }

        // Add this constant to the collection
        existing.push({
          file: file.relativePath,
          node: variable,
          value,
        });
      }
    }

    return issues;
  }

  // ============================================================================
  // Naming Convention Analysis (Requirements 10.1, 10.4)
  // ============================================================================

  /**
   * Detect single-letter variables (except loop counters)
   * Validates: Requirements 10.1, 10.4
   */
  private detectSingleLetterVariables(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Get all variable declarations
    const variables = this.getVariableDeclarations(ast);

    for (const variable of variables) {
      const varName = this.getNodeName(variable);
      if (!varName) continue;

      // Check if it's a single letter
      if (varName.length === 1) {
        // Check if it's a loop counter (i, j, k in for loops)
        const isLoopCounter = this.isLoopCounter(variable);

        if (!isLoopCounter) {
          issues.push(
            this.createIssue({
              type: "poor-naming",
              severity: "low",
              category: "general",
              file: file.relativePath,
              node: variable,
              description: `Single-letter variable name '${varName}' detected. Single-letter names make code harder to understand and search.`,
              recommendation:
                `Use descriptive variable names:\n` +
                `1. Choose a name that describes what the variable represents\n` +
                `2. Use camelCase for variable names\n` +
                `3. Make the name searchable and meaningful\n` +
                `4. Avoid abbreviations unless they are well-known`,
              estimatedEffort: "trivial",
              tags: ["poor-naming", "single-letter", "readability"],
            }),
          );
        }
      }
    }

    // Also check function parameters
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getArrowFunctions(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      let params: ParameterDeclaration[] = [];
      if (
        Node.isFunctionDeclaration(func) ||
        Node.isMethodDeclaration(func) ||
        Node.isArrowFunction(func) ||
        Node.isFunctionExpression(func)
      ) {
        params = func.getParameters();
      }

      for (const param of params) {
        const paramName = param.getName();
        if (!paramName) continue;

        if (paramName.length === 1) {
          // Allow single-letter params in very short arrow functions (common pattern)
          const isShortArrowFunction =
            func.getKind() === SyntaxKind.ArrowFunction &&
            func.getText().length < 50;

          if (!isShortArrowFunction) {
            issues.push(
              this.createIssue({
                type: "poor-naming",
                severity: "low",
                category: "general",
                file: file.relativePath,
                node: param,
                description: `Single-letter parameter name '${paramName}' detected. Use descriptive parameter names for clarity.`,
                recommendation:
                  `Use descriptive parameter names:\n` +
                  `1. Choose a name that describes the parameter's purpose\n` +
                  `2. Use camelCase for parameter names\n` +
                  `3. Make the name self-documenting\n` +
                  `4. Consider the function's context when naming`,
                estimatedEffort: "trivial",
                tags: ["poor-naming", "single-letter", "parameters"],
              }),
            );
          }
        }
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent naming patterns (camelCase vs snake_case)
   * Validates: Requirements 10.1
   */
  private detectInconsistentNaming(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Collect all identifiers and their naming styles
    const namingStyles: Map<
      string,
      {
        style:
          | "camelCase"
          | "snake_case"
          | "PascalCase"
          | "UPPER_CASE"
          | "mixed";
        nodes: Node[];
      }
    > = new Map();

    // Check variables
    const variables = this.getVariableDeclarations(ast);
    for (const variable of variables) {
      const varName = this.getNodeName(variable);
      if (!varName) continue;

      const style = this.detectNamingStyle(varName);

      // Skip constants (UPPER_CASE is expected)
      if (this.isConstantVariable(variable) && style === "UPPER_CASE") {
        continue;
      }

      if (!namingStyles.has(style)) {
        namingStyles.set(style, {
          style: style as
            | "camelCase"
            | "snake_case"
            | "PascalCase"
            | "UPPER_CASE"
            | "mixed",
          nodes: [],
        });
      }
      namingStyles.get(style)!.nodes.push(variable);
    }

    // Check functions
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      const funcName = this.getNodeName(func);
      if (!funcName) continue;

      const style = this.detectNamingStyle(funcName);

      if (!namingStyles.has(style)) {
        namingStyles.set(style, {
          style: style as
            | "camelCase"
            | "snake_case"
            | "PascalCase"
            | "UPPER_CASE"
            | "mixed",
          nodes: [],
        });
      }
      namingStyles.get(style)!.nodes.push(func);
    }

    // Check if there are multiple naming styles in use (excluding PascalCase for classes/types)
    const variableStyles = Array.from(namingStyles.keys()).filter(
      (s) => s !== "PascalCase" && s !== "UPPER_CASE",
    );

    if (variableStyles.length > 1) {
      // Find the minority style (the one used less frequently)
      const styleCounts = variableStyles.map((style) => ({
        style,
        count: namingStyles.get(style)!.nodes.length,
      }));

      styleCounts.sort((a, b) => a.count - b.count);

      // Report issues for the minority style(s)
      for (let i = 0; i < styleCounts.length - 1; i++) {
        const minorityStyle = styleCounts[i].style;
        const nodes = namingStyles.get(minorityStyle)!.nodes;

        for (const node of nodes) {
          const name = this.getNodeName(node);
          if (!name) continue;

          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "low",
              category: "general",
              file: file.relativePath,
              node,
              description: `Inconsistent naming convention: '${name}' uses ${minorityStyle} while most of the file uses ${styleCounts[styleCounts.length - 1].style}`,
              recommendation:
                `Standardize naming conventions:\n` +
                `1. Use camelCase for variables and functions (TypeScript/JavaScript standard)\n` +
                `2. Use PascalCase for classes, interfaces, and types\n` +
                `3. Use UPPER_CASE for constants\n` +
                `4. Avoid mixing snake_case with camelCase`,
              estimatedEffort: "trivial",
              tags: ["inconsistent-pattern", "naming-convention", "style"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect unclear function/variable names
   * Validates: Requirements 10.4
   */
  private detectUnclearNames(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Common unclear/vague names to flag
    const vagueNames = new Set([
      "data",
      "info",
      "item",
      "obj",
      "temp",
      "tmp",
      "val",
      "value",
      "result",
      "res",
      "ret",
      "output",
      "input",
      "thing",
      "stuff",
      "handle",
      "process",
      "manage",
      "do",
      "perform",
      "execute",
    ]);

    // Check variables
    const variables = this.getVariableDeclarations(ast);
    for (const variable of variables) {
      const varName = this.getNodeName(variable);
      if (!varName) continue;

      // Check if name is too vague
      if (vagueNames.has(varName.toLowerCase())) {
        issues.push(
          this.createIssue({
            type: "poor-naming",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: variable,
            description: `Unclear variable name '${varName}'. This name is too vague and doesn't convey the variable's purpose.`,
            recommendation:
              `Use more descriptive names:\n` +
              `1. Describe what the variable represents, not just its type\n` +
              `2. Use domain-specific terminology\n` +
              `3. Make the name self-documenting\n` +
              `4. Consider the context and scope when naming`,
            estimatedEffort: "trivial",
            tags: ["poor-naming", "unclear-name", "readability"],
          }),
        );
      }

      // Check for abbreviations that might be unclear
      if (this.hasUnclearAbbreviation(varName)) {
        issues.push(
          this.createIssue({
            type: "poor-naming",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: variable,
            description: `Variable name '${varName}' contains unclear abbreviations. Avoid abbreviations unless they are well-known.`,
            recommendation:
              `Use full words instead of abbreviations:\n` +
              `1. Spell out words for clarity (e.g., 'user' instead of 'usr')\n` +
              `2. Only use well-known abbreviations (e.g., 'id', 'url', 'html')\n` +
              `3. Prioritize readability over brevity\n` +
              `4. Modern IDEs have autocomplete, so longer names are not a burden`,
            estimatedEffort: "trivial",
            tags: ["poor-naming", "abbreviation", "readability"],
          }),
        );
      }
    }

    // Check functions
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      const funcName = this.getNodeName(func);
      if (!funcName) continue;

      // Check if function name is too vague
      if (vagueNames.has(funcName.toLowerCase())) {
        issues.push(
          this.createIssue({
            type: "poor-naming",
            severity: "low",
            category: "general",
            file: file.relativePath,
            node: func,
            description: `Unclear function name '${funcName}'. This name doesn't clearly describe what the function does.`,
            recommendation:
              `Use descriptive function names:\n` +
              `1. Use verbs that describe the action (e.g., 'getUserById', 'calculateTotal')\n` +
              `2. Be specific about what the function does\n` +
              `3. Follow the single responsibility principle\n` +
              `4. Make the name self-documenting`,
            estimatedEffort: "trivial",
            tags: ["poor-naming", "unclear-name", "functions"],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Legacy Code Detection (Requirement 1.3)
  // ============================================================================

  /**
   * Detect commented-out code blocks
   * Validates: Requirements 1.3
   */
  private detectCommentedOutCode(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get the full text of the file
    const fullText = ast.getFullText();
    const lines = fullText.split("\n");

    // Track consecutive commented lines that look like code
    let commentedCodeBlock: {
      start: number;
      end: number;
      lines: string[];
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line is a comment
      const isSingleLineComment = line.startsWith("//");
      const isMultiLineComment = line.startsWith("/*") || line.startsWith("*");

      if (isSingleLineComment || isMultiLineComment) {
        // Remove comment markers to check if it looks like code
        const content = line
          .replace(/^\/\/\s*/, "")
          .replace(/^\/\*\s*/, "")
          .replace(/^\*\s*/, "")
          .replace(/\*\/\s*$/, "")
          .trim();

        // Check if the content looks like code (has code-like patterns)
        if (this.looksLikeCode(content)) {
          if (!commentedCodeBlock) {
            commentedCodeBlock = { start: i + 1, end: i + 1, lines: [content] };
          } else {
            commentedCodeBlock.end = i + 1;
            commentedCodeBlock.lines.push(content);
          }
        } else {
          // Not code-like, reset the block
          if (commentedCodeBlock && commentedCodeBlock.lines.length >= 3) {
            // Report the block if it has 3+ lines
            issues.push(
              this.createIssueFromLines({
                type: "legacy-code",
                severity: "low",
                category: "general",
                file: file.relativePath,
                startLine: commentedCodeBlock.start,
                endLine: commentedCodeBlock.end,
                description: `Commented-out code block detected (${commentedCodeBlock.lines.length} lines). Commented code should be removed and tracked in version control instead.`,
                recommendation:
                  `Remove commented-out code:\n` +
                  `1. Delete the commented code - version control preserves history\n` +
                  `2. If the code might be needed, create a feature branch\n` +
                  `3. Add a TODO comment if you plan to restore it soon\n` +
                  `4. Use feature flags instead of commenting code`,
                estimatedEffort: "trivial",
                tags: ["legacy-code", "commented-code", "cleanup"],
              }),
            );
          }
          commentedCodeBlock = null;
        }
      } else {
        // Not a comment line, check if we have a pending block
        if (commentedCodeBlock && commentedCodeBlock.lines.length >= 3) {
          issues.push(
            this.createIssueFromLines({
              type: "legacy-code",
              severity: "low",
              category: "general",
              file: file.relativePath,
              startLine: commentedCodeBlock.start,
              endLine: commentedCodeBlock.end,
              description: `Commented-out code block detected (${commentedCodeBlock.lines.length} lines). Commented code should be removed and tracked in version control instead.`,
              recommendation:
                `Remove commented-out code:\n` +
                `1. Delete the commented code - version control preserves history\n` +
                `2. If the code might be needed, create a feature branch\n` +
                `3. Add a TODO comment if you plan to restore it soon\n` +
                `4. Use feature flags instead of commenting code`,
              estimatedEffort: "trivial",
              tags: ["legacy-code", "commented-code", "cleanup"],
            }),
          );
        }
        commentedCodeBlock = null;
      }
    }

    // Check for any remaining block at the end of file
    if (commentedCodeBlock && commentedCodeBlock.lines.length >= 3) {
      issues.push(
        this.createIssueFromLines({
          type: "legacy-code",
          severity: "low",
          category: "general",
          file: file.relativePath,
          startLine: commentedCodeBlock.start,
          endLine: commentedCodeBlock.end,
          description: `Commented-out code block detected (${commentedCodeBlock.lines.length} lines). Commented code should be removed and tracked in version control instead.`,
          recommendation:
            `Remove commented-out code:\n` +
            `1. Delete the commented code - version control preserves history\n` +
            `2. If the code might be needed, create a feature branch\n` +
            `3. Add a TODO comment if you plan to restore it soon\n` +
            `4. Use feature flags instead of commenting code`,
          estimatedEffort: "trivial",
          tags: ["legacy-code", "commented-code", "cleanup"],
        }),
      );
    }

    return issues;
  }

  /**
   * Detect unused exports using import analysis
   * Validates: Requirements 1.3
   */
  private detectUnusedExports(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all exported declarations
    const exportedDeclarations = ast.getExportedDeclarations();

    // For each export, we would need to scan the entire codebase to see if it's imported
    // This is a simplified version that flags exports that might be unused
    // A full implementation would require cross-file analysis

    exportedDeclarations.forEach((declarations, name) => {
      for (const declaration of declarations) {
        // Skip default exports and type-only exports (harder to track)
        if (name === "default") continue;

        // Check if this is a type export
        const parent = declaration.getParent();
        if (
          parent &&
          (parent.getKind() === SyntaxKind.InterfaceDeclaration ||
            parent.getKind() === SyntaxKind.TypeAliasDeclaration)
        ) {
          continue; // Skip type exports for now
        }

        // This is a simplified check - in a real implementation, we would:
        // 1. Track all imports across the codebase
        // 2. Check if this export is imported anywhere
        // 3. Flag it as unused if not imported

        // For now, we'll add a note that this requires cross-file analysis
        // and only flag exports in files that seem to be utilities (not main entry points)

        const isUtilityFile =
          file.relativePath.includes("/util") ||
          file.relativePath.includes("/helper") ||
          file.relativePath.includes("/lib");

        if (isUtilityFile) {
          // Add a low-severity issue suggesting to verify if the export is used
          issues.push(
            this.createIssue({
              type: "legacy-code",
              severity: "low",
              category: "general",
              file: file.relativePath,
              node: declaration,
              description: `Exported declaration '${name}' may be unused. Verify if this export is imported elsewhere in the codebase.`,
              recommendation:
                `Review and remove unused exports:\n` +
                `1. Search the codebase for imports of '${name}'\n` +
                `2. If not imported anywhere, remove the export\n` +
                `3. If not used at all, remove the entire declaration\n` +
                `4. Use a tool like ts-prune to find unused exports automatically`,
              estimatedEffort: "trivial",
              tags: ["legacy-code", "unused-export", "cleanup"],
            }),
          );
        }
      }
    });

    return issues;
  }

  // ============================================================================
  // Helper Methods for Naming and Legacy Code Detection
  // ============================================================================

  /**
   * Check if a variable is a loop counter (i, j, k in for loops)
   */
  private isLoopCounter(variable: Node): boolean {
    const varName = this.getNodeName(variable);
    if (!varName || !["i", "j", "k"].includes(varName)) {
      return false;
    }

    // Check if the variable is declared in a for loop
    let parent = variable.getParent();
    while (parent) {
      const kind = parent.getKind();
      if (
        kind === SyntaxKind.ForStatement ||
        kind === SyntaxKind.ForInStatement ||
        kind === SyntaxKind.ForOfStatement
      ) {
        return true;
      }
      parent = parent.getParent();
    }

    return false;
  }

  /**
   * Detect the naming style of an identifier
   */
  private detectNamingStyle(name: string): string {
    // UPPER_CASE
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
      return "UPPER_CASE";
    }

    // PascalCase
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      return "PascalCase";
    }

    // snake_case
    if (/^[a-z][a-z0-9_]*$/.test(name) && name.includes("_")) {
      return "snake_case";
    }

    // camelCase
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
      return "camelCase";
    }

    // Mixed or unclear
    return "mixed";
  }

  /**
   * Check if a name has unclear abbreviations
   */
  private hasUnclearAbbreviation(name: string): boolean {
    // Common unclear abbreviations
    const unclearAbbreviations = [
      /usr/i, // user
      /btn/i, // button
      /msg/i, // message
      /num/i, // number
      /str/i, // string
      /arr/i, // array
      /obj/i, // object
      /func/i, // function
      /calc/i, // calculate
      /proc/i, // process
      /mgr/i, // manager
      /ctrl/i, // controller (unless in specific contexts)
      /svc/i, // service
    ];

    return unclearAbbreviations.some((pattern) => pattern.test(name));
  }

  /**
   * Check if a string looks like code (has code-like patterns)
   */
  private looksLikeCode(text: string): boolean {
    // Patterns that indicate code
    const codePatterns = [
      /^(const|let|var|function|class|interface|type|import|export|return|if|else|for|while)\s/,
      /[{}\[\]();]/,
      /=>/,
      /[=<>!]==/,
      /\w+\s*\(/, // function calls
      /\w+\s*:/, // object properties
      /\.\w+/, // property access
    ];

    return codePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Create an issue from line numbers (for commented code detection)
   */
  private createIssueFromLines(params: {
    type: Issue["type"];
    severity: Issue["severity"];
    category: Issue["category"];
    file: string;
    startLine: number;
    endLine: number;
    description: string;
    recommendation: string;
    estimatedEffort: Issue["estimatedEffort"];
    tags: string[];
  }): Issue {
    return {
      id: randomUUID(),
      type: params.type,
      severity: params.severity,
      category: params.category,
      file: params.file,
      location: {
        startLine: params.startLine,
        endLine: params.endLine,
        startColumn: 0,
        endColumn: 0,
      },
      description: params.description,
      codeSnippet: `Lines ${params.startLine}-${params.endLine}`,
      recommendation: params.recommendation,
      estimatedEffort: params.estimatedEffort,
      tags: params.tags,
      detectedBy: this.name,
      detectedAt: new Date(),
      relatedIssues: [],
    };
  }

  // ============================================================================
  // Helper Methods for Duplication Detection
  // ============================================================================

  /**
   * Get function signature (name and parameters)
   */
  private getFunctionSignature(func: Node): string {
    const name = this.getNodeName(func) || "anonymous";
    let params: ParameterDeclaration[] = [];
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isMethodDeclaration(func) ||
      Node.isArrowFunction(func) ||
      Node.isFunctionExpression(func)
    ) {
      params = func.getParameters();
    }
    const paramNames = params.map((p) => p.getName?.() || "").join(",");
    return `${name}(${paramNames})`;
  }

  /**
   * Get function body text
   */
  private getFunctionBody(func: Node): string | null {
    let body: Node | undefined;
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isMethodDeclaration(func) ||
      Node.isArrowFunction(func) ||
      Node.isFunctionExpression(func)
    ) {
      body = func.getBody();
    }
    if (!body) return null;
    return body.getText();
  }

  /**
   * Normalize code for comparison (remove whitespace, comments, etc.)
   */
  private normalizeCode(code: string): string {
    return (
      code
        // Remove single-line comments
        .replace(/\/\/.*$/gm, "")
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        // Remove extra whitespace
        .replace(/\s+/g, " ")
        // Remove leading/trailing whitespace
        .trim()
        // Normalize string quotes
        .replace(/"/g, "'")
    );
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Simple hash function for strings
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Check if a variable is a constant
   */
  private isConstantVariable(variable: Node): boolean {
    const parent = variable.getParent();
    if (!parent) return false;

    // Check if it's a const declaration
    const grandParent = parent.getParent();
    if (grandParent && Node.isVariableDeclarationList(grandParent)) {
      const flags = grandParent.getDeclarationKind();
      if (flags === "const") {
        return true;
      }
    }

    // Check if the name is in UPPER_CASE (convention for constants)
    const name = this.getNodeName(variable);
    if (name && /^[A-Z][A-Z0-9_]*$/.test(name)) {
      return true;
    }

    return false;
  }
}
