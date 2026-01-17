/**
 * Type Pattern Analyzer
 * 
 * Analyzes TypeScript type definitions and usage patterns in the codebase
 * to identify inconsistencies, redundancies, and type safety issues.
 * 
 * Detects:
 * - All type definitions (interfaces, types, enums)
 * - Type usage across files
 * - Duplicate type definitions
 * - Inconsistent type definitions for same entities
 * - Excessive 'any' type usage
 * - Type assertions that could be avoided
 * - Mismatches between Supabase generated types and manual types
 */

import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { BasePatternAnalyzer } from './pattern-analyzer';
import type { FileInfo, Issue, FileCategory } from '../types';

/**
 * Information about a type definition
 */
interface TypeDefinition {
  name: string;
  kind: 'interface' | 'type' | 'enum';
  node: Node;
  file: string;
  definition: string;
}

/**
 * Information about type usage
 */
interface TypeUsage {
  typeName: string;
  node: Node;
  file: string;
  context: string; // 'variable' | 'parameter' | 'return' | 'property'
}

/**
 * Analyzer for TypeScript type patterns
 */
export class TypePatternAnalyzer extends BasePatternAnalyzer {
  readonly name = 'TypePatternAnalyzer';

  // Track type definitions across files for cross-file analysis
  private typeDefinitions: TypeDefinition[] = [];
  private typeUsages: TypeUsage[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ['type', 'component', 'api-route', 'service', 'util'];
  }

  /**
   * Analyze a file for type-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Task 8.1: Find all type definitions and track type usage
    this.discoverTypeDefinitions(file, ast);
    this.trackTypeUsage(file, ast);

    // Task 8.2: Detect type inconsistencies
    // Note: This requires cross-file analysis, so we detect issues after all files are analyzed
    // The detectTypeInconsistencies() method should be called after analyzing all files

    // Task 8.3: Detect type safety issues
    issues.push(...this.detectExcessiveAnyUsage(file, ast));
    issues.push(...this.detectUnnecessaryTypeAssertions(file, ast));

    return issues;
  }

  /**
   * Detect type inconsistencies across all analyzed files
   * This method should be called after all files have been analyzed
   * Validates Requirements: 7.2, 7.4, 7.5
   */
  public detectTypeInconsistencies(): Issue[] {
    const issues: Issue[] = [];

    // Detect duplicate type definitions for the same entities
    issues.push(...this.detectDuplicateTypeDefinitions());

    // Detect mismatches between Supabase types and manual types
    issues.push(...this.detectSupabaseTypeMismatches());

    return issues;
  }

  // ============================================================================
  // Task 8.1: Type Definition Discovery
  // ============================================================================

  /**
   * Find all type definitions (interfaces, types, enums) in the file
   * Validates Requirements: 7.1
   */
  private discoverTypeDefinitions(file: FileInfo, ast: SourceFile): void {
    // Find all interface declarations
    const interfaces = ast.getInterfaces();
    for (const interfaceDecl of interfaces) {
      const name = interfaceDecl.getName();
      
      this.typeDefinitions.push({
        name,
        kind: 'interface',
        node: interfaceDecl,
        file: file.relativePath,
        definition: interfaceDecl.getText(),
      });
    }

    // Find all type alias declarations
    const typeAliases = ast.getTypeAliases();
    for (const typeAlias of typeAliases) {
      const name = typeAlias.getName();
      
      this.typeDefinitions.push({
        name,
        kind: 'type',
        node: typeAlias,
        file: file.relativePath,
        definition: typeAlias.getText(),
      });
    }

    // Find all enum declarations
    const enums = ast.getEnums();
    for (const enumDecl of enums) {
      const name = enumDecl.getName();
      
      this.typeDefinitions.push({
        name,
        kind: 'enum',
        node: enumDecl,
        file: file.relativePath,
        definition: enumDecl.getText(),
      });
    }
  }

