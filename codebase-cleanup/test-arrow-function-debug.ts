/**
 * Debug test for arrow function detection
 */

import { Project, Node, VariableDeclaration } from 'ts-morph';
import { AdapterPatternAnalyzer } from './src/analyzers/adapter-pattern-analyzer';
import type { FileInfo } from './src/types';

function createFileInfo(path: string): FileInfo {
  return {
    path: `/test/${path}`,
    relativePath: path,
    extension: '.ts',
    size: 1000,
    category: 'util',
  };
}

async function testArrowFunctions() {
  console.log('Testing arrow function detection...\n');

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99,
      module: 99,
    },
  });

  const code = `
    const fetchUser = (userId: string) => database.getUser(userId);
    
    const checkAuth = (userId: string) => supabase.auth.getUser(userId);
    
    const verifyUser = (id: string) => authService.verify(id);
  `;

  const sourceFile = project.createSourceFile('test.ts', code);
  
  // Check what functions are found
  console.log('Functions found in AST:');
  const functions = sourceFile.getFunctions();
  console.log(`  Regular functions: ${functions.length}`);
  
  const arrowFunctions: Node[] = [];
  sourceFile.forEachDescendant((node) => {
    if (node.getKindName() === 'ArrowFunction') {
      arrowFunctions.push(node);
      const parent = node.getParent();
      console.log(`  Arrow function found, parent: ${parent?.getKindName()}`);
      if (parent && Node.isVariableDeclaration(parent)) {
        console.log(`    Variable name: ${(parent as VariableDeclaration).getName()}`);
      }
    }
  });
  console.log(`  Arrow functions: ${arrowFunctions.length}\n`);

  const analyzer = new AdapterPatternAnalyzer();
  const issues = await analyzer.analyze(createFileInfo('test.ts'), sourceFile);
  
  console.log(`Issues found: ${issues.length}`);
  issues.forEach(issue => {
    console.log(`  - ${issue.description}`);
  });
}

testArrowFunctions().catch(console.error);
