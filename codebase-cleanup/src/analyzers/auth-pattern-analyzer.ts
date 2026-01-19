/**
 * Auth Pattern Analyzer
 *
 * Analyzes authentication and authorization patterns in the codebase
 * to identify inconsistencies, redundancies, and unnecessary complexity.
 *
 * Detects:
 * - Multiple auth client instantiation patterns
 * - Inconsistent permission checking approaches
 * - Inconsistent session management
 * - Redundant auth middleware
 * - Unnecessary auth wrapper functions
 */

import { SourceFile, Node, ArrowFunction } from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Pattern for tracking auth client instantiation
 */
interface AuthClientPattern {
  functionName: string;
  node: Node;
  file: string;
}

/**
 * Pattern for tracking permission checks
 */
interface PermissionCheckPattern {
  type: "role" | "permission" | "custom";
  node: Node;
  file: string;
}

/**
 * Pattern for tracking session management
 */
interface SessionPattern {
  type: "cookie" | "token" | "supabase" | "custom";
  node: Node;
  file: string;
}

/**
 * Analyzer for authentication and authorization patterns
 */
export class AuthPatternAnalyzer extends BasePatternAnalyzer {
  readonly name = "AuthPatternAnalyzer";

  private authClientPatterns: AuthClientPattern[] = [];
  private permissionCheckPatterns: PermissionCheckPattern[] = [];
  private sessionPatterns: SessionPattern[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["api-route", "service", "middleware", "util"];
  }

  /**
   * Analyze a file for auth-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 5.1: Detect auth client instantiation patterns
    issues.push(...this.detectAuthClientPatterns(file, ast));

    // Task 5.2: Detect auth inconsistencies
    issues.push(...this.detectAuthInconsistencies(file, ast));

    // Task 5.3: Detect unnecessary auth adapters
    issues.push(...this.detectUnnecessaryAuthAdapters(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 5.1: Auth Client Instantiation Pattern Detection
  // ============================================================================

  /**
   * Detect multiple patterns for creating auth clients
   * Validates Requirements: 2.1
   */
  private detectAuthClientPatterns(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    // Common auth client creation patterns
    const authClientPatterns = [
      "createClient",
      "getSupabaseClient",
      "initSupabase",
      "createSupabaseClient",
      "getAuthClient",
      "initAuth",
      "createAuthClient",
      "supabaseClient",
      "getClient",
      "initClient",
    ];

    for (const call of callExpressions) {
      const callText = call.getText();

      // Check if this is an auth client creation call
      for (const pattern of authClientPatterns) {
        if (callText.includes(pattern)) {
          // Track this pattern
          this.authClientPatterns.push({
            functionName: pattern,
            node: call,
            file: file.relativePath,
          });

          // If we've seen multiple different patterns, flag as inconsistent
          const uniquePatterns = new Set(
            this.authClientPatterns.map((p) => p.functionName),
          );
          if (uniquePatterns.size > 1) {
            issues.push(
              this.createIssue({
                type: "inconsistent-pattern",
                severity: "medium",
                category: "authentication",
                file: file.relativePath,
                node: call,
                description: `Inconsistent auth client instantiation pattern detected. Found ${uniquePatterns.size} different patterns: ${Array.from(uniquePatterns).join(", ")}`,
                recommendation:
                  "Standardize auth client creation to use a single pattern across the codebase. Consider creating a centralized auth client factory function.",
                estimatedEffort: "medium",
                tags: ["auth", "inconsistency", "client-instantiation"],
              }),
            );
          }
          break;
        }
      }
    }

    return issues;
  }

  // ============================================================================
  // Task 5.2: Auth Inconsistency Detection
  // ============================================================================

  /**
   * Detect inconsistent permission checking, session management, and redundant middleware
   * Validates Requirements: 2.2, 2.3, 2.4
   */
  private detectAuthInconsistencies(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Detect inconsistent permission checking
    issues.push(...this.detectInconsistentPermissionChecks(file, ast));

    // Detect inconsistent session management
    issues.push(...this.detectInconsistentSessionManagement(file, ast));

    // Detect redundant auth middleware
    issues.push(...this.detectRedundantAuthMiddleware(file, ast));

    return issues;
  }