  /**
   * Track type usage across the file
   * Validates Requirements: 7.1
   */
  private trackTypeUsage(file: FileInfo, ast: SourceFile): void {
    // Track type usage in variable declarations
    const variableDeclarations = this.getVariableDeclarations(ast);
    for (const varDecl of variableDeclarations) {
      const typeNode = varDecl.getTypeNode();
      if (typeNode) {
        const typeName = this.extractTypeName(typeNode);
        if (typeName) {
          this.typeUsages.push({
            typeName,
            node: varDecl,
            file: file.relativePath,
            context: 'variable',
          });
        }
      }
    }

    // Track type usage in function parameters
    const functions = [
      ...ast.getFunctions(),
      ...this.findNodesByKind(ast, SyntaxKind.ArrowFunction),
      ...this.findNodesByKind(ast, SyntaxKind.FunctionExpression),
      ...this.findNodesByKind(ast, SyntaxKind.MethodDeclaration),
    ];

    for (const func of functions) {
      const parameters = this.getFunctionParameters(func);
      for (const param of parameters) {
        const typeNode = param.getTypeNode?.();
        if (typeNode) {
          const typeName = this.extractTypeName(typeNode);
          if (typeName) {
            this.typeUsages.push({
              typeName,
              node: param,
              file: file.relativePath,
              context: 'parameter',
            });
          }
        }
      }

      // Track return type usage
      const returnTypeNode = func.getReturnTypeNode?.();
      if (returnTypeNode) {
        const typeName = this.extractTypeName(returnTypeNode);
        if (typeName) {
          this.typeUsages.push({
            typeName,
            node: func,
            file: file.relativePath,
            context: 'return',
          });
        }
      }
    }

    // Track type usage in interface/type properties
    const interfaces = ast.getInterfaces();
    for (const interfaceDecl of interfaces) {
      const properties = interfaceDecl.getProperties();
      for (const prop of properties) {
        const typeNode = prop.getTypeNode();
        if (typeNode) {
          const typeName = this.extractTypeName(typeNode);
          if (typeName) {
            this.typeUsages.push({
              typeName,
              node: prop,
              file: file.relativePath,
              context: 'property',
            });
          }
        }
      }
    }

    const typeAliases = ast.getTypeAliases();
    for (const typeAlias of typeAliases) {
      const typeNode = typeAlias.getTypeNode();
      if (typeNode) {
        const typeName = this.extractTypeName(typeNode);
        if (typeName) {
          this.typeUsages.push({
            typeName,
            node: typeAlias,
            file: file.relativePath,
            context: 'property',
          });
        }
      }
    }
  }

  /**
   * Extract the type name from a type node
   * Handles simple types, generic types, and complex type expressions
   */
  private extractTypeName(typeNode: Node): string | null {
    const typeText = typeNode.getText();

    // Handle simple type references (e.g., "User", "string", "number")
    if (/^[A-Z][a-zA-Z0-9_]*$/.test(typeText)) {
      return typeText;
    }

    // Handle generic types (e.g., "Array<User>", "Promise<User>")
    const genericMatch = typeText.match(/^([A-Z][a-zA-Z0-9_]*)<(.+)>$/);
    if (genericMatch) {
      // Return the inner type for tracking
      return this.extractTypeName({ getText: () => genericMatch[2] } as Node);
    }

    // Handle union types (e.g., "User | null")
    if (typeText.includes('|')) {
      const types = typeText.split('|').map(t => t.trim());
      // Return the first non-primitive type
      for (const type of types) {
        if (/^[A-Z][a-zA-Z0-9_]*$/.test(type)) {
          return type;
        }
      }
    }

    // Handle intersection types (e.g., "User & Timestamps")
    if (typeText.includes('&')) {
      const types = typeText.split('&').map(t => t.trim());
      // Return the first type
      for (const type of types) {
        if (/^[A-Z][a-zA-Z0-9_]*$/.test(type)) {
          return type;
        }
      }
    }

    // Handle array types (e.g., "User[]")
    const arrayMatch = typeText.match(/^([A-Z][a-zA-Z0-9_]*)\[\]$/);
    if (arrayMatch) {
      return arrayMatch[1];
    }

    // Handle Supabase Database types (e.g., "Database['public']['Tables']['users']['Row']")
    if (typeText.includes('Database[')) {
      const tableMatch = typeText.match(/\['Tables'\]\['([^']+)'\]/);
      if (tableMatch) {
        // Return a normalized name for the table type
        return `Db${this.capitalize(tableMatch[1])}`;
      }
    }

    return null;
  }

