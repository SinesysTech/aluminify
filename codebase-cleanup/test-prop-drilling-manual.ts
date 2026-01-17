/**
 * Manual test for prop drilling detection
 * Run with: npx ts-node test-prop-drilling-manual.ts
 */

import { Project } from 'ts-morph';
import { ComponentPatternAnalyzer } from './src/analyzers/component-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

async function testPropDrilling() {
  console.log('Testing Prop Drilling Detection...\n');

  const analyzer = new ComponentPatternAnalyzer();
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsx: 1, // JSX preserve mode
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  // Test case 1: Prop drilling exceeding 3 levels (should flag)
  console.log('Test 1: Prop drilling exceeding 3 levels');
  const code1 = `
    function GrandParent({ data }) {
      return <Parent data={data} />;
    }
    
    function Parent({ data }) {
      return <Child data={data} />;
    }
    
    function Child({ data }) {
      return <GrandChild data={data} />;
    }
    
    function GrandChild({ data }) {
      return <div>{data}</div>;
    }
  `;

  const ast1 = project.createSourceFile('test1.tsx', code1, { overwrite: true });
  const fileInfo1: FileInfo = {
    path: '/test/test1.tsx',
    relativePath: 'test1.tsx',
    extension: '.tsx',
    size: 1000,
    category: 'component',
    lastModified: new Date(),
  };

  analyzer.clearDiscoveredComponents();
  const issues1 = await analyzer.analyze(fileInfo1, ast1);
  const propDrillingIssues1 = issues1.filter(issue => issue.tags.includes('prop-drilling'));
  
  console.log(`  Components discovered: ${analyzer.getDiscoveredComponents().length}`);
  console.log(`  Total issues: ${issues1.length}`);
  console.log(`  Prop drilling issues: ${propDrillingIssues1.length}`);
  
  if (propDrillingIssues1.length > 0) {
    console.log(`  ✓ PASS: Detected prop drilling`);
    console.log(`  Issue: ${propDrillingIssues1[0].description}`);
  } else {
    console.log(`  ✗ FAIL: Should have detected prop drilling`);
  }
  console.log();

  // Test case 2: Prop drilling at 3 levels (should NOT flag)
  console.log('Test 2: Prop drilling at exactly 3 levels (acceptable)');
  const code2 = `
    function Parent({ data }) {
      return <Child data={data} />;
    }
    
    function Child({ data }) {
      return <GrandChild data={data} />;
    }
    
    function GrandChild({ data }) {
      return <div>{data}</div>;
    }
  `;

  const ast2 = project.createSourceFile('test2.tsx', code2, { overwrite: true });
  const fileInfo2: FileInfo = {
    path: '/test/test2.tsx',
    relativePath: 'test2.tsx',
    extension: '.tsx',
    size: 1000,
    category: 'component',
    lastModified: new Date(),
  };

  analyzer.clearDiscoveredComponents();
  const issues2 = await analyzer.analyze(fileInfo2, ast2);
  const propDrillingIssues2 = issues2.filter(issue => issue.tags.includes('prop-drilling'));
  
  console.log(`  Components discovered: ${analyzer.getDiscoveredComponents().length}`);
  console.log(`  Total issues: ${issues2.length}`);
  console.log(`  Prop drilling issues: ${propDrillingIssues2.length}`);
  
  if (propDrillingIssues2.length === 0) {
    console.log(`  ✓ PASS: Did not flag acceptable prop passing`);
  } else {
    console.log(`  ✗ FAIL: Should not flag 3 levels or less`);
  }
  console.log();

  // Test case 3: No prop drilling (independent components)
  console.log('Test 3: Independent components (no prop drilling)');
  const code3 = `
    function ComponentA() {
      return <div>A</div>;
    }
    
    function ComponentB() {
      return <div>B</div>;
    }
    
    function ComponentC() {
      return <div>C</div>;
    }
  `;

  const ast3 = project.createSourceFile('test3.tsx', code3, { overwrite: true });
  const fileInfo3: FileInfo = {
    path: '/test/test3.tsx',
    relativePath: 'test3.tsx',
    extension: '.tsx',
    size: 1000,
    category: 'component',
    lastModified: new Date(),
  };

  analyzer.clearDiscoveredComponents();
  const issues3 = await analyzer.analyze(fileInfo3, ast3);
  const propDrillingIssues3 = issues3.filter(issue => issue.tags.includes('prop-drilling'));
  
  console.log(`  Components discovered: ${analyzer.getDiscoveredComponents().length}`);
  console.log(`  Total issues: ${issues3.length}`);
  console.log(`  Prop drilling issues: ${propDrillingIssues3.length}`);
  
  if (propDrillingIssues3.length === 0) {
    console.log(`  ✓ PASS: No prop drilling detected in independent components`);
  } else {
    console.log(`  ✗ FAIL: Should not detect prop drilling in independent components`);
  }
  console.log();

  // Test case 4: Arrow function components with prop drilling
  console.log('Test 4: Arrow function components with prop drilling');
  const code4 = `
    const A = ({ value }) => <B value={value} />;
    const B = ({ value }) => <C value={value} />;
    const C = ({ value }) => <D value={value} />;
    const D = ({ value }) => <div>{value}</div>;
  `;

  const ast4 = project.createSourceFile('test4.tsx', code4, { overwrite: true });
  const fileInfo4: FileInfo = {
    path: '/test/test4.tsx',
    relativePath: 'test4.tsx',
    extension: '.tsx',
    size: 1000,
    category: 'component',
    lastModified: new Date(),
  };

  analyzer.clearDiscoveredComponents();
  const issues4 = await analyzer.analyze(fileInfo4, ast4);
  const propDrillingIssues4 = issues4.filter(issue => issue.tags.includes('prop-drilling'));
  
  console.log(`  Components discovered: ${analyzer.getDiscoveredComponents().length}`);
  console.log(`  Total issues: ${issues4.length}`);
  console.log(`  Prop drilling issues: ${propDrillingIssues4.length}`);
  
  if (propDrillingIssues4.length > 0) {
    console.log(`  ✓ PASS: Detected prop drilling in arrow functions`);
  } else {
    console.log(`  ✗ FAIL: Should detect prop drilling in arrow functions`);
  }
  console.log();

  console.log('='.repeat(60));
  console.log('Manual Test Complete!');
  console.log('='.repeat(60));
}

testPropDrilling().catch(console.error);
