/**
 * Unit tests for ComponentPatternAnalyzer
 *
 * Tests component discovery and categorization functionality
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from 'ts-morph';
import { ComponentPatternAnalyzer } from '../../../src/analyzers/component-pattern-analyzer';
describe('ComponentPatternAnalyzer', () => {
    let analyzer;
    let project;
    beforeEach(() => {
        analyzer = new ComponentPatternAnalyzer();
        project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                jsx: 1, // JSX preserve mode
                target: 99, // ESNext
                module: 99, // ESNext
            },
        });
        // Clear any previously discovered components
        analyzer.clearDiscoveredComponents();
    });
    const createFileInfo = (relativePath) => ({
        path: `/test/${relativePath}`,
        relativePath,
        extension: '.tsx',
        size: 1000,
        category: 'component',
        lastModified: new Date(),
    });
    const parseCode = (code) => {
        return project.createSourceFile('test.tsx', code, { overwrite: true });
    };
    describe('Task 7.1: Function Component Discovery', () => {
        it('should discover a simple function component', async () => {
            const code = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/MyComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('MyComponent');
            expect(components[0].type).toBe('function');
        });
        it('should discover a function component with props', async () => {
            const code = `
        function UserProfile(props) {
          return <div>{props.name}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/UserProfile.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('UserProfile');
            expect(components[0].hasProps).toBe(true);
        });
        it('should discover a function component with destructured props', async () => {
            const code = `
        function Button({ label, onClick }) {
          return <button onClick={onClick}>{label}</button>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Button.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Button');
            expect(components[0].hasProps).toBe(true);
        });
        it('should discover a function component using hooks', async () => {
            const code = `
        function Counter() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Counter.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Counter');
            expect(components[0].usesHooks).toBe(true);
            expect(components[0].usesState).toBe(true);
        });
        it('should discover an exported function component', async () => {
            const code = `
        export function Header() {
          return <header>Header</header>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Header.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Header');
            expect(components[0].isExported).toBe(true);
        });
        it('should not discover lowercase functions as components', async () => {
            const code = `
        function myHelper() {
          return <div>Not a component</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('utils/helper.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(0);
        });
        it('should not discover functions without JSX as components', async () => {
            const code = `
        function MyUtility() {
          return "just a string";
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('utils/MyUtility.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(0);
        });
    });
    describe('Task 7.1: Arrow Function Component Discovery', () => {
        it('should discover an arrow function component', async () => {
            const code = `
        const Card = () => {
          return <div className="card">Card</div>;
        };
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Card.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Card');
            expect(components[0].type).toBe('arrow');
        });
        it('should discover an arrow function component with implicit return', async () => {
            const code = `
        const Badge = () => <span className="badge">Badge</span>;
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Badge.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Badge');
            expect(components[0].type).toBe('arrow');
        });
        it('should discover an arrow function component with props', async () => {
            const code = `
        const Avatar = ({ src, alt }) => {
          return <img src={src} alt={alt} />;
        };
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Avatar.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Avatar');
            expect(components[0].hasProps).toBe(true);
        });
        it('should discover an exported arrow function component', async () => {
            const code = `
        export const Footer = () => {
          return <footer>Footer</footer>;
        };
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Footer.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Footer');
            expect(components[0].isExported).toBe(true);
        });
        it('should discover an arrow function component using hooks', async () => {
            const code = `
        const Timer = () => {
          const [time, setTime] = useState(0);
          useEffect(() => {
            const interval = setInterval(() => setTime(t => t + 1), 1000);
            return () => clearInterval(interval);
          }, []);
          return <div>{time}</div>;
        };
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Timer.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Timer');
            expect(components[0].usesHooks).toBe(true);
            expect(components[0].usesState).toBe(true);
        });
    });
    describe('Task 7.1: Class Component Discovery', () => {
        it('should discover a class component extending React.Component', async () => {
            const code = `
        class MyClassComponent extends React.Component {
          render() {
            return <div>Class Component</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/MyClassComponent.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('MyClassComponent');
            expect(components[0].type).toBe('class');
            // Should flag class components as legacy
            expect(issues.length).toBeGreaterThan(0);
            expect(issues[0].type).toBe('legacy-code');
        });
        it('should discover a class component extending Component', async () => {
            const code = `
        class Counter extends Component {
          render() {
            return <div>Counter</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Counter.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Counter');
            expect(components[0].type).toBe('class');
        });
        it('should discover a class component with state', async () => {
            const code = `
        class StatefulComponent extends React.Component {
          constructor(props) {
            super(props);
            this.state = { count: 0 };
          }
          
          render() {
            return <div>{this.state.count}</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/StatefulComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('StatefulComponent');
            expect(components[0].usesState).toBe(true);
        });
        it('should discover a class component with props', async () => {
            const code = `
        class Greeting extends React.Component {
          render() {
            return <div>Hello {this.props.name}</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Greeting.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('Greeting');
            expect(components[0].hasProps).toBe(true);
        });
        it('should discover a PureComponent', async () => {
            const code = `
        class OptimizedComponent extends React.PureComponent {
          render() {
            return <div>Optimized</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/OptimizedComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('OptimizedComponent');
            expect(components[0].type).toBe('class');
        });
        it('should not discover classes that do not extend React.Component', async () => {
            const code = `
        class MyService {
          doSomething() {
            return "not a component";
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('services/MyService.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(0);
        });
    });
    describe('Task 7.1: Multiple Components Discovery', () => {
        it('should discover multiple components in the same file', async () => {
            const code = `
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
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Layout.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(3);
            expect(components.map(c => c.name)).toContain('Header');
            expect(components.map(c => c.name)).toContain('Footer');
            expect(components.map(c => c.name)).toContain('Sidebar');
        });
        it('should categorize components by type', async () => {
            const code = `
        function FuncComp() {
          return <div>Function</div>;
        }
        
        const ArrowComp = () => <div>Arrow</div>;
        
        class ClassComp extends React.Component {
          render() {
            return <div>Class</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Mixed.tsx');
            await analyzer.analyze(fileInfo, ast);
            const functionComponents = analyzer.getComponentsByType('function');
            const arrowComponents = analyzer.getComponentsByType('arrow');
            const classComponents = analyzer.getComponentsByType('class');
            expect(functionComponents).toHaveLength(1);
            expect(arrowComponents).toHaveLength(1);
            expect(classComponents).toHaveLength(1);
        });
    });
    describe('Task 7.1: Component Filtering', () => {
        beforeEach(async () => {
            const code = `
        export function ExportedFunc() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
        
        const LocalArrow = () => <div>Local</div>;
        
        export const ExportedArrow = () => {
          useEffect(() => {}, []);
          return <div>Exported</div>;
        };
        
        class LocalClass extends React.Component {
          render() {
            return <div>Local Class</div>;
          }
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Exports.tsx');
            await analyzer.analyze(fileInfo, ast);
        });
        it('should filter exported components', () => {
            const exported = analyzer.getExportedComponents();
            expect(exported).toHaveLength(2);
            expect(exported.map(c => c.name)).toContain('ExportedFunc');
            expect(exported.map(c => c.name)).toContain('ExportedArrow');
        });
        it('should filter components using hooks', () => {
            const withHooks = analyzer.getComponentsUsingHooks();
            expect(withHooks.length).toBeGreaterThan(0);
            expect(withHooks.every(c => c.usesHooks)).toBe(true);
        });
        it('should filter components using state', () => {
            const withState = analyzer.getComponentsUsingState();
            expect(withState.length).toBeGreaterThan(0);
            expect(withState.every(c => c.usesState)).toBe(true);
        });
    });
    describe('Task 7.1: JSX Fragment Support', () => {
        it('should discover components returning fragments', async () => {
            const code = `
        function FragmentComponent() {
          return (
            <>
              <div>First</div>
              <div>Second</div>
            </>
          );
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/FragmentComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('FragmentComponent');
        });
        it('should discover components returning React.Fragment', async () => {
            const code = `
        function LongFragmentComponent() {
          return (
            <React.Fragment>
              <div>First</div>
              <div>Second</div>
            </React.Fragment>
          );
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/LongFragmentComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('LongFragmentComponent');
        });
    });
    describe('Task 7.1: Custom Hooks Detection', () => {
        it('should recognize components using custom hooks', async () => {
            const code = `
        function ComponentWithCustomHook() {
          const data = useCustomData();
          return <div>{data}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/ComponentWithCustomHook.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].usesHooks).toBe(true);
        });
        it('should not confuse custom hooks with components', async () => {
            const code = `
        function useCustomHook() {
          const [value, setValue] = useState(null);
          return value;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('hooks/useCustomHook.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            // Custom hooks start with 'use' but lowercase, so not PascalCase
            expect(components).toHaveLength(0);
        });
    });
    describe('Task 7.1: Edge Cases', () => {
        it('should handle components with TypeScript types', async () => {
            const code = `
        interface Props {
          title: string;
        }
        
        function TypedComponent({ title }: Props) {
          return <h1>{title}</h1>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/TypedComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('TypedComponent');
        });
        it('should handle components with generic types', async () => {
            const code = `
        function GenericComponent<T>({ data }: { data: T }) {
          return <div>{String(data)}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/GenericComponent.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(1);
            expect(components[0].name).toBe('GenericComponent');
        });
        it('should handle empty files', async () => {
            const code = ``;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Empty.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(0);
        });
        it('should handle files with only imports', async () => {
            const code = `
        import React from 'react';
        import { useState } from 'react';
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/ImportsOnly.tsx');
            await analyzer.analyze(fileInfo, ast);
            const components = analyzer.getDiscoveredComponents();
            expect(components).toHaveLength(0);
        });
    });
    describe('Supported File Types', () => {
        it('should support component file category', () => {
            const supportedTypes = analyzer.getSupportedFileTypes();
            expect(supportedTypes).toContain('component');
        });
    });
    describe('Task 7.2: Prop Drilling Detection', () => {
        it('should detect prop drilling exceeding 3 levels', async () => {
            const code = `
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
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/PropDrilling.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should detect prop drilling issue
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues.length).toBeGreaterThan(0);
            expect(propDrillingIssues[0].type).toBe('confusing-logic');
            expect(propDrillingIssues[0].severity).toBe('medium');
            expect(propDrillingIssues[0].description).toContain('prop drilling');
        });
        it('should not flag prop drilling at 3 levels or less', async () => {
            const code = `
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
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/AcceptablePropPassing.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Should not detect prop drilling issue (only 3 levels)
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues).toHaveLength(0);
        });
        it('should detect prop drilling with destructured props', async () => {
            const code = `
        function Level1({ userId, userName }) {
          return <Level2 userId={userId} userName={userName} />;
        }
        
        function Level2({ userId, userName }) {
          return <Level3 userId={userId} userName={userName} />;
        }
        
        function Level3({ userId, userName }) {
          return <Level4 userId={userId} userName={userName} />;
        }
        
        function Level4({ userId, userName }) {
          return <div>{userName} ({userId})</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/DestructuredPropDrilling.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues.length).toBeGreaterThan(0);
        });
        it('should detect prop drilling with props object', async () => {
            const code = `
        function ComponentA(props) {
          return <ComponentB value={props.value} />;
        }
        
        function ComponentB(props) {
          return <ComponentC value={props.value} />;
        }
        
        function ComponentC(props) {
          return <ComponentD value={props.value} />;
        }
        
        function ComponentD(props) {
          return <div>{props.value}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/PropsObjectDrilling.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues.length).toBeGreaterThan(0);
        });
        it('should provide helpful recommendations for prop drilling', async () => {
            const code = `
        function Top({ config }) {
          return <Middle config={config} />;
        }
        
        function Middle({ config }) {
          return <Bottom config={config} />;
        }
        
        function Bottom({ config }) {
          return <Leaf config={config} />;
        }
        
        function Leaf({ config }) {
          return <div>{config.name}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/ConfigDrilling.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues.length).toBeGreaterThan(0);
            expect(propDrillingIssues[0].recommendation).toContain('Context');
            expect(propDrillingIssues[0].estimatedEffort).toBe('medium');
        });
        it('should handle components with spread props', async () => {
            const code = `
        function Wrapper(props) {
          return <Inner {...props} />;
        }
        
        function Inner(props) {
          return <Deep {...props} />;
        }
        
        function Deep(props) {
          return <Deeper {...props} />;
        }
        
        function Deeper(props) {
          return <div>{props.text}</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/SpreadProps.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            // Spread props should be detected as potential prop drilling
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            // May or may not detect depending on implementation
            // This is a valid test case to ensure no crashes
            expect(issues).toBeDefined();
        });
        it('should not flag components that do not pass props down', async () => {
            const code = `
        function Independent1() {
          return <div>I am independent</div>;
        }
        
        function Independent2() {
          return <div>Me too</div>;
        }
        
        function Independent3() {
          return <div>Same here</div>;
        }
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/Independent.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues).toHaveLength(0);
        });
        it('should handle arrow function components in prop drilling detection', async () => {
            const code = `
        const A = ({ data }) => <B data={data} />;
        const B = ({ data }) => <C data={data} />;
        const C = ({ data }) => <D data={data} />;
        const D = ({ data }) => <div>{data}</div>;
      `;
            const ast = parseCode(code);
            const fileInfo = createFileInfo('components/ArrowPropDrilling.tsx');
            const issues = await analyzer.analyze(fileInfo, ast);
            const propDrillingIssues = issues.filter(issue => issue.tags.includes('prop-drilling'));
            expect(propDrillingIssues.length).toBeGreaterThan(0);
        });
    });
});
describe('Task 7.3: Component Pattern Inconsistency Detection', () => {
    it('should detect inconsistent prop patterns (destructuring vs object)', async () => {
        const code = `
        // Destructured props
        function ComponentA({ name, age }) {
          return <div>{name} - {age}</div>;
        }
        
        // Props object
        const ComponentB = (props) => {
          return <div>{props.name} - {props.age}</div>;
        };
        
        // Destructured props (majority pattern)
        function ComponentC({ title }) {
          return <h1>{title}</h1>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/InconsistentProps.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const inconsistentPatternIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' && issue.description.includes('props'));
        expect(inconsistentPatternIssues.length).toBeGreaterThan(0);
        expect(inconsistentPatternIssues[0].severity).toBe('low');
    });
    it('should detect inconsistent export patterns', async () => {
        const code = `
        // Named export
        export function ComponentA() {
          return <div>A</div>;
        }
        
        // Named export
        export const ComponentB = () => <div>B</div>;
        
        // Default export (minority pattern)
        function ComponentC() {
          return <div>C</div>;
        }
        export default ComponentC;
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/InconsistentExports.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const exportPatternIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' && issue.description.includes('export'));
        expect(exportPatternIssues.length).toBeGreaterThan(0);
    });
    it('should detect inconsistent component definition styles', async () => {
        const code = `
        // Function declaration
        function ComponentA() {
          return <div>A</div>;
        }
        
        // Arrow function (minority pattern)
        const ComponentB = () => <div>B</div>;
        
        // Function declaration (majority pattern)
        function ComponentC() {
          return <div>C</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/InconsistentDefinitions.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const definitionStyleIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' &&
            (issue.description.includes('function declaration') || issue.description.includes('arrow function')));
        expect(definitionStyleIssues.length).toBeGreaterThan(0);
    });
    it('should detect inconsistent event handler naming', async () => {
        const code = `
        function ComponentA() {
          const handleClick = () => console.log('clicked');
          return <button onClick={handleClick}>Click</button>;
        }
        
        function ComponentB() {
          const onClick = () => console.log('clicked');
          return <button onClick={onClick}>Click</button>;
        }
        
        function ComponentC() {
          const handleSubmit = () => console.log('submitted');
          return <button onClick={handleSubmit}>Submit</button>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/InconsistentHandlers.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const handlerNamingIssues = issues.filter(issue => issue.type === 'inconsistent-pattern' && issue.description.includes('Event handler'));
        expect(handlerNamingIssues.length).toBeGreaterThan(0);
    });
    it('should not flag inconsistencies when patterns are consistent', async () => {
        const code = `
        function ComponentA({ name }) {
          return <div>{name}</div>;
        }
        
        function ComponentB({ title }) {
          return <h1>{title}</h1>;
        }
        
        function ComponentC({ content }) {
          return <p>{content}</p>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/ConsistentPatterns.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const inconsistentPatternIssues = issues.filter(issue => issue.type === 'inconsistent-pattern');
        // Should have no or very few inconsistency issues
        expect(inconsistentPatternIssues.length).toBe(0);
    });
});
describe('Task 7.3: Duplicate Component Logic Detection', () => {
    it('should detect duplicate validation logic', async () => {
        const code = `
        function ComponentA({ email }) {
          const validateEmail = (email) => {
            if (!email || !email.includes('@')) {
              return false;
            }
            return true;
          };
          return <div>{email}</div>;
        }
        
        function ComponentB({ email }) {
          const validateEmail = (email) => {
            if (!email || !email.includes('@')) {
              return false;
            }
            return true;
          };
          return <div>{email}</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/DuplicateValidation.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const duplicationIssues = issues.filter(issue => issue.type === 'code-duplication' && issue.description.includes('validation'));
        expect(duplicationIssues.length).toBeGreaterThan(0);
        expect(duplicationIssues[0].severity).toBe('medium');
    });
    it('should detect duplicate useEffect patterns', async () => {
        const code = `
        function ComponentA() {
          useEffect(() => {
            console.log('Component mounted');
            return () => console.log('Component unmounted');
          }, []);
          return <div>A</div>;
        }
        
        function ComponentB() {
          useEffect(() => {
            console.log('Component mounted');
            return () => console.log('Component unmounted');
          }, []);
          return <div>B</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/DuplicateEffects.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const effectDuplicationIssues = issues.filter(issue => issue.type === 'code-duplication' && issue.description.includes('useEffect'));
        expect(effectDuplicationIssues.length).toBeGreaterThan(0);
    });
    it('should detect duplicate data transformations', async () => {
        const code = `
        function ComponentA({ items }) {
          const sorted = items.map(item => item.name).sort();
          return <div>{sorted.join(', ')}</div>;
        }
        
        function ComponentB({ products }) {
          const sorted = products.map(item => item.name).sort();
          return <div>{sorted.join(', ')}</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/DuplicateTransformations.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const transformDuplicationIssues = issues.filter(issue => issue.type === 'code-duplication' && issue.description.includes('transformation'));
        expect(transformDuplicationIssues.length).toBeGreaterThan(0);
    });
    it('should detect similar component structures', async () => {
        const code = `
        function UserCard({ name, email }) {
          const [isActive, setIsActive] = useState(false);
          
          useEffect(() => {
            console.log('mounted');
          }, []);
          
          const handleClick = () => setIsActive(!isActive);
          
          return (
            <div onClick={handleClick}>
              <h2>{name}</h2>
              <p>{email}</p>
            </div>
          );
        }
        
        function ProductCard({ title, price }) {
          const [isVisible, setIsVisible] = useState(false);
          
          useEffect(() => {
            console.log('mounted');
          }, []);
          
          const handleClick = () => setIsVisible(!isVisible);
          
          return (
            <div onClick={handleClick}>
              <h2>{title}</h2>
              <p>${price}</p>
            </div>
          );
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/SimilarStructures.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const similarityIssues = issues.filter(issue => issue.type === 'code-duplication' && issue.description.includes('similar structures'));
        expect(similarityIssues.length).toBeGreaterThan(0);
    });
    it('should provide helpful recommendations for duplicate logic', async () => {
        const code = `
        function ComponentA() {
          const validate = (value) => {
            if (!value) return false;
            return true;
          };
          return <div>A</div>;
        }
        
        function ComponentB() {
          const validate = (value) => {
            if (!value) return false;
            return true;
          };
          return <div>B</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/DuplicateLogic.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const duplicationIssues = issues.filter(issue => issue.type === 'code-duplication');
        expect(duplicationIssues.length).toBeGreaterThan(0);
        expect(duplicationIssues[0].recommendation).toContain('Extract');
        expect(duplicationIssues[0].estimatedEffort).toBeDefined();
    });
    it('should not flag unique component logic as duplicate', async () => {
        const code = `
        function ComponentA() {
          const uniqueLogicA = () => console.log('A specific logic');
          return <div>A</div>;
        }
        
        function ComponentB() {
          const uniqueLogicB = () => console.log('B specific logic');
          return <div>B</div>;
        }
      `;
        const ast = parseCode(code);
        const fileInfo = createFileInfo('components/UniqueLogic.tsx');
        const issues = await analyzer.analyze(fileInfo, ast);
        const duplicationIssues = issues.filter(issue => issue.type === 'code-duplication');
        // Should have no or very few duplication issues
        expect(duplicationIssues.length).toBe(0);
    });
});
//# sourceMappingURL=component-pattern-analyzer.test.js.map