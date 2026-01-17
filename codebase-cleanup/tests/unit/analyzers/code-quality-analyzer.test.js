/**
 * Unit tests for CodeQualityAnalyzer
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeQualityAnalyzer } from '../../../src/analyzers/code-quality-analyzer';
import { ASTParser } from '../../../src/utils/ast-parser';
describe('CodeQualityAnalyzer', () => {
    let analyzer;
    let parser;
    beforeEach(() => {
        analyzer = new CodeQualityAnalyzer();
        parser = new ASTParser();
    });
    afterEach(() => {
        parser.clearAll();
    });
    const createFileInfo = (name, code) => ({
        path: `/test/${name}.ts`,
        relativePath: `test/${name}.ts`,
        extension: '.ts',
        size: code.length,
        category: 'other',
        lastModified: new Date(),
    });
    describe('Deeply Nested Conditionals Detection', () => {
        it('should detect deeply nested conditionals (>3 levels)', async () => {
            const code = `
function checkPermissions(user: any) {
  if (user) {
    if (user.role) {
      if (user.role === 'admin') {
        if (user.permissions) {
          if (user.permissions.includes('delete')) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
      `;
            const ast = parser.parseContent(code, 'test-nested.ts');
            const fileInfo = createFileInfo('test-nested', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            expect(issues.length).toBeGreaterThan(0);
            const nestedIssue = issues.find(i => i.tags.includes('nested-conditionals'));
            expect(nestedIssue).toBeDefined();
            expect(nestedIssue?.type).toBe('confusing-logic');
            expect(nestedIssue?.severity).toBe('medium');
            expect(nestedIssue?.description).toContain('nested conditional');
        });
        it('should not flag conditionals at 3 levels or less', async () => {
            const code = `
function checkUser(user: any) {
  if (user) {
    if (user.active) {
      if (user.verified) {
        return true;
      }
    }
  }
  return false;
}
      `;
            const ast = parser.parseContent(code, 'test-ok-nesting.ts');
            const fileInfo = createFileInfo('test-ok-nesting', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const nestedIssue = issues.find(i => i.tags.includes('nested-conditionals'));
            expect(nestedIssue).toBeUndefined();
        });
    });
    describe('Complex Boolean Expressions Detection', () => {
        it('should detect complex boolean expressions (>3 operators)', async () => {
            const code = `
function validateUser(user: any) {
  if (user && user.active && user.verified && user.role === 'admin' && user.permissions.length > 0) {
    return true;
  }
  return false;
}
      `;
            const ast = parser.parseContent(code, 'test-complex-bool.ts');
            const fileInfo = createFileInfo('test-complex-bool', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            expect(issues.length).toBeGreaterThan(0);
            const booleanIssue = issues.find(i => i.tags.includes('complex-boolean'));
            expect(booleanIssue).toBeDefined();
            expect(booleanIssue?.type).toBe('confusing-logic');
            expect(booleanIssue?.description).toContain('boolean expression');
        });
        it('should not flag simple boolean expressions', async () => {
            const code = `
function isValid(user: any) {
  if (user && user.active && user.verified) {
    return true;
  }
  return false;
}
      `;
            const ast = parser.parseContent(code, 'test-simple-bool.ts');
            const fileInfo = createFileInfo('test-simple-bool', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const booleanIssue = issues.find(i => i.tags.includes('complex-boolean'));
            expect(booleanIssue).toBeUndefined();
        });
    });
    describe('Multiple Returns Detection', () => {
        it('should detect multiple returns in complex functions', async () => {
            const code = `
function processData(data: any) {
  if (!data) return null;
  if (data.type === 'A') return processTypeA(data);
  if (data.type === 'B') return processTypeB(data);
  if (data.type === 'C') return processTypeC(data);
  if (data.type === 'D') return processTypeD(data);
  
  for (let i = 0; i < data.items.length; i++) {
    if (data.items[i].valid) {
      return data.items[i];
    }
  }
  
  return null;
}

function processTypeA(data: any) { return data; }
function processTypeB(data: any) { return data; }
function processTypeC(data: any) { return data; }
function processTypeD(data: any) { return data; }
      `;
            const ast = parser.parseContent(code, 'test-multiple-returns.ts');
            const fileInfo = createFileInfo('test-multiple-returns', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const returnIssue = issues.find(i => i.tags.includes('multiple-returns'));
            expect(returnIssue).toBeDefined();
            expect(returnIssue?.type).toBe('confusing-logic');
            expect(returnIssue?.description).toContain('return statements');
        });
        it('should not flag simple functions with few returns', async () => {
            const code = `
function calculate(x: number) {
  if (x < 0) return 0;
  return x * 2;
}
      `;
            const ast = parser.parseContent(code, 'test-simple-returns.ts');
            const fileInfo = createFileInfo('test-simple-returns', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const returnIssue = issues.find(i => i.tags.includes('multiple-returns'));
            expect(returnIssue).toBeUndefined();
        });
    });
    describe('Deeply Nested Loops Detection', () => {
        it('should detect deeply nested loops (>2 levels)', async () => {
            const code = `
function processMatrix(matrix: number[][][]) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      for (let k = 0; k < matrix[i][j].length; k++) {
        console.log(matrix[i][j][k]);
      }
    }
  }
}
      `;
            const ast = parser.parseContent(code, 'test-nested-loops.ts');
            const fileInfo = createFileInfo('test-nested-loops', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const loopIssue = issues.find(i => i.tags.includes('nested-loops'));
            expect(loopIssue).toBeDefined();
            expect(loopIssue?.type).toBe('confusing-logic');
            expect(loopIssue?.severity).toBe('medium');
            expect(loopIssue?.description).toContain('nested loop');
        });
        it('should not flag loops at 2 levels or less', async () => {
            const code = `
function processArray(arr: number[][]) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      console.log(arr[i][j]);
    }
  }
}
      `;
            const ast = parser.parseContent(code, 'test-ok-loops.ts');
            const fileInfo = createFileInfo('test-ok-loops', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const loopIssue = issues.find(i => i.tags.includes('nested-loops'));
            expect(loopIssue).toBeUndefined();
        });
    });
    describe('Switch Fall-Through Detection', () => {
        it('should detect switch statements with fall-through', async () => {
            const code = `
function handleAction(action: string) {
  switch (action) {
    case 'start':
      console.log('Starting...');
      // Missing break - falls through!
    case 'continue':
      console.log('Continuing...');
      break;
    case 'stop':
      console.log('Stopping...');
      break;
  }
}
      `;
            const ast = parser.parseContent(code, 'test-fall-through.ts');
            const fileInfo = createFileInfo('test-fall-through', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const switchIssue = issues.find(i => i.tags.includes('switch-fall-through'));
            expect(switchIssue).toBeDefined();
            expect(switchIssue?.type).toBe('confusing-logic');
            expect(switchIssue?.description).toContain('fall-through');
        });
        it('should not flag switch statements with proper breaks', async () => {
            const code = `
function handleAction(action: string) {
  switch (action) {
    case 'start':
      console.log('Starting...');
      break;
    case 'continue':
      console.log('Continuing...');
      break;
    case 'stop':
      console.log('Stopping...');
      break;
  }
}
      `;
            const ast = parser.parseContent(code, 'test-proper-switch.ts');
            const fileInfo = createFileInfo('test-proper-switch', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            const switchIssue = issues.find(i => i.tags.includes('switch-fall-through'));
            expect(switchIssue).toBeUndefined();
        });
    });
    describe('Clean Code', () => {
        it('should not flag clean, well-written code', async () => {
            const code = `
function calculateTotal(items: any[]) {
  if (!items || items.length === 0) {
    return 0;
  }
  
  return items.reduce((sum, item) => sum + item.price, 0);
}

function isValidUser(user: any) {
  return user && user.active && user.verified;
}
      `;
            const ast = parser.parseContent(code, 'test-clean-code.ts');
            const fileInfo = createFileInfo('test-clean-code', code);
            const issues = await analyzer.analyze(fileInfo, ast);
            expect(issues.length).toBe(0);
        });
    });
    describe('Analyzer Metadata', () => {
        it('should have correct name', () => {
            expect(analyzer.name).toBe('CodeQualityAnalyzer');
        });
        it('should support appropriate file types', () => {
            const supportedTypes = analyzer.getSupportedFileTypes();
            expect(supportedTypes).toContain('component');
            expect(supportedTypes).toContain('api-route');
            expect(supportedTypes).toContain('service');
            expect(supportedTypes).toContain('util');
            expect(supportedTypes).toContain('middleware');
            expect(supportedTypes).toContain('other');
        });
    });
});
//# sourceMappingURL=code-quality-analyzer.test.js.map