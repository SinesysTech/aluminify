/**
 * Manual test script for ComponentPatternAnalyzer
 * Run with: npx tsx test-component-analyzer-manual.ts
 */

import { Project } from 'ts-morph';
import { ComponentPatternAnalyzer } from './src/analyzers/component-pattern-analyzer';
import type { FileInfo } from './src/types';

async function testComponentAnalyzer() {
  console.log('🧪 Testing ComponentPatternAnalyzer...\n');

  const analyzer = new ComponentPatternAnalyzer();
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsx: 1, // JSX preserve mode
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  // Test 1: Function Component
  console.log('Test 1: Function Component Discovery');
  const code1 = `
    function MyComponent() {
      return <div>Hello World</div>;
    }
  `;
  const ast1 = project.createSourceFile('test1.tsx', code1);
  const fileInfo1: FileInfo = {
    path: '/test/test1.tsx',
    relativePath: 'test1.tsx',
    extension: '.tsx',
    size: code1.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  await analyzer.analyze(fileInfo1, ast1);
  const components1 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components1.length} component(s)`);
  if (components1.length > 0) {
    console.log(`  - ${components1[0].name} (type: ${components1[0].type})`);
  }
  console.log();

  // Test 2: Arrow Function Component
  console.log('Test 2: Arrow Function Component Discovery');
  const code2 = `
    const Card = () => {
      return <div className="card">Card Content</div>;
    };
  `;
  const ast2 = project.createSourceFile('test2.tsx', code2, { overwrite: true });
  const fileInfo2: FileInfo = {
    path: '/test/test2.tsx',
    relativePath: 'test2.tsx',
    extension: '.tsx',
    size: code2.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  await analyzer.analyze(fileInfo2, ast2);
  const components2 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components2.length} component(s)`);
  if (components2.length > 0) {
    console.log(`  - ${components2[0].name} (type: ${components2[0].type})`);
  }
  console.log();

  // Test 3: Class Component
  console.log('Test 3: Class Component Discovery');
  const code3 = `
    class MyClassComponent extends React.Component {
      render() {
        return <div>Class Component</div>;
      }
    }
  `;
  const ast3 = project.createSourceFile('test3.tsx', code3, { overwrite: true });
  const fileInfo3: FileInfo = {
    path: '/test/test3.tsx',
    relativePath: 'test3.tsx',
    extension: '.tsx',
    size: code3.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  const issues3 = await analyzer.analyze(fileInfo3, ast3);
  const components3 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components3.length} component(s)`);
  if (components3.length > 0) {
    console.log(`  - ${components3[0].name} (type: ${components3[0].type})`);
  }
  console.log(`✓ Found ${issues3.length} issue(s) (class components flagged as legacy)`);
  console.log();

  // Test 4: Component with Hooks
  console.log('Test 4: Component with Hooks');
  const code4 = `
    function Counter() {
      const [count, setCount] = useState(0);
      useEffect(() => {
        console.log('Count changed');
      }, [count]);
      return <div>{count}</div>;
    }
  `;
  const ast4 = project.createSourceFile('test4.tsx', code4, { overwrite: true });
  const fileInfo4: FileInfo = {
    path: '/test/test4.tsx',
    relativePath: 'test4.tsx',
    extension: '.tsx',
    size: code4.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  await analyzer.analyze(fileInfo4, ast4);
  const components4 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components4.length} component(s)`);
  if (components4.length > 0) {
    console.log(`  - ${components4[0].name} (uses hooks: ${components4[0].usesHooks}, uses state: ${components4[0].usesState})`);
  }
  console.log();

  // Test 5: Multiple Components
  console.log('Test 5: Multiple Components in One File');
  const code5 = `
    function Header() {
      return <header>Header</header>;
    }
    
    const Footer = () => <footer>Footer</footer>;
    
    class Sidebar extends React.Component {
      render() {
        return <aside>Sidebar</aside>;
      }
    }
  `;
  const ast5 = project.createSourceFile('test5.tsx', code5, { overwrite: true });
  const fileInfo5: FileInfo = {
    path: '/test/test5.tsx',
    relativePath: 'test5.tsx',
    extension: '.tsx',
    size: code5.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  await analyzer.analyze(fileInfo5, ast5);
  const components5 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components5.length} component(s)`);
  components5.forEach(comp => {
    console.log(`  - ${comp.name} (type: ${comp.type})`);
  });
  console.log();

  // Test 6: Filtering
  console.log('Test 6: Component Filtering');
  const functionComps = analyzer.getComponentsByType('function');
  const arrowComps = analyzer.getComponentsByType('arrow');
  const classComps = analyzer.getComponentsByType('class');
  console.log(`✓ Function components: ${functionComps.length}`);
  console.log(`✓ Arrow components: ${arrowComps.length}`);
  console.log(`✓ Class components: ${classComps.length}`);
  console.log();

  // Test 7: Non-component functions
  console.log('Test 7: Non-component Functions (should not be detected)');
  const code7 = `
    function myHelper() {
      return <div>Not a component</div>;
    }
    
    function MyUtility() {
      return "just a string";
    }
  `;
  const ast7 = project.createSourceFile('test7.tsx', code7, { overwrite: true });
  const fileInfo7: FileInfo = {
    path: '/test/test7.tsx',
    relativePath: 'test7.tsx',
    extension: '.tsx',
    size: code7.length,
    category: 'component',
    lastModified: new Date(),
  };
  
  analyzer.clearDiscoveredComponents();
  await analyzer.analyze(fileInfo7, ast7);
  const components7 = analyzer.getDiscoveredComponents();
  console.log(`✓ Found ${components7.length} component(s) (expected 0)`);
  console.log();

  console.log('✅ All manual tests completed!');
}

testComponentAnalyzer().catch(console.error);
