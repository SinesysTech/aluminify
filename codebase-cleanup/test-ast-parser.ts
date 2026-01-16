/**
 * Quick manual test for AST parser utilities
 */

import { ASTParser, ASTQueryHelper } from './src/utils/ast-parser';
import type { FileInfo } from './src/types';

async function testASTParser() {
  console.log('Testing AST Parser...\n');

  const parser = new ASTParser();

  // Test parsing content
  const testCode = `
    import { useState } from 'react';
    
    interface User {
      id: string;
      name: string;
    }
    
    type UserRole = 'admin' | 'user';
    
    function greet(name: string): string {
      return \`Hello, \${name}!\`;
    }
    
    const add = (a: number, b: number) => a + b;
    
    class UserService {
      getUser(id: string) {
        return { id, name: 'Test' };
      }
    }
    
    // This is commented out code
    // function oldFunction() {
    //   const x = 1;
    //   return x;
    // }
    
    export default function Component() {
      const [count, setCount] = useState(0);
      
      if (count > 10) {
        if (count > 20) {
          console.log('High count');
        }
      }
      
      return <div>{count}</div>;
    }
  `;

  try {
    // Parse the test code
    const ast = parser.parseContent(testCode, 'test.tsx');
    console.log('✓ Successfully parsed test code');

    // Test query helpers
    const functions = ASTQueryHelper.findFunctions(ast);
    console.log(`✓ Found ${functions.length} function declarations`);

    const arrowFunctions = ASTQueryHelper.findArrowFunctions(ast);
    console.log(`✓ Found ${arrowFunctions.length} arrow functions`);

    const classes = ASTQueryHelper.findClasses(ast);
    console.log(`✓ Found ${classes.length} class declarations`);

    const interfaces = ASTQueryHelper.findInterfaces(ast);
    console.log(`✓ Found ${interfaces.length} interface declarations`);

    const typeAliases = ASTQueryHelper.findTypeAliases(ast);
    console.log(`✓ Found ${typeAliases.length} type aliases`);

    const imports = ASTQueryHelper.findImports(ast);
    console.log(`✓ Found ${imports.length} import declarations`);

    const ifStatements = ASTQueryHelper.findIfStatements(ast);
    console.log(`✓ Found ${ifStatements.length} if statements`);

    const jsxElements = ASTQueryHelper.findJSXElements(ast);
    console.log(`✓ Found ${jsxElements.length} JSX elements`);

    const reactComponents = ASTQueryHelper.findReactComponents(ast);
    console.log(`✓ Found ${reactComponents.length} React components`);

    const commentedCode = ASTQueryHelper.findCommentedCode(ast);
    console.log(`✓ Found ${commentedCode.length} commented code blocks`);

    // Test complexity calculation
    const allFunctions = ASTQueryHelper.findAllFunctions(ast);
    if (allFunctions.length > 0) {
      const complexity = ASTQueryHelper.calculateComplexity(allFunctions[0]);
      console.log(`✓ Calculated complexity: ${complexity}`);
    }

    // Test nesting depth
    if (ifStatements.length > 0) {
      const depth = ASTQueryHelper.calculateNestingDepth(ifStatements[0]);
      console.log(`✓ Calculated nesting depth: ${depth}`);
    }

    console.log('\n✅ All AST parser tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testASTParser();
