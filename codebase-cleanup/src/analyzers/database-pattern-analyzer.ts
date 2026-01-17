/**
 * Database Pattern Analyzer
 * 
 * Analyzes database access patterns in the codebase to identify
 * inconsistencies, redundancies, and unnecessary complexity.
 * 
 * Detects:
 * - Multiple Supabase client instantiation patterns
 * - Inconsistent error handling in database operations
 * - Unnecessary database client wrappers
 * - Inconsistent type usage for database entities
 * - Code bypassing established database access patterns
 */

import { SourceFile, Node, SyntaxKind, CallExpression, FunctionDeclaration, ArrowFunction, FunctionExpression } from 'ts-morph';
import { BasePatternAnalyzer } from './pattern-analyzer';
import type { FileInfo, Issue, FileCategory } from '../types';

/**
 * Pattern for tracking database client instantiation
 */
interface DatabaseClientPattern {
  functionName: string;
  node: Node;
  file: string;
}

/**
 * Pattern for tracking database operations
 */
interface DatabaseOperationPattern {
  operation: string;
  hasErrorHandling: boolean;
  node: Node;
  file: string;
}

/**
 * Analyzer for database access patterns
 */
export class DatabasePatternAnalyzer extends BasePatternAnalyzer {
  readonly name = 'DatabasePatternAnalyzer';

  private dbClientPatterns: DatabaseClientPattern[] = [];
  private dbOperationPatterns: DatabaseOperationPattern[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ['api-route', 'service', 'util'];
  }

