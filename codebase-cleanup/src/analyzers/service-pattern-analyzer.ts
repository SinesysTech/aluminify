/**
 * Service Pattern Analyzer
 * 
 * Analyzes service layer architecture in the codebase to identify
 * inconsistencies, circular dependencies, and unnecessary complexity.
 * 
 * Detects:
 * - All service modules in the codebase
 * - Service dependencies and import relationships
 * - Circular dependencies between services
 * - Inconsistent service initialization patterns
 * - Unnecessary service abstraction layers
 */

import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { BasePatternAnalyzer } from './pattern-analyzer.js';
import type { FileInfo, Issue, FileCategory } from '../types.js';

/**
 * Pattern for tracking service modules
 */
interface ServiceModule {
  name: string;
  path: string;
  imports: string[];
  exports: string[];
  node: Node;
}

/**
 * Pattern for tracking service dependencies
 */
interface ServiceDependency {
  from: string;
  to: string;
  importNode: Node;
}

/**
 * Analyzer for service layer patterns
 */
export class ServicePatternAnalyzer extends BasePatternAnalyzer {
  readonly name = 'ServicePatternAnalyzer';

  // Track all discovered services across files
  private services: Map<string, ServiceModule> = new Map();
  private dependencies: ServiceDependency[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ['service'];
  }

  /**
   * Analyze a file for service-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 10.1: Discover service modules and analyze dependencies
    issues.push(...this.discoverServiceModule(file, ast));
    issues.push(...this.analyzeServiceDependencies(file, ast));
    issues.push(...this.analyzeServiceImports(file, ast));

    // Task 10.2: Detect circular dependencies
    // Note: This should be called after all services have been discovered
    // Typically called once after analyzing all files
    issues.push(...this.detectCircularDependencies(file));

    return issues;
  }

  // ============================================================================
  // Task 10.1: Service Discovery and Analysis
  // ============================================================================

  /**
   * Discover and catalog service modules
   * Validates Requirements: 5.1
   */
  private discoverServiceModule(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Extract service name from file path
    const serviceName = this.extractServiceName(file.relativePath);
    
    if (!serviceName) {
      return issues;
    }

    // Get all imports from this service
    const imports = this.getImportDeclarations(ast);
    const importedServices: string[] = [];

    for (const importDecl of imports) {
      // Cast to ImportDeclaration to access getModuleSpecifierValue
      if (!Node.isImportDeclaration(importDecl)) continue;
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if this import is from another service
      if (this.isServiceImport(moduleSpecifier)) {
        const importedServiceName = this.extractServiceNameFromImport(moduleSpecifier);
        if (importedServiceName) {
          importedServices.push(importedServiceName);
          
          // Track dependency
          this.dependencies.push({
            from: serviceName,
            to: importedServiceName,
            importNode: importDecl,
          });
        }
      }
    }

    // Get all exports from this service
    const exports = this.getExportDeclarations(ast);
    const exportedNames: string[] = [];

    // Get named exports
    for (const exportDecl of exports) {
      // Cast to ExportDeclaration to access getNamedExports
      if (!Node.isExportDeclaration(exportDecl)) continue;
      const namedExports = exportDecl.getNamedExports();
      for (const namedExport of namedExports) {
        exportedNames.push(namedExport.getName());
      }
    }

    // Get exported functions, classes, and variables
    const functions = ast.getFunctions();
    const classes = this.getClassDeclarations(ast);
    const variables = this.getVariableDeclarations(ast);

    for (const func of functions) {
      if (this.isExported(func)) {
        const funcName = this.getNodeName(func);
        if (funcName) {
          exportedNames.push(funcName);
        }
      }
    }

    for (const cls of classes) {
      if (this.isExported(cls)) {
        const className = this.getNodeName(cls);
        if (className) {
          exportedNames.push(className);
        }
      }
    }

    // Store service information
    const serviceModule: ServiceModule = {
      name: serviceName,
      path: file.relativePath,
      imports: importedServices,
      exports: exportedNames,
      node: ast,
    };

    this.services.set(serviceName, serviceModule);

    // Check if service has no exports (might be incomplete or unused)
    if (exportedNames.length === 0) {
      issues.push(
        this.createIssue({
          type: 'architectural',
          severity: 'medium',
          category: 'services',
          file: file.relativePath,
          node: ast,
          description: `Service module '${serviceName}' has no exports. This might indicate an incomplete implementation or an unused service file.`,
          recommendation: 'Either add exports to make this service usable, or remove the file if it\'s no longer needed. Services should export functions, classes, or objects that provide specific functionality.',
          estimatedEffort: 'small',
          tags: ['service', 'architecture', 'unused-code'],
        })
      );
    }

    return issues;
  }

