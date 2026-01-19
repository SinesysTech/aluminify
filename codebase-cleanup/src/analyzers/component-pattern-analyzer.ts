/**
 * Component Pattern Analyzer
 *
 * Analyzes React component structure and patterns in the codebase to identify
 * component quality issues and inconsistencies.
 *
 * Detects:
 * - React function components
 * - React class components
 * - Component categorization by type
 * - Components with business logic that should be in services
 * - Excessive prop drilling (more than 3 levels)
 * - Duplicate component logic
 * - Inconsistent component composition patterns
 * - Components mixing concerns (UI + data fetching + business logic)
 */

import {
  SourceFile,
  Node,
  FunctionDeclaration,
  ArrowFunction,
  ClassDeclaration,
  VariableDeclaration,
} from "ts-morph";
import { BasePatternAnalyzer } from "./pattern-analyzer.js";
import type { FileInfo, Issue, FileCategory } from "../types.js";

/**
 * Information about a discovered React component
 */
interface ComponentInfo {
  name: string;
  type: "function" | "class" | "arrow";
  node: Node;
  file: string;
  isExported: boolean;
  hasProps: boolean;
  usesHooks: boolean;
  usesState: boolean;
}

/**
 * Information about a prop chain through component hierarchy
 */
interface PropChain {
  propName: string;
  depth: number;
  componentPath: string[];
  startNode: Node;
}

/**
 * Analyzer for React component patterns
 */
export class ComponentPatternAnalyzer extends BasePatternAnalyzer {
  readonly name = "ComponentPatternAnalyzer";

  private discoveredComponents: ComponentInfo[] = [];

  /**
   * Get supported file types for this analyzer
   */
  getSupportedFileTypes(): FileCategory[] {
    return ["component"];
  }

  /**
   * Analyze a file for component-related issues
   */
  async analyze(file: FileInfo, ast: SourceFile): Promise<Issue[]> {
    // Reset state for each file analysis
    this.discoveredComponents = [];

    const issues: Issue[] = [];

    // Task 7.1: Discover and categorize React components
    issues.push(...this.discoverComponents(file, ast));

    // Task 7.2: Detect prop drilling
    issues.push(...this.detectPropDrilling(file, ast));

    // Task 7.3: Detect component pattern inconsistencies and duplicate logic
    issues.push(...this.detectComponentPatternInconsistencies(file, ast));
    issues.push(...this.detectDuplicateComponentLogic(file, ast));

    return issues;
  }

  // ============================================================================
  // Task 7.1: Component Discovery and Categorization
  // ============================================================================

  /**
   * Discover all React components (function and class components) and categorize them
   * Validates Requirements: 6.1
   */
  private discoverComponents(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Discover function components
    issues.push(...this.discoverFunctionComponents(file, ast));

    // Discover class components
    issues.push(...this.discoverClassComponents(file, ast));

    // Discover arrow function components
    issues.push(...this.discoverArrowFunctionComponents(file, ast));

    return issues;
  }

  /**
   * Discover React function components (function declarations)
   */
  private discoverFunctionComponents(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const functionDeclarations = ast.getFunctions();

    for (const func of functionDeclarations) {
      const funcName = func.getName();
      if (!funcName) continue;

      // Check if this is a React component
      if (this.isReactComponent(func, funcName)) {
        const componentInfo: ComponentInfo = {
          name: funcName,
          type: "function",
          node: func,
          file: file.relativePath,
          isExported: this.isExported(func),
          hasProps: this.hasParameters(func),
          usesHooks: this.usesReactHooks(func),
          usesState: this.usesStateHook(func),
        };

        this.discoveredComponents.push(componentInfo);

        // Log discovery (not an issue, just tracking)
        // We don't create issues for valid components, only for problems
      }
    }

    return issues;
  }

  /**
   * Discover React class components
   */
  private discoverClassComponents(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];
    const classDeclarations = this.getClassDeclarations(ast);