  /**
   * Capitalize the first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get parameters from a function node
   */
  private getFunctionParameters(func: Node): Node[] {
    const funcWithParams = func as any;
    if (funcWithParams.getParameters && typeof funcWithParams.getParameters === 'function') {
      return funcWithParams.getParameters();
    }
    return [];
  }

  // ============================================================================
  // Public API for accessing tracked data
  // ============================================================================

  /**
   * Get all discovered type definitions
   * Useful for cross-file analysis and reporting
   */
  public getTypeDefinitions(): TypeDefinition[] {
    return this.typeDefinitions;
  }

  /**
   * Get all tracked type usages
   * Useful for cross-file analysis and reporting
   */
  public getTypeUsages(): TypeUsage[] {
    return this.typeUsages;
  }

  /**
   * Get type definitions by name
   */
  public getTypeDefinitionsByName(name: string): TypeDefinition[] {
    return this.typeDefinitions.filter(def => def.name === name);
  }

  /**
   * Get type usages by name
   */
  public getTypeUsagesByName(name: string): TypeUsage[] {
    return this.typeUsages.filter(usage => usage.typeName === name);
  }

  /**
   * Clear tracked data (useful for testing or re-analysis)
   */
  public clearTrackedData(): void {
    this.typeDefinitions = [];
    this.typeUsages = [];
  }

  // ============================================================================
  // Task 8.2: Type Inconsistency Detection
  // ============================================================================

  /**
   * Detect duplicate type definitions for the same entities
   * Validates Requirements: 7.2, 7.4
   */
  private detectDuplicateTypeDefinitions(): Issue[] {
    const issues: Issue[] = [];
    const typesByName = new Map<string, TypeDefinition[]>();

    // Group type definitions by name
    for (const typeDef of this.typeDefinitions) {
      const existing = typesByName.get(typeDef.name) || [];
      existing.push(typeDef);
      typesByName.set(typeDef.name, existing);
    }

    // Check for duplicates
    for (const [typeName, definitions] of typesByName.entries()) {
      if (definitions.length > 1) {
        // We have duplicate type definitions
        const files = definitions.map(d => d.file).join(', ');
        
        // Check if definitions are identical or different
        const uniqueDefinitions = new Set(definitions.map(d => this.normalizeTypeDefinition(d.definition)));
        
        if (uniqueDefinitions.size === 1) {
          // Identical definitions - code duplication
          for (const def of definitions) {
            issues.push(
              this.createIssue({
                type: 'code-duplication',
                severity: 'medium',
                category: 'types',
                file: def.file,
                node: def.node,
                description: `Duplicate type definition '${typeName}' found in ${definitions.length} files: ${files}`,
                recommendation: `Consolidate the type definition '${typeName}' into a single shared type file and import it where needed. This reduces maintenance burden and ensures consistency.`,
                estimatedEffort: 'small',
                tags: ['duplicate-type', 'type-consolidation', typeName],
              })
            );
          }
        } else {
          // Different definitions - inconsistent types
          for (const def of definitions) {
            issues.push(
              this.createIssue({
                type: 'inconsistent-pattern',
                severity: 'high',
                category: 'types',
                file: def.file,
                node: def.node,
                description: `Inconsistent type definition for '${typeName}' found across ${definitions.length} files: ${files}. The definitions differ in structure or properties.`,
                recommendation: `Review all definitions of '${typeName}' and establish a single canonical definition. Ensure all usages align with the canonical type. Consider if these should be different types with different names.`,
                estimatedEffort: 'medium',
                tags: ['inconsistent-type', 'type-mismatch', typeName],
              })
            );
          }
        }
      }
    }

    return issues;
  }

