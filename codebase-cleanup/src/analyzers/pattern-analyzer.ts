/**
 * Abstract base class for all pattern analyzers
 * Provides common utilities for AST traversal and issue creation
 */

import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { v4 as uuidv4 } from 'uuid';
import type {
  PatternAnalyzer,
  FileInfo,
  Issue,
  IssueType,
  IssueCategory,
  Severity,
  EffortLevel,
  CodeLocation,
  FileCategory,
} from '../types';

/**
 * Abstract base class that all pattern analyzers must extend
 */
export abstract class BasePatternAnalyzer implements PatternAnalyzer {
  /**
   * Name of the analyzer (must be implemented by subclasses)
   */
  abstract readonly name: string;

  /**
   * Analyze a file and return detected issues
   * @param file File information
   * @param ast Parsed AST of the file
   * @returns Array of detected issues
   */
  abstract analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]>;

  /**
   * Get the file types this analyzer supports
   * @returns Array of supported file categories
   */
  abstract getSupportedFileTypes(): FileCategory[];

  // ============================================================================
  // Issue Creation Helpers
  // ============================================================================

  /**
   * Create an issue with proper location tracking
   * @param params Issue parameters
   * @returns Complete Issue object
   */
  protected createIssue(params: {
    type: IssueType;
    severity: Severity;
    category: IssueCategory;
    file: string;
    node: Node;
    description: string;
    recommendation: string;
    estimatedEffort: EffortLevel;
    tags?: string[];
  }): Issue {
    const location = this.getNodeLocation(params.node);
    const codeSnippet = this.getCodeSnippet(params.node);

    return {
      id: uuidv4(),
      type: params.type,
      severity: params.severity,
      category: params.category,
      file: params.file,
      location,
      description: params.description,
      codeSnippet,
      recommendation: params.recommendation,
      estimatedEffort: params.estimatedEffort,
      tags: params.tags || [],
      detectedBy: this.name,
      detectedAt: new Date(),
      relatedIssues: [],
    };
  }

  /**
   * Get the location of a node in the source file
   * @param node AST node
   * @returns Code location with line and column numbers
   */
  protected getNodeLocation(node: Node): CodeLocation {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const end = node.getEnd();

    const startLineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);

    return {
      startLine: startLineAndColumn.line,
      endLine: endLineAndColumn.line,
      startColumn: startLineAndColumn.column,
      endColumn: endLineAndColumn.column,
    };
  }

  /**
   * Get a code snippet from a node
   * @param node AST node
   * @param maxLength Maximum length of snippet (default: 200)
   * @returns Code snippet as string
   */
  protected getCodeSnippet(node: Node, maxLength: number = 200): string {
    const text = node.getText();
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  // ============================================================================
  // AST Traversal Utilities
  // ============================================================================

  /**
   * Find all nodes of a specific kind in the AST
   * @param ast Source file AST
   * @param kind Syntax kind to search for
   * @returns Array of matching nodes
   */
  protected findNodesByKind(ast: SourceFile, kind: SyntaxKind): Node[] {
    const nodes: Node[] = [];
    
    const traverse = (node: Node) => {
      if (node.getKind() === kind) {
        nodes.push(node);
      }
      node.forEachChild(traverse);
    };

    traverse(ast);
    return nodes;
  }

  /**
   * Find all nodes matching a predicate function
   * @param ast Source file AST
   * @param predicate Function to test each node
   * @returns Array of matching nodes
   */
  protected findNodes(ast: SourceFile, predicate: (node: Node) => boolean): Node[] {
    const nodes: Node[] = [];
    
    const traverse = (node: Node) => {
      if (predicate(node)) {
        nodes.push(node);
      }
      node.forEachChild(traverse);
    };

    traverse(ast);
    return nodes;
  }

  /**
   * Get all function declarations in the AST
   * @param ast Source file AST
   * @returns Array of function declaration nodes
   */
  protected getFunctionDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.FunctionDeclaration);
  }

  /**
   * Get all arrow functions in the AST
   * @param ast Source file AST
   * @returns Array of arrow function nodes
   */
  protected getArrowFunctions(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.ArrowFunction);
  }

  /**
   * Get all function expressions in the AST
   * @param ast Source file AST
   * @returns Array of function expression nodes
   */
  protected getFunctionExpressions(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.FunctionExpression);
  }

  /**
   * Get all method declarations in the AST
   * @param ast Source file AST
   * @returns Array of method declaration nodes
   */
  protected getMethodDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.MethodDeclaration);
  }

  /**
   * Get all class declarations in the AST
   * @param ast Source file AST
   * @returns Array of class declaration nodes
   */
  protected getClassDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.ClassDeclaration);
  }

  /**
   * Get all interface declarations in the AST
   * @param ast Source file AST
   * @returns Array of interface declaration nodes
   */
  protected getInterfaceDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.InterfaceDeclaration);
  }

  /**
   * Get all type alias declarations in the AST
   * @param ast Source file AST
   * @returns Array of type alias nodes
   */
  protected getTypeAliases(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.TypeAliasDeclaration);
  }

  /**
   * Get all import declarations in the AST
   * @param ast Source file AST
   * @returns Array of import declaration nodes
   */
  protected getImportDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.ImportDeclaration);
  }

  /**
   * Get all export declarations in the AST
   * @param ast Source file AST
   * @returns Array of export declaration nodes
   */
  protected getExportDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.ExportDeclaration);
  }

  /**
   * Get all variable declarations in the AST
   * @param ast Source file AST
   * @returns Array of variable declaration nodes
   */
  protected getVariableDeclarations(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.VariableDeclaration);
  }

  /**
   * Get all if statements in the AST
   * @param ast Source file AST
   * @returns Array of if statement nodes
   */
  protected getIfStatements(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.IfStatement);
  }

  /**
   * Get all call expressions in the AST
   * @param ast Source file AST
   * @returns Array of call expression nodes
   */
  protected getCallExpressions(ast: SourceFile): Node[] {
    return this.findNodesByKind(ast, SyntaxKind.CallExpression);
  }

  // ============================================================================
  // Code Analysis Utilities
  // ============================================================================

  /**
   * Calculate the nesting depth of a node
   * @param node AST node
   * @returns Nesting depth (0 for top-level)
   */
  protected getNestingDepth(node: Node): number {
    let depth = 0;
    let current = node.getParent();

    while (current) {
      const kind = current.getKind();
      // Count blocks that increase nesting
      if (
        kind === SyntaxKind.IfStatement ||
        kind === SyntaxKind.ForStatement ||
        kind === SyntaxKind.WhileStatement ||
        kind === SyntaxKind.DoStatement ||
        kind === SyntaxKind.SwitchStatement ||
        kind === SyntaxKind.CaseClause ||
        kind === SyntaxKind.TryStatement ||
        kind === SyntaxKind.CatchClause
      ) {
        depth++;
      }
      current = current.getParent();
    }

    return depth;
  }

  /**
   * Check if a node contains a specific text pattern
   * @param node AST node
   * @param pattern Regular expression pattern
   * @returns True if pattern is found
   */
  protected containsPattern(node: Node, pattern: RegExp): boolean {
    return pattern.test(node.getText());
  }

  /**
   * Get the name of a named node (function, class, variable, etc.)
   * @param node AST node
   * @returns Name of the node or undefined
   */
  protected getNodeName(node: Node): string | undefined {
    // Try to get name from various node types
    const nodeWithName = node as any;
    
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
  protected isExported(node: Node): boolean {
    const nodeWithModifiers = node as any;
    
    if (!nodeWithModifiers.getModifiers) {
      return false;
    }
    
    const modifiers = nodeWithModifiers.getModifiers();
    return modifiers.some((mod: any) => 
      mod.getKind() === SyntaxKind.ExportKeyword
    );
  }

  /**
   * Get all comments associated with a node
   * @param node AST node
   * @returns Array of comment texts
   */
  protected getComments(node: Node): string[] {
    const comments: string[] = [];
    const sourceFile = node.getSourceFile();
    const fullText = sourceFile.getFullText();
    
    // Get leading comments
    const leadingCommentRanges = node.getLeadingCommentRanges();
    for (const range of leadingCommentRanges) {
      comments.push(fullText.substring(range.getPos(), range.getEnd()));
    }
    
    // Get trailing comments
    const trailingCommentRanges = node.getTrailingCommentRanges();
    for (const range of trailingCommentRanges) {
      comments.push(fullText.substring(range.getPos(), range.getEnd()));
    }
    
    return comments;
  }

  /**
   * Count the number of child nodes
   * @param node AST node
   * @returns Number of direct children
   */
  protected getChildCount(node: Node): number {
    return node.getChildCount();
  }

  /**
   * Get the text length of a node
   * @param node AST node
   * @returns Length in characters
   */
  protected getTextLength(node: Node): number {
    return node.getText().length;
  }
}