    for (const classDecl of classDeclarations) {
      const className = this.getNodeName(classDecl);
      if (!className) continue;

      // Cast to ClassDeclaration for type safety
      if (!Node.isClassDeclaration(classDecl)) continue;

      // Check if this class extends React.Component or React.PureComponent
      if (this.isReactClassComponent(classDecl)) {
        const componentInfo: ComponentInfo = {
          name: className,
          type: "class",
          node: classDecl,
          file: file.relativePath,
          isExported: this.isExported(classDecl),
          hasProps: this.classHasProps(classDecl),
          usesHooks: false, // Class components don't use hooks
          usesState: this.classHasState(classDecl),
        };

        this.discoveredComponents.push(componentInfo);

        // Flag class components as potentially outdated pattern
        // Modern React prefers function components with hooks
        issues.push(
          this.createIssue({
            type: "legacy-code",
            severity: "low",
            category: "components",
            file: file.relativePath,
            node: classDecl,
            description: `Class component '${className}' detected. Modern React development favors function components with hooks for better code reuse and simpler patterns.`,
            recommendation: `Consider refactoring '${className}' to a function component using hooks (useState, useEffect, etc.). This improves code readability and enables better composition with custom hooks.`,
            estimatedEffort: "medium",
            tags: ["component", "class-component", "modernization", "hooks"],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Discover React arrow function components (variable declarations with arrow functions)
   */
  private discoverArrowFunctionComponents(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];
    const variableDeclarations = this.getVariableDeclarations(ast);

    for (const varDecl of variableDeclarations) {
      const varName = this.getNodeName(varDecl);
      if (!varName) continue;

      // Cast to VariableDeclaration to access getInitializer
      if (!Node.isVariableDeclaration(varDecl)) continue;
      const initializer = varDecl.getInitializer();
      if (!initializer || !Node.isArrowFunction(initializer)) continue;

      // Check if this is a React component
      if (this.isReactComponent(initializer, varName)) {
        const componentInfo: ComponentInfo = {
          name: varName,
          type: "arrow",
          node: varDecl,
          file: file.relativePath,
          isExported: this.isExported(varDecl),
          hasProps: this.hasParameters(initializer),
          usesHooks: this.usesReactHooks(initializer),
          usesState: this.usesStateHook(initializer),
        };

        this.discoveredComponents.push(componentInfo);
      }
    }

    return issues;
  }

  // ============================================================================
  // Component Detection Helpers
  // ============================================================================

  /**
   * Check if a function/arrow function is a React component
   * React components:
   * - Start with uppercase letter (PascalCase)
   * - Return JSX (contains JSX elements)
   * - May use React hooks
   */
  private isReactComponent(node: Node, name: string): boolean {
    // Check 1: Name starts with uppercase (PascalCase convention)
    if (!this.isPascalCase(name)) {
      return false;
    }

    // Check 2: Returns JSX or uses React hooks
    const returnsJSX = this.returnsJSX(node);
    const usesHooks = this.usesReactHooks(node);

    return returnsJSX || usesHooks;
  }

  /**
   * Check if a class is a React component
   */
  private isReactClassComponent(classDecl: ClassDeclaration): boolean {
    const heritage = classDecl.getExtends();
    if (!heritage) return false;

    const heritageText = heritage.getText();

    // Check if extends React.Component, React.PureComponent, Component, or PureComponent
    return (
      heritageText.includes("React.Component") ||
      heritageText.includes("React.PureComponent") ||
      heritageText === "Component" ||
      heritageText === "PureComponent"
    );
  }

  /**
   * Check if a name follows PascalCase convention
   */
  private isPascalCase(name: string): boolean {
    // PascalCase: starts with uppercase, contains at least one letter
    return /^[A-Z][a-zA-Z0-9]*$/.test(name) && name.length > 1;
  }

  /**
   * Check if a function returns JSX
   */
  private returnsJSX(node: Node): boolean {
    const text = node.getText();

    // Look for JSX patterns:
    // - JSX elements: <div>, <Component>
    // - JSX fragments: <>, </>
    // - Return statements with JSX
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*[\s>\/]/, // Component tags: <MyComponent
      /<[a-z][a-zA-Z0-9]*[\s>\/]/, // HTML tags: <div
      /<>/, // Fragment opening
      /<\/>/, // Fragment closing
      /return\s*\(/, // Return with parentheses (common for JSX)
    ];

    return jsxPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check if a function uses React hooks
   */
  private usesReactHooks(node: Node): boolean {
    const text = node.getText();

    // Common React hooks
    const hookPatterns = [
      /\buse[A-Z][a-zA-Z0-9]*\(/, // Any hook: useState, useEffect, useCustomHook
      /\buseState\(/,
      /\buseEffect\(/,
      /\buseContext\(/,
      /\buseReducer\(/,
      /\buseCallback\(/,
      /\buseMemo\(/,
      /\buseRef\(/,
      /\buseImperativeHandle\(/,
      /\buseLayoutEffect\(/,
      /\buseDebugValue\(/,
    ];

    return hookPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check if a function uses useState hook
   */
  private usesStateHook(node: Node): boolean {
    const text = node.getText();
    return /\buseState\(/.test(text);
  }

  /**
   * Check if a function has parameters
   */
  private hasParameters(node: Node): boolean {
    if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node)) {
      return node.getParameters().length > 0;
    }
    return false;
  }

  /**
   * Check if a class component has props
   */
  private classHasProps(classDecl: ClassDeclaration): boolean {
    // Check constructor parameters
    const constructors = classDecl.getConstructors();
    for (const constructor of constructors) {
      if (constructor.getParameters().length > 0) {
        return true;
      }
    }

    // Check if props are accessed in the class
    const classText = classDecl.getText();
    return classText.includes("this.props");
  }

  /**
   * Check if a class component has state
   */
  private classHasState(classDecl: ClassDeclaration): boolean {
    const classText = classDecl.getText();

    // Check for state initialization or usage
    return classText.includes("this.state") || classText.includes("setState(");
  }

  // ============================================================================
  // Task 7.2: Prop Drilling Detection
  // ============================================================================

  /**
   * Detect excessive prop drilling (props passed through more than 3 levels)
   * Validates Requirements: 6.3
   */
  private detectPropDrilling(file: FileInfo, ast: SourceFile): Issue[] {
    const issues: Issue[] = [];

    // Find all JSX elements in the file
    const jsxElements = this.findJSXElements(ast);

    // Track prop chains through component hierarchy
    const propChains = this.buildPropChains(jsxElements, ast);

    // Flag chains exceeding 3 levels
    for (const chain of propChains) {
      if (chain.depth > 3) {
        issues.push(
          this.createIssue({
            type: "confusing-logic",
            severity: "medium",
            category: "components",
            file: file.relativePath,
            node: chain.startNode,
            description: `Prop drilling detected: prop '${chain.propName}' is passed through ${chain.depth} levels of components (${chain.componentPath.join(" → ")}). This makes the code harder to maintain and understand.`,
            recommendation: `Consider using React Context, a state management library (Redux, Zustand), or component composition patterns to avoid passing '${chain.propName}' through ${chain.depth} levels. This will make the code more maintainable and reduce coupling between components.`,
            estimatedEffort: "medium",
            tags: [
              "component",
              "prop-drilling",
              "state-management",
              "refactoring",
            ],
          }),
        );
      }
    }

    return issues;
  }

  /**
   * Find all JSX elements in the AST
   */
  private findJSXElements(ast: SourceFile): Node[] {
    const jsxElements: Node[] = [];

    const traverse = (node: Node) => {
      const kind = node.getKind();

      // JSX element types
      if (
        kind === SyntaxKind.JsxElement ||
        kind === SyntaxKind.JsxSelfClosingElement ||
        kind === SyntaxKind.JsxFragment
      ) {
        jsxElements.push(node);
      }

      node.forEachChild(traverse);
    };

    traverse(ast);
    return jsxElements;
  }

  /**
   * Build prop chains by tracking props through component hierarchy
   */
  private buildPropChains(jsxElements: Node[], ast: SourceFile): PropChain[] {
    const chains: PropChain[] = [];

    // For each component in the file, track its props
    for (const component of this.discoveredComponents) {
      const componentNode = component.node;
      const componentName = component.name;

      // Get the props parameter
      const props = this.getComponentProps(componentNode);
      if (!props || props.length === 0) continue;

      // For each prop, track where it's passed down
      for (const propName of props) {
        const chain = this.trackPropThroughHierarchy(
          propName,
          componentName,
          componentNode,
          ast,
          1,
        );

        if (chain && chain.depth > 1) {
          chains.push(chain);
        }
      }
    }

    return chains;
  }

  /**
   * Get the props from a component (parameter names)
   */
  private getComponentProps(componentNode: Node): string[] {
    const props: string[] = [];

    // Handle function components
    if (
      Node.isFunctionDeclaration(componentNode) ||
      Node.isArrowFunction(componentNode)
    ) {
      const params = componentNode.getParameters();
      if (params.length > 0) {
        const propsParam = params[0];

        // Handle destructured props: function MyComponent({ prop1, prop2 })
        const binding = propsParam.getNameNode();
        if (Node.isObjectBindingPattern(binding)) {
          const elements = binding.getElements();
          for (const element of elements) {
            const name = element.getName();
            if (name) {
              props.push(name);
            }
          }
        } else {
          // Handle props object: function MyComponent(props)
          const paramName = propsParam.getName();
          if (paramName) {
            // Look for props.propName usage in the component
            const componentText = componentNode.getText();
            const propAccessPattern = new RegExp(
              `${paramName}\\.([a-zA-Z_$][a-zA-Z0-9_$]*)`,
              "g",
            );
            let match;
            while ((match = propAccessPattern.exec(componentText)) !== null) {
              const propName = match[1];
              if (!props.includes(propName)) {
                props.push(propName);
              }
            }
          }
        }
      }
    }

    // Handle variable declarations with arrow functions
    if (Node.isVariableDeclaration(componentNode)) {
      const initializer = componentNode.getInitializer();
      if (initializer && Node.isArrowFunction(initializer)) {
        return this.getComponentProps(initializer);
      }
    }

    return props;
  }

  /**
   * Track a prop through the component hierarchy to detect drilling
   */
  private trackPropThroughHierarchy(
    propName: string,
    currentComponent: string,
    componentNode: Node,
    ast: SourceFile,
    currentDepth: number,
    visitedComponents: Set<string> = new Set(),
  ): PropChain | null {
    // Prevent infinite recursion
    if (visitedComponents.has(currentComponent)) {
      return null;
    }
    visitedComponents.add(currentComponent);

    // Maximum depth to track (prevent excessive recursion)
    if (currentDepth > 10) {
      return null;
    }

    const componentPath = [currentComponent];
    let maxDepth = currentDepth;
    let deepestNode = componentNode;

    // Find JSX elements within this component that pass the prop down
    const jsxElements = this.findJSXElementsInNode(componentNode);

    for (const jsxElement of jsxElements) {
      const childComponentName = this.getJSXElementName(jsxElement);
      if (!childComponentName) continue;

      // Check if this JSX element passes the prop down
      if (this.jsxElementPassesProp(jsxElement, propName)) {
        // Find the child component definition
        const childComponent = this.discoveredComponents.find(
          (comp) => comp.name === childComponentName,
        );

        if (childComponent) {
          // Recursively track the prop in the child component
          const childChain = this.trackPropThroughHierarchy(
            propName,
            childComponentName,
            childComponent.node,
            ast,
            currentDepth + 1,
            new Set(visitedComponents),
          );

          if (childChain && childChain.depth > maxDepth) {
            maxDepth = childChain.depth;
            componentPath.push(...childChain.componentPath);
            deepestNode = childChain.startNode;
          }
        } else {
          // Child component not found in this file, assume it's passed one more level
          componentPath.push(childComponentName);
          maxDepth = currentDepth + 1;
        }
      }
    }

    if (maxDepth > currentDepth) {
      return {
        propName,
        depth: maxDepth,
        componentPath,
        startNode: deepestNode,
      };
    }

    return {
      propName,
      depth: currentDepth,
      componentPath,
      startNode: componentNode,
    };
  }

  /**
   * Find JSX elements within a specific node
   */
  private findJSXElementsInNode(node: Node): Node[] {
    const jsxElements: Node[] = [];

    const traverse = (n: Node) => {
      const kind = n.getKind();

      if (
        kind === SyntaxKind.JsxElement ||
        kind === SyntaxKind.JsxSelfClosingElement
      ) {
        jsxElements.push(n);
      }

      n.forEachChild(traverse);
    };

    traverse(node);
    return jsxElements;
  }

  /**
   * Get the component name from a JSX element
   */
  private getJSXElementName(jsxElement: Node): string | null {
    const text = jsxElement.getText();

    // Match opening tag: <ComponentName or <ComponentName>
    const match = text.match(/^<([A-Z][a-zA-Z0-9]*)/);
    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Check if a JSX element passes a specific prop down
   */
  private jsxElementPassesProp(jsxElement: Node, propName: string): boolean {
    const text = jsxElement.getText();

    // Look for patterns like:
    // - propName={propName}
    // - propName={props.propName}
    // - {...props} (spread operator)
    const patterns = [
      new RegExp(`\\b${propName}=\\{${propName}\\}`), // propName={propName}
      new RegExp(`\\b${propName}=\\{props\\.${propName}\\}`), // propName={props.propName}
      new RegExp(`\\b${propName}=\\{[^}]*${propName}[^}]*\\}`), // propName={...propName...}
      /\{\.\.\.props\}/, // {...props}
      /\{\.\.\.rest\}/, // {...rest}
    ];

    return patterns.some((pattern) => pattern.test(text));
  }

  // ============================================================================
  // Public API for accessing discovered components
  // ============================================================================

  /**
   * Get all discovered components
   */
  public getDiscoveredComponents(): ComponentInfo[] {
    return this.discoveredComponents;
  }

  /**
   * Get components by type
   */
  public getComponentsByType(
    type: "function" | "class" | "arrow",
  ): ComponentInfo[] {
    return this.discoveredComponents.filter((comp) => comp.type === type);
  }

  /**
   * Get exported components
   */
  public getExportedComponents(): ComponentInfo[] {
    return this.discoveredComponents.filter((comp) => comp.isExported);
  }

  /**
   * Get components that use hooks
   */
  public getComponentsUsingHooks(): ComponentInfo[] {
    return this.discoveredComponents.filter((comp) => comp.usesHooks);
  }

  /**
   * Get components that use state
   */
  public getComponentsUsingState(): ComponentInfo[] {
    return this.discoveredComponents.filter((comp) => comp.usesState);
  }

  /**
   * Clear discovered components (useful for testing or re-analysis)
   */
  public clearDiscoveredComponents(): void {
    this.discoveredComponents = [];
  }

  // ============================================================================
  // Task 7.3: Component Pattern Inconsistency Detection
  // ============================================================================

  /**
   * Detect inconsistent component composition patterns
   * Validates Requirements: 6.4
   *
   * Detects:
   * - Inconsistent prop passing patterns (destructuring vs object)
   * - Inconsistent export patterns (default vs named)
   * - Inconsistent component definition styles (function vs arrow)
   * - Inconsistent hook usage patterns
   * - Inconsistent event handler naming
   */
  private detectComponentPatternInconsistencies(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Analyze patterns across all components in the file
    const patterns = this.analyzeComponentPatterns();

    // Detect inconsistent prop patterns
    issues.push(...this.detectInconsistentPropPatterns(file, patterns));

    // Detect inconsistent export patterns
    issues.push(...this.detectInconsistentExportPatterns(file, patterns));

    // Detect inconsistent component definition styles
    issues.push(...this.detectInconsistentDefinitionStyles(file, patterns));

    // Detect inconsistent event handler naming
    issues.push(...this.detectInconsistentEventHandlerNaming(file, ast));

    return issues;
  }

  /**
   * Analyze patterns across all discovered components
   */
  private analyzeComponentPatterns() {
    const patterns = {
      propDestructuring: 0,
      propObject: 0,
      defaultExports: 0,
      namedExports: 0,
      functionDeclarations: 0,
      arrowFunctions: 0,
      usesTypeScript: 0,
      usesJavaScript: 0,
    };

    for (const component of this.discoveredComponents) {
      // Count prop patterns
      if (this.usesPropDestructuring(component.node)) {
        patterns.propDestructuring++;
      } else if (component.hasProps) {
        patterns.propObject++;
      }

      // Count export patterns
      if (this.isDefaultExport(component.node)) {
        patterns.defaultExports++;
      } else if (component.isExported) {
        patterns.namedExports++;
      }

      // Count definition styles
      if (component.type === "function") {
        patterns.functionDeclarations++;
      } else if (component.type === "arrow") {
        patterns.arrowFunctions++;
      }
    }

    return patterns;
  }

  /**
   * Detect inconsistent prop passing patterns
   */
  private detectInconsistentPropPatterns(
    file: FileInfo,
    patterns: any,
  ): Issue[] {
    const issues: Issue[] = [];

    // If both patterns are used, flag inconsistency
    if (patterns.propDestructuring > 0 && patterns.propObject > 0) {
      const total = patterns.propDestructuring + patterns.propObject;
      const destructuringPercent = Math.round(
        (patterns.propDestructuring / total) * 100,
      );

      // Find components using the minority pattern
      for (const component of this.discoveredComponents) {
        const usesDestructuring = this.usesPropDestructuring(component.node);
        const isMinorityPattern =
          (usesDestructuring && destructuringPercent < 50) ||
          (!usesDestructuring &&
            component.hasProps &&
            destructuringPercent >= 50);

        if (isMinorityPattern) {
          const preferredPattern =
            destructuringPercent >= 50 ? "destructuring" : "object";
          const currentPattern = usesDestructuring ? "destructuring" : "object";

          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "low",
              category: "components",
              file: file.relativePath,
              node: component.node,
              description: `Component '${component.name}' uses ${currentPattern} for props, but ${patterns.propDestructuring} components use destructuring and ${patterns.propObject} use object props. This inconsistency makes the codebase harder to understand.`,
              recommendation: `Consider using ${preferredPattern} pattern for props consistently across all components. This improves code readability and maintainability.`,
              estimatedEffort: "trivial",
              tags: [
                "component",
                "inconsistent-pattern",
                "props",
                "code-style",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent export patterns
   */
  private detectInconsistentExportPatterns(
    file: FileInfo,
    patterns: any,
  ): Issue[] {
    const issues: Issue[] = [];

    // If both export patterns are used, flag inconsistency
    if (patterns.defaultExports > 0 && patterns.namedExports > 0) {
      const total = patterns.defaultExports + patterns.namedExports;
      const defaultPercent = Math.round(
        (patterns.defaultExports / total) * 100,
      );

      // Find components using the minority pattern
      for (const component of this.discoveredComponents) {
        const isDefault = this.isDefaultExport(component.node);
        const isMinorityPattern =
          (isDefault && defaultPercent < 50) ||
          (component.isExported && !isDefault && defaultPercent >= 50);

        if (isMinorityPattern) {
          const preferredPattern = defaultPercent >= 50 ? "default" : "named";
          const currentPattern = isDefault ? "default" : "named";

          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "low",
              category: "components",
              file: file.relativePath,
              node: component.node,
              description: `Component '${component.name}' uses ${currentPattern} export, but ${patterns.defaultExports} components use default exports and ${patterns.namedExports} use named exports. This inconsistency can confuse developers.`,
              recommendation: `Consider using ${preferredPattern} exports consistently across all components. This makes imports more predictable and consistent.`,
              estimatedEffort: "trivial",
              tags: [
                "component",
                "inconsistent-pattern",
                "exports",
                "code-style",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent component definition styles
   */
  private detectInconsistentDefinitionStyles(
    file: FileInfo,
    patterns: any,
  ): Issue[] {
    const issues: Issue[] = [];

    // If both function and arrow styles are used, flag inconsistency
    if (patterns.functionDeclarations > 0 && patterns.arrowFunctions > 0) {
      const total = patterns.functionDeclarations + patterns.arrowFunctions;
      const functionPercent = Math.round(
        (patterns.functionDeclarations / total) * 100,
      );

      // Find components using the minority pattern
      for (const component of this.discoveredComponents) {
        if (component.type === "class") continue; // Skip class components

        const isFunction = component.type === "function";
        const isMinorityPattern =
          (isFunction && functionPercent < 50) ||
          (component.type === "arrow" && functionPercent >= 50);

        if (isMinorityPattern) {
          const preferredPattern =
            functionPercent >= 50 ? "function declaration" : "arrow function";
          const currentPattern = isFunction
            ? "function declaration"
            : "arrow function";

          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "low",
              category: "components",
              file: file.relativePath,
              node: component.node,
              description: `Component '${component.name}' is defined as ${currentPattern}, but ${patterns.functionDeclarations} components use function declarations and ${patterns.arrowFunctions} use arrow functions. This inconsistency affects code style uniformity.`,
              recommendation: `Consider using ${preferredPattern} consistently for all function components. This creates a more uniform codebase.`,
              estimatedEffort: "trivial",
              tags: [
                "component",
                "inconsistent-pattern",
                "definition-style",
                "code-style",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Detect inconsistent event handler naming patterns
   */
  private detectInconsistentEventHandlerNaming(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Track event handler naming patterns
    const handlerPatterns = {
      handlePrefix: 0, // handleClick, handleSubmit
      onPrefix: 0, // onClick, onSubmit
      other: 0, // click, submit, doSomething
    };

    const inconsistentHandlers: Array<{
      name: string;
      node: Node;
      pattern: string;
    }> = [];

    for (const component of this.discoveredComponents) {
      const handlers = this.findEventHandlers(component.node);

      for (const handler of handlers) {
        if (handler.name.startsWith("handle")) {
          handlerPatterns.handlePrefix++;
          inconsistentHandlers.push({ ...handler, pattern: "handle" });
        } else if (handler.name.startsWith("on")) {
          handlerPatterns.onPrefix++;
          inconsistentHandlers.push({ ...handler, pattern: "on" });
        } else {
          handlerPatterns.other++;
          inconsistentHandlers.push({ ...handler, pattern: "other" });
        }
      }
    }

    // If multiple patterns are used, flag inconsistency
    const patternsUsed = [
      handlerPatterns.handlePrefix > 0,
      handlerPatterns.onPrefix > 0,
      handlerPatterns.other > 0,
    ].filter(Boolean).length;

    if (patternsUsed > 1) {
      const total =
        handlerPatterns.handlePrefix +
        handlerPatterns.onPrefix +
        handlerPatterns.other;
      const dominantPattern =
        handlerPatterns.handlePrefix > handlerPatterns.onPrefix &&
        handlerPatterns.handlePrefix > handlerPatterns.other
          ? "handle"
          : handlerPatterns.onPrefix > handlerPatterns.other
            ? "on"
            : "other";

      // Flag handlers using minority patterns
      for (const handler of inconsistentHandlers) {
        if (handler.pattern !== dominantPattern) {
          const preferredExample =
            dominantPattern === "handle"
              ? "handleClick"
              : dominantPattern === "on"
                ? "onClick"
                : "descriptive names";

          issues.push(
            this.createIssue({
              type: "inconsistent-pattern",
              severity: "low",
              category: "components",
              file: file.relativePath,
              node: handler.node,
              description: `Event handler '${handler.name}' uses '${handler.pattern}' prefix, but the codebase has ${handlerPatterns.handlePrefix} 'handle' handlers, ${handlerPatterns.onPrefix} 'on' handlers, and ${handlerPatterns.other} other patterns. This inconsistency makes the code less predictable.`,
              recommendation: `Consider using '${dominantPattern}' prefix consistently for event handlers (e.g., ${preferredExample}). This improves code consistency and makes event handlers easier to identify.`,
              estimatedEffort: "trivial",
              tags: [
                "component",
                "inconsistent-pattern",
                "event-handlers",
                "naming",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Find event handler functions in a component
   */
  private findEventHandlers(node: Node): Array<{ name: string; node: Node }> {
    const handlers: Array<{ name: string; node: Node }> = [];
    const text = node.getText();

    // Look for common event handler patterns in JSX
    const eventAttributes = [
      "onClick",
      "onChange",
      "onSubmit",
      "onFocus",
      "onBlur",
      "onKeyDown",
      "onKeyUp",
      "onKeyPress",
      "onMouseEnter",
      "onMouseLeave",
      "onMouseDown",
      "onMouseUp",
      "onInput",
      "onScroll",
      "onLoad",
    ];

    for (const eventAttr of eventAttributes) {
      // Match patterns like onClick={handleClick} or onClick={onClickHandler}
      const pattern = new RegExp(
        `${eventAttr}=\\{([a-zA-Z_$][a-zA-Z0-9_$]*)\\}`,
        "g",
      );
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const handlerName = match[1];

        // Find the actual function definition
        const handlerNode = this.findFunctionByName(node, handlerName);
        if (handlerNode) {
          handlers.push({ name: handlerName, node: handlerNode });
        }
      }
    }

    return handlers;
  }

  /**
   * Find a function definition by name within a node
   */
  private findFunctionByName(node: Node, name: string): Node | null {
    let foundNode: Node | null = null;

    const traverse = (n: Node) => {
      if (foundNode) return;

      // Check function declarations
      if (Node.isFunctionDeclaration(n)) {
        if (n.getName() === name) {
          foundNode = n;
          return;
        }
      }

      // Check variable declarations with arrow functions
      if (Node.isVariableDeclaration(n)) {
        if (this.getNodeName(n) === name) {
          foundNode = n;
          return;
        }
      }

      n.forEachChild(traverse);
    };

    traverse(node);
    return foundNode;
  }

  // ============================================================================
  // Task 7.3: Duplicate Component Logic Detection
  // ============================================================================

  /**
   * Detect duplicate component logic across components
   * Validates Requirements: 6.5
   *
   * Detects:
   * - Duplicate validation logic
   * - Duplicate data transformation logic
   * - Duplicate effect patterns
   * - Duplicate custom hook patterns
   * - Similar component structures
   */
  private detectDuplicateComponentLogic(
    file: FileInfo,
    ast: SourceFile,
  ): Issue[] {
    const issues: Issue[] = [];

    // Detect duplicate validation logic
    issues.push(...this.detectDuplicateValidation(file));

    // Detect duplicate useEffect patterns
    issues.push(...this.detectDuplicateEffects(file));

    // Detect duplicate data transformations
    issues.push(...this.detectDuplicateTransformations(file));

    // Detect similar component structures
    issues.push(...this.detectSimilarComponentStructures(file));

    return issues;
  }

  /**
   * Detect duplicate validation logic across components
   */
  private detectDuplicateValidation(file: FileInfo): Issue[] {
    const issues: Issue[] = [];
    const validationPatterns = new Map<
      string,
      Array<{ component: ComponentInfo; node: Node }>
    >();

    for (const component of this.discoveredComponents) {
      const validations = this.extractValidationLogic(component.node);

      for (const validation of validations) {
        const pattern = this.normalizeCode(validation.code);

        if (!validationPatterns.has(pattern)) {
          validationPatterns.set(pattern, []);
        }

        validationPatterns.get(pattern)!.push({
          component,
          node: validation.node,
        });
      }
    }

    // Flag patterns that appear in multiple components
    for (const [pattern, occurrences] of validationPatterns.entries()) {
      if (occurrences.length > 1) {
        const componentNames = occurrences
          .map((o) => o.component.name)
          .join(", ");

        for (const occurrence of occurrences) {
          issues.push(
            this.createIssue({
              type: "code-duplication",
              severity: "medium",
              category: "components",
              file: file.relativePath,
              node: occurrence.node,
              description: `Duplicate validation logic found in component '${occurrence.component.name}'. This same validation appears in ${occurrences.length} components: ${componentNames}. Duplicated validation logic increases maintenance burden.`,
              recommendation: `Extract this validation logic into a shared utility function or custom hook. This will make the validation logic reusable and easier to maintain. Consider creating a validation utility in a shared location.`,
              estimatedEffort: "small",
              tags: [
                "component",
                "code-duplication",
                "validation",
                "refactoring",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Extract validation logic from a component
   */
  private extractValidationLogic(
    node: Node,
  ): Array<{ code: string; node: Node }> {
    const validations: Array<{ code: string; node: Node }> = [];
    const text = node.getText();

    // Look for common validation patterns
    const validationKeywords = [
      "validate",
      "isValid",
      "check",
      "verify",
      "test",
      "required",
      "optional",
      "min",
      "max",
      "pattern",
      "email",
      "phone",
      "url",
      "number",
      "string",
    ];

    const traverse = (n: Node) => {
      // Look for if statements with validation logic
      if (Node.isIfStatement(n)) {
        const condition = n.getExpression().getText();

        if (
          validationKeywords.some((keyword) =>
            condition.toLowerCase().includes(keyword),
          )
        ) {
          validations.push({
            code: n.getText(),
            node: n,
          });
        }
      }

      // Look for validation functions
      if (Node.isFunctionDeclaration(n) || Node.isArrowFunction(n)) {
        const funcText = n.getText();
        const funcName = Node.isFunctionDeclaration(n) ? n.getName() : "";

        if (
          validationKeywords.some(
            (keyword) =>
              funcName?.toLowerCase().includes(keyword) ||
              funcText.toLowerCase().includes(keyword),
          )
        ) {
          validations.push({
            code: funcText,
            node: n,
          });
        }
      }

      n.forEachChild(traverse);
    };

    traverse(node);
    return validations;
  }

  /**
   * Detect duplicate useEffect patterns
   */
  private detectDuplicateEffects(file: FileInfo): Issue[] {
    const issues: Issue[] = [];
    const effectPatterns = new Map<
      string,
      Array<{ component: ComponentInfo; node: Node }>
    >();

    for (const component of this.discoveredComponents) {
      const effects = this.extractEffects(component.node);

      for (const effect of effects) {
        const pattern = this.normalizeCode(effect.code);

        if (!effectPatterns.has(pattern)) {
          effectPatterns.set(pattern, []);
        }

        effectPatterns.get(pattern)!.push({
          component,
          node: effect.node,
        });
      }
    }

    // Flag patterns that appear in multiple components
    for (const [pattern, occurrences] of effectPatterns.entries()) {
      if (occurrences.length > 1) {
        const componentNames = occurrences
          .map((o) => o.component.name)
          .join(", ");

        for (const occurrence of occurrences) {
          issues.push(
            this.createIssue({
              type: "code-duplication",
              severity: "medium",
              category: "components",
              file: file.relativePath,
              node: occurrence.node,
              description: `Duplicate useEffect logic found in component '${occurrence.component.name}'. This same effect appears in ${occurrences.length} components: ${componentNames}. Duplicated effects increase maintenance burden.`,
              recommendation: `Extract this effect logic into a custom hook. This will make the effect reusable and easier to maintain. Consider creating a custom hook like 'use[DescriptiveName]' in a shared hooks directory.`,
              estimatedEffort: "small",
              tags: [
                "component",
                "code-duplication",
                "hooks",
                "useEffect",
                "refactoring",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Extract useEffect calls from a component
   */
  private extractEffects(node: Node): Array<{ code: string; node: Node }> {
    const effects: Array<{ code: string; node: Node }> = [];
    const text = node.getText();

    // Find useEffect calls
    const effectPattern = /useEffect\s*\(/g;
    let match;

    while ((match = effectPattern.exec(text)) !== null) {
      // Try to find the actual call expression node
      const traverse = (n: Node) => {
        if (Node.isCallExpression(n)) {
          const expr = n.getExpression();
          if (expr.getText() === "useEffect") {
            effects.push({
              code: n.getText(),
              node: n,
            });
          }
        }
        n.forEachChild(traverse);
      };

      traverse(node);
    }

    return effects;
  }

  /**
   * Detect duplicate data transformation logic
   */
  private detectDuplicateTransformations(file: FileInfo): Issue[] {
    const issues: Issue[] = [];
    const transformPatterns = new Map<
      string,
      Array<{ component: ComponentInfo; node: Node }>
    >();

    for (const component of this.discoveredComponents) {
      const transforms = this.extractTransformations(component.node);

      for (const transform of transforms) {
        const pattern = this.normalizeCode(transform.code);

        if (!transformPatterns.has(pattern)) {
          transformPatterns.set(pattern, []);
        }

        transformPatterns.get(pattern)!.push({
          component,
          node: transform.node,
        });
      }
    }

    // Flag patterns that appear in multiple components
    for (const [pattern, occurrences] of transformPatterns.entries()) {
      if (occurrences.length > 1) {
        const componentNames = occurrences
          .map((o) => o.component.name)
          .join(", ");

        for (const occurrence of occurrences) {
          issues.push(
            this.createIssue({
              type: "code-duplication",
              severity: "medium",
              category: "components",
              file: file.relativePath,
              node: occurrence.node,
              description: `Duplicate data transformation logic found in component '${occurrence.component.name}'. This same transformation appears in ${occurrences.length} components: ${componentNames}. Duplicated transformations increase maintenance burden.`,
              recommendation: `Extract this transformation logic into a shared utility function. This will make the transformation reusable and easier to maintain. Consider creating a utility function in a shared location.`,
              estimatedEffort: "small",
              tags: [
                "component",
                "code-duplication",
                "transformation",
                "refactoring",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Extract data transformation logic from a component
   */
  private extractTransformations(
    node: Node,
  ): Array<{ code: string; node: Node }> {
    const transformations: Array<{ code: string; node: Node }> = [];

    const traverse = (n: Node) => {
      // Look for array methods (map, filter, reduce, etc.)
      if (Node.isCallExpression(n)) {
        const expr = n.getExpression();
        const exprText = expr.getText();

        if (
          exprText.endsWith(".map") ||
          exprText.endsWith(".filter") ||
          exprText.endsWith(".reduce") ||
          exprText.endsWith(".sort") ||
          exprText.endsWith(".find") ||
          exprText.endsWith(".findIndex")
        ) {
          transformations.push({
            code: n.getText(),
            node: n,
          });
        }
      }

      n.forEachChild(traverse);
    };

    traverse(node);
    return transformations;
  }

  /**
   * Detect similar component structures (potential for abstraction)
   */
  private detectSimilarComponentStructures(file: FileInfo): Issue[] {
    const issues: Issue[] = [];

    // Compare components pairwise for structural similarity
    for (let i = 0; i < this.discoveredComponents.length; i++) {
      for (let j = i + 1; j < this.discoveredComponents.length; j++) {
        const comp1 = this.discoveredComponents[i];
        const comp2 = this.discoveredComponents[j];

        const similarity = this.calculateStructuralSimilarity(comp1, comp2);

        // If components are very similar (>70% similar), flag for potential abstraction
        if (similarity > 0.7) {
          issues.push(
            this.createIssue({
              type: "code-duplication",
              severity: "medium",
              category: "components",
              file: file.relativePath,
              node: comp1.node,
              description: `Components '${comp1.name}' and '${comp2.name}' have very similar structures (${Math.round(similarity * 100)}% similar). This suggests they could be abstracted into a single reusable component.`,
              recommendation: `Consider creating a single component that accepts configuration props to handle both use cases. This reduces code duplication and makes the codebase more maintainable. Look for common patterns and extract them into a shared component.`,
              estimatedEffort: "medium",
              tags: [
                "component",
                "code-duplication",
                "abstraction",
                "refactoring",
              ],
            }),
          );
        }
      }
    }

    return issues;
  }

  /**
   * Calculate structural similarity between two components
   */
  private calculateStructuralSimilarity(
    comp1: ComponentInfo,
    comp2: ComponentInfo,
  ): number {
    let similarityScore = 0;
    let totalChecks = 0;

    // Compare component types
    totalChecks++;
    if (comp1.type === comp2.type) {
      similarityScore++;
    }

    // Compare hook usage
    totalChecks++;
    if (comp1.usesHooks === comp2.usesHooks) {
      similarityScore++;
    }

    // Compare state usage
    totalChecks++;
    if (comp1.usesState === comp2.usesState) {
      similarityScore++;
    }

    // Compare props usage
    totalChecks++;
    if (comp1.hasProps === comp2.hasProps) {
      similarityScore++;
    }

    // Compare code structure (simplified - count similar patterns)
    const text1 = comp1.node.getText();
    const text2 = comp2.node.getText();

    // Count common patterns
    const patterns = [
      /useEffect/g,
      /useState/g,
      /useCallback/g,
      /useMemo/g,
      /return\s*\(/g,
      /onClick/g,
      /onChange/g,
      /className/g,
    ];

    for (const pattern of patterns) {
      totalChecks++;
      const count1 = (text1.match(pattern) || []).length;
      const count2 = (text2.match(pattern) || []).length;

      if (count1 > 0 && count2 > 0) {
        // Both use this pattern
        const ratio = Math.min(count1, count2) / Math.max(count1, count2);
        similarityScore += ratio;
      }
    }

    return similarityScore / totalChecks;
  }

  /**
   * Normalize code for comparison (remove whitespace, comments, etc.)
   */
  private normalizeCode(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*/g, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  // ============================================================================
  // Helper Methods for Pattern Detection
  // ============================================================================

  /**
   * Check if a component uses prop destructuring
   */
  private usesPropDestructuring(node: Node): boolean {
    if (Node.isFunctionDeclaration(node) || Node.isArrowFunction(node)) {
      const params = node.getParameters();
      if (params.length > 0) {
        const binding = params[0].getNameNode();
        return Node.isObjectBindingPattern(binding);
      }
    }

    if (Node.isVariableDeclaration(node)) {
      const initializer = node.getInitializer();
      if (initializer && Node.isArrowFunction(initializer)) {
        return this.usesPropDestructuring(initializer);
      }
    }

    return false;
  }

  /**
   * Check if a component uses default export
   */
  private isDefaultExport(node: Node): boolean {
    const parent = node.getParent();

    // Check if this is a default export declaration
    if (parent && Node.isExportAssignment(parent)) {
      return true;
    }

    // Check if there's a separate default export statement
    const sourceFile = node.getSourceFile();
    const defaultExports = sourceFile.getExportAssignments();

    for (const exportAssignment of defaultExports) {
      const expr = exportAssignment.getExpression();
      const nodeName = this.getNodeName(node);

      if (nodeName && expr.getText() === nodeName) {
        return true;
      }
    }

    // Check for "export default" syntax
    const text = node.getText();
    const fullText = node.getFullText();

    return (
      fullText.includes("export default") || text.startsWith("export default")
    );
  }
}
