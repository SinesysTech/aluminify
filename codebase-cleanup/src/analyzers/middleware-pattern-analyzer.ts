/**
 * Middleware Pattern Analyzer
 * 
 * Analyzes middleware implementations in the codebase to identify:
 * - All middleware implementations
 * - Middleware usage patterns across routes
 * - Duplicate middleware logic
 * - Inconsistent middleware ordering
 * - Opportunities for consolidation
 * 
 * Validates Requirements: 15.1, 15.2, 15.3, 15.5
 */

import { SourceFile, Node, VariableDeclaration } from 'ts-morph';
import { BasePatternAnalyzer } from './pattern-analyzer.js';
import type { FileInfo, Issue, FileCategory } from '../types.js';

/**
 * Pattern for tracking middleware implementations
 */
interface MiddlewareImplementation {
  name: string;
  node: Node;
  file: string;
  type: 'function' | 'arrow' | 'class' | 'variable';
  isExported: boolean;
}

/**
 * Pattern for tracking middleware usage in routes
 */
interface MiddlewareUsage {
  middlewareName: string;
  routeFile: string;
  node: Node;
  order: number; // Position in middleware chain
}

/**
 * Analyzer for middleware patterns
 */
export class MiddlewarePatternAnalyzer extends BasePatternAnalyzer {
  readonly name = 'MiddlewarePatternAnalyzer';

  // Track middleware implementations across files
  private middlewareImplementations: MiddlewareImplementation[] = [];
  
  // Track middleware usage in routes
  private middlewareUsages: MiddlewareUsage[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ['middleware', 'api-route', 'service', 'util'];
  }

