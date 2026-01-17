/**
 * Manual test for component pattern inconsistency detection (Task 7.3)
 */

import { Project } from 'ts-morph';
import { ComponentPatternAnalyzer } from './src/analyzers/component-pattern-analyzer';
import type { FileInfo } from './src/types';

// Create test file with inconsistent patterns
const testCode = `
import React, { useState, useEffect } from 'react';

// Function component with destructured props
function UserCard({ name, email }: { name: string; email: string }) {
  const [isActive, setIsActive] = useState(false);
  
  // Validation logic (duplicate pattern 1)
  const validateEmail = (email: string) => {
    if (!email || !email.includes('@')) {
      return false;
    }
    return true;
  };

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <div onClick={handleClick}>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

// Arrow function component with props object
const ProductCard = (props: { title: string; price: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Validation logic (duplicate pattern 2 - same as above)
  const validateEmail = (email: string) => {
    if (!email || !email.includes('@')) {
      return false;
    }
    return true;
  };

  // Different event handler naming pattern
  const onClick = () => {
    setIsVisible(!isVisible);
  };

  // Duplicate useEffect pattern
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  return (
    <div onClick={onClick}>
      <h3>{props.title}</h3>
      <span>${props.price}</span>
    </div>
  );
};

// Another component with duplicate useEffect
const OrderCard = ({ orderId, status }: { orderId: string; status: string }) => {
  // Duplicate useEffect pattern (same as ProductCard)
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  // Another event handler naming pattern
  const onSubmit = () => {
    console.log('Submit order');
  };

  return (
    <div>
      <p>Order: {orderId}</p>
      <p>Status: {status}</p>
      <button onClick={onSubmit}>Submit</button>
    </div>
  );
};

// Default export (inconsistent with named exports above)
export default UserCard;
export { ProductCard, OrderCard };
`;

async function testComponentPatternInconsistency() {
  console.log('Testing Component Pattern Inconsistency Detection (Task 7.3)...\n');

  // Create a ts-morph project
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      jsx: 2, // React
    },
  });

  // Add test file
  const sourceFile = project.createSourceFile('test-components.tsx', testCode);

  // Create analyzer
  const analyzer = new ComponentPatternAnalyzer();

  // Create file info
  const fileInfo: FileInfo = {
    path: '/test/test-components.tsx',
    relativePath: 'test-components.tsx',
    extension: '.tsx',
    size: testCode.length,
    category: 'component',
  };

  // Run analysis
  const issues = await analyzer.analyze(fileInfo, sourceFile);

  console.log(`Found ${issues.length} issues:\n`);

  // Group issues by type
  const issuesByType = new Map<string, typeof issues>();
  for (const issue of issues) {
    if (!issuesByType.has(issue.type)) {
      issuesByType.set(issue.type, []);
    }
    issuesByType.get(issue.type)!.push(issue);
  }

  // Display issues by type
  for (const [type, typeIssues] of issuesByType.entries()) {
    console.log(`\n=== ${type.toUpperCase()} (${typeIssues.length} issues) ===`);
    
    for (const issue of typeIssues) {
      console.log(`\n[${issue.severity.toUpperCase()}] ${issue.description}`);
      console.log(`Location: ${issue.file}:${issue.location.startLine}`);
      console.log(`Recommendation: ${issue.recommendation}`);
      console.log(`Tags: ${issue.tags.join(', ')}`);
    }
  }

  // Verify expected issues
  console.log('\n\n=== VERIFICATION ===');
  
  const expectedPatterns = [
    'inconsistent-pattern', // Prop patterns, export patterns, definition styles, event handlers
    'code-duplication',     // Duplicate validation, effects, transformations
  ];

  for (const pattern of expectedPatterns) {
    const count = issuesByType.get(pattern)?.length || 0;
    console.log(`✓ ${pattern}: ${count} issues found`);
  }

  // Check for specific expected issues
  const hasInconsistentProps = issues.some(i => 
    i.description.includes('props') && i.type === 'inconsistent-pattern'
  );
  const hasInconsistentExports = issues.some(i => 
    i.description.includes('export') && i.type === 'inconsistent-pattern'
  );
  const hasInconsistentDefinitions = issues.some(i => 
    i.description.includes('function declaration') || i.description.includes('arrow function')
  );
  const hasInconsistentEventHandlers = issues.some(i => 
    i.description.includes('Event handler') && i.type === 'inconsistent-pattern'
  );
  const hasDuplicateValidation = issues.some(i => 
    i.description.includes('validation') && i.type === 'code-duplication'
  );
  const hasDuplicateEffects = issues.some(i => 
    i.description.includes('useEffect') && i.type === 'code-duplication'
  );

  console.log('\nExpected Issue Types:');
  console.log(`  Inconsistent prop patterns: ${hasInconsistentProps ? '✓' : '✗'}`);
  console.log(`  Inconsistent export patterns: ${hasInconsistentExports ? '✓' : '✗'}`);
  console.log(`  Inconsistent definition styles: ${hasInconsistentDefinitions ? '✓' : '✗'}`);
  console.log(`  Inconsistent event handlers: ${hasInconsistentEventHandlers ? '✓' : '✗'}`);
  console.log(`  Duplicate validation logic: ${hasDuplicateValidation ? '✓' : '✗'}`);
  console.log(`  Duplicate useEffect patterns: ${hasDuplicateEffects ? '✓' : '✗'}`);

  console.log('\n✅ Task 7.3 implementation test complete!');
}

// Run the test
testComponentPatternInconsistency().catch(console.error);