  /**
   * Analyze service dependencies for patterns and issues
   * Validates Requirements: 5.1
   */
  private analyzeServiceDependencies(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    const serviceName = this.extractServiceName(file.relativePath);
    if (!serviceName) {
      return issues;
    }

    // Get dependencies for this service
    const serviceDeps = this.dependencies.filter(dep => dep.from === serviceName);

    // Check for excessive dependencies (might indicate poor separation of concerns)
    if (serviceDeps.length > 5) {
      issues.push(
        this.createIssue({
          type: 'architectural',
          severity: 'medium',
          category: 'services',
          file: file.relativePath,
          node: ast,
          description: `Service '${serviceName}' depends on ${serviceDeps.length} other services. This high number of dependencies suggests the service might have unclear responsibilities or be doing too much.`,
          recommendation: 'Consider breaking this service into smaller, more focused services with clearer responsibilities. Each service should have a single, well-defined purpose. Review the dependencies to see if some functionality could be consolidated or if the service is mixing concerns.',
          estimatedEffort: 'large',
          tags: ['service', 'architecture', 'separation-of-concerns'],
        })
      );
    }

    // Check for duplicate imports (same service imported multiple times)
    const importCounts = new Map<string, number>();
    for (const dep of serviceDeps) {
      importCounts.set(dep.to, (importCounts.get(dep.to) || 0) + 1);
    }

    for (const [importedService, count] of importCounts.entries()) {
      if (count > 1) {
        issues.push(
          this.createIssue({
            type: 'inconsistent-pattern',
            severity: 'low',
            category: 'services',
            file: file.relativePath,
            node: ast,
            description: `Service '${importedService}' is imported ${count} times in this file. This might indicate duplicate import statements or inconsistent import patterns.`,
            recommendation: 'Consolidate imports from the same service into a single import statement. This improves code readability and reduces redundancy.',
            estimatedEffort: 'trivial',
            tags: ['service', 'imports', 'code-quality'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Analyze service import patterns and relationships
   * Validates Requirements: 5.1
   */
  private analyzeServiceImports(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    const imports = this.getImportDeclarations(ast);
    
    // Track import patterns
    const importPatterns = {
      defaultImports: 0,
      namedImports: 0,
      namespaceImports: 0,
      sideEffectImports: 0,
    };

    for (const importDecl of imports) {
      // Cast to ImportDeclaration to access import methods
      if (!Node.isImportDeclaration(importDecl)) continue;
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Only analyze service imports
      if (!this.isServiceImport(moduleSpecifier)) {
        continue;
      }

      // Check import type
      const defaultImport = importDecl.getDefaultImport();
      const namedImports = importDecl.getNamedImports();
      const namespaceImport = importDecl.getNamespaceImport();

      if (defaultImport) {
        importPatterns.defaultImports++;
      }
      
      if (namedImports.length > 0) {
        importPatterns.namedImports++;
      }
      
      if (namespaceImport) {
        importPatterns.namespaceImports++;
      }
      
      if (!defaultImport && namedImports.length === 0 && !namespaceImport) {
        importPatterns.sideEffectImports++;
      }

      // Check for relative imports that go up multiple levels
      if (moduleSpecifier.startsWith('../')) {
        const levels = (moduleSpecifier.match(/\.\.\//g) || []).length;
        
        if (levels > 2) {
          issues.push(
            this.createIssue({
              type: 'inconsistent-pattern',
              severity: 'low',
              category: 'services',
              file: file.relativePath,
              node: importDecl,
              description: `Import uses ${levels} levels of relative path traversal (${moduleSpecifier}). This makes the code harder to refactor and understand.`,
              recommendation: 'Consider using absolute imports or path aliases (e.g., @/services/...) instead of deep relative imports. This makes imports more maintainable and less fragile during refactoring.',
              estimatedEffort: 'trivial',
              tags: ['service', 'imports', 'maintainability'],
            })
          );
        }
      }
    }

    // Check for inconsistent import patterns
    const totalServiceImports = importPatterns.defaultImports + 
                                importPatterns.namedImports + 
                                importPatterns.namespaceImports;

    if (totalServiceImports > 2) {
      // If we have a mix of default and named imports, flag it
      if (importPatterns.defaultImports > 0 && importPatterns.namedImports > 0) {
        issues.push(
          this.createIssue({
            type: 'inconsistent-pattern',
            severity: 'low',
            category: 'services',
            file: file.relativePath,
            node: ast,
            description: `Inconsistent import patterns detected: ${importPatterns.defaultImports} default imports and ${importPatterns.namedImports} named imports from services. This inconsistency can make the codebase harder to understand.`,
            recommendation: 'Standardize on either default exports or named exports for services. Named exports are generally preferred as they provide better IDE support and make refactoring easier.',
            estimatedEffort: 'small',
            tags: ['service', 'imports', 'consistency'],
          })
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Task 10.2: Circular Dependency Detection
  // ============================================================================

  /**
   * Detect circular dependencies between services
   * Validates Requirements: 5.3
   * 
   * Uses depth-first search to detect cycles in the dependency graph.
   * A circular dependency exists when service A depends on service B,
   * and service B (directly or indirectly) depends on service A.
   */
  private detectCircularDependencies(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    const serviceName = this.extractServiceName(file.relativePath);
    if (!serviceName) {
      return issues;
    }

    // Build dependency graph
    const graph = this.buildDependencyGraph();

    // Find all cycles that include this service
    const cycles = this.findCyclesInGraph(graph, serviceName);

    // Create issues for each unique cycle
    for (const cycle of cycles) {
      // Only report the cycle once (from the first service in the cycle alphabetically)
      // This prevents duplicate reports for the same cycle
      const sortedCycle = [...cycle].sort();
      if (sortedCycle[0] !== serviceName) {
        continue;
      }

      const cycleDescription = cycle.join(' → ') + ' → ' + cycle[0];
      
      issues.push(
        this.createIssue({
          type: 'architectural',
          severity: 'high',
          category: 'services',
          file: file.relativePath,
          node: this.services.get(serviceName)?.node || file as any,
          description: `Circular dependency detected: ${cycleDescription}. This creates tight coupling between services and can lead to initialization problems, testing difficulties, and maintenance issues.`,
          recommendation: `Break the circular dependency by:
1. Extracting shared functionality into a separate service that both services can depend on
2. Using dependency injection to invert the dependency
3. Refactoring to remove the need for one of the dependencies
4. Using events or a message bus to decouple the services

Circular dependencies are a serious architectural issue that should be resolved to improve code maintainability and testability.`,
          estimatedEffort: 'large',
          tags: ['service', 'architecture', 'circular-dependency', 'coupling'],
        })
      );
    }

    return issues;
  }

  /**
   * Build a dependency graph from discovered services
   * Returns a Map where keys are service names and values are arrays of dependent service names
   */
  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize graph with all services
    for (const serviceName of this.services.keys()) {
      graph.set(serviceName, []);
    }

    // Add dependencies
    for (const dep of this.dependencies) {
      const deps = graph.get(dep.from) || [];
      // Only add if the target service exists in our discovered services
      if (this.services.has(dep.to)) {
        deps.push(dep.to);
        graph.set(dep.from, deps);
      }
    }

    return graph;
  }

  /**
   * Find all cycles in the dependency graph that include the given service
   * Uses depth-first search with cycle detection
   */
  private findCyclesInGraph(graph: Map<string, string[]>, startService: string): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    /**
     * Depth-first search to detect cycles
     */
    const dfs = (service: string): void => {
      visited.add(service);
      recursionStack.add(service);
      path.push(service);

      const dependencies = graph.get(service) || [];

      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          // Continue DFS
          dfs(dep);
        } else if (recursionStack.has(dep)) {
          // Found a cycle!
          // Extract the cycle from the path
          const cycleStartIndex = path.indexOf(dep);
          if (cycleStartIndex !== -1) {
            const cycle = path.slice(cycleStartIndex);
            
            // Only include cycles that contain the start service
            if (cycle.includes(startService)) {
              // Normalize the cycle to start with the lexicographically smallest service
              // This helps with deduplication
              const minIndex = cycle.indexOf(
                cycle.reduce((min, curr) => (curr < min ? curr : min))
              );
              const normalizedCycle = [
                ...cycle.slice(minIndex),
                ...cycle.slice(0, minIndex),
              ];
              
              // Check if we've already found this cycle
              const cycleKey = normalizedCycle.join('→');
              const isDuplicate = cycles.some(
                existingCycle => existingCycle.join('→') === cycleKey
              );
              
              if (!isDuplicate) {
                cycles.push(normalizedCycle);
              }
            }
          }
        }
      }

      path.pop();
      recursionStack.delete(service);
    };

    // Start DFS from the given service
    dfs(startService);

    return cycles;
  }

  // ============================================================================
  // Task 10.3: Service Pattern Inconsistency Detection
  // ============================================================================

  /**
   * Detect inconsistent service initialization and configuration patterns
   * Validates Requirements: 5.4
   */
  private detectInconsistentInitialization(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    const serviceName = this.extractServiceName(file.relativePath);
    if (!serviceName) {
      return issues;
    }

    // Track initialization patterns found in this service
    const initPatterns = {
      hasConstructor: false,
      hasInitFunction: false,
      hasConfigObject: false,
      hasFactoryFunction: false,
      hasSingletonPattern: false,
      hasDirectExports: false,
    };

    // Check for class-based services with constructors
    const classes = this.getClassDeclarations(ast);
    for (const cls of classes) {
      if (this.isExported(cls)) {
        // Cast to ClassDeclaration to access getConstructors
        if (!Node.isClassDeclaration(cls)) continue;
        const constructors = cls.getConstructors();
        if (constructors.length > 0) {
          initPatterns.hasConstructor = true;
          
          // Check if constructor has parameters (dependency injection)
          const constructor = constructors[0];
          const params = constructor.getParameters();
          
          // Flag constructors with too many parameters (poor design)
          if (params.length > 5) {
            issues.push(
              this.createIssue({
                type: 'inconsistent-pattern',
                severity: 'medium',
                category: 'services',
                file: file.relativePath,
                node: constructor,
                description: `Service class constructor has ${params.length} parameters. This high number of dependencies suggests the service might be doing too much or have unclear responsibilities.`,
                recommendation: 'Consider breaking this service into smaller, more focused services. Use the Single Responsibility Principle: each service should have one clear purpose. If many dependencies are needed, consider using a configuration object or builder pattern instead of individual parameters.',
                estimatedEffort: 'medium',
                tags: ['service', 'initialization', 'constructor', 'dependencies'],
              })
            );
          }
        }
      }
    }

    // Check for init/initialize/setup functions
    const functions = ast.getFunctions();
    for (const func of functions) {
      const funcName = this.getNodeName(func);
      if (funcName && /^(init|initialize|setup|configure|config)/i.test(funcName)) {
        if (this.isExported(func)) {
          initPatterns.hasInitFunction = true;
        }
      }
      
      // Check for factory functions (create*, make*, build*)
      if (funcName && /^(create|make|build|get)/i.test(funcName)) {
        if (this.isExported(func)) {
          initPatterns.hasFactoryFunction = true;
        }
      }
    }

    // Check for configuration objects
    const variables = this.getVariableDeclarations(ast);
    for (const varDecl of variables) {
      const varName = this.getNodeName(varDecl);
      if (varName && /config|options|settings/i.test(varName)) {
        if (this.isExported(varDecl)) {
          initPatterns.hasConfigObject = true;
        }
      }
      
      // Check for singleton pattern (instance variable)
      if (varName && /instance|singleton/i.test(varName)) {
        initPatterns.hasSingletonPattern = true;
      }
    }

    // Check for direct function exports (functional style)
    const exportedFunctions = functions.filter(f => this.isExported(f));
    if (exportedFunctions.length > 0 && !initPatterns.hasConstructor) {
      initPatterns.hasDirectExports = true;
    }

    // Detect mixed initialization patterns (inconsistency)
    const patternCount = [
      initPatterns.hasConstructor,
      initPatterns.hasInitFunction,
      initPatterns.hasFactoryFunction,
      initPatterns.hasSingletonPattern,
    ].filter(Boolean).length;

    if (patternCount > 1) {
      const patterns: string[] = [];
      if (initPatterns.hasConstructor) patterns.push('class constructor');
      if (initPatterns.hasInitFunction) patterns.push('init/setup function');
      if (initPatterns.hasFactoryFunction) patterns.push('factory function');
      if (initPatterns.hasSingletonPattern) patterns.push('singleton pattern');

      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'medium',
          category: 'services',
          file: file.relativePath,
          node: ast,
          description: `Service '${serviceName}' uses multiple initialization patterns: ${patterns.join(', ')}. This inconsistency makes the service harder to understand and use correctly.`,
          recommendation: 'Standardize on a single initialization pattern for this service. Choose one approach:\n1. Class-based with constructor injection (good for stateful services)\n2. Factory functions (good for creating instances)\n3. Direct function exports (good for stateless utilities)\n4. Singleton pattern (use sparingly, only when truly needed)\n\nConsistency in initialization patterns makes the codebase more predictable and easier to maintain.',
          estimatedEffort: 'medium',
          tags: ['service', 'initialization', 'consistency', 'pattern'],
        })
      );
    }

    // Check for services with no clear initialization pattern
    if (patternCount === 0 && !initPatterns.hasDirectExports) {
      issues.push(
        this.createIssue({
          type: 'inconsistent-pattern',
          severity: 'low',
          category: 'services',
          file: file.relativePath,
          node: ast,
          description: `Service '${serviceName}' has no clear initialization pattern. It's unclear how this service should be instantiated or configured.`,
          recommendation: 'Add a clear initialization pattern to this service. Consider:\n1. Exporting a class with a constructor\n2. Exporting a factory function (e.g., createService())\n3. Exporting direct functions if this is a stateless utility\n\nClear initialization patterns make services easier to use and test.',
          estimatedEffort: 'small',
          tags: ['service', 'initialization', 'clarity'],
        })
      );
    }

    return issues;
  }

  /**
   * Detect unnecessary service abstraction layers
   * Validates Requirements: 5.5
   */
  private detectUnnecessaryAbstractions(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    const serviceName = this.extractServiceName(file.relativePath);
    if (!serviceName) {
      return issues;
    }

    // Check all exported functions for pass-through behavior
    const functions = ast.getFunctions();
    
    for (const func of functions) {
      if (!this.isExported(func)) {
        continue;
      }

      const funcName = this.getNodeName(func);
      if (!funcName) {
        continue;
      }

      // Get function body
      const body = func.getBody();
      if (!body || !Node.isBlock(body)) {
        continue;
      }

      const statements = body.getStatements();
      
      // Check for single-statement functions (potential pass-through)
      if (statements.length === 1) {
        const statement = statements[0];
        
        // Check if it's a return statement
        if (Node.isReturnStatement(statement)) {
          const returnExpr = statement.getExpression();
          
          if (returnExpr) {
            // Check if it's a simple call expression (pass-through)
            if (Node.isCallExpression(returnExpr)) {
              const callExpr = returnExpr;
              const calledExpr = callExpr.getExpression();
              
              // Check if parameters are just passed through
              const funcParams = func.getParameters();
              const callArgs = callExpr.getArguments();
              
              // Simple heuristic: if parameter count matches and function just calls another function
              if (funcParams.length === callArgs.length) {
                // Check if all arguments are simple identifiers matching parameters
                let isSimplePassThrough = true;
                const paramNames = funcParams.map(p => p.getName());
                
                for (let i = 0; i < callArgs.length; i++) {
                  const arg = callArgs[i];
                  if (Node.isIdentifier(arg)) {
                    if (arg.getText() !== paramNames[i]) {
                      isSimplePassThrough = false;
                      break;
                    }
                  } else {
                    // Argument is not a simple identifier
                    isSimplePassThrough = false;
                    break;
                  }
                }
                
                if (isSimplePassThrough) {
                  const calledFunctionName = calledExpr.getText();
                  
                  issues.push(
                    this.createIssue({
                      type: 'unnecessary-adapter',
                      severity: 'low',
                      category: 'services',
                      file: file.relativePath,
                      node: func,
                      description: `Function '${funcName}' is a simple pass-through wrapper that just calls '${calledFunctionName}' with the same parameters. This abstraction layer adds no value and increases code complexity.`,
                      recommendation: `Consider removing this wrapper function and using '${calledFunctionName}' directly. If this wrapper exists for a specific reason (e.g., to provide a stable API while the implementation changes), document that reason clearly. Otherwise, unnecessary abstraction layers make code harder to navigate and maintain.`,
                      estimatedEffort: 'trivial',
                      tags: ['service', 'abstraction', 'wrapper', 'pass-through'],
                    })
                  );
                }
              }
            }
            
            // Check for simple property access pass-through
            if (Node.isPropertyAccessExpression(returnExpr)) {
              issues.push(
                this.createIssue({
                  type: 'unnecessary-adapter',
                  severity: 'low',
                  category: 'services',
                  file: file.relativePath,
                  node: func,
                  description: `Function '${funcName}' simply returns a property access (${returnExpr.getText()}). This adds an unnecessary abstraction layer.`,
                  recommendation: 'Consider exposing the property directly or removing this wrapper function. Simple property access wrappers add little value and make code harder to follow.',
                  estimatedEffort: 'trivial',
                  tags: ['service', 'abstraction', 'wrapper', 'property-access'],
                })
              );
            }
          }
        }
      }
      
      // Check for functions with only trivial transformations
      if (statements.length === 2) {
        // Pattern: const result = someCall(); return result;
        const firstStmt = statements[0];
        const secondStmt = statements[1];
        
        if (Node.isVariableStatement(firstStmt) && Node.isReturnStatement(secondStmt)) {
          const varDecls = firstStmt.getDeclarations();
          if (varDecls.length === 1) {
            const varDecl = varDecls[0];
            const varName = varDecl.getName();
            const returnExpr = secondStmt.getExpression();
            
            // Check if return statement just returns the variable
            if (returnExpr && Node.isIdentifier(returnExpr) && returnExpr.getText() === varName) {
              const initializer = varDecl.getInitializer();
              
              if (initializer && Node.isCallExpression(initializer)) {
                // This is a pass-through with an intermediate variable
                issues.push(
                  this.createIssue({
                    type: 'unnecessary-adapter',
                    severity: 'low',
                    category: 'services',
                    file: file.relativePath,
                    node: func,
                    description: `Function '${funcName}' is a pass-through wrapper that calls another function and immediately returns the result without any transformation or additional logic.`,
                    recommendation: 'Consider removing this wrapper function unless it serves a specific architectural purpose (e.g., providing a stable API, adding logging, or handling errors). Document the reason if the wrapper is intentional.',
                    estimatedEffort: 'trivial',
                    tags: ['service', 'abstraction', 'wrapper', 'pass-through'],
                  })
                );
              }
            }
          }
        }
      }
    }

    // Check for wrapper classes that just delegate to another class
    const classes = this.getClassDeclarations(ast);
    
    for (const cls of classes) {
      if (!this.isExported(cls)) {
        continue;
      }

      const className = this.getNodeName(cls);
      if (!className) {
        continue;
      }

      // Cast to ClassDeclaration to access getMethods
      if (!Node.isClassDeclaration(cls)) continue;
      const methods = cls.getMethods();
      let passThroughMethodCount = 0;
      
      for (const method of methods) {
        const methodBody = method.getBody();
        if (!methodBody || !Node.isBlock(methodBody)) {
          continue;
        }

        const statements = methodBody.getStatements();
        
        // Check for single-statement methods that just delegate
        if (statements.length === 1) {
          const statement = statements[0];
          
          if (Node.isReturnStatement(statement)) {
            const returnExpr = statement.getExpression();
            
            if (returnExpr && Node.isCallExpression(returnExpr)) {
              const callExpr = returnExpr;
              const calledExpr = callExpr.getExpression();
              
              // Check if it's calling a method on a member variable (delegation)
              if (Node.isPropertyAccessExpression(calledExpr)) {
                passThroughMethodCount++;
              }
            }
          }
        }
      }
      
      // If most methods are pass-through, flag the class as unnecessary abstraction
      if (methods.length > 0 && passThroughMethodCount / methods.length > 0.7) {
        issues.push(
          this.createIssue({
            type: 'unnecessary-adapter',
            severity: 'medium',
            category: 'services',
            file: file.relativePath,
            node: cls,
            description: `Class '${className}' appears to be a wrapper class where ${passThroughMethodCount} out of ${methods.length} methods simply delegate to another object. This abstraction layer may be unnecessary.`,
            recommendation: 'Consider whether this wrapper class is needed. If it\'s just delegating calls without adding value (no error handling, logging, transformation, or business logic), consider using the wrapped class directly. If the wrapper serves a specific purpose (e.g., adapter pattern for third-party libraries, providing a stable API), document that clearly.',
            estimatedEffort: 'medium',
            tags: ['service', 'abstraction', 'wrapper', 'delegation', 'class'],
          })
        );
      }
    }

    return issues;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Extract service name from file path
   * Examples:
   *   backend/services/user/index.ts -> user
   *   backend/services/auth/auth-service.ts -> auth
   *   services/database/db.ts -> database
   */
  private extractServiceName(filePath: string): string | null {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Match patterns like: backend/services/NAME/... or services/NAME/...
    const serviceMatch = normalizedPath.match(/(?:backend\/)?services\/([^\/]+)/);
    
    if (serviceMatch) {
      return serviceMatch[1];
    }

    return null;
  }

  /**
   * Check if an import is from a service module
   */
  private isServiceImport(moduleSpecifier: string): boolean {
    // Normalize path separators
    const normalizedPath = moduleSpecifier.replace(/\\/g, '/');
    
    // Check for service imports
    return normalizedPath.includes('/services/') || 
           normalizedPath.includes('services/') ||
           normalizedPath.startsWith('@/services/') ||
           normalizedPath.startsWith('~/services/');
  }

  /**
   * Extract service name from import path
   */
  private extractServiceNameFromImport(moduleSpecifier: string): string | null {
    // Normalize path separators
    const normalizedPath = moduleSpecifier.replace(/\\/g, '/');
    
    // Match patterns like: ../services/NAME or @/services/NAME
    const serviceMatch = normalizedPath.match(/services\/([^\/]+)/);
    
    if (serviceMatch) {
      return serviceMatch[1];
    }

    return null;
  }

  /**
   * Get all discovered services
   * This can be used by other analyzers or for reporting
   */
  public getDiscoveredServices(): Map<string, ServiceModule> {
    return this.services;
  }

  /**
   * Get all service dependencies
   * This can be used for circular dependency detection
   */
  public getServiceDependencies(): ServiceDependency[] {
    return this.dependencies;
  }

  /**
   * Clear the analyzer state (useful for testing or re-analysis)
   */
  public reset(): void {
    this.services.clear();
    this.dependencies = [];
  }
}