  /**
   * Analyze a file for middleware-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 11.1: Discover middleware implementations
    issues.push(...this.discoverMiddlewareImplementations(file, ast));

    // Track middleware usage in API routes
    if (file.category === 'api-route') {
      this.trackMiddlewareUsage(file, ast);
    }

    // Task 11.2: Detect duplicate middleware logic
    issues.push(...this.detectDuplicateMiddleware(file, ast));

    // Task 11.2: Detect inconsistent middleware ordering
    issues.push(...this.detectInconsistentOrdering(file, ast));

    // Task 11.2: Identify consolidation opportunities
    issues.push(...this.identifyConsolidationOpportunities(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 11.1: Middleware Discovery
  // ============================================================================

  /**
   * Find all middleware implementations and track their usage
   * Validates Requirements: 15.1
   */
  private discoverMiddlewareImplementations(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Only analyze middleware files and files that might contain middleware
    const isMiddlewareFile = file.category === 'middleware' || 
                            file.relativePath.toLowerCase().includes('middleware');

    // Find middleware functions
    const middlewareFunctions = this.findMiddlewareFunctions(ast);

    for (const middleware of middlewareFunctions) {
      const name = this.getNodeName(middleware) || 'anonymous';
      const isExported = this.isExported(middleware);

      // Track this middleware implementation
      this.middlewareImplementations.push({
        name,
        node: middleware,
        file: file.relativePath,
        type: this.getMiddlewareType(middleware),
        isExported,
      });

      // If this is a middleware file, document the middleware
      if (isMiddlewareFile) {
        issues.push(
          this.createIssue({
            type: 'architectural',
            severity: 'low',
            category: 'middleware',
            file: file.relativePath,
            node: middleware,
            description: `Middleware implementation found: "${name}". ${isExported ? 'Exported' : 'Not exported'}.`,
            recommendation: isExported 
              ? 'Ensure this middleware is properly documented and follows consistent patterns.'
              : 'Consider exporting this middleware if it should be reusable, or remove it if unused.',
            estimatedEffort: 'trivial',
            tags: ['middleware', 'discovery', 'documentation'],
          })
        );
      }
    }

    // Find middleware classes
    const middlewareClasses = this.findMiddlewareClasses(ast);

    for (const middlewareClass of middlewareClasses) {
      const name = this.getNodeName(middlewareClass) || 'anonymous';
      const isExported = this.isExported(middlewareClass);

      // Track this middleware implementation
      this.middlewareImplementations.push({
        name,
        node: middlewareClass,
        file: file.relativePath,
        type: 'class',
        isExported,
      });

      if (isMiddlewareFile) {
        issues.push(
          this.createIssue({
            type: 'architectural',
            severity: 'low',
            category: 'middleware',
            file: file.relativePath,
            node: middlewareClass,
            description: `Middleware class found: "${name}". ${isExported ? 'Exported' : 'Not exported'}.`,
            recommendation: isExported
              ? 'Ensure this middleware class follows consistent patterns and is properly documented.'
              : 'Consider exporting this middleware class if it should be reusable, or remove it if unused.',
            estimatedEffort: 'trivial',
            tags: ['middleware', 'discovery', 'class', 'documentation'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Find all functions that appear to be middleware
   */
  private findMiddlewareFunctions(ast: SourceFile): Node[] {
    const middlewareFunctions: Node[] = [];

    // Get all function-like nodes
    const functions = [
      ...this.getFunctionDeclarations(ast),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
    ];

    for (const func of functions) {
      if (this.isMiddlewareFunction(func)) {
        middlewareFunctions.push(func);
      }
    }

    // Also check variable declarations that might be middleware
    const variables = this.getVariableDeclarations(ast);
    for (const variable of variables) {
      if (this.isMiddlewareVariable(variable)) {
        middlewareFunctions.push(variable);
      }
    }

    return middlewareFunctions;
  }

  /**
   * Find all classes that appear to be middleware
   */
  private findMiddlewareClasses(ast: SourceFile): Node[] {
    const middlewareClasses: Node[] = [];
    const classes = this.getClassDeclarations(ast);

    for (const classNode of classes) {
      const className = this.getNodeName(classNode) || '';
      
      // Check if class name suggests it's middleware
      if (this.isMiddlewareRelatedName(className)) {
        middlewareClasses.push(classNode);
      }
    }

    return middlewareClasses;
  }

  /**
   * Check if a function is middleware based on its signature and name
   */
  private isMiddlewareFunction(func: Node): boolean {
    const funcText = func.getText();
    const funcName = this.getNodeName(func) || '';

    // Check if name suggests middleware
    if (this.isMiddlewareRelatedName(funcName)) {
      return true;
    }

    // Check for common middleware patterns in the function signature
    // Middleware typically has (req, res, next) or (request, response, next) parameters
    const middlewareSignaturePatterns = [
      /\(.*req.*,.*res.*,.*next.*\)/i,
      /\(.*request.*,.*response.*,.*next.*\)/i,
      /\(.*context.*,.*next.*\)/i,
      /\(.*ctx.*,.*next.*\)/i,
    ];

    if (middlewareSignaturePatterns.some(pattern => pattern.test(funcText))) {
      return true;
    }

    // Check for Next.js middleware pattern (NextRequest, NextResponse)
    if (funcText.includes('NextRequest') || funcText.includes('NextResponse')) {
      return true;
    }

    // Check for Express-style middleware patterns
    if (funcText.includes('Request') && funcText.includes('Response')) {
      return true;
    }

    return false;
  }

  /**
   * Check if a variable declaration is middleware
   */
  private isMiddlewareVariable(variable: Node): boolean {
    if (!Node.isVariableDeclaration(variable)) {
      return false;
    }

    const varDecl = variable as VariableDeclaration;
    const name = varDecl.getName();
    const initializer = varDecl.getInitializer();

    // Check if name suggests middleware
    if (this.isMiddlewareRelatedName(name)) {
      return true;
    }

    // Check if initializer is a function that looks like middleware
    if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
      return this.isMiddlewareFunction(initializer);
    }

    return false;
  }

  /**
   * Check if a name is middleware-related
   */
  private isMiddlewareRelatedName(name: string): boolean {
    const lowerName = name.toLowerCase();
    
    const middlewareKeywords = [
      'middleware',
      'guard',
      'interceptor',
      'handler',
      'auth',
      'authenticate',
      'authorize',
      'validate',
      'cors',
      'ratelimit',
      'logger',
      'error',
      'session',
    ];

    return middlewareKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Get the type of middleware implementation
   */
  private getMiddlewareType(node: Node): 'function' | 'arrow' | 'class' | 'variable' {
    if (Node.isFunctionDeclaration(node)) {
      return 'function';
    } else if (Node.isArrowFunction(node)) {
      return 'arrow';
    } else if (Node.isClassDeclaration(node)) {
      return 'class';
    } else if (Node.isVariableDeclaration(node)) {
      return 'variable';
    }
    return 'function'; // default
  }

  /**
   * Track middleware usage in API routes
   */
  private trackMiddlewareUsage(file: FileInfo, ast: SourceFile): void {
    const callExpressions = this.getCallExpressions(ast);

    let order = 0;
    for (const call of callExpressions) {
      const callText = call.getText();

      // Check if this call expression is using middleware
      // Common patterns: app.use(middleware), router.use(middleware), middleware(req, res, next)
      if (this.isMiddlewareUsageCall(callText)) {
        // Try to extract middleware name
        const middlewareName = this.extractMiddlewareName(callText);
        
        if (middlewareName) {
          this.middlewareUsages.push({
            middlewareName,
            routeFile: file.relativePath,
            node: call,
            order: order++,
          });
        }
      }
    }
  }

  /**
   * Check if a call expression is using middleware
   */
  private isMiddlewareUsageCall(callText: string): boolean {
    const usagePatterns = [
      /\.use\(/,
      /\.apply\(/,
      /middleware\(/i,
      /guard\(/i,
      /authenticate\(/i,
      /authorize\(/i,
      /validate\(/i,
    ];

    return usagePatterns.some(pattern => pattern.test(callText));
  }

  /**
   * Extract middleware name from a call expression
   */
  private extractMiddlewareName(callText: string): string | null {
    // Try to extract the middleware name from patterns like:
    // app.use(authMiddleware)
    // router.use(validateRequest)
    // authenticate(req, res, next)

    const patterns = [
      /\.use\(([a-zA-Z_$][a-zA-Z0-9_$]*)/,
      /\.apply\(([a-zA-Z_$][a-zA-Z0-9_$]*)/,
      /^([a-zA-Z_$][a-zA-Z0-9_$]*)\(/,
    ];

    for (const pattern of patterns) {
      const match = callText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get summary of middleware discoveries
   * This can be called after analyzing all files to get a complete picture
   */
  public getMiddlewareSummary(): {
    totalImplementations: number;
    totalUsages: number;
    implementationsByFile: Map<string, number>;
    usagesByRoute: Map<string, number>;
  } {
    const implementationsByFile = new Map<string, number>();
    const usagesByRoute = new Map<string, number>();

    for (const impl of this.middlewareImplementations) {
      const count = implementationsByFile.get(impl.file) || 0;
      implementationsByFile.set(impl.file, count + 1);
    }

    for (const usage of this.middlewareUsages) {
      const count = usagesByRoute.get(usage.routeFile) || 0;
      usagesByRoute.set(usage.routeFile, count + 1);
    }

    return {
      totalImplementations: this.middlewareImplementations.length,
      totalUsages: this.middlewareUsages.length,
      implementationsByFile,
      usagesByRoute,
    };
  }

  // ============================================================================
  // Task 11.2: Middleware Pattern Detection
  // ============================================================================

  /**
   * Detect duplicate middleware logic across implementations
   * Validates Requirements: 15.2
   */
  private detectDuplicateMiddleware(file: FileInfo, _ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get middleware implementations in this file
    const fileMiddleware = this.middlewareImplementations.filter(
      impl => impl.file === file.relativePath
    );

    // Compare each middleware in this file with all previously seen middleware
    for (const currentMiddleware of fileMiddleware) {
      // Compare with other middleware implementations
      for (const otherMiddleware of this.middlewareImplementations) {
        // Skip comparing with itself
        if (currentMiddleware === otherMiddleware) {
          continue;
        }

        // Skip if already compared (avoid duplicate issues)
        if (currentMiddleware.file === otherMiddleware.file && 
            this.middlewareImplementations.indexOf(currentMiddleware) > 
            this.middlewareImplementations.indexOf(otherMiddleware)) {
          continue;
        }

        // Check for duplicate logic
        const similarity = this.calculateMiddlewareSimilarity(
          currentMiddleware.node,
          otherMiddleware.node
        );

        // If similarity is high (>80%), flag as duplicate
        if (similarity > 0.8) {
          issues.push(
            this.createIssue({
              type: 'code-duplication',
              severity: 'medium',
              category: 'middleware',
              file: file.relativePath,
              node: currentMiddleware.node,
              description: `Duplicate middleware logic detected. Middleware "${currentMiddleware.name}" is ${Math.round(similarity * 100)}% similar to "${otherMiddleware.name}" in ${otherMiddleware.file}.`,
              recommendation: `Consider consolidating these middleware implementations into a single reusable function. Extract common logic into a shared middleware utility.`,
              estimatedEffort: 'small',
              tags: ['middleware', 'duplication', 'consolidation', 'refactoring'],
            })
          );
        }
        // If similarity is moderate (50-80%), flag as potential consolidation
        else if (similarity > 0.5) {
          issues.push(
            this.createIssue({
              type: 'code-duplication',
              severity: 'low',
              category: 'middleware',
              file: file.relativePath,
              node: currentMiddleware.node,
              description: `Similar middleware logic detected. Middleware "${currentMiddleware.name}" shares ${Math.round(similarity * 100)}% similarity with "${otherMiddleware.name}" in ${otherMiddleware.file}.`,
              recommendation: `Review these middleware implementations for potential consolidation. Consider extracting shared logic into a common utility function.`,
              estimatedEffort: 'small',
              tags: ['middleware', 'similarity', 'potential-consolidation'],
            })
          );
        }
      }
    }

    return issues;
  }

  /**
   * Calculate similarity between two middleware implementations
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  private calculateMiddlewareSimilarity(node1: Node, node2: Node): number {
    const text1 = this.normalizeMiddlewareCode(node1.getText());
    const text2 = this.normalizeMiddlewareCode(node2.getText());

    // If texts are identical after normalization, they're duplicates
    if (text1 === text2) {
      return 1.0;
    }

    // Calculate similarity using a simple approach:
    // 1. Tokenize both texts
    // 2. Count common tokens
    // 3. Calculate Jaccard similarity

    const tokens1 = this.tokenizeCode(text1);
    const tokens2 = this.tokenizeCode(text2);

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    // Calculate intersection and union
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Normalize middleware code for comparison
   * Removes variable names, whitespace, and other non-semantic differences
   */
  private normalizeMiddlewareCode(code: string): string {
    return code
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove trailing/leading whitespace
      .trim()
      // Normalize string quotes
      .replace(/"/g, "'")
      // Remove semicolons (optional in JS/TS)
      .replace(/;/g, '');
  }

  /**
   * Tokenize code into meaningful tokens for comparison
   */
  private tokenizeCode(code: string): string[] {
    // Split on word boundaries and filter out empty strings
    return code
      .split(/\b/)
      .filter(token => token.trim().length > 0)
      .filter(token => !/^\s+$/.test(token));
  }

  /**
   * Detect inconsistent middleware ordering across routes
   * Validates Requirements: 15.3
   */
  private detectInconsistentOrdering(file: FileInfo, _ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Only analyze API routes
    if (file.category !== 'api-route') {
      return issues;
    }

    // Get middleware usage in this route
    const routeMiddleware = this.middlewareUsages.filter(
      usage => usage.routeFile === file.relativePath
    );

    if (routeMiddleware.length === 0) {
      return issues;
    }

    // Build a map of middleware ordering patterns across all routes
    const orderingPatterns = this.analyzeMiddlewareOrderingPatterns();

    // Check if this route's ordering is consistent with common patterns
    const routeOrder = routeMiddleware
      .sort((a, b) => a.order - b.order)
      .map(m => m.middlewareName);

    // Find the most common ordering pattern for the middleware used in this route
    const expectedOrder = this.findExpectedOrder(routeOrder, orderingPatterns);

    if (expectedOrder && !this.arraysEqual(routeOrder, expectedOrder)) {
      // Find the first middleware that's out of order
      const outOfOrderIndex = routeOrder.findIndex((name, idx) => name !== expectedOrder[idx]);
      
      if (outOfOrderIndex >= 0 && routeMiddleware[outOfOrderIndex]) {
        issues.push(
          this.createIssue({
            type: 'inconsistent-pattern',
            severity: 'medium',
            category: 'middleware',
            file: file.relativePath,
            node: routeMiddleware[outOfOrderIndex].node,
            description: `Inconsistent middleware ordering detected. Current order: [${routeOrder.join(', ')}]. Expected order based on common patterns: [${expectedOrder.join(', ')}].`,
            recommendation: `Reorder middleware to match the common pattern used in other routes. This ensures consistent behavior and makes the codebase more predictable. Standard order should be: authentication → authorization → validation → business logic.`,
            estimatedEffort: 'trivial',
            tags: ['middleware', 'ordering', 'consistency', 'pattern'],
          })
        );
      }
    }

    // Check for common ordering anti-patterns
    issues.push(...this.detectOrderingAntiPatterns(file, routeMiddleware));

    return issues;
  }

  /**
   * Analyze middleware ordering patterns across all routes
   */
  private analyzeMiddlewareOrderingPatterns(): Map<string, string[]> {
    const patterns = new Map<string, string[]>();

    // Group usages by route
    const usagesByRoute = new Map<string, MiddlewareUsage[]>();
    for (const usage of this.middlewareUsages) {
      const routeUsages = usagesByRoute.get(usage.routeFile) || [];
      routeUsages.push(usage);
      usagesByRoute.set(usage.routeFile, routeUsages);
    }

    // Extract ordering patterns from each route
    for (const [route, usages] of usagesByRoute) {
      const order = usages
        .sort((a, b) => a.order - b.order)
        .map(u => u.middlewareName);
      
      const patternKey = order.join('→');
      const existing = patterns.get(patternKey) || [];
      existing.push(route);
      patterns.set(patternKey, existing);
    }

    return patterns;
  }

  /**
   * Find the expected order for a set of middleware based on common patterns
   */
  private findExpectedOrder(
    currentOrder: string[],
    patterns: Map<string, string[]>
  ): string[] | null {
    // Look for patterns that contain all the middleware in currentOrder
    let bestMatch: string[] | null = null;
    let bestMatchCount = 0;

    for (const [patternKey, routes] of patterns) {
      const patternOrder = patternKey.split('→');
      
      // Check if this pattern contains all middleware from currentOrder
      const containsAll = currentOrder.every(name => patternOrder.includes(name));
      
      if (containsAll && routes.length > bestMatchCount) {
        // Extract only the middleware that are in currentOrder, preserving pattern order
        bestMatch = patternOrder.filter(name => currentOrder.includes(name));
        bestMatchCount = routes.length;
      }
    }

    return bestMatch;
  }

  /**
   * Check if two arrays are equal
   */
  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    return arr1.every((val, idx) => val === arr2[idx]);
  }

  /**
   * Detect common middleware ordering anti-patterns
   */
  private detectOrderingAntiPatterns(
    file: FileInfo,
    routeMiddleware: MiddlewareUsage[]
  ): Issue[] {
    const issues: Issue[] = [];
    const order = routeMiddleware
      .sort((a, b) => a.order - b.order)
      .map(m => m.middlewareName.toLowerCase());

    // Anti-pattern 1: Validation before authentication
    // Note: Check for 'authenticate' first, then 'auth' (but exclude 'authorize')
    const authIndex = order.findIndex(name => 
      (name.includes('authenticate') || (name.includes('auth') && !name.includes('authorize')))
    );
    const validateIndex = order.findIndex(name => 
      name.includes('validate') || name.includes('validation')
    );

    if (authIndex > validateIndex && authIndex >= 0 && validateIndex >= 0) {
      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'high',
          category: 'middleware',
          file: file.relativePath,
          node: routeMiddleware[validateIndex].node,
          description: `Middleware ordering anti-pattern: validation middleware runs before authentication. This could allow unauthenticated requests to consume validation resources.`,
          recommendation: `Move authentication middleware before validation middleware. Standard order: authentication → authorization → validation → business logic.`,
          estimatedEffort: 'trivial',
          tags: ['middleware', 'ordering', 'anti-pattern', 'security'],
        })
      );
    }

    // Anti-pattern 2: Authorization before authentication
    const authorizeIndex = order.findIndex(name => 
      name.includes('authorize') || name.includes('permission')
    );

    if (authIndex > authorizeIndex && authIndex >= 0 && authorizeIndex >= 0) {
      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'high',
          category: 'middleware',
          file: file.relativePath,
          node: routeMiddleware[authorizeIndex].node,
          description: `Middleware ordering anti-pattern: authorization middleware runs before authentication. Cannot check permissions without knowing who the user is.`,
          recommendation: `Move authentication middleware before authorization middleware. Standard order: authentication → authorization → validation → business logic.`,
          estimatedEffort: 'trivial',
          tags: ['middleware', 'ordering', 'anti-pattern', 'security'],
        })
      );
    }

    // Anti-pattern 3: Rate limiting after business logic
    const rateLimitIndex = order.findIndex(name => 
      name.includes('ratelimit') || name.includes('rate-limit') || name.includes('throttle')
    );

    if (rateLimitIndex > 2 && rateLimitIndex >= 0) {
      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'medium',
          category: 'middleware',
          file: file.relativePath,
          node: routeMiddleware[rateLimitIndex].node,
          description: `Middleware ordering anti-pattern: rate limiting middleware runs late in the chain. Rate limiting should be one of the first middleware to prevent resource consumption.`,
          recommendation: `Move rate limiting middleware to the beginning of the middleware chain, ideally before authentication.`,
          estimatedEffort: 'trivial',
          tags: ['middleware', 'ordering', 'anti-pattern', 'performance'],
        })
      );
    }

    return issues;
  }

  /**
   * Identify opportunities to consolidate middleware
   * Validates Requirements: 15.5
   */
  private identifyConsolidationOpportunities(file: FileInfo, _ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get middleware implementations in this file
    const fileMiddleware = this.middlewareImplementations.filter(
      impl => impl.file === file.relativePath
    );

    if (fileMiddleware.length < 2) {
      return issues;
    }

    // Group middleware by functionality based on names
    const functionalGroups = this.groupMiddlewareByFunction(fileMiddleware);

    // Check each functional group for consolidation opportunities
    for (const [functionality, middleware] of functionalGroups) {
      if (middleware.length > 1) {
        // Multiple middleware with similar functionality - potential consolidation
        const names = middleware.map(m => m.name).join(', ');
        
        issues.push(
          this.createIssue({
            type: 'architectural',
            severity: 'low',
            category: 'middleware',
            file: file.relativePath,
            node: middleware[0].node,
            description: `Consolidation opportunity: ${middleware.length} middleware implementations with similar "${functionality}" functionality found: ${names}. These could potentially be consolidated into a single, configurable middleware.`,
            recommendation: `Review these middleware implementations and consider consolidating them into a single, parameterized middleware function. This reduces code duplication and makes the codebase easier to maintain.`,
            estimatedEffort: 'medium',
            tags: ['middleware', 'consolidation', 'refactoring', 'architecture'],
          })
        );
      }
    }

    // Check for middleware that are only used once
    const unusedMiddleware = fileMiddleware.filter(impl => {
      const usageCount = this.middlewareUsages.filter(
        usage => usage.middlewareName === impl.name
      ).length;
      return usageCount <= 1 && impl.isExported;
    });

    for (const unused of unusedMiddleware) {
      issues.push(
        this.createIssue({
          type: 'legacy-code',
          severity: 'low',
          category: 'middleware',
          file: file.relativePath,
          node: unused.node,
          description: `Middleware "${unused.name}" is exported but used in only one place (or not used at all). Consider inlining it or removing the export if it's not intended to be reusable.`,
          recommendation: `If this middleware is only used once, consider inlining it at the usage site. If it's not used at all, consider removing it. If it's intended to be reusable, ensure it's properly documented.`,
          estimatedEffort: 'trivial',
          tags: ['middleware', 'unused', 'consolidation', 'cleanup'],
        })
      );
    }

    // Check for very small middleware that could be inlined
    const smallMiddleware = fileMiddleware.filter(impl => {
      const textLength = impl.node.getText().length;
      return textLength < 150 && impl.isExported; // Less than ~3-4 lines
    });

    for (const small of smallMiddleware) {
      const usageCount = this.middlewareUsages.filter(
        usage => usage.middlewareName === small.name
      ).length;

      if (usageCount <= 2) {
        issues.push(
          this.createIssue({
            type: 'unnecessary-adapter',
            severity: 'low',
            category: 'middleware',
            file: file.relativePath,
            node: small.node,
            description: `Middleware "${small.name}" is very small (${small.node.getText().length} characters) and used in ${usageCount} place(s). Consider inlining this logic instead of maintaining a separate middleware function.`,
            recommendation: `For very simple middleware used in few places, consider inlining the logic directly at the usage sites. This reduces indirection and makes the code easier to follow.`,
            estimatedEffort: 'trivial',
            tags: ['middleware', 'inline', 'simplification', 'consolidation'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Group middleware by their functional purpose based on naming patterns
   */
  private groupMiddlewareByFunction(
    middleware: MiddlewareImplementation[]
  ): Map<string, MiddlewareImplementation[]> {
    const groups = new Map<string, MiddlewareImplementation[]>();

    const functionKeywords = [
      'auth',
      'validate',
      'cors',
      'rate',
      'log',
      'error',
      'session',
      'cache',
      'security',
      'permission',
      'guard',
    ];

    for (const impl of middleware) {
      const lowerName = impl.name.toLowerCase();
      
      // Find which functional keyword this middleware matches
      let matchedFunction = 'other';
      for (const keyword of functionKeywords) {
        if (lowerName.includes(keyword)) {
          matchedFunction = keyword;
          break;
        }
      }

      const group = groups.get(matchedFunction) || [];
      group.push(impl);
      groups.set(matchedFunction, group);
    }

    return groups;
  }
}