  /**
   * Detect inconsistent permission checking patterns
   * Validates Requirements: 2.2
   */
  private detectInconsistentPermissionChecks(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    // Permission checking patterns
    const roleCheckPatterns = [
      "checkRole",
      "hasRole",
      "isRole",
      "role ===",
      "role ==",
    ];
    const permissionCheckPatterns = [
      "checkPermission",
      "hasPermission",
      "can",
      "permissions.includes",
    ];
    const customCheckPatterns = [
      "checkAuth",
      "isAuthorized",
      "authorize",
      "verifyAccess",
    ];

    for (const call of callExpressions) {
      const callText = call.getText();

      // Identify the type of permission check
      let checkType: "role" | "permission" | "custom" | null = null;

      if (roleCheckPatterns.some((pattern) => callText.includes(pattern))) {
        checkType = "role";
      } else if (
        permissionCheckPatterns.some((pattern) => callText.includes(pattern))
      ) {
        checkType = "permission";
      } else if (
        customCheckPatterns.some((pattern) => callText.includes(pattern))
      ) {
        checkType = "custom";
      }

      if (checkType) {
        this.permissionCheckPatterns.push({
          type: checkType,
          node: call,
          file: file.relativePath,
        });

        // If we've seen multiple different check types, flag as inconsistent
        const uniqueCheckTypes = new Set(
          this.permissionCheckPatterns.map((p) => p.type),
        );
        if (uniqueCheckTypes.size > 1) {
          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "high",
              category: "authentication",
              file: file.relativePath,
              node: call,
              description: `Inconsistent permission checking approach detected. Found ${uniqueCheckTypes.size} different approaches: ${Array.from(uniqueCheckTypes).join(", ")}`,
              recommendation:
                "Standardize permission checking to use a single approach (either role-based, permission-based, or a custom unified approach). This improves maintainability and reduces security risks.",
              estimatedEffort: "medium",
              tags: ["auth", "permissions", "inconsistency", "security"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent session management
   * Validates Requirements: 2.4
   */
  private detectInconsistentSessionManagement(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    // Session management patterns
    const cookiePatterns = ["cookies()", "getCookie", "setCookie", "cookie."];
    const tokenPatterns = ["getToken", "setToken", "token", "jwt", "bearer"];
    const supabasePatterns = [
      "getSession",
      "setSession",
      "session.user",
      "auth.getUser",
    ];
    const customPatterns = ["getAuth", "setAuth", "authSession"];

    for (const call of callExpressions) {
      const callText = call.getText();

      // Identify the type of session management
      let sessionType: "cookie" | "token" | "supabase" | "custom" | null = null;

      if (cookiePatterns.some((pattern) => callText.includes(pattern))) {
        sessionType = "cookie";
      } else if (tokenPatterns.some((pattern) => callText.includes(pattern))) {
        sessionType = "token";
      } else if (
        supabasePatterns.some((pattern) => callText.includes(pattern))
      ) {
        sessionType = "supabase";
      } else if (customPatterns.some((pattern) => callText.includes(pattern))) {
        sessionType = "custom";
      }

      if (sessionType) {
        this.sessionPatterns.push({
          type: sessionType,
          node: call,
          file: file.relativePath,
        });

        // If we've seen multiple different session types, flag as inconsistent
        const uniqueSessionTypes = new Set(
          this.sessionPatterns.map((p) => p.type),
        );
        if (uniqueSessionTypes.size > 1) {
          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "high",
              category: "authentication",
              file: file.relativePath,
              node: call,
              description: `Inconsistent session management detected. Found ${uniqueSessionTypes.size} different approaches: ${Array.from(uniqueSessionTypes).join(", ")}`,
              recommendation:
                "Standardize session management to use a single approach. For Supabase projects, prefer using Supabase's built-in session management.",
              estimatedEffort: "large",
              tags: ["auth", "session", "inconsistency", "security"],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect redundant auth middleware
   * Validates Requirements: 2.3
   */
  private detectRedundantAuthMiddleware(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Only check middleware files
    if (
      file.category !== "middleware" &&
      !file.relativePath.includes("middleware")
    ) {
      return issues;
    }

    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
    ];

    // Track middleware functions that perform auth checks
    const authMiddlewareFunctions: Node[] = [];

    for (const func of functions) {
      const funcText = func.getText();

      // Check if this function performs auth checks
      const authKeywords = [
        "auth",
        "authenticate",
        "authorize",
        "checkAuth",
        "verifyAuth",
        "getUser",
        "getSession",
        "checkPermission",
        "checkRole",
      ];

      if (
        authKeywords.some((keyword) =>
          funcText.toLowerCase().includes(keyword.toLowerCase()),
        )
      ) {
        authMiddlewareFunctions.push(func);
      }
    }

    // If we have multiple auth middleware functions in the same file, flag as redundant
    if (authMiddlewareFunctions.length > 1) {
      for (const func of authMiddlewareFunctions) {
        issues.push(
          this.createIssue({
            type: "code-duplication",
            severity: "medium",
            category: "authentication",
            file: file.relativePath,
            node: func,
            description: `Redundant auth middleware detected. Found ${authMiddlewareFunctions.length} auth middleware functions in the same file.`,
            recommendation:
              "Consolidate auth middleware into a single, reusable function. Consider creating a composable middleware pattern if different auth checks are needed.",
            estimatedEffort: "small",
            tags: ["auth", "middleware", "duplication"],
          }),
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Task 5.3: Unnecessary Auth Adapter Detection
  // ============================================================================

  /**
   * Detect simple pass-through auth wrapper functions
   * Validates Requirements: 2.5
   */
  private detectUnnecessaryAuthAdapters(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
    ];

    for (const func of functions) {
      const _funcText = func.getText();
      const funcName = this.getNodeName(func);

      // Skip if no name or not auth-related
      if (!funcName || !this.isAuthRelated(funcName)) {
        continue;
      }

      // Check if this is a simple pass-through wrapper
      if (this.isPassThroughWrapper(func)) {
        issues.push(
          this.createIssue({
            type: "unnecessary-adapter",
            severity: "low",
            category: "authentication",
            file: file.relativePath,
            node: func,
            description: `Unnecessary auth adapter detected: "${funcName}". This function appears to be a simple pass-through wrapper that adds no meaningful value.`,
            recommendation:
              "Remove this wrapper function and call the underlying auth function directly. This reduces code complexity and improves maintainability.",
            estimatedEffort: "trivial",
            tags: ["auth", "adapter", "unnecessary", "wrapper"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Check if a function name is auth-related
   */
  private isAuthRelated(name: string): boolean {
    const authKeywords = [
      "auth",
      "authenticate",
      "authorize",
      "login",
      "logout",
      "session",
      "user",
      "permission",
      "role",
      "access",
      "token",
      "credential",
    ];

    const lowerName = name.toLowerCase();
    return authKeywords.some((keyword) => lowerName.includes(keyword));
  }

  /**
   * Check if a function is a simple pass-through wrapper
   */
  private isPassThroughWrapper(func: Node): boolean {
    const funcText = func.getText();

    // Get the function body
    let body: Node | undefined;

    if (Node.isFunctionDeclaration(func) || Node.isFunctionExpression(func)) {
      body = (func as any).getBody();
    } else if (Node.isArrowFunction(func)) {
      const _arrowBody = (func as ArrowFunction).getBody();
    }

    if (!body) {
      return false;
    }

    const bodyText = body.getText().trim();

    // Check for simple pass-through patterns:
    // 1. Single return statement with a function call
    // 2. Single line arrow function that just calls another function
    // 3. Function that just returns the result of another function call

    // Pattern 1: { return someFunction(...) }
    const singleReturnPattern = /^\{\s*return\s+\w+\([^)]*\)\s*;?\s*\}$/;
    if (singleReturnPattern.test(bodyText)) {
      return true;
    }

    // Pattern 2: Arrow function: (...) => someFunction(...)
    const arrowPassThroughPattern = /^\w+\([^)]*\)$/;
    if (Node.isArrowFunction(func) && arrowPassThroughPattern.test(bodyText)) {
      return true;
    }

    // Pattern 3: Check if body has only one statement that's a return with a call
    if (Node.isBlock(body)) {
      const statements = body.getStatements();
      if (statements.length === 1) {
        const statement = statements[0];
        if (Node.isReturnStatement(statement)) {
          const expression = statement.getExpression();
          if (expression && Node.isCallExpression(expression)) {
            // This is a simple pass-through: just returns a function call
            return true;
          }
        }
      }
    }

    // Pattern 4: Arrow function with single call expression
    if (Node.isArrowFunction(func)) {
      const arrowBody = (func as ArrowFunction).getBody();
      if (Node.isCallExpression(arrowBody)) {
        return true;
      }
    }

    return false;
  }
}
