/**
 * API Route Pattern Analyzer
 *
 * Analyzes Next.js API route handlers for consistency and quality.
 *
 * Detects:
 * - All Next.js API route handlers (GET, POST, PUT, DELETE, PATCH, etc.)
 * - Route patterns and categorization
 * - Inconsistent request validation patterns
 * - Missing or inconsistent error handling
 * - Inconsistent response formats
 * - Duplicate or redundant middleware usage
 */

import { SourceFile, Node } from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Pattern for tracking API route handlers
 */
interface RouteHandlerPattern {
  method: string;
  handlerName: string;
  node: Node;
  file: string;
  isExported: boolean;
}

/**
 * Pattern for tracking route characteristics
 */
interface RouteCharacteristics {
  hasRequestValidation: boolean;
  hasErrorHandling: boolean;
  responseFormat: string | null;
  middlewareUsed: string[];
}

/**
 * Analyzer for API route patterns
 */
export class APIRoutePatternAnalyzer extends BasePatternAnalyzer {
  readonly name = "APIRoutePatternAnalyzer";

  private routeHandlers: RouteHandlerPattern[] = [];
  private routeCharacteristics: Map<string, RouteCharacteristics> = new Map();

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["api-route"];
  }

  /**
   * Analyze a file for API route-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    // Reset state for each file analysis
    this.routeHandlers = [];
    this.routeCharacteristics.clear();

    const issues: Issue[] = [];

    // Task 9.1: Implement API route discovery
    issues.push(...this.discoverAPIRoutes(file, ast));

    // Task 9.2: Implement route pattern inconsistency detection
    issues.push(...this.detectInconsistentRequestValidation(file, ast));
    issues.push(...this.detectInconsistentErrorHandling(file, ast));
    issues.push(...this.detectInconsistentResponseFormats(file, ast));
    issues.push(...this.detectDuplicateMiddleware(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 9.1: API Route Discovery
  // ============================================================================

  /**
   * Find all Next.js API route handlers and categorize routes by pattern
   * Validates Requirements: 4.1
   */
  private discoverAPIRoutes(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Next.js 13+ App Router: route handlers are exported functions named after HTTP methods
    const httpMethods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
    ];

    // Find exported function declarations
    const functionDeclarations = ast.getFunctions();
    for (const func of functionDeclarations) {
      const funcName = func.getName();

      if (funcName && httpMethods.includes(funcName.toUpperCase())) {
        const isExported = this.isExported(func);

        if (isExported) {
          // This is a Next.js App Router route handler
          this.routeHandlers.push({
            method: funcName.toUpperCase(),
            handlerName: funcName,
            node: func,
            file: file.relativePath,
            isExported: true,
          });

          // Analyze route characteristics
          const characteristics = this.analyzeRouteCharacteristics(func);
          this.routeCharacteristics.set(
            `${file.relativePath}:${funcName}`,
            characteristics,
          );
        }
      }
    }

    // Find exported arrow functions and function expressions assigned to HTTP method names
    const variableDeclarations = this.getVariableDeclarations(ast);
    for (const varDecl of variableDeclarations) {
      const varName = this.getNodeName(varDecl);

      if (varName && httpMethods.includes(varName.toUpperCase())) {
        // Cast to VariableDeclaration to access getInitializer
        if (!Node.isVariableDeclaration(varDecl)) continue;
        const initializer = varDecl.getInitializer();

        if (
          initializer &&
          (Node.isArrowFunction(initializer) ||
            Node.isFunctionExpression(initializer))
        ) {
          // Check if this is exported
          const parent = varDecl.getParent()?.getParent();
          const isExported = parent ? this.isExported(parent) : false;

          if (isExported) {
            // This is a Next.js App Router route handler
            this.routeHandlers.push({
              method: varName.toUpperCase(),
              handlerName: varName,
              node: varDecl,
              file: file.relativePath,
              isExported: true,
            });

            // Analyze route characteristics
            const characteristics =
              this.analyzeRouteCharacteristics(initializer);
            this.routeCharacteristics.set(
              `${file.relativePath}:${varName}`,
              characteristics,
            );
          }
        }
      }
    }

    // Find Next.js Pages Router API handlers (default export function)
    const defaultExport = ast.getDefaultExportSymbol();
    if (defaultExport) {
      const declarations = defaultExport.getDeclarations();

      for (const decl of declarations) {
        // Check if this is a function that looks like an API handler
        if (
          Node.isFunctionDeclaration(decl) ||
          Node.isArrowFunction(decl) ||
          Node.isFunctionExpression(decl)
        ) {
          // Pages Router handlers typically have (req, res) signature
          const params = this.getFunctionParameters(decl);
          if (params.length >= 2) {
            const param1Name = this.getNodeName(params[0])?.toLowerCase() || "";
            const param2Name = this.getNodeName(params[1])?.toLowerCase() || "";

            if (
              (param1Name.includes("req") || param1Name.includes("request")) &&
              (param2Name.includes("res") || param2Name.includes("response"))
            ) {
              // This is a Pages Router API handler
              this.routeHandlers.push({
                method: "MULTIPLE", // Pages Router handlers handle multiple methods
                handlerName: "default",
                node: decl,
                file: file.relativePath,
                isExported: true,
              });

              // Analyze route characteristics
              const characteristics = this.analyzeRouteCharacteristics(decl);
              this.routeCharacteristics.set(
                `${file.relativePath}:default`,
                characteristics,
              );
            }
          }
        }
      }
    }

    // Categorize routes by pattern
    const routePatterns = this.categorizeRoutesByPattern(file);

    // Report findings (informational, not an issue)
    if (this.routeHandlers.length > 0) {
      const methods = this.routeHandlers.map((h) => h.method).join(", ");
      const patternInfo =
        routePatterns.length > 0
          ? ` Patterns detected: ${routePatterns.join(", ")}`
          : "";

      // Create an informational issue to document the discovered routes
      issues.push(
        this.createIssue({
          type: "inconsistent-pattern",
          severity: "low",
          category: "api-routes",
          file: file.relativePath,
          node: this.routeHandlers[0].node,
          description: `API route discovered with ${this.routeHandlers.length} handler(s): ${methods}.${patternInfo}`,
          recommendation:
            "Ensure all route handlers follow consistent patterns for validation, error handling, and response formatting.",
          estimatedEffort: "trivial",
          tags: ["api-routes", "discovery", "informational"],
        }),
      );
    }

    return issues;
  }

  /**
   * Analyze characteristics of a route handler
   */
  private analyzeRouteCharacteristics(handler: Node): RouteCharacteristics {
    const _handlerText = handler.getText();

    return {
      hasRequestValidation: this.checkForRequestValidation(handler),
      hasErrorHandling: this.checkForErrorHandling(handler),
      responseFormat: this.detectResponseFormat(handler),
      middlewareUsed: this.detectMiddlewareUsage(handler),
    };
  }

  /**
   * Check if a route handler has request validation
   */
  private checkForRequestValidation(handler: Node): boolean {
    const handlerText = handler.getText();

    // Common validation patterns
    const validationPatterns = [
      // Zod validation
      /\.parse\(/,
      /\.safeParse\(/,
      /z\./,

      // Yup validation
      /\.validate\(/,
      /yup\./,

      // Manual validation
      /if\s*\([^)]*(!|===|!==)[^)]*\)\s*{\s*(throw|return)/,
      /if\s*\(!\w+\)/,

      // Type guards
      /typeof\s+\w+\s*(===|!==)/,
      /instanceof/,

      // Validation libraries
      /validator\./,
      /validate\(/,
      /schema\./,
    ];

    return validationPatterns.some((pattern) => pattern.test(handlerText));
  }

  /**
   * Check if a route handler has error handling
   */
  private checkForErrorHandling(handler: Node): boolean {
    const handlerText = handler.getText();

    // Look for try-catch blocks
    if (handlerText.includes("try") && handlerText.includes("catch")) {
      return true;
    }

    // Look for .catch() on promises
    if (handlerText.includes(".catch(")) {
      return true;
    }

    // Look for error checking patterns
    if (
      handlerText.includes("error") &&
      (handlerText.includes("if") || handlerText.includes("throw"))
    ) {
      return true;
    }

    // Look for NextResponse.json with error status
    if (
      handlerText.includes("NextResponse") &&
      (handlerText.includes("status: 4") || handlerText.includes("status: 5"))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Detect the response format used by a route handler
   */
  private detectResponseFormat(handler: Node): string | null {
    const handlerText = handler.getText();

    // Next.js App Router: NextResponse
    if (handlerText.includes("NextResponse.json")) {
      return "NextResponse.json";
    }

    if (handlerText.includes("new Response")) {
      return "Response";
    }

    // Next.js Pages Router: res.json, res.status, res.send
    if (handlerText.includes("res.json")) {
      return "res.json";
    }

    if (handlerText.includes("res.status")) {
      return "res.status";
    }

    if (handlerText.includes("res.send")) {
      return "res.send";
    }

    // Return object directly (App Router)
    if (
      handlerText.includes("return {") ||
      handlerText.includes("return new")
    ) {
      return "direct-return";
    }

    return null;
  }

  /**
   * Detect middleware usage in a route handler
   */
  private detectMiddlewareUsage(handler: Node): string[] {
    const handlerText = handler.getText();
    const middleware: string[] = [];

    // Common middleware patterns
    const middlewarePatterns = [
      { pattern: /auth\w*\(/, name: "auth" },
      { pattern: /authenticate\w*\(/, name: "authentication" },
      { pattern: /authorize\w*\(/, name: "authorization" },
      { pattern: /validate\w*\(/, name: "validation" },
      { pattern: /cors\w*\(/, name: "cors" },
      { pattern: /rateLimit\w*\(/, name: "rate-limiting" },
      { pattern: /logger\w*\(/, name: "logging" },
      { pattern: /cache\w*\(/, name: "caching" },
    ];

    for (const { pattern, name } of middlewarePatterns) {
      if (pattern.test(handlerText)) {
        middleware.push(name);
      }
    }

    return middleware;
  }

  /**
   * Categorize routes by pattern
   */
  private categorizeRoutesByPattern(file: FileInfo): string[] {
    const patterns: string[] = [];
    const filePath = file.relativePath.toLowerCase();

    // Detect route patterns based on file path

    // Dynamic routes: [id], [slug], etc.
    if (filePath.includes("[") && filePath.includes("]")) {
      patterns.push("dynamic-route");
    }

    // Catch-all routes: [...slug]
    if (filePath.includes("[...")) {
      patterns.push("catch-all-route");
    }

    // Optional catch-all routes: [[...slug]]
    if (filePath.includes("[[...")) {
      patterns.push("optional-catch-all-route");
    }

    // Route groups: (group)
    if (filePath.includes("(") && filePath.includes(")")) {
      patterns.push("route-group");
    }

    // Parallel routes: @folder
    if (filePath.includes("@")) {
      patterns.push("parallel-route");
    }

    // Intercepting routes: (.)folder, (..)folder, (...)folder
    if (filePath.match(/\(\.+\)/)) {
      patterns.push("intercepting-route");
    }

    // Detect patterns based on route handlers
    const methods = this.routeHandlers.map((h) => h.method);

    // RESTful CRUD pattern
    if (
      methods.includes("GET") &&
      methods.includes("POST") &&
      methods.includes("PUT") &&
      methods.includes("DELETE")
    ) {
      patterns.push("restful-crud");
    }

    // Read-only API
    if (methods.includes("GET") && methods.length === 1) {
      patterns.push("read-only");
    }

    // Write-only API
    if (
      (methods.includes("POST") ||
        methods.includes("PUT") ||
        methods.includes("DELETE")) &&
      !methods.includes("GET")
    ) {
      patterns.push("write-only");
    }

    return patterns;
  }

  /**
   * Get parameters from a function
   */
  private getFunctionParameters(func: Node): Node[] {
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isFunctionExpression(func) ||
      Node.isArrowFunction(func)
    ) {
      return func.getParameters();
    }

    return [];
  }

  // ============================================================================
  // Task 9.2: Route Pattern Inconsistency Detection
  // ============================================================================

  /**
   * Detect inconsistent request validation patterns across routes
   * Validates Requirements: 4.2
   */
  private detectInconsistentRequestValidation(
    file: FileInfo,
    _ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Analyze each route handler for validation patterns
    for (const handler of this.routeHandlers) {
      const key = `${handler.file}:${handler.handlerName}`;
      const characteristics = this.routeCharacteristics.get(key);

      if (!characteristics) continue;

      // Check if route accepts data but has no validation
      const acceptsData = ["POST", "PUT", "PATCH"].includes(handler.method);

      if (acceptsData && !characteristics.hasRequestValidation) {
        issues.push(
          this.createIssue({
            type: "inconsistent-pattern",
            severity: "high",
            category: "api-routes",
            file: handler.file,
            node: handler.node,
            description: `${handler.method} route handler lacks request validation. Routes that accept data should validate input to prevent invalid data processing.`,
            recommendation:
              "Add request validation using a schema validation library (e.g., Zod, Yup) or manual validation checks before processing the request data.",
            estimatedEffort: "small",
            tags: [
              "api-routes",
              "validation",
              "security",
              "inconsistent-pattern",
            ],
          }),
        );
      }
    }

    // Check for inconsistent validation approaches across multiple handlers in the same file
    if (this.routeHandlers.length > 1) {
      const validationApproaches = new Set<string>();
      const handlerText = this.routeHandlers
        .map((h) => h.node.getText())
        .join("\n");

      // Detect different validation libraries being used
      if (handlerText.includes("z.") || handlerText.includes(".parse(")) {
        validationApproaches.add("Zod");
      }
      if (handlerText.includes("yup.") || handlerText.includes(".validate(")) {
        validationApproaches.add("Yup");
      }
      if (
        handlerText.match(/if\s*\([^)]*(!|===|!==)[^)]*\)\s*{\s*(throw|return)/)
      ) {
        validationApproaches.add("Manual");
      }

      // If multiple validation approaches are used, flag as inconsistent
      if (validationApproaches.size > 1) {
        issues.push(
          this.createIssue({
            type: "inconsistent-pattern",
            severity: "medium",
            category: "api-routes",
            file: file.relativePath,
            node: this.routeHandlers[0].node,
            description: `Multiple validation approaches detected in the same file: ${Array.from(validationApproaches).join(", ")}. This creates inconsistency and makes the codebase harder to maintain.`,
            recommendation:
              "Standardize on a single validation approach across all route handlers in this file. Consider using a schema validation library like Zod for consistency.",
            estimatedEffort: "medium",
            tags: [
              "api-routes",
              "validation",
              "inconsistent-pattern",
              "maintainability",
            ],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent error handling patterns across routes
   * Validates Requirements: 4.3
   */
  private detectInconsistentErrorHandling(
    file: FileInfo,
    _ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Analyze each route handler for error handling
    for (const handler of this.routeHandlers) {
      const key = `${handler.file}:${handler.handlerName}`;
      const characteristics = this.routeCharacteristics.get(key);

      if (!characteristics) continue;

      // Check if route lacks error handling
      if (!characteristics.hasErrorHandling) {
        issues.push(
          this.createIssue({
            type: "missing-error-handling",
            severity: "high",
            category: "api-routes",
            file: handler.file,
            node: handler.node,
            description: `${handler.method} route handler lacks error handling. Unhandled errors can crash the application or leak sensitive information.`,
            recommendation:
              "Add try-catch blocks or .catch() handlers to handle errors gracefully. Return appropriate error responses with proper status codes.",
            estimatedEffort: "small",
            tags: ["api-routes", "error-handling", "reliability", "security"],
          }),
        );
      }
    }

    // Check for inconsistent error response patterns across handlers
    if (this.routeHandlers.length > 1) {
      const errorPatterns = new Set<string>();

      for (const handler of this.routeHandlers) {
        const handlerText = handler.node.getText();

        // Detect different error response patterns
        if (
          handlerText.includes("NextResponse.json") &&
          handlerText.match(/status:\s*[45]\d{2}/)
        ) {
          errorPatterns.add("NextResponse.json with status");
        }
        if (
          handlerText.includes("new Response") &&
          handlerText.includes("status:")
        ) {
          errorPatterns.add("Response with status");
        }
        if (
          handlerText.includes("res.status(") &&
          handlerText.includes(".json(")
        ) {
          errorPatterns.add("res.status().json()");
        }
        if (handlerText.includes("throw new Error")) {
          errorPatterns.add("throw Error");
        }
        if (handlerText.includes("return { error:")) {
          errorPatterns.add("return error object");
        }
      }

      // If multiple error patterns are used, flag as inconsistent
      if (errorPatterns.size > 1) {
        issues.push(
          this.createIssue({
            type: "inconsistent-pattern",
            severity: "medium",
            category: "api-routes",
            file: file.relativePath,
            node: this.routeHandlers[0].node,
            description: `Multiple error handling patterns detected: ${Array.from(errorPatterns).join(", ")}. Inconsistent error handling makes debugging harder and creates a poor API experience.`,
            recommendation:
              "Standardize error handling across all route handlers. Use a consistent pattern for error responses with proper status codes and error message formats.",
            estimatedEffort: "medium",
            tags: [
              "api-routes",
              "error-handling",
              "inconsistent-pattern",
              "api-design",
            ],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent response format patterns across routes
   * Validates Requirements: 4.4
   */
  private detectInconsistentResponseFormats(
    file: FileInfo,
    _ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Collect response formats from all handlers
    const responseFormats = new Map<string, number>();

    for (const handler of this.routeHandlers) {
      const key = `${handler.file}:${handler.handlerName}`;
      const characteristics = this.routeCharacteristics.get(key);

      if (!characteristics || !characteristics.responseFormat) continue;

      const format = characteristics.responseFormat;
      responseFormats.set(format, (responseFormats.get(format) || 0) + 1);
    }

    // If multiple response formats are used in the same file, flag as inconsistent
    if (responseFormats.size > 1) {
      const formatsList = Array.from(responseFormats.entries())
        .map(([format, count]) => `${format} (${count}x)`)
        .join(", ");

      issues.push(
        this.createIssue({
          type: "inconsistent-pattern",
          severity: "medium",
          category: "api-routes",
          file: file.relativePath,
          node: this.routeHandlers[0].node,
          description: `Multiple response format patterns detected in the same file: ${formatsList}. Inconsistent response formats make the API harder to consume and maintain.`,
          recommendation:
            "Standardize on a single response format across all route handlers. For Next.js App Router, use NextResponse.json() consistently. For Pages Router, use res.json() consistently.",
          estimatedEffort: "small",
          tags: [
            "api-routes",
            "response-format",
            "inconsistent-pattern",
            "api-design",
          ],
        }),
      );
    }

    // Check for missing response format (handlers that don't return anything)
    for (const handler of this.routeHandlers) {
      const key = `${handler.file}:${handler.handlerName}`;
      const characteristics = this.routeCharacteristics.get(key);

      if (!characteristics || characteristics.responseFormat) continue;

      // Handler doesn't have a clear response format
      issues.push(
        this.createIssue({
          type: "inconsistent-pattern",
          severity: "high",
          category: "api-routes",
          file: handler.file,
          node: handler.node,
          description: `${handler.method} route handler does not have a clear response format. All API routes should return a consistent response.`,
          recommendation:
            "Ensure the route handler returns a response using NextResponse.json() (App Router) or res.json() (Pages Router) with appropriate data and status codes.",
          estimatedEffort: "small",
          tags: ["api-routes", "response-format", "api-design"],
        }),
      );
    }

    return issues;
  }

  /**
   * Detect duplicate or redundant middleware usage across routes
   * Validates Requirements: 4.5
   */
  private detectDuplicateMiddleware(file: FileInfo, _ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Collect middleware usage across all handlers
    const middlewareUsage = new Map<string, number>();

    for (const handler of this.routeHandlers) {
      const key = `${handler.file}:${handler.handlerName}`;
      const characteristics = this.routeCharacteristics.get(key);

      if (!characteristics) continue;

      for (const middleware of characteristics.middlewareUsed) {
        middlewareUsage.set(
          middleware,
          (middlewareUsage.get(middleware) || 0) + 1,
        );
      }
    }

    // If the same middleware is used in multiple handlers in the same file, suggest consolidation
    for (const [middleware, count] of middlewareUsage.entries()) {
      if (count > 1 && this.routeHandlers.length > 1) {
        issues.push(
          this.createIssue({
            type: "code-duplication",
            severity: "low",
            category: "api-routes",
            file: file.relativePath,
            node: this.routeHandlers[0].node,
            description: `Middleware '${middleware}' is used ${count} times across different route handlers in the same file. This creates duplication and makes updates harder.`,
            recommendation:
              "Consider extracting common middleware to a shared location or using Next.js middleware.ts for route-level middleware that applies to multiple handlers.",
            estimatedEffort: "small",
            tags: [
              "api-routes",
              "middleware",
              "code-duplication",
              "refactoring",
            ],
          }),
        );
      }
    }

    // Check for inline middleware logic that could be extracted
    for (const handler of this.routeHandlers) {
      const handlerText = handler.node.getText();

      // Look for common patterns that should be middleware
      const inlinePatterns = [
        {
          pattern: /const\s+session\s*=\s*await\s+.*auth/i,
          name: "authentication",
          description: "Inline authentication logic detected",
        },
        {
          pattern: /if\s*\(.*\.role\s*!==|if\s*\(!.*\.role\)/,
          name: "authorization",
          description: "Inline authorization logic detected",
        },
        {
          pattern: /const\s+.*\s*=\s*.*\.parse\(|.*\.safeParse\(/,
          name: "validation",
          description: "Inline validation logic detected",
        },
      ];

      for (const { pattern, name, description } of inlinePatterns) {
        if (pattern.test(handlerText)) {
          // Check if this pattern appears in multiple handlers
          let occurrences = 0;
          for (const h of this.routeHandlers) {
            if (pattern.test(h.node.getText())) {
              occurrences++;
            }
          }

          if (occurrences > 1) {
            issues.push(
              this.createIssue({
                type: "code-duplication",
                severity: "medium",
                category: "api-routes",
                file: handler.file,
                node: handler.node,
                description: `${description} appears in ${occurrences} route handlers. This logic should be extracted into reusable middleware.`,
                recommendation: `Extract the ${name} logic into a shared middleware function that can be reused across multiple route handlers. This improves maintainability and reduces duplication.`,
                estimatedEffort: "medium",
                tags: [
                  "api-routes",
                  "middleware",
                  "code-duplication",
                  "refactoring",
                  name,
                ],
              }),
            );
            break; // Only report once per handler
          }
        }
      }
    }

    return issues;
  }
}
