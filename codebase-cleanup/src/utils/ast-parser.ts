/**
 * AST Parsing Utilities
 * 
 * Provides utilities for parsing TypeScript/JavaScript files into ASTs
 * and querying AST nodes for common patterns.
 */

import { Project, SourceFile, Node, SyntaxKind, VariableDeclarationList, Modifier } from 'ts-morph';
import type { FileInfo } from '../types';

/**
 * Interface for nodes that may have a getName method
 */
interface NodeWithName {
  getName?: () => string | undefined;
  name?: string | { getText?: () => string };
}

/**
 * Interface for nodes that may have getModifiers method
 */
interface NodeWithModifiers {
  getModifiers?: () => Modifier[];
}

/**
 * Error thrown when file parsing fails
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * AST Parser class for parsing files and querying AST nodes
 */
export class ASTParser {
  private project: Project;

  constructor() {
    // Initialize ts-morph Project with TypeScript compiler options
    this.project = new Project({
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        jsx: 2, // React
        allowJs: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        noEmit: true,
      },
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
    });
  }

  /**
   * Parse a file into an AST
   * @param file File information
   * @returns Parsed SourceFile AST
   * @throws ParseError if parsing fails
   */
  async parseFile(file: FileInfo): Promise<SourceFile> {
    try {
      // Add the file to the project
      const sourceFile = this.project.addSourceFileAtPath(file.path);
      
      // Check for syntax errors
      const diagnostics = sourceFile.getPreEmitDiagnostics();
      
      if (diagnostics.length > 0) {
        // Log diagnostics but don't fail - we want to analyze even files with errors
        const errors = diagnostics.map(d => d.getMessageText()).join('\n');
        console.warn(`Syntax warnings in ${file.relativePath}:\n${errors}`);
      }
      
      return sourceFile;
    } catch (error) {
      throw new ParseError(
        `Failed to parse file: ${file.relativePath}`,
        file.path,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse file content from a string
   * @param content File content as string
   * @param filePath Virtual file path for the content
   * @returns Parsed SourceFile AST
   * @throws ParseError if parsing fails
   */
  parseContent(content: string, filePath: string): SourceFile {
    try {
      return this.project.createSourceFile(filePath, content, { overwrite: true });
    } catch (error) {
      throw new ParseError(
        `Failed to parse content for: ${filePath}`,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Remove a file from the project to free memory
   * @param sourceFile Source file to remove
   */
  removeFile(sourceFile: SourceFile): void {
    sourceFile.forget();
  }

  /**
   * Clear all files from the project
   */
  clearAll(): void {
    this.project.getSourceFiles().forEach(sf => sf.forget());
  }

  /**
   * Get the ts-morph Project instance
   * @returns The Project instance
   */
  getProject(): Project {
    return this.project;
  }
}

// ============================================================================
// AST Query Helpers
// ============================================================================

/**
 * Query helper functions for common AST operations
 */
export class ASTQueryHelper {
  /**
   * Find all function declarations in a source file
   * @param ast Source file AST
   * @returns Array of function declaration nodes
   */
  static findFunctions(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
  }

  /**
   * Find all arrow functions in a source file
   * @param ast Source file AST
   * @returns Array of arrow function nodes
   */
  static findArrowFunctions(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.ArrowFunction);
  }

  /**
   * Find all function expressions in a source file
   * @param ast Source file AST
   * @returns Array of function expression nodes
   */
  static findFunctionExpressions(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.FunctionExpression);
  }

  /**
   * Find all functions (declarations, expressions, and arrow functions)
   * @param ast Source file AST
   * @returns Array of all function nodes
   */
  static findAllFunctions(ast: SourceFile): Node[] {
    return [
      ...this.findFunctions(ast),
      ...this.findArrowFunctions(ast),
      ...this.findFunctionExpressions(ast),
    ];
  }

  /**
   * Find all method declarations in a source file
   * @param ast Source file AST
   * @returns Array of method declaration nodes
   */
  static findMethods(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
  }

  /**
   * Find all class declarations in a source file
   * @param ast Source file AST
   * @returns Array of class declaration nodes
   */
  static findClasses(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
  }

  /**
   * Find all interface declarations in a source file
   * @param ast Source file AST
   * @returns Array of interface declaration nodes
   */
  static findInterfaces(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration);
  }

  /**
   * Find all type alias declarations in a source file
   * @param ast Source file AST
   * @returns Array of type alias nodes
   */
  static findTypeAliases(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);
  }

  /**
   * Find all type definitions (interfaces and type aliases)
   * @param ast Source file AST
   * @returns Array of type definition nodes
   */
  static findTypes(ast: SourceFile): Node[] {
    return [
      ...this.findInterfaces(ast),
      ...this.findTypeAliases(ast),
    ];
  }

  /**
   * Find all import declarations in a source file
   * @param ast Source file AST
   * @returns Array of import declaration nodes
   */
  static findImports(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
  }

  /**
   * Find all export declarations in a source file
   * @param ast Source file AST
   * @returns Array of export declaration nodes
   */
  static findExports(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.ExportDeclaration);
  }

  /**
   * Find all variable declarations in a source file
   * @param ast Source file AST
   * @returns Array of variable declaration nodes
   */
  static findVariables(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  }

  /**
   * Find all const declarations in a source file
   * @param ast Source file AST
   * @returns Array of const variable declaration nodes
   */
  static findConstants(ast: SourceFile): Node[] {
    const variableStatements = ast.getDescendantsOfKind(SyntaxKind.VariableStatement);
    const constants: Node[] = [];

    for (const statement of variableStatements) {
      const declarationList = statement.getFirstChildByKind(SyntaxKind.VariableDeclarationList) as VariableDeclarationList | undefined;
      if (declarationList) {
        const flags = declarationList.getDeclarationKind?.();
        if (flags === 2) { // VariableDeclarationKind.Const
          constants.push(...declarationList.getDescendantsOfKind(SyntaxKind.VariableDeclaration));
        }
      }
    }

    return constants;
  }

  /**
   * Find all if statements in a source file
   * @param ast Source file AST
   * @returns Array of if statement nodes
   */
  static findIfStatements(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.IfStatement);
  }

  /**
   * Find all for statements in a source file
   * @param ast Source file AST
   * @returns Array of for statement nodes
   */
  static findForStatements(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.ForStatement);
  }

  /**
   * Find all while statements in a source file
   * @param ast Source file AST
   * @returns Array of while statement nodes
   */
  static findWhileStatements(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.WhileStatement);
  }

  /**
   * Find all switch statements in a source file
   * @param ast Source file AST
   * @returns Array of switch statement nodes
   */
  static findSwitchStatements(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.SwitchStatement);
  }

  /**
   * Find all try statements in a source file
   * @param ast Source file AST
   * @returns Array of try statement nodes
   */
  static findTryStatements(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.TryStatement);
  }

  /**
   * Find all catch clauses in a source file
   * @param ast Source file AST
   * @returns Array of catch clause nodes
   */
  static findCatchClauses(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.CatchClause);
  }

  /**
   * Find all call expressions in a source file
   * @param ast Source file AST
   * @returns Array of call expression nodes
   */
  static findCallExpressions(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.CallExpression);
  }

  /**
   * Find all JSX elements in a source file
   * @param ast Source file AST
   * @returns Array of JSX element nodes
   */
  static findJSXElements(ast: SourceFile): Node[] {
    return [
      ...ast.getDescendantsOfKind(SyntaxKind.JsxElement),
      ...ast.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ];
  }

  /**
   * Find all React component declarations (function components)
   * @param ast Source file AST
   * @returns Array of React component nodes
   */
  static findReactComponents(ast: SourceFile): Node[] {
    const components: Node[] = [];
    
    // Find function declarations that return JSX
    const functions = [
      ...this.findFunctions(ast),
      ...this.findArrowFunctions(ast),
      ...this.findFunctionExpressions(ast),
    ];

    for (const func of functions) {
      const text = func.getText();
      // Check if function returns JSX (contains JSX syntax)
      if (text.includes('<') && text.includes('/>') || text.includes('</')) {
        components.push(func);
      }
    }

    return components;
  }

  /**
   * Find all nodes with 'any' type annotation
   * @param ast Source file AST
   * @returns Array of nodes with 'any' type
   */
  static findAnyTypes(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.AnyKeyword);
  }

  /**
   * Find all type assertions (as Type)
   * @param ast Source file AST
   * @returns Array of type assertion nodes
   */
  static findTypeAssertions(ast: SourceFile): Node[] {
    return ast.getDescendantsOfKind(SyntaxKind.AsExpression);
  }

  /**
   * Find all comments in a source file
   * @param ast Source file AST
   * @returns Array of comment texts
   */
  static findComments(ast: SourceFile): string[] {
    const comments: string[] = [];
    const fullText = ast.getFullText();
    
    // Get all comment ranges
    ast.forEachDescendant(node => {
      const leadingComments = node.getLeadingCommentRanges();
      const trailingComments = node.getTrailingCommentRanges();
      
      for (const range of [...leadingComments, ...trailingComments]) {
        const commentText = fullText.substring(range.getPos(), range.getEnd());
        comments.push(commentText);
      }
    });
    
    return comments;
  }

  /**
   * Find all commented-out code blocks
   * @param ast Source file AST
   * @returns Array of commented code blocks
   */
  static findCommentedCode(ast: SourceFile): string[] {
    const comments = this.findComments(ast);
    const commentedCode: string[] = [];
    
    for (const comment of comments) {
      // Remove comment markers
      const cleaned = comment
        .replace(/^\/\*+/, '')
        .replace(/\*+\/$/, '')
        .replace(/^\/\/+/gm, '')
        .trim();
      
      // Check if it looks like code (has common code patterns)
      const codePatterns = [
        /function\s+\w+/,
        /const\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /class\s+\w+/,
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /import\s+.*from/,
        /export\s+(default|const|function|class)/,
        /if\s*\(/,
        /for\s*\(/,
        /while\s*\(/,
        /=>\s*{/,
      ];
      
      if (codePatterns.some(pattern => pattern.test(cleaned))) {
        commentedCode.push(comment);
      }
    }
    
    return commentedCode;
  }

  /**
   * Find nodes by custom predicate
   * @param ast Source file AST
   * @param predicate Function to test each node
   * @returns Array of matching nodes
   */
  static findByPredicate(ast: SourceFile, predicate: (node: Node) => boolean): Node[] {
    const matches: Node[] = [];
    
    ast.forEachDescendant(node => {
      if (predicate(node)) {
        matches.push(node);
      }
    });
    
    return matches;
  }

  /**
   * Find nodes by syntax kind
   * @param ast Source file AST
   * @param kind Syntax kind to search for
   * @returns Array of matching nodes
   */
  static findByKind(ast: SourceFile, kind: SyntaxKind): Node[] {
    return ast.getDescendantsOfKind(kind);
  }

  /**
   * Get the name of a named node (function, class, variable, etc.)
   * @param node AST node
   * @returns Name of the node or undefined
   */
  static getNodeName(node: Node): string | undefined {
    const nodeWithName = node as unknown as NodeWithName;

    if (nodeWithName.getName && typeof nodeWithName.getName === 'function') {
      return nodeWithName.getName();
    }

    if (nodeWithName.name) {
      return typeof nodeWithName.name === 'string'
        ? nodeWithName.name
        : nodeWithName.name.getText?.();
    }

    return undefined;
  }

  /**
   * Check if a node is exported
   * @param node AST node
   * @returns True if the node is exported
   */
  static isExported(node: Node): boolean {
    const nodeWithModifiers = node as unknown as NodeWithModifiers;

    if (!nodeWithModifiers.getModifiers) {
      return false;
    }

    const modifiers = nodeWithModifiers.getModifiers();
    return modifiers.some((mod: Modifier) =>
      mod.getKind() === SyntaxKind.ExportKeyword
    );
  }

  /**
   * Calculate the cyclomatic complexity of a function
   * @param node Function node
   * @returns Complexity score
   */
  static calculateComplexity(node: Node): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPoints = [
      SyntaxKind.IfStatement,
      SyntaxKind.ConditionalExpression,
      SyntaxKind.CaseClause,
      SyntaxKind.ForStatement,
      SyntaxKind.ForInStatement,
      SyntaxKind.ForOfStatement,
      SyntaxKind.WhileStatement,
      SyntaxKind.DoStatement,
      SyntaxKind.CatchClause,
      SyntaxKind.BinaryExpression, // For && and ||
    ];
    
    node.forEachDescendant(child => {
      if (decisionPoints.includes(child.getKind())) {
        // For binary expressions, only count logical operators
        if (child.getKind() === SyntaxKind.BinaryExpression) {
          const text = child.getText();
          if (text.includes('&&') || text.includes('||')) {
            complexity++;
          }
        } else {
          complexity++;
        }
      }
    });
    
    return complexity;
  }

  /**
   * Calculate the nesting depth of a node
   * @param node AST node
   * @returns Maximum nesting depth
   */
  static calculateNestingDepth(node: Node): number {
    let maxDepth = 0;
    
    const traverse = (n: Node, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      
      const kind = n.getKind();
      const nestingKinds = [
        SyntaxKind.IfStatement,
        SyntaxKind.ForStatement,
        SyntaxKind.ForInStatement,
        SyntaxKind.ForOfStatement,
        SyntaxKind.WhileStatement,
        SyntaxKind.DoStatement,
        SyntaxKind.SwitchStatement,
        SyntaxKind.TryStatement,
        SyntaxKind.CatchClause,
      ];
      
      const newDepth = nestingKinds.includes(kind) ? depth + 1 : depth;
      
      n.forEachChild(child => traverse(child, newDepth));
    };
    
    traverse(node, 0);
    return maxDepth;
  }

  /**
   * Get all identifiers in a node
   * @param node AST node
   * @returns Array of identifier names
   */
  static getIdentifiers(node: Node): string[] {
    const identifiers: string[] = [];
    
    node.forEachDescendant(child => {
      if (child.getKind() === SyntaxKind.Identifier) {
        identifiers.push(child.getText());
      }
    });
    
    return identifiers;
  }

  /**
   * Check if a node contains a specific pattern
   * @param node AST node
   * @param pattern Regular expression pattern
   * @returns True if pattern is found
   */
  static containsPattern(node: Node, pattern: RegExp): boolean {
    return pattern.test(node.getText());
  }
}

/**
 * Export a singleton instance of ASTParser for convenience
 */
export const astParser = new ASTParser();
