/**
 * Manual test for ErrorHandlingPatternAnalyzer
 */

import { Project } from 'ts-morph';
import { ErrorHandlingPatternAnalyzer } from './src/analyzers/error-handling-pattern-analyzer.js';
import type { FileInfo } from './src/types.js';

// Helper to create FileInfo
function createFileInfo(path: string): FileInfo {
  return {
    path: `/test/${path}`,
    relativePath: path,
    extension: '.ts',
    size: 1000,
    category: 'api-route',
    lastModified: new Date(),
  };
}

async function testErrorHandlingAnalyzer() {
  console.log('Testing ErrorHandlingPatternAnalyzer...\n');

  const analyzer = new ErrorHandlingPatternAnalyzer();
  const project = new Project();

  // Test 1: Empty catch block
  console.log('Test 1: Empty catch block');
  const code1 = `
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        return response.json();
      } catch (error) {
      }
    }
  `;
  const sourceFile1 = project.createSourceFile('test1.ts', code1, { overwrite: true });
  const issues1 = await analyzer.analyze(createFileInfo('test1.ts'), sourceFile1);
  console.log(`Found ${issues1.length} issues`);
  issues1.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  // Test 2: Missing error handling on promise
  console.log('Test 2: Missing error handling on promise');
  const code2 = `
    async function getData() {
      const data = await fetch('/api/data');
      return data;
    }
  `;
  const sourceFile2 = project.createSourceFile('test2.ts', code2, { overwrite: true });
  const issues2 = await analyzer.analyze(createFileInfo('test2.ts'), sourceFile2);
  console.log(`Found ${issues2.length} issues`);
  issues2.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  // Test 3: Error return pattern without check
  console.log('Test 3: Error return pattern without check');
  const code3 = `
    async function getUser(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      return data;
    }
  `;
  const sourceFile3 = project.createSourceFile('test3.ts', code3, { overwrite: true });
  const issues3 = await analyzer.analyze(createFileInfo('test3.ts'), sourceFile3);
  console.log(`Found ${issues3.length} issues`);
  issues3.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  // Test 4: Good error handling with try-catch
  console.log('Test 4: Good error handling with try-catch');
  const code4 = `
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        return response.json();
      } catch (error) {
        console.error('Failed to fetch data:', error);
        throw new Error('Data fetch failed');
      }
    }
  `;
  const sourceFile4 = project.createSourceFile('test4.ts', code4, { overwrite: true });
  const issues4 = await analyzer.analyze(createFileInfo('test4.ts'), sourceFile4);
  console.log(`Found ${issues4.length} issues`);
  issues4.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  // Test 5: Error callback pattern without check
  console.log('Test 5: Error callback pattern without check');
  const code5 = `
    function readFile(path: string, callback: (err: Error | null, data: string) => void) {
      fs.readFile(path, 'utf8', (err, data) => {
        callback(null, data);
      });
    }
  `;
  const sourceFile5 = project.createSourceFile('test5.ts', code5, { overwrite: true });
  const issues5 = await analyzer.analyze(createFileInfo('test5.ts'), sourceFile5);
  console.log(`Found ${issues5.length} issues`);
  issues5.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  // Test 6: Promise .catch() without logging
  console.log('Test 6: Promise .catch() without logging');
  const code6 = `
    function getData() {
      return fetch('/api/data')
        .then(res => res.json())
        .catch(err => {
          return null;
        });
    }
  `;
  const sourceFile6 = project.createSourceFile('test6.ts', code6, { overwrite: true });
  const issues6 = await analyzer.analyze(createFileInfo('test6.ts'), sourceFile6);
  console.log(`Found ${issues6.length} issues`);
  issues6.forEach(issue => {
    console.log(`  - ${issue.severity}: ${issue.description}`);
  });
  console.log();

  console.log('All tests completed!');
}

testErrorHandlingAnalyzer().catch(console.error);
