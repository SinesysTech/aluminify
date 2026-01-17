/**
 * Test export detection for variable declarations
 */

import { Project, SyntaxKind } from 'ts-morph';

async function testExportDetection() {
  console.log('Testing Export Detection...\n');

  const project = new Project();
  
  const code = `
    export const passthrough = (req: Request, res: Response, next: NextFunction) => next();
    export const noop = (req: any, res: any, next: any) => next();
    const notExported = () => {};
  `;

  const sourceFile = project.createSourceFile('test.ts', code);
  
  const varDecls = sourceFile.getVariableDeclarations();
  
  console.log('Variable declarations found:');
  varDecls.forEach(varDecl => {
    const name = varDecl.getName();
    console.log(`\n  Variable: ${name}`);
    
    // Check modifiers on the variable declaration itself
    const declModifiers = (varDecl as any).getModifiers?.() || [];
    console.log(`    Modifiers on declaration: ${declModifiers.length}`);
    
    // Check modifiers on the parent variable statement
    const parent = varDecl.getParent();
    console.log(`    Parent type: ${parent.getKindName()}`);
    
    const parentParent = parent.getParent();
    console.log(`    Parent's parent type: ${parentParent?.getKindName()}`);
    
    if (parentParent && (parentParent as any).getModifiers) {
      const parentModifiers = (parentParent as any).getModifiers();
      console.log(`    Modifiers on parent's parent: ${parentModifiers.length}`);
      const hasExport = parentModifiers.some((mod: any) => 
        mod.getKind() === SyntaxKind.ExportKeyword
      );
      console.log(`    Has export keyword: ${hasExport}`);
    }
  });
}

testExportDetection().catch(console.error);
