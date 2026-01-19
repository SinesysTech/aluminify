/**
 * Detailed debug test for arrow function detection
 */

import { Project, Node, ArrowFunction, Statement } from 'ts-morph';

async function testArrowFunctionAnalysis() {
  console.log('Detailed arrow function analysis...\n');

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99,
      module: 99,
    },
  });

  const code = `
    const fetchUser = (userId: string) => database.getUser(userId);
  `;

  const sourceFile = project.createSourceFile('test.ts', code);
  
  // Find the arrow function
  let arrowFunc: ArrowFunction | null = null;
  sourceFile.forEachDescendant((node) => {
    if (Node.isArrowFunction(node)) {
      arrowFunc = node;
    }
  });

  if (!arrowFunc) {
    console.log('No arrow function found!');
    return;
  }

  console.log('Arrow function found!');
  console.log('Full text:', arrowFunc.getText());
  
  const body = arrowFunc.getBody();
  console.log('\nBody kind:', body.getKindName());
  console.log('Body text:', body.getText());
  console.log('Body is Block?', Node.isBlock(body));
  console.log('Body is CallExpression?', Node.isCallExpression(body));
  
  // Check if body is a call expression
  if (Node.isCallExpression(body)) {
    console.log('\n✓ Body is a call expression (expression body)');
    console.log('Call text:', body.getText());
    
    const expression = body.getExpression();
    console.log('Expression:', expression.getText());
  }
  
  // Get statements
  let statements: (Statement | Node)[] = [];
  if (Node.isBlock(body)) {
    statements = body.getStatements();
    console.log('\nStatements in block:', statements.length);
  } else {
    statements = [body];
    console.log('\nExpression body (single statement)');
  }
  
  console.log('Statement count:', statements.length);
  statements.forEach((stmt, i) => {
    console.log(`  Statement ${i}: ${stmt.getKindName()} - ${stmt.getText().substring(0, 50)}`);
  });
  
  // Get call expressions
  const callExpressions: Node[] = [];
  body.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      callExpressions.push(node);
    }
  });
  
  console.log('\nCall expressions found:', callExpressions.length);
  callExpressions.forEach((call, i) => {
    console.log(`  Call ${i}: ${call.getText()}`);
  });
  
  // Get parameters
  const params = arrowFunc.getParameters();
  console.log('\nParameters:', params.length);
  params.forEach((param) => {
    console.log(`  - ${param.getName()}`);
  });
}

testArrowFunctionAnalysis().catch(console.error);