  /**
   * Detect mismatches between Supabase generated types and manual type definitions
   * Validates Requirements: 7.5
   */
  private detectSupabaseTypeMismatches(): Issue[] {
    const issues: Issue[] = [];
    
    // Find Supabase database type definitions
    const supabaseTypes = this.typeDefinitions.filter(def => 
      def.file.includes('database.types') || 
      def.file.includes('supabase') ||
      def.definition.includes("Database['public']['Tables']")
    );

    // Find manual type definitions that might correspond to database entities
    const manualTypes = this.typeDefinitions.filter(def => 
      !def.file.includes('database.types') && 
      !def.file.includes('supabase')
    );

    // Check for potential mismatches
    for (const manualType of manualTypes) {
      // Check if there's a corresponding Supabase type
      const potentialSupabaseType = this.findCorrespondingSupabaseType(manualType, supabaseTypes);
      
      if (potentialSupabaseType) {
        // We found a potential mismatch - manual type exists alongside Supabase type
        issues.push(
          this.createIssue({
            type: 'inconsistent-pattern',
            severity: 'high',
            category: 'types',
            file: manualType.file,
            node: manualType.node,
            description: `Manual type definition '${manualType.name}' may conflict with Supabase generated type. Found potential Supabase type in ${potentialSupabaseType.file}.`,
            recommendation: `Use Supabase generated types instead of manual definitions to ensure type safety with the database schema. Import the type from the generated types file: import type { ${manualType.name} } from '@/types/database.types'`,
            estimatedEffort: 'small',
            tags: ['supabase-type-mismatch', 'database-type', manualType.name],
          })
        );
      }
    }

    // Check for usage of Database['public']['Tables'] pattern outside of type files
    for (const usage of this.typeUsages) {
      if (usage.typeName.startsWith('Db') && !usage.file.includes('database.types')) {
        // This is likely a Supabase type being used directly
        // Check if there's a manual type that should be used instead
        const manualType = this.typeDefinitions.find(def => 
          def.name === usage.typeName && 
          !def.file.includes('database.types')
        );

        if (!manualType) {
          // Using Supabase type directly without a proper type alias
          // This is actually good practice, so we don't flag it as an issue
          continue;
        }
      }
    }

    return issues;
  }

  /**
   * Find a corresponding Supabase type for a manual type definition
   */
  private findCorrespondingSupabaseType(
    manualType: TypeDefinition, 
    supabaseTypes: TypeDefinition[]
  ): TypeDefinition | null {
    // Look for Supabase types with similar names
    const manualName = manualType.name.toLowerCase();
    
    for (const supabaseType of supabaseTypes) {
      const supabaseName = supabaseType.name.toLowerCase();
      
      // Check for exact match
      if (manualName === supabaseName) {
        return supabaseType;
      }
      
      // Check for common patterns:
      // - User vs users (singular vs plural)
      // - User vs DbUser
      // - UserProfile vs user_profiles
      
      if (
        manualName === supabaseName + 's' ||
        manualName + 's' === supabaseName ||
        manualName === 'db' + supabaseName ||
        'db' + manualName === supabaseName ||
        manualName.replace(/_/g, '') === supabaseName.replace(/_/g, '')
      ) {
        return supabaseType;
      }
      
      // Check if the Supabase type definition references a table with similar name
      if (supabaseType.definition.includes(`['${manualName}']`) ||
          supabaseType.definition.includes(`['${manualName}s']`) ||
          supabaseType.definition.includes(`['${manualName.replace(/([A-Z])/g, '_$1').toLowerCase()}']`)) {
        return supabaseType;
      }
    }
    
    return null;
  }

