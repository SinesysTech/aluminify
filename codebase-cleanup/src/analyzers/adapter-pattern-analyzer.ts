/**
 * Adapter Pattern Analyzer
 *
 * Analyzes adapter patterns in the codebase to identify unnecessary
 * abstraction layers and pass-through wrappers that add no meaningful value.
 *
 * Detects:
 * - Single-method wrappers that just delegate to another function
 * - Pass-through functions with no error handling, validation, or transformation
 * - Redundant abstraction layers that increase complexity without benefit
 * - Adapters that exist solely for historical reasons
 *
 * Validates Requirements: 1.4, 14.1, 14.2, 14.4
 */

import {
  SourceFile,
  Node,
  CallExpression,
  ArrowFunction,
  FunctionExpression,
} from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Pattern for tracking wrapper functions
 */
interface WrapperPattern {
  functionName: string;
  wrappedFunction: string;
  node: Node;
  file: string;
  addedValue: string[];
}

/**
 * Analyzer for adapter and wrapper patterns
 */
export class AdapterPatternAnalyzer extends BasePatternAnalyzer {
  readonly name = "AdapterPatternAnalyzer";

  private wrapperPatterns: WrapperPattern[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["api-route", "service", "util", "middleware"];
  }

  /**
   * Analyze a file for adapter pattern issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 14.1: Find all wrapper functions and abstraction layers
    issues.push(...this.detectWrapperFunctions(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 14.1: Wrapper Function and Adapter Detection
  // ============================================================================

  /**
   * Detect all wrapper functions and abstraction layers
   * Analyzes function bodies to detect pass-through behavior
   * Identifies adapters that add no meaningful value
   *
   * Validates Requirements: 1.4, 14.1, 14.2, 14.4
   */
  private detectWrapperFunctions(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all functions in the file
    const functions = [
      ...ast.getFunctions(),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
      ...this.getMethodDeclarations(ast),
    ];

    for (const func of functions) {
      // Get function name
      const funcName = this.getFunctionName(func);
      if (!funcName || funcName === "anonymous") {
        continue;
      }

      // Get function body
      const body = this.getFunctionBody(func);
      if (!body) {
        continue;
      }

      // Analyze the function to determine if it's a wrapper
      const wrapperAnalysis = this.analyzeWrapperFunction(func, funcName, body);

      if (
        wrapperAnalysis.isWrapper &&
        wrapperAnalysis.addedValue.length === 0
      ) {
        // This is an unnecessary adapter - it wraps another function but adds no value
        issues.push(
          this.createIssue({
            type: "unnecessary-adapter",
            severity: "medium",
            category: "general",
            file: file.relativePath,
            node: func,
            description: `Function '${funcName}' is an unnecessary adapter that adds no meaningful value. It simply delegates to '${wrapperAnalysis.wrappedFunction}' without adding error handling, validation, transformation, or other logic.`,
            recommendation: this.generateRemovalRecommendation(
              funcName,
              wrapperAnalysis.wrappedFunction,
            ),
            estimatedEffort: "small",
            tags: ["adapter", "unnecessary", "wrapper", "simplification"],
          }),
        );

        // Track this wrapper pattern
        this.wrapperPatterns.push({
          functionName: funcName,
          wrappedFunction: wrapperAnalysis.wrappedFunction,
          node: func,
          file: file.relativePath,
          addedValue: wrapperAnalysis.addedValue,
        });
      } else if (
        wrapperAnalysis.isWrapper &&
        wrapperAnalysis.addedValue.length > 0
      ) {
        // This is a wrapper that adds some value, but we should document it
        // Only flag if the added value is minimal (e.g., just parameter renaming)
        const minimalValue = wrapperAnalysis.addedValue.every(
          (value) => value.includes("parameter") || value.includes("rename"),
        );

        if (minimalValue) {
          issues.push(
            this.createIssue({
              type: "unnecessary-adapter",
              severity: "low",
              category: "general",
              file: file.relativePath,
              node: func,
              description: `Function '${funcName}' is a thin wrapper around '${wrapperAnalysis.wrappedFunction}' that adds minimal value (${wrapperAnalysis.addedValue.join(", ")}). Consider if this abstraction is necessary.`,
              recommendation: `Evaluate if the wrapper function '${funcName}' is necessary. It only adds: ${wrapperAnalysis.addedValue.join(", ")}. If this abstraction doesn't provide significant value, consider removing it and calling '${wrapperAnalysis.wrappedFunction}' directly.`,
              estimatedEffort: "trivial",
              tags: ["adapter", "thin-wrapper", "minimal-value"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Analyze a function to determine if it's a wrapper and what value it adds
   */
  private analyzeWrapperFunction(
    func: Node,
    funcName: string,
    body: Node,
  ): {
    isWrapper: boolean;
    wrappedFunction: string;
    addedValue: string[];
  } {
    const bodyText = body.getText();
    const statements = this.getFunctionStatements(body);
    const addedValue: string[] = [];

    // Get all call expressions in the function body
    const callExpressions = this.getCallExpressionsFromNode(body);

    // A wrapper function typically:
    // 1. Has very few statements (usually 1-2)
    // 2. Contains a call to another function
    // 3. Returns the result of that call (or is the call itself for arrow functions)

    // Check if this looks like a wrapper
    if (statements.length > 3) {
      // Too many statements - likely doing more than just wrapping
      return { isWrapper: false, wrappedFunction: "", addedValue: [] };
    }

    if (callExpressions.length === 0) {
      // No function calls - not a wrapper
      return { isWrapper: false, wrappedFunction: "", addedValue: [] };
    }

    // Find the main delegated call
    const mainCall = this.findMainDelegatedCall(statements, callExpressions);
    if (!mainCall) {
      return { isWrapper: false, wrappedFunction: "", addedValue: [] };
    }

    const wrappedFunction = this.extractFunctionName(mainCall);
    if (!wrappedFunction) {
      return { isWrapper: false, wrappedFunction: "", addedValue: [] };
    }

    // Now analyze what value this wrapper adds
    const funcParams = this.getFunctionParameters(func);
    const funcParamNames = funcParams
      .map((p) => this.getNodeName(p))
      .filter(Boolean) as string[];

    // Check for error handling
    if (this.hasErrorHandling(body, bodyText)) {
      addedValue.push("error handling");
    }

    // Check for validation
    if (this.hasValidation(body, bodyText)) {
      addedValue.push("input validation");
    }

    // Check for data transformation
    if (this.hasDataTransformation(body, bodyText, mainCall)) {
      addedValue.push("data transformation");
    }

    // Check for logging
    if (this.hasLogging(bodyText)) {
      addedValue.push("logging");
    }

    // Check for caching
    if (this.hasCaching(bodyText)) {
      addedValue.push("caching");
    }

    // Check for retry logic
    if (this.hasRetryLogic(bodyText)) {
      addedValue.push("retry logic");
    }

    // Check for authentication/authorization
    if (this.hasAuthLogic(bodyText)) {
      addedValue.push("authentication/authorization");
    }

    // Check for parameter transformation (beyond simple pass-through)
    if (this.hasParameterTransformation(funcParamNames, mainCall, bodyText)) {
      addedValue.push("parameter transformation");
    }

    // Check for default values or parameter enrichment
    if (this.hasParameterEnrichment(funcParamNames, mainCall, bodyText)) {
      addedValue.push("parameter enrichment");
    }

    // Check if parameters are just passed through unchanged
    const isSimplePassThrough = this.isSimpleParameterPassThrough(
      funcParamNames,
      mainCall,
      statements.length,
    );

    // It's a wrapper if:
    // 1. It has few statements
    // 2. It calls another function
    // 3. It mostly just passes parameters through
    const isWrapper =
      statements.length <= 3 &&
      callExpressions.length >= 1 &&
      (isSimplePassThrough || addedValue.length === 0);

    return { isWrapper, wrappedFunction, addedValue };
  }

  /**
   * Find the main delegated call in a function
   * This is typically the call in a return statement or the only call expression
   */
  private findMainDelegatedCall(
    statements: Node[],
    callExpressions: CallExpression[],
  ): CallExpression | null {
    // If there's only one call, that's the main one
    if (callExpressions.length === 1) {
      return callExpressions[0];
    }

    // Look for a call in a return statement
    for (const stmt of statements) {
      if (Node.isReturnStatement(stmt)) {
        const expression = stmt.getExpression();
        if (expression && Node.isCallExpression(expression)) {
          return expression;
        }
        // Check if return contains an await call
        if (expression && Node.isAwaitExpression(expression)) {
          const awaitedExpr = expression.getExpression();
          if (Node.isCallExpression(awaitedExpr)) {
            return awaitedExpr;
          }
        }
      }
    }

    // For arrow functions with expression body
    if (statements.length === 1) {
      const stmt = statements[0];
      if (Node.isCallExpression(stmt)) {
        return stmt;
      }
      if (Node.isAwaitExpression(stmt)) {
        const awaitedExpr = stmt.getExpression();
        if (Node.isCallExpression(awaitedExpr)) {
          return awaitedExpr;
        }
      }
    }

    // If we have multiple calls, try to find the most significant one
    // (usually the last one or the one with the most parameters)
    if (callExpressions.length > 1) {
      return callExpressions[callExpressions.length - 1];
    }

    return null;
  }

  /**
   * Extract the function name from a call expression
   */
  private extractFunctionName(call: CallExpression): string {
    const expression = call.getExpression();
    const expressionText = expression.getText();

    // Handle different call patterns:
    // - Simple: functionName()
    // - Method: object.method()
    // - Chained: object.method1().method2()
    // - Nested: module.submodule.function()

    // For property access (object.method), get the full chain
    if (Node.isPropertyAccessExpression(expression)) {
      return expressionText;
    }

    // For simple identifiers
    if (Node.isIdentifier(expression)) {
      return expression.getText();
    }

    // Fallback to the full expression text
    return expressionText;
  }

  /**
   * Check if the function has error handling
   */
  private hasErrorHandling(body: Node, bodyText: string): boolean {
    // Check for try-catch blocks
    const hasTryCatch = bodyText.includes("try") && bodyText.includes("catch");
    if (hasTryCatch) return true;

    // Check for error checking (if (error) or if (!result))
    const hasErrorCheck =
      /if\s*\(\s*error\s*\)/.test(bodyText) || /if\s*\(\s*!.*\)/.test(bodyText);
    if (hasErrorCheck) return true;

    // Check for .catch() handlers
    const hasCatchHandler = bodyText.includes(".catch(");
    if (hasCatchHandler) return true;

    // Check for throw statements
    const hasThrow = bodyText.includes("throw");
    if (hasThrow) return true;

    return false;
  }

  /**
   * Check if the function has validation logic
   */
  private hasValidation(body: Node, bodyText: string): boolean {
    // Check for validation patterns
    const validationPatterns = [
      /if\s*\(\s*!.*\)/, // if (!param)
      /if\s*\(.*===.*\)/, // if (param === value)
      /if\s*\(.*!==.*\)/, // if (param !== value)
      /if\s*\(.*<.*\)/, // if (param < value)
      /if\s*\(.*>.*\)/, // if (param > value)
      /\.validate\(/, // .validate()
      /\.check\(/, // .check()
      /\.assert\(/, // .assert()
      /typeof.*===/, // typeof check
      /instanceof/, // instanceof check
      /Array\.isArray/, // Array.isArray()
    ];

    return validationPatterns.some((pattern) => pattern.test(bodyText));
  }

  /**
   * Check if the function has data transformation logic
   */
  private hasDataTransformation(
    body: Node,
    bodyText: string,
    mainCall: CallExpression,
  ): boolean {
    // Check for transformation methods
    const transformationMethods = [
      ".map(",
      ".filter(",
      ".reduce(",
      ".transform(",
      ".convert(",
      "Object.assign(",
      "Object.keys(",
      "Object.values(",
      "Object.entries(",
      "JSON.parse(",
      "JSON.stringify(",
      ".toString(",
      ".toUpperCase(",
      ".toLowerCase(",
      ".trim(",
      ".split(",
      ".join(",
    ];

    // Check if transformation happens before or after the main call
    const mainCallText = mainCall.getText();
    const beforeCall = bodyText.substring(0, bodyText.indexOf(mainCallText));
    const afterCall = bodyText.substring(
      bodyText.indexOf(mainCallText) + mainCallText.length,
    );

    const hasTransformationBefore = transformationMethods.some((method) =>
      beforeCall.includes(method),
    );
    const hasTransformationAfter = transformationMethods.some((method) =>
      afterCall.includes(method),
    );

    // Check for object spreading with additional properties (not just parameter spreading)
    // Pattern: { ...result, newProp: value } or { ...obj, prop: value }
    const hasObjectSpreadWithNewProps = /\{[^}]*\.\.\.[^}]*,[^}]+\}/.test(
      afterCall,
    );

    return (
      hasTransformationBefore ||
      hasTransformationAfter ||
      hasObjectSpreadWithNewProps
    );
  }

  /**
   * Check if the function has logging
   */
  private hasLogging(bodyText: string): boolean {
    const loggingPatterns = [
      "console.",
      "logger.",
      "log(",
      "debug(",
      "info(",
      "warn(",
      "error(",
    ];

    return loggingPatterns.some((pattern) => bodyText.includes(pattern));
  }

  /**
   * Check if the function has caching logic
   */
  private hasCaching(bodyText: string): boolean {
    const cachingPatterns = [
      "cache",
      "memoize",
      "localStorage",
      "sessionStorage",
      "redis",
      "getItem",
      "setItem",
    ];

    return cachingPatterns.some((pattern) =>
      bodyText.toLowerCase().includes(pattern),
    );
  }

  /**
   * Check if the function has retry logic
   */
  private hasRetryLogic(bodyText: string): boolean {
    const retryPatterns = [
      "retry",
      "attempt",
      "while",
      "for",
      "maxRetries",
      "retryCount",
    ];

    return retryPatterns.some((pattern) => bodyText.includes(pattern));
  }

  /**
   * Check if the function has authentication/authorization logic
   * This should detect actual auth logic, not just calling auth functions
   */
  private hasAuthLogic(bodyText: string): boolean {
    // Only flag as having auth logic if there are actual auth checks/conditions
    // Not just calling an auth function
    const authCheckPatterns = [
      /if\s*\([^)]*auth/i,
      /if\s*\([^)]*permission/i,
      /if\s*\([^)]*role/i,
      /if\s*\([^)]*token/i,
      /if\s*\([^)]*session/i,
      /checkAuth\s*\(/,
      /verifyAuth\s*\(/,
      /isAuthenticated\s*\(/,
      /isAuthorized\s*\(/,
      /checkPermission\s*\(/,
      /checkRole\s*\(/,
      /hasPermission\s*\(/,
      /hasRole\s*\(/,
    ];

    return authCheckPatterns.some((pattern) => pattern.test(bodyText));
  }

  /**
   * Check if the function has parameter transformation
   */
  private hasParameterTransformation(
    funcParamNames: string[],
    mainCall: CallExpression,
    bodyText: string,
  ): boolean {
    const _callArgs = mainCall.getArguments();
    const callText = mainCall.getText();

    // Check if parameters are transformed before being passed
    for (const paramName of funcParamNames) {
      // Look for transformations like: param.toLowerCase(), param.trim(), etc.
      const transformationPattern = new RegExp(`${paramName}\\.(\\w+)\\(`);
      if (transformationPattern.test(callText)) {
        return true;
      }

      // Look for transformations in the body before the call
      const beforeCall = bodyText.substring(0, bodyText.indexOf(callText));
      if (beforeCall.includes(paramName) && beforeCall.includes("=")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if the function enriches parameters with default values or additional data
   */
  private hasParameterEnrichment(
    funcParamNames: string[],
    mainCall: CallExpression,
    bodyText: string,
  ): boolean {
    const callArgs = mainCall.getArguments();

    // Check if the call has more arguments than the function parameters
    if (callArgs.length > funcParamNames.length) {
      return true;
    }

    // Check for default value assignments
    const hasDefaultValues =
      /=.*\|\|/.test(bodyText) || /=.*\?\?/.test(bodyText);
    if (hasDefaultValues) {
      return true;
    }

    // Check for object spreading with additional properties
    const hasSpreadWithAdditions = /\{.*\.\.\..*,.*\}/.test(bodyText);
    if (hasSpreadWithAdditions) {
      return true;
    }

    return false;
  }

  /**
   * Check if parameters are simply passed through unchanged
   */
  private isSimpleParameterPassThrough(
    funcParamNames: string[],
    mainCall: CallExpression,
    statementCount: number,
  ): boolean {
    // If there are no parameters, check if it's still a simple wrapper
    if (funcParamNames.length === 0) {
      // A parameterless wrapper is still a wrapper if it just calls another function
      return statementCount <= 2;
    }

    const _callArgs = mainCall.getArguments();
    const callText = mainCall.getText();

    // Count how many function parameters appear in the call
    let paramsInCall = 0;
    for (const paramName of funcParamNames) {
      // Check if the parameter name appears in the call arguments
      if (callText.includes(paramName)) {
        paramsInCall++;
      }
    }

    // If most parameters (>70%) are passed through and there are few statements,
    // it's likely a simple pass-through
    const passThrough =
      paramsInCall >= funcParamNames.length * 0.7 && statementCount <= 2;

    return passThrough;
  }

  /**
   * Generate a recommendation for removing an unnecessary adapter
   */
  private generateRemovalRecommendation(
    funcName: string,
    wrappedFunction: string,
  ): string {
    return (
      `Remove the wrapper function '${funcName}' and call '${wrappedFunction}' directly. ` +
      `This adapter adds no meaningful value (no error handling, validation, transformation, logging, or other logic) ` +
      `and only increases code complexity. Direct calls to '${wrappedFunction}' will be clearer and easier to maintain. ` +
      `If this wrapper was created for future extensibility, consider adding it back when actual logic is needed (YAGNI principle).`
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get arrow functions from the AST
   */
  protected getArrowFunctions(ast: SourceFile): ArrowFunction[] {
    const arrowFunctions: ArrowFunction[] = [];

    ast.forEachDescendant((node) => {
      if (Node.isArrowFunction(node)) {
        arrowFunctions.push(node);
      }
    });

    return arrowFunctions;
  }

  /**
   * Get function expressions from the AST
   */
  protected getFunctionExpressions(ast: SourceFile): FunctionExpression[] {
    const functionExpressions: FunctionExpression[] = [];

    ast.forEachDescendant((node) => {
      if (Node.isFunctionExpression(node)) {
        functionExpressions.push(node);
      }
    });

    return functionExpressions;
  }

  /**
   * Get the body of a function (works for different function types)
   */
  protected getFunctionBody(func: Node): Node | undefined {
    if (Node.isFunctionDeclaration(func) || Node.isFunctionExpression(func)) {
      return func.getBody();
    }

    if (Node.isArrowFunction(func)) {
      const body = func.getBody();
      return body;
    }

    if (Node.isMethodDeclaration(func)) {
      return func.getBody();
    }

    return undefined;
  }

  /**
   * Get the name of a function
   */
  protected getFunctionName(func: Node): string {
    if (Node.isFunctionDeclaration(func)) {
      return func.getName() || "anonymous";
    }

    if (Node.isMethodDeclaration(func)) {
      return func.getName();
    }

    if (Node.isFunctionExpression(func) || Node.isArrowFunction(func)) {
      // Try to get the name from the parent variable declaration
      const parent = func.getParent();
      if (Node.isVariableDeclaration(parent)) {
        return parent.getName();
      }

      // Try to get from property assignment
      if (Node.isPropertyAssignment(parent)) {
        return parent.getName();
      }

      // Try to get from property declaration
      if (Node.isPropertyDeclaration(parent)) {
        return parent.getName();
      }

      return "anonymous";
    }

    return "unknown";
  }

  /**
   * Get statements from a function body
   */
  protected getFunctionStatements(body: Node): Node[] {
    if (Node.isBlock(body)) {
      return body.getStatements();
    }

    // For arrow functions with expression bodies
    return [body];
  }

  /**
   * Get call expressions from a specific node
   */
  protected getCallExpressionsFromNode(node: Node): CallExpression[] {
    const calls: CallExpression[] = [];

    // Check if the node itself is a call expression (for arrow function expression bodies)
    if (Node.isCallExpression(node)) {
      calls.push(node);
    }

    // Also check descendants
    node.forEachDescendant((descendant) => {
      if (Node.isCallExpression(descendant)) {
        calls.push(descendant);
      }
    });

    return calls;
  }

  /**
   * Get parameters from a function
   */
  protected getFunctionParameters(func: Node): Node[] {
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isFunctionExpression(func) ||
      Node.isArrowFunction(func) ||
      Node.isMethodDeclaration(func)
    ) {
      return func.getParameters();
    }

    return [];
  }
}