  /**
   * Analyze a file for database-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 6.1: Detect database client instantiation patterns
    issues.push(...this.detectDatabaseClientPatterns(file, ast));

    // Task 6.2: Detect database inconsistencies
    issues.push(...this.detectInconsistentErrorHandling(file, ast));
    issues.push(...this.detectInconsistentTypeUsage(file, ast));
    issues.push(...this.detectPatternBypass(file, ast));

    // Task 6.3: Detect unnecessary database adapters
    issues.push(...this.detectUnnecessaryAdapters(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 6.1: Database Client Pattern Detection
  // ============================================================================

  /**
   * Detect all Supabase client instantiation patterns
   * Validates Requirements: 3.1
   */
  private detectDatabaseClientPatterns(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    // Common Supabase/database client creation patterns
    const dbClientPatterns = [
      'createClient',
      'getSupabaseClient',
      'initSupabase',
      'createSupabaseClient',
      'supabaseClient',
      'getClient',
      'initClient',
      'createServerClient',
      'createBrowserClient',
      'createRouteHandlerClient',
      'createServerComponentClient',
      'createMiddlewareClient',
      'getDB',
      'initDB',
      'createDB',
      'getDatabaseClient',
      'initDatabase',
    ];

    for (const call of callExpressions) {
      const callText = call.getText();
      
      // Check if this is a database client creation call
      for (const pattern of dbClientPatterns) {
        if (callText.includes(pattern)) {
          // Track this pattern
          this.dbClientPatterns.push({
            functionName: pattern,
            node: call,
            file: file.relativePath,
          });

          // If we've seen multiple different patterns, flag as inconsistent
          const uniquePatterns = new Set(this.dbClientPatterns.map(p => p.functionName));
          if (uniquePatterns.size > 1) {
            issues.push(
              this.createIssue({
                type: 'inconsistent-pattern',
                severity: 'medium',
                category: 'database',
                file: file.relativePath,
                node: call,
                description: `Inconsistent database client instantiation pattern detected. Found ${uniquePatterns.size} different patterns: ${Array.from(uniquePatterns).join(', ')}`,
                recommendation: 'Standardize database client creation to use a single pattern across the codebase. For Supabase projects, use the appropriate client creation method based on context (server component, route handler, middleware, etc.) but maintain consistency within each context type.',
                estimatedEffort: 'medium',
                tags: ['database', 'inconsistency', 'client-instantiation', 'supabase'],
              })
            );
          }
          break;
        }
      }

      // Also check for direct Supabase imports that might indicate client usage
      if (callText.includes('supabase.from') || 
          callText.includes('supabase.auth') ||
          callText.includes('supabase.storage') ||
          callText.includes('supabase.rpc')) {
        
        // Track database operations for later analysis
        const operation = this.extractDatabaseOperation(callText);
        if (operation) {
          const hasErrorHandling = this.checkForErrorHandling(call);
          
          this.dbOperationPatterns.push({
            operation,
            hasErrorHandling,
            node: call,
            file: file.relativePath,
          });
        }
      }
    }

    // Check for variable declarations that might be database clients
    const variableDeclarations = this.getVariableDeclarations(ast);
    for (const varDecl of variableDeclarations) {
      const varText = varDecl.getText();
      const varName = this.getNodeName(varDecl);
      
      // Check if variable name suggests it's a database client
      const dbClientNames = [
        'supabase',
        'db',
        'database',
        'client',
        'dbClient',
        'supabaseClient',
      ];

      if (varName && dbClientNames.some(name => varName.toLowerCase().includes(name.toLowerCase()))) {
        // Check if it's being initialized with a client creation function
        const initializerText = varText.toLowerCase();
        if (dbClientPatterns.some(pattern => initializerText.includes(pattern.toLowerCase()))) {
          // Track this as a client instantiation
          const matchedPattern = dbClientPatterns.find(pattern => 
            initializerText.includes(pattern.toLowerCase())
          );
          
          if (matchedPattern) {
            this.dbClientPatterns.push({
              functionName: matchedPattern,
              node: varDecl,
              file: file.relativePath,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extract the database operation type from a call expression
   */
  private extractDatabaseOperation(callText: string): string | null {
    // Common Supabase operations
    const operations = [
      'from',
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'rpc',
      'auth.signIn',
      'auth.signUp',
      'auth.signOut',
      'auth.getUser',
      'auth.getSession',
      'storage.from',
      'storage.upload',
      'storage.download',
    ];

    for (const op of operations) {
      if (callText.includes(op)) {
        return op;
      }
    }

    return null;
  }

  /**
   * Check if a call expression has proper error handling
   */
  private checkForErrorHandling(call: Node): boolean {
    // Look for error handling patterns in the surrounding code
    let current: Node | undefined = call;
    let depth = 0;
    const maxDepth = 5; // Don't traverse too far up

    while (current && depth < maxDepth) {
      const parent = current.getParent();
      if (!parent) break;

      const parentText = parent.getText();

      // Check for try-catch blocks
      if (Node.isTryStatement(parent)) {
        return true;
      }

      // Check for error destructuring: const { data, error } = await ...
      if (Node.isVariableDeclaration(parent)) {
        const varText = parent.getText();
        if (varText.includes('error') && varText.includes('{')) {
          // Check if error is actually used
          const scope = parent.getParent()?.getParent(); // Get the block scope
          if (scope) {
            const scopeText = scope.getText();
            // Look for error handling after the declaration
            if (scopeText.includes('if') && scopeText.includes('error')) {
              return true;
            }
            if (scopeText.includes('throw') && scopeText.includes('error')) {
              return true;
            }
          }
        }
      }

      // Check for .catch() or .then() with error handling
      if (Node.isCallExpression(parent)) {
        const callExpr = parent as CallExpression;
        const expression = callExpr.getExpression();
        const exprText = expression.getText();
        
        if (exprText.includes('.catch') || exprText.includes('.then')) {
          return true;
        }
      }

      current = parent;
      depth++;
    }

    return false;
  }

  // ============================================================================
  // Task 6.2: Database Inconsistency Detection
  // ============================================================================

  /**
   * Detect inconsistent error handling in database operations
   * Validates Requirements: 3.2
   */
  private detectInconsistentErrorHandling(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const callExpressions = this.getCallExpressions(ast);

    // Track database operations and their error handling
    const dbOperations: Array<{ node: Node; hasErrorHandling: boolean; operation: string }> = [];

    for (const call of callExpressions) {
      const callText = call.getText();
      
      // Check if this is a database operation
      const operation = this.extractDatabaseOperation(callText);
      if (operation) {
        const hasErrorHandling = this.checkForErrorHandling(call);
        
        dbOperations.push({
          node: call,
          hasErrorHandling,
          operation,
        });

        // If this operation lacks error handling, flag it
        if (!hasErrorHandling) {
          issues.push(
            this.createIssue({
              type: 'missing-error-handling',
              severity: 'high',
              category: 'database',
              file: file.relativePath,
              node: call,
              description: `Database operation '${operation}' lacks proper error handling. This can lead to unhandled promise rejections and silent failures.`,
              recommendation: 'Add proper error handling using try-catch blocks or by checking the error property returned from Supabase operations. Example: const { data, error } = await supabase.from(...); if (error) { /* handle error */ }',
              estimatedEffort: 'small',
              tags: ['database', 'error-handling', 'reliability'],
            })
          );
        }
      }
    }

    // Check for inconsistent error handling patterns across operations
    if (dbOperations.length > 1) {
      const withErrorHandling = dbOperations.filter(op => op.hasErrorHandling).length;
      const withoutErrorHandling = dbOperations.filter(op => !op.hasErrorHandling).length;

      // If we have a mix of handled and unhandled operations, flag inconsistency
      if (withErrorHandling > 0 && withoutErrorHandling > 0) {
        const percentage = Math.round((withoutErrorHandling / dbOperations.length) * 100);
        
        issues.push(
          this.createIssue({
            type: 'inconsistent-pattern',
            severity: 'medium',
            category: 'database',
            file: file.relativePath,
            node: dbOperations[0].node,
            description: `Inconsistent error handling in database operations. ${percentage}% of operations (${withoutErrorHandling}/${dbOperations.length}) lack error handling while others have it.`,
            recommendation: 'Standardize error handling across all database operations. Either use try-catch blocks consistently or always check the error property from Supabase responses.',
            estimatedEffort: 'medium',
            tags: ['database', 'error-handling', 'inconsistency'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent type usage for database entities
   * Validates Requirements: 3.4
   */
  private detectInconsistentTypeUsage(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Track type annotations for database-related variables
    const typeAnnotations: Map<string, Array<{ type: string; node: Node }>> = new Map();

    // Get all variable declarations with type annotations
    const variableDeclarations = this.getVariableDeclarations(ast);
    
    for (const varDecl of variableDeclarations) {
      const varName = this.getNodeName(varDecl);
      const typeNode = varDecl.getTypeNode();
      
      if (varName && typeNode) {
        const typeText = typeNode.getText();
        
        // Check if this looks like a database entity type
        // Common patterns: User, DbUser, UserRow, Database['public']['Tables']['users']['Row']
        const isDatabaseType = 
          typeText.includes('Database[') ||
          typeText.includes('Row') ||
          typeText.includes('Insert') ||
          typeText.includes('Update') ||
          varName.match(/^(user|profile|post|comment|session|account|organization|team|project|task|item|entity|record|data)s?$/i);

        if (isDatabaseType) {
          if (!typeAnnotations.has(varName)) {
            typeAnnotations.set(varName, []);
          }
          
          typeAnnotations.get(varName)!.push({
            type: typeText,
            node: varDecl,
          });
        }
      }
    }

    // Check for 'any' type usage in database operations
    for (const varDecl of variableDeclarations) {
      const varText = varDecl.getText();
      const typeNode = varDecl.getTypeNode();
      
      // Check if this is a database operation result with 'any' type
      if (typeNode && typeNode.getText() === 'any') {
        const initializerText = varDecl.getInitializer()?.getText() || '';
        
        if (this.extractDatabaseOperation(initializerText)) {
          issues.push(
            this.createIssue({
              type: 'type-safety',
              severity: 'medium',
              category: 'database',
              file: file.relativePath,
              node: varDecl,
              description: `Database operation result typed as 'any', losing type safety. This makes it harder to catch type-related bugs at compile time.`,
              recommendation: 'Use proper TypeScript types for database entities. For Supabase, use generated types from the Database type or define explicit interfaces for your entities.',
              estimatedEffort: 'small',
              tags: ['database', 'type-safety', 'typescript'],
            })
          );
        }
      }
    }

    // Check for inconsistent type definitions for the same entity
    for (const [entityName, types] of typeAnnotations.entries()) {
      if (types.length > 1) {
        const uniqueTypes = new Set(types.map(t => t.type));
        
        if (uniqueTypes.size > 1) {
          issues.push(
            this.createIssue({
              type: 'inconsistent-pattern',
              severity: 'medium',
              category: 'database',
              file: file.relativePath,
              node: types[0].node,
              description: `Inconsistent type usage for entity '${entityName}'. Found ${uniqueTypes.size} different type definitions: ${Array.from(uniqueTypes).join(', ')}`,
              recommendation: 'Standardize type definitions for database entities. Use Supabase generated types consistently or define a single canonical type for each entity in a shared types file.',
              estimatedEffort: 'medium',
              tags: ['database', 'type-safety', 'inconsistency'],
            })
          );
        }
      }
    }

    // Check for manual type definitions that might conflict with generated types
    const typeAliases = ast.getTypeAliases();
    const interfaces = ast.getInterfaces();
    
    for (const typeAlias of typeAliases) {
      const typeName = typeAlias.getName();
      const typeText = typeAlias.getText();
      
      // Check if this looks like a database entity type
      if (typeName.match(/^(User|Profile|Post|Comment|Session|Account|Organization|Team|Project|Task|Item|Entity|Record)s?$/)) {
        // Check if there's a Supabase Database type import
        const imports = ast.getImportDeclarations();
        const hasSupabaseTypes = imports.some(imp => 
          imp.getModuleSpecifierValue().includes('database.types') ||
          imp.getModuleSpecifierValue().includes('supabase')
        );
        
        if (hasSupabaseTypes && !typeText.includes('Database[')) {
          issues.push(
            this.createIssue({
              type: 'inconsistent-pattern',
              severity: 'low',
              category: 'database',
              file: file.relativePath,
              node: typeAlias,
              description: `Manual type definition '${typeName}' may conflict with Supabase generated types. This can lead to type mismatches and runtime errors.`,
              recommendation: 'Consider using Supabase generated types instead of manual definitions. If manual types are necessary, ensure they match the database schema exactly.',
              estimatedEffort: 'small',
              tags: ['database', 'type-safety', 'supabase'],
            })
          );
        }
      }
    }

    for (const interfaceDecl of interfaces) {
      const interfaceName = interfaceDecl.getName();
      const interfaceText = interfaceDecl.getText();
      
      // Check if this looks like a database entity interface
      if (interfaceName.match(/^(User|Profile|Post|Comment|Session|Account|Organization|Team|Project|Task|Item|Entity|Record)s?$/)) {
        const imports = ast.getImportDeclarations();
        const hasSupabaseTypes = imports.some(imp => 
          imp.getModuleSpecifierValue().includes('database.types') ||
          imp.getModuleSpecifierValue().includes('supabase')
        );
        
        if (hasSupabaseTypes && !interfaceText.includes('Database[')) {
          issues.push(
            this.createIssue({
              type: 'inconsistent-pattern',
              severity: 'low',
              category: 'database',
              file: file.relativePath,
              node: interfaceDecl,
              description: `Manual interface definition '${interfaceName}' may conflict with Supabase generated types. This can lead to type mismatches and runtime errors.`,
              recommendation: 'Consider using Supabase generated types instead of manual definitions. If manual interfaces are necessary, ensure they match the database schema exactly.',
              estimatedEffort: 'small',
              tags: ['database', 'type-safety', 'supabase'],
            })
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect code bypassing established database access patterns
   * Validates Requirements: 3.5
   */
  private detectPatternBypass(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Check for direct database client usage in components
    if (file.category === 'component') {
      const callExpressions = this.getCallExpressions(ast);
      
      for (const call of callExpressions) {
        const callText = call.getText();
        const operation = this.extractDatabaseOperation(callText);
        
        if (operation) {
          issues.push(
            this.createIssue({
              type: 'architectural',
              severity: 'high',
              category: 'database',
              file: file.relativePath,
              node: call,
              description: `Direct database access in component. Components should not directly access the database; this violates separation of concerns and makes testing difficult.`,
              recommendation: 'Move database operations to a service layer or API route. Components should fetch data through API calls or use server-side data fetching patterns (e.g., Next.js Server Components, getServerSideProps).',
              estimatedEffort: 'medium',
              tags: ['database', 'architecture', 'separation-of-concerns'],
            })
          );
        }
      }
    }

    // Check for SQL injection vulnerabilities (raw SQL queries)
    const callExpressions = this.getCallExpressions(ast);
    
    for (const call of callExpressions) {
      const callText = call.getText();
      
      // Check for .rpc() calls with string concatenation or template literals
      if (callText.includes('.rpc(')) {
        const args = call.getArguments();
        
        for (const arg of args) {
          const argText = arg.getText();
          
          // Check for string concatenation or template literals that might indicate SQL injection risk
          if (argText.includes('${') || argText.includes('+')) {
            issues.push(
              this.createIssue({
                type: 'architectural',
                severity: 'critical',
                category: 'database',
                file: file.relativePath,
                node: call,
                description: `Potential SQL injection vulnerability detected. RPC call uses string concatenation or template literals, which can be exploited if user input is not properly sanitized.`,
                recommendation: 'Use parameterized queries or Supabase query builder methods instead of string concatenation. Pass user input as separate parameters that will be properly escaped.',
                estimatedEffort: 'small',
                tags: ['database', 'security', 'sql-injection'],
              })
            );
          }
        }
      }
    }

    // Check for missing service layer (direct database access in API routes without abstraction)
    if (file.category === 'api-route') {
      const callExpressions = this.getCallExpressions(ast);
      let dbOperationCount = 0;
      
      for (const call of callExpressions) {
        const callText = call.getText();
        if (this.extractDatabaseOperation(callText)) {
          dbOperationCount++;
        }
      }

      // If there are multiple database operations in a single API route, suggest service layer
      if (dbOperationCount > 3) {
        issues.push(
          this.createIssue({
            type: 'architectural',
            severity: 'medium',
            category: 'database',
            file: file.relativePath,
            node: callExpressions[0],
            description: `API route contains ${dbOperationCount} database operations. Complex database logic should be abstracted into a service layer for better maintainability and testability.`,
            recommendation: 'Extract database operations into a dedicated service module. This improves code organization, makes testing easier, and allows reuse across multiple API routes.',
            estimatedEffort: 'medium',
            tags: ['database', 'architecture', 'service-layer'],
          })
        );
      }
    }

    // Check for bypassing established patterns by using different client creation methods
    const imports = ast.getImportDeclarations();
    const clientImports: string[] = [];
    
    for (const imp of imports) {
      const namedImports = imp.getNamedImports();
      for (const named of namedImports) {
        const importName = named.getName();
        if (importName.toLowerCase().includes('client') || 
            importName.toLowerCase().includes('supabase')) {
          clientImports.push(importName);
        }
      }
    }

    // If multiple different client creation methods are imported, flag it
    if (clientImports.length > 2) {
      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'low',
          category: 'database',
          file: file.relativePath,
          node: imports[0],
          description: `Multiple database client creation methods imported: ${clientImports.join(', ')}. This suggests inconsistent patterns or bypassing established conventions.`,
          recommendation: 'Standardize on a single client creation pattern appropriate for the context. For Next.js with Supabase, use createServerComponentClient for Server Components, createRouteHandlerClient for API routes, etc.',
          estimatedEffort: 'small',
          tags: ['database', 'inconsistency', 'patterns'],
        })
      );
    }

    return issues;
  }

  // ============================================================================
  // Task 6.3: Unnecessary Database Adapter Detection
  // ============================================================================

  /**
   * Detect simple pass-through database wrappers that add no meaningful value
   * Validates Requirements: 3.3
   */
  private detectUnnecessaryAdapters(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Get all function declarations and arrow functions
    const functions = [
      ...ast.getFunctions(),
      ...this.getArrowFunctions(ast),
      ...this.getFunctionExpressions(ast),
    ];

    for (const func of functions) {
      // Skip if function has no body
      const body = this.getFunctionBody(func);
      if (!body) continue;

      const bodyText = body.getText();
      const funcName = this.getFunctionName(func);

      // Check if this function looks like a database wrapper
      const isDatabaseWrapper = this.isDatabaseRelatedFunction(func, funcName);
      if (!isDatabaseWrapper) continue;

      // Analyze the function body to determine if it's a simple pass-through
      const isPassThrough = this.isPassThroughWrapper(func, body, bodyText);
      
      if (isPassThrough) {
        const recommendation = this.generateAdapterRecommendation(func, funcName, bodyText);
        
        issues.push(
          this.createIssue({
            type: 'unnecessary-adapter',
            severity: 'medium',
            category: 'database',
            file: file.relativePath,
            node: func,
            description: `Function '${funcName}' is a simple pass-through wrapper that adds no meaningful value. It just delegates to another function without adding error handling, validation, transformation, or other logic.`,
            recommendation,
            estimatedEffort: 'small',
            tags: ['database', 'unnecessary-adapter', 'simplification'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Check if a function is database-related based on its name and content
   */
  private isDatabaseRelatedFunction(func: Node, funcName: string): boolean {
    const funcText = func.getText();
    
    // Check function name for database-related keywords
    const dbKeywords = [
      'db', 'database', 'supabase', 'client', 'query', 'fetch', 'get', 'create',
      'update', 'delete', 'insert', 'upsert', 'select', 'find', 'save', 'load',
      'user', 'profile', 'post', 'comment', 'session', 'account', 'data',
    ];

    const nameHasDbKeyword = dbKeywords.some(keyword => 
      funcName.toLowerCase().includes(keyword)
    );

    // Check if function body contains database operations
    const hasDbOperation = this.extractDatabaseOperation(funcText) !== null;

    return nameHasDbKeyword || hasDbOperation;
  }

  /**
   * Determine if a function is a simple pass-through wrapper
   */
  private isPassThroughWrapper(func: Node, body: Node, bodyText: string): boolean {
    // Get the statements in the function body
    const statements = this.getFunctionStatements(body);
    
    // A pass-through wrapper typically has:
    // 1. Very few statements (1-2, usually just a return statement)
    // 2. No error handling (no try-catch, no error checking)
    // 3. No data transformation or validation
    // 4. No logging or side effects
    // 5. Just calls another function with the same or similar parameters

    // Check 1: Too many statements suggests it's doing something meaningful
    if (statements.length > 2) {
      return false;
    }

    // Check 2: Has error handling (try-catch or error checking)
    if (bodyText.includes('try') || bodyText.includes('catch') || 
        bodyText.includes('if') && bodyText.includes('error')) {
      return false;
    }

    // Check 3: Has validation logic
    if (bodyText.includes('if') && (
        bodyText.includes('!') || 
        bodyText.includes('===') || 
        bodyText.includes('!==') ||
        bodyText.includes('throw')
    )) {
      return false;
    }

    // Check 4: Has logging
    if (bodyText.includes('console.') || bodyText.includes('logger.') || 
        bodyText.includes('log(')) {
      return false;
    }

    // Check 5: Has data transformation
    // Look for common transformation patterns
    if (bodyText.includes('.map(') || bodyText.includes('.filter(') || 
        bodyText.includes('.reduce(') || bodyText.includes('.transform(') ||
        bodyText.includes('Object.assign') || bodyText.includes('...')) {
      // Check if the spread/transformation is just for parameter passing
      // vs actual data transformation
      const hasReturnStatement = statements.some(stmt => 
        Node.isReturnStatement(stmt)
      );
      
      if (hasReturnStatement) {
        const returnStmt = statements.find(stmt => Node.isReturnStatement(stmt));
        if (returnStmt) {
          const returnText = returnStmt.getText();
          // If the return statement is just returning a function call with spread params,
          // it's still a pass-through
          const isSimpleReturn = /^return\s+\w+\([^)]*\)/.test(returnText.trim());
          if (!isSimpleReturn) {
            return false;
          }
        }
      }
    }

    // Check 6: Must have a return statement or be a single expression
    const hasReturn = statements.some(stmt => Node.isReturnStatement(stmt));
    const isSingleExpression = statements.length === 1 && 
      Node.isExpressionStatement(statements[0]);

    if (!hasReturn && !isSingleExpression) {
      return false;
    }

    // Check 7: The function must call another function (delegation)
    const callExpressions = this.getCallExpressionsFromNode(body);
    if (callExpressions.length === 0) {
      return false;
    }

    // Check 8: Parameters should be mostly passed through unchanged
    const params = this.getFunctionParameters(func);
    const paramNames = params.map(p => this.getNodeName(p)).filter(Boolean);
    
    // Count how many parameters are used in the delegated call
    let paramsUsedInCall = 0;
    for (const call of callExpressions) {
      const callText = call.getText();
      for (const paramName of paramNames) {
        if (callText.includes(paramName!)) {
          paramsUsedInCall++;
        }
      }
    }

    // If most parameters are just passed through, it's likely a pass-through wrapper
    const passThrough = paramNames.length > 0 && 
      paramsUsedInCall >= paramNames.length * 0.7; // At least 70% of params passed through

    return passThrough || (statements.length === 1 && callExpressions.length === 1);
  }

  /**
   * Generate a recommendation for removing an unnecessary adapter
   */
  private generateAdapterRecommendation(func: Node, funcName: string, bodyText: string): string {
    // Try to identify what function is being called
    const callMatch = bodyText.match(/(?:return\s+)?(\w+(?:\.\w+)*)\(/);
    const calledFunction = callMatch ? callMatch[1] : 'the underlying function';

    return `Remove the wrapper function '${funcName}' and call ${calledFunction} directly. ` +
      `This wrapper adds no value (no error handling, validation, or transformation) and only increases code complexity. ` +
      `If the wrapper was created for future extensibility, consider adding it back when actual logic is needed (YAGNI principle).`;
  }

  /**
   * Get arrow functions from the AST
   */
  private getArrowFunctions(ast: SourceFile): ArrowFunction[] {
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
  private getFunctionExpressions(ast: SourceFile): FunctionExpression[] {
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
  private getFunctionBody(func: Node): Node | undefined {
    if (Node.isFunctionDeclaration(func) || Node.isFunctionExpression(func)) {
      return func.getBody();
    }
    
    if (Node.isArrowFunction(func)) {
      const body = func.getBody();
      // Arrow functions can have expression bodies or block bodies
      return body;
    }
    
    return undefined;
  }

  /**
   * Get the name of a function
   */
  private getFunctionName(func: Node): string {
    if (Node.isFunctionDeclaration(func)) {
      return func.getName() || 'anonymous';
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
      
      return 'anonymous';
    }
    
    return 'unknown';
  }

  /**
   * Get statements from a function body
   */
  private getFunctionStatements(body: Node): Node[] {
    if (Node.isBlock(body)) {
      return body.getStatements();
    }
    
    // For arrow functions with expression bodies
    return [body];
  }

  /**
   * Get call expressions from a specific node
   */
  private getCallExpressionsFromNode(node: Node): CallExpression[] {
    const calls: CallExpression[] = [];
    
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
  private getFunctionParameters(func: Node): Node[] {
    if (Node.isFunctionDeclaration(func) || 
        Node.isFunctionExpression(func) || 
        Node.isArrowFunction(func)) {
      return func.getParameters();
    }
    
    return [];
  }
}