  /**
   * Normalize a type definition for comparison
   * Removes whitespace and formatting differences
   */
  private normalizeTypeDefinition(definition: string): string {
    return definition
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/;\s*}/g, '}')  // Remove trailing semicolons
      .trim();
  }

  // ============================================================================
  // Task 8.3: Type Safety Issue Detection
  // ============================================================================

  /**
   * Detect excessive 'any' type usage
   * Validates Requirements: 7.3
   */
  private detectExcessiveAnyUsage(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Find all occurrences of 'any' type in the file
    const anyTypeNodes = this.findAnyTypeUsage(ast);

    for (const node of anyTypeNodes) {
      // Determine the context of the 'any' usage
      const context = this.getAnyTypeContext(node);
      
      // Create an issue for each 'any' usage
      issues.push(
        this.createIssue({
          type: 'type-safety',
          severity: 'medium',
          category: 'types',
          file: file.relativePath,
          node: node,
          description: `Excessive use of 'any' type detected in ${context}. This bypasses TypeScript's type checking and reduces type safety.`,
          recommendation: `Replace 'any' with a specific type. Consider using: 1) A proper interface or type definition, 2) Generic types for flexible but type-safe code, 3) 'unknown' if the type is truly unknown (requires type guards), 4) Union types for multiple possible types.`,
          estimatedEffort: 'small',
          tags: ['any-type', 'type-safety', context],
        })
      );
    }

    return issues;
  }

  /**
   * Detect unnecessary type assertions
   * Validates Requirements: 7.3
   */
  private detectUnnecessaryTypeAssertions(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Find all type assertions (as Type and <Type>)
    const typeAssertions = this.findTypeAssertions(ast);

    for (const assertion of typeAssertions) {
      // Check if the type assertion is unnecessary
      if (this.isTypeAssertionUnnecessary(assertion)) {
        const assertedType = this.getAssertedType(assertion);
        
        issues.push(
          this.createIssue({
            type: 'type-safety',
            severity: 'low',
            category: 'types',
            file: file.relativePath,
            node: assertion,
            description: `Unnecessary type assertion to '${assertedType}' detected. The expression already has the correct type or TypeScript can infer it.`,
            recommendation: `Remove the type assertion and let TypeScript infer the type naturally. If the assertion is needed for a specific reason, add a comment explaining why. Type assertions should only be used when you have more information about the type than TypeScript can infer.`,
            estimatedEffort: 'trivial',
            tags: ['type-assertion', 'type-safety', 'unnecessary-assertion'],
          })
        );
      }
    }

    return issues;
  }

  /**
   * Find all 'any' type usage in the AST
   */
  private findAnyTypeUsage(ast: SourceFile): Node[] {
    const anyNodes: Node[] = [];

    // Find nodes with 'any' keyword
    const traverse = (node: Node) => {
      // Check if this is an 'any' type reference
      if (node.getKind() === SyntaxKind.AnyKeyword) {
        anyNodes.push(node);
      }
      
      node.forEachChild(traverse);
    };

    traverse(ast);
    return anyNodes;
  }

  /**
   * Get the context of an 'any' type usage
   */
  private getAnyTypeContext(node: Node): string {
    let parent = node.getParent();
    
    // Traverse up to find the meaningful context
    while (parent) {
      const kind = parent.getKind();
      
      if (kind === SyntaxKind.Parameter) {
        const paramName = this.getNodeName(parent) || 'parameter';
        return `function parameter '${paramName}'`;
      }
      
      if (kind === SyntaxKind.VariableDeclaration) {
        const varName = this.getNodeName(parent) || 'variable';
        return `variable declaration '${varName}'`;
      }
      
      if (kind === SyntaxKind.PropertySignature || kind === SyntaxKind.PropertyDeclaration) {
        const propName = this.getNodeName(parent) || 'property';
        return `property '${propName}'`;
      }
      
      if (kind === SyntaxKind.FunctionDeclaration || 
          kind === SyntaxKind.MethodDeclaration ||
          kind === SyntaxKind.ArrowFunction) {
        const funcName = this.getNodeName(parent) || 'function';
        return `return type of '${funcName}'`;
      }
      
      if (kind === SyntaxKind.TypeAliasDeclaration) {
        const typeName = this.getNodeName(parent) || 'type';
        return `type alias '${typeName}'`;
      }
      
      if (kind === SyntaxKind.InterfaceDeclaration) {
        const interfaceName = this.getNodeName(parent) || 'interface';
        return `interface '${interfaceName}'`;
      }
      
      parent = parent.getParent();
    }
    
    return 'unknown context';
  }

  /**
   * Find all type assertions in the AST
   */
  private findTypeAssertions(ast: SourceFile): Node[] {
    const assertions: Node[] = [];

    // Find 'as' type assertions
    const asAssertions = this.findNodesByKind(ast, SyntaxKind.AsExpression);
    assertions.push(...asAssertions);

    // Find angle bracket type assertions (TypeReference)
    const typeAssertions = this.findNodesByKind(ast, SyntaxKind.TypeAssertionExpression);
    assertions.push(...typeAssertions);

    // Find non-null assertions (!)
    const nonNullAssertions = this.findNodesByKind(ast, SyntaxKind.NonNullExpression);
    assertions.push(...nonNullAssertions);

    return assertions;
  }

  /**
   * Check if a type assertion is unnecessary
   */
  private isTypeAssertionUnnecessary(assertion: Node): boolean {
    const assertionText = assertion.getText();
    
    // Check for common patterns of unnecessary assertions
    
    // Pattern 1: Asserting to the same type as the literal
    // e.g., "hello" as string, 123 as number, true as boolean
    if (this.isLiteralToSameTypeAssertion(assertion)) {
      return true;
    }
    
    // Pattern 2: Double assertions (as any as Type)
    // These are sometimes necessary for complex type conversions, so we're lenient
    if (assertionText.includes(' as any as ')) {
      return false; // Not flagging double assertions as they're often intentional
    }
    
    // Pattern 3: Asserting after a type guard
    // This is harder to detect statically, so we skip it for now
    
    // Pattern 4: Asserting to 'any' (this is caught by excessive any detection)
    if (assertionText.includes(' as any') || assertionText.includes('<any>')) {
      return false; // Let the 'any' detection handle this
    }
    
    // Pattern 5: Non-null assertion on optional chaining result
    // e.g., obj?.prop! - this is often unnecessary
    if (assertion.getKind() === SyntaxKind.NonNullExpression) {
      const expression = (assertion as any).getExpression?.();
      if (expression) {
        const exprText = expression.getText();
        // Check if the expression uses optional chaining
        if (exprText.includes('?.')) {
          return true; // Likely unnecessary
        }
      }
    }
    
    // For other cases, we need more sophisticated type inference
    // which would require the TypeScript type checker
    // For now, we're conservative and don't flag them
    return false;
  }

  /**
   * Check if an assertion is from a literal to its natural type
   */
  private isLiteralToSameTypeAssertion(assertion: Node): boolean {
    const assertionText = assertion.getText();
    
    // Check for string literal to string
    if (assertionText.match(/["'`][^"'`]*["'`]\s+as\s+string/)) {
      return true;
    }
    
    // Check for number literal to number
    if (assertionText.match(/\d+(\.\d+)?\s+as\s+number/)) {
      return true;
    }
    
    // Check for boolean literal to boolean
    if (assertionText.match(/(true|false)\s+as\s+boolean/)) {
      return true;
    }
    
    // Check for array literal to array type
    if (assertionText.match(/\[.*\]\s+as\s+.*\[\]/)) {
      return true;
    }
    
    // Check for object literal to object type
    if (assertionText.match(/\{.*\}\s+as\s+\{.*\}/)) {
      // This might be necessary for specific object shapes, so we're lenient
      return false;
    }
    
    return false;
  }

  /**
   * Get the type being asserted to
   */
  private getAssertedType(assertion: Node): string {
    const assertionText = assertion.getText();
    
    // Extract type from 'as Type' syntax
    const asMatch = assertionText.match(/\s+as\s+(.+)$/);
    if (asMatch) {
      return asMatch[1].trim();
    }
    
    // Extract type from '<Type>' syntax
    const angleMatch = assertionText.match(/^<(.+)>/);
    if (angleMatch) {
      return angleMatch[1].trim();
    }
    
    // Non-null assertion
    if (assertion.getKind() === SyntaxKind.NonNullExpression) {
      return 'non-null';
    }
    
    return 'unknown';
  }
}

