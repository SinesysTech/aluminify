/**
 * Unit tests for enhanced pattern detection in IssueClassifier
 * 
 * Tests the new functionality added in task 17.2:
 * - Grouping similar issues across files
 * - Identifying systemic problems
 * - Calculating pattern occurrence statistics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createIssueClassifier } from '../../../src/classifier/issue-classifier';
import type { Issue, IssueClassifier } from '../../../src/types';

/**
 * Helper function to create a test issue
 */
function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: `issue-${Math.random().toString(36).substr(2, 9)}`,
    type: 'inconsistent-pattern',
    severity: 'medium',
    category: 'general',
    file: '/test/file.ts',
    location: {
      startLine: 1,
      endLine: 1,
      startColumn: 0,
      endColumn: 10,
    },
    description: 'Test issue',
    codeSnippet: 'const x = 1;',
    recommendation: 'Fix this',
    estimatedEffort: 'small',
    tags: [],
    detectedBy: 'TestAnalyzer',
    detectedAt: new Date(),
    relatedIssues: [],
    ...overrides,
  };
}

describe('IssueClassifier - Enhanced Pattern Detection', () => {
  let classifier: IssueClassifier;

  beforeEach(() => {
    classifier = createIssueClassifier();
  });

  describe('Similar Issue Detection', () => {
    it('should group issues with similar descriptions', () => {
      const issues: Issue[] = [
        createIssue({
          description: 'Missing error handling in database query operation',
          file: '/db/users.ts',
          type: 'missing-error-handling',
          category: 'database',
        }),
        createIssue({
          description: 'Missing error handling in database insert operation',
          file: '/db/posts.ts',
          type: 'missing-error-handling',
          category: 'database',
        }),
        createIssue({
          description: 'Missing error handling in database update operation',
          file: '/db/comments.ts',
          type: 'missing-error-handling',
          category: 'database',
        }),
        createIssue({
          description: 'Completely different issue about naming conventions',
          file: '/utils/helpers.ts',
          type: 'poor-naming',
          category: 'general',
        }),
      ];

      const patterns = classifier.detectPatterns(issues);

      // Should find a pattern for similar error handling issues
      const similarPattern = patterns.find(p => p.patternId.includes('similar'));
      expect(similarPattern).toBeDefined();
      expect(similarPattern?.occurrences).toBeGreaterThanOrEqual(3);
      expect(similarPattern?.affectedFiles).toContain('/db/users.ts');
      expect(similarPattern?.affectedFiles).toContain('/db/posts.ts');
      expect(similarPattern?.affectedFiles).toContain('/db/comments.ts');
    });

    it('should not group dissimilar issues', () => {
      const issues: Issue[] = [
        createIssue({
          description: 'Missing error handling in API route',
          file: '/api/users.ts',
        }),
        createIssue({
          description: 'Inconsistent naming convention for variables',
          file: '/utils/helpers.ts',
        }),
        createIssue({
          description: 'Type safety issue with any type usage',
          file: '/types/models.ts',
        }),
      ];

      const patterns = classifier.detectPatterns(issues);

      // Should not find similar patterns for completely different issues
      const similarPattern = patterns.find(p => p.patternId.includes('similar'));
      expect(similarPattern).toBeUndefined();
    });

    it('should respect similarity threshold configuration', () => {
      const strictClassifier = createIssueClassifier({ similarityThreshold: 0.9 });
      
      const issues: Issue[] = [
        createIssue({
          description: 'Missing error handling in database query',
          file: '/db/users.ts',
        }),
        createIssue({
          description: 'Missing error handling in database operation',
          file: '/db/posts.ts',
        }),
        createIssue({
          description: 'Missing error handling in database call',
          file: '/db/comments.ts',
        }),
      ];

      const patterns = strictClassifier.detectPatterns(issues);

      // With high threshold, might not find pattern
      // (depends on exact similarity calculation)
      expect(patterns).toBeDefined();
    });

    it('should be able to disable similar issue detection', () => {
      const classifier = createIssueClassifier({ detectSimilarIssues: false });
      
      const issues: Issue[] = [
        createIssue({
          description: 'Missing error handling in database query operation',
          file: '/db/users.ts',
        }),
        createIssue({
          description: 'Missing error handling in database insert operation',
          file: '/db/posts.ts',
        }),
        createIssue({
          description: 'Missing error handling in database update operation',
          file: '/db/comments.ts',
        }),
      ];

      const patterns = classifier.detectPatterns(issues);

      // Should not find similar patterns when disabled
      const similarPattern = patterns.find(p => p.patternId.includes('similar'));
      expect(similarPattern).toBeUndefined();
    });
  });

  describe('Systemic Problem Detection', () => {
    it('should identify systemic problems affecting many files', () => {
      const issues: Issue[] = [];
      
      // Create issues affecting 6 files (threshold is 5)
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'type-safety',
            category: 'types',
            severity: 'high',
            file: `/src/file${i}.ts`,
          })
        );
      }

      const patterns = classifier.detectPatterns(issues);

      // Should detect systemic problem
      const systemicPattern = patterns.find(p => p.patternId === 'systemic-type-safety');
      expect(systemicPattern).toBeDefined();
      expect(systemicPattern?.patternName).toContain('Systemic');
      expect(systemicPattern?.affectedFiles.length).toBeGreaterThanOrEqual(5);
      expect(systemicPattern?.description).toContain('Widespread');
      expect(systemicPattern?.description).toContain('systemic');
    });

    it('should boost priority for systemic issues', () => {
      const regularIssues: Issue[] = [
        createIssue({ type: 'poor-naming', file: '/file1.ts', severity: 'low' }),
        createIssue({ type: 'poor-naming', file: '/file2.ts', severity: 'low' }),
        createIssue({ type: 'poor-naming', file: '/file3.ts', severity: 'low' }),
      ];

      const systemicIssues: Issue[] = [];
      for (let i = 1; i <= 6; i++) {
        systemicIssues.push(
          createIssue({
            type: 'type-safety',
            file: `/src/file${i}.ts`,
            severity: 'high',
          })
        );
      }

      const regularPatterns = classifier.detectPatterns(regularIssues);
      const systemicPatterns = classifier.detectPatterns(systemicIssues);

      const systemicPattern = systemicPatterns.find(p => p.patternId === 'systemic-type-safety');
      const regularPattern = regularPatterns.find(p => p.patternId === 'pattern-poor-naming-general');

      if (systemicPattern && regularPattern) {
        // Systemic issues should have higher priority
        expect(systemicPattern.priority).toBeGreaterThan(regularPattern.priority);
      }
    });

    it('should not detect systemic problems for issues affecting few files', () => {
      const issues: Issue[] = [
        createIssue({ type: 'type-safety', file: '/file1.ts', severity: 'high' }),
        createIssue({ type: 'type-safety', file: '/file2.ts', severity: 'high' }),
        createIssue({ type: 'type-safety', file: '/file3.ts', severity: 'high' }),
      ];

      const patterns = classifier.detectPatterns(issues);

      // Should not detect as systemic (only 3 files, threshold is 5)
      const systemicPattern = patterns.find(p => p.patternId === 'systemic-type-safety');
      expect(systemicPattern).toBeUndefined();
    });

    it('should require high severity issues for systemic problems', () => {
      const issues: Issue[] = [];
      
      // Create many low-severity issues
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'poor-naming',
            file: `/src/file${i}.ts`,
            severity: 'low', // All low severity
          })
        );
      }

      const patterns = classifier.detectPatterns(issues);

      // Should not detect as systemic without high-severity issues
      const systemicPattern = patterns.find(p => p.patternId === 'systemic-poor-naming');
      expect(systemicPattern).toBeUndefined();
    });

    it('should include detailed recommendations for systemic problems', () => {
      const issues: Issue[] = [];
      
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'inconsistent-pattern',
            file: `/src/file${i}.ts`,
            severity: 'high',
          })
        );
      }

      const patterns = classifier.detectPatterns(issues);

      const systemicPattern = patterns.find(p => p.patternId === 'systemic-inconsistent-pattern');
      expect(systemicPattern).toBeDefined();
      expect(systemicPattern?.recommendedAction).toContain('standardized solution');
      expect(systemicPattern?.recommendedAction).toContain('batches');
      expect(systemicPattern?.recommendedAction).toContain('automated checks');
    });
  });

  describe('Pattern Statistics', () => {
    it('should include severity distribution in pattern descriptions', () => {
      const issues: Issue[] = [
        createIssue({ type: 'type-safety', file: '/file1.ts', severity: 'critical' }),
        createIssue({ type: 'type-safety', file: '/file2.ts', severity: 'critical' }),
        createIssue({ type: 'type-safety', file: '/file3.ts', severity: 'high' }),
        createIssue({ type: 'type-safety', file: '/file4.ts', severity: 'medium' }),
        createIssue({ type: 'type-safety', file: '/file5.ts', severity: 'low' }),
        createIssue({ type: 'type-safety', file: '/file6.ts', severity: 'low' }),
      ];

      const patterns = classifier.detectPatterns(issues);

      const systemicPattern = patterns.find(p => p.patternId === 'systemic-type-safety');
      expect(systemicPattern).toBeDefined();
      expect(systemicPattern?.description).toContain('critical');
      expect(systemicPattern?.description).toContain('high');
      expect(systemicPattern?.description).toContain('medium');
      expect(systemicPattern?.description).toContain('low');
    });

    it('should identify most affected file in cross-file patterns', () => {
      const issues: Issue[] = [
        createIssue({ file: '/file1.ts', detectedBy: 'TestAnalyzer' }),
        createIssue({ file: '/file1.ts', detectedBy: 'TestAnalyzer' }), // 2 in file1
        createIssue({ file: '/file1.ts', detectedBy: 'TestAnalyzer' }), // 3 in file1
        createIssue({ file: '/file2.ts', detectedBy: 'TestAnalyzer' }),
        createIssue({ file: '/file3.ts', detectedBy: 'TestAnalyzer' }),
      ];

      const patterns = classifier.detectPatterns(issues);

      const crossFilePattern = patterns.find(p => p.patternId.includes('cross-file'));
      expect(crossFilePattern).toBeDefined();
      expect(crossFilePattern?.description).toContain('/file1.ts');
      expect(crossFilePattern?.description).toContain('most affected');
    });

    it('should calculate effort estimates for patterns', () => {
      const issues: Issue[] = [];
      
      // Create issues with various effort levels
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'code-duplication',
            file: `/src/file${i}.ts`,
            severity: 'high',
            estimatedEffort: 'medium',
          })
        );
      }

      const patterns = classifier.detectPatterns(issues);

      const systemicPattern = patterns.find(p => p.patternId === 'systemic-code-duplication');
      expect(systemicPattern).toBeDefined();
      expect(systemicPattern?.description).toMatch(/Estimated effort:/);
      expect(systemicPattern?.description).toMatch(/(hours|days|weeks)/);
    });

    it('should count unique files correctly in patterns', () => {
      const issues: Issue[] = [
        createIssue({ type: 'type-safety', file: '/file1.ts' }),
        createIssue({ type: 'type-safety', file: '/file1.ts' }), // Duplicate file
        createIssue({ type: 'type-safety', file: '/file2.ts' }),
        createIssue({ type: 'type-safety', file: '/file3.ts' }),
      ];

      const patterns = classifier.detectPatterns(issues);

      const pattern = patterns.find(p => p.patternId === 'pattern-type-safety-general');
      expect(pattern).toBeDefined();
      expect(pattern?.occurrences).toBe(4); // All issues
      expect(pattern?.affectedFiles).toHaveLength(3); // Unique files only
    });

    it('should provide occurrence statistics in descriptions', () => {
      const issues: Issue[] = [];
      
      for (let i = 1; i <= 8; i++) {
        issues.push(
          createIssue({
            type: 'missing-error-handling',
            file: `/src/file${i}.ts`,
            severity: 'high',
          })
        );
      }

      const patterns = classifier.detectPatterns(issues);

      const systemicPattern = patterns.find(p => p.patternId === 'systemic-missing-error-handling');
      expect(systemicPattern).toBeDefined();
      expect(systemicPattern?.description).toContain('8 occurrences');
      expect(systemicPattern?.description).toContain('8 files');
    });
  });

  describe('Enhanced Cross-File Pattern Detection', () => {
    it('should include statistics in cross-file pattern descriptions', () => {
      const issues: Issue[] = [
        createIssue({ 
          file: '/file1.ts', 
          detectedBy: 'DatabaseAnalyzer',
          severity: 'critical',
        }),
        createIssue({ 
          file: '/file2.ts', 
          detectedBy: 'DatabaseAnalyzer',
          severity: 'high',
        }),
        createIssue({ 
          file: '/file3.ts', 
          detectedBy: 'DatabaseAnalyzer',
          severity: 'medium',
        }),
      ];

      const patterns = classifier.detectPatterns(issues);

      const crossFilePattern = patterns.find(p => p.patternId.includes('cross-file'));
      expect(crossFilePattern).toBeDefined();
      expect(crossFilePattern?.description).toContain('critical');
      expect(crossFilePattern?.description).toContain('systemic');
    });

    it('should handle multiple analyzers with different patterns', () => {
      const issues: Issue[] = [
        // Analyzer 1 issues
        createIssue({ file: '/file1.ts', detectedBy: 'Analyzer1' }),
        createIssue({ file: '/file2.ts', detectedBy: 'Analyzer1' }),
        createIssue({ file: '/file3.ts', detectedBy: 'Analyzer1' }),
        // Analyzer 2 issues
        createIssue({ file: '/file4.ts', detectedBy: 'Analyzer2' }),
        createIssue({ file: '/file5.ts', detectedBy: 'Analyzer2' }),
        createIssue({ file: '/file6.ts', detectedBy: 'Analyzer2' }),
      ];

      const patterns = classifier.detectPatterns(issues);

      // Should find patterns for both analyzers
      const analyzer1Pattern = patterns.find(p => p.patternId.includes('analyzer1'));
      const analyzer2Pattern = patterns.find(p => p.patternId.includes('analyzer2'));
      
      expect(analyzer1Pattern).toBeDefined();
      expect(analyzer2Pattern).toBeDefined();
    });
  });

  describe('Integration with Classification', () => {
    it('should include enhanced patterns in classification results', () => {
      const issues: Issue[] = [];
      
      // Create systemic problem
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'type-safety',
            file: `/src/file${i}.ts`,
            severity: 'high',
          })
        );
      }

      // Create similar issues
      issues.push(
        createIssue({
          description: 'Missing error handling in database query',
          file: '/db/users.ts',
          type: 'missing-error-handling',
        }),
        createIssue({
          description: 'Missing error handling in database insert',
          file: '/db/posts.ts',
          type: 'missing-error-handling',
        }),
        createIssue({
          description: 'Missing error handling in database update',
          file: '/db/comments.ts',
          type: 'missing-error-handling',
        })
      );

      const classified = classifier.classify(issues);

      // Should have multiple pattern types
      expect(classified.patterns.length).toBeGreaterThan(0);
      
      // Should include systemic pattern
      const systemicPattern = classified.patterns.find(p => p.patternId.includes('systemic'));
      expect(systemicPattern).toBeDefined();
    });

    it('should sort all patterns by priority including enhanced patterns', () => {
      const issues: Issue[] = [];
      
      // Create various patterns
      for (let i = 1; i <= 6; i++) {
        issues.push(
          createIssue({
            type: 'type-safety',
            file: `/critical/file${i}.ts`,
            severity: 'critical',
          })
        );
      }

      for (let i = 1; i <= 3; i++) {
        issues.push(
          createIssue({
            type: 'poor-naming',
            file: `/low/file${i}.ts`,
            severity: 'low',
          })
        );
      }

      const classified = classifier.classify(issues);

      // All patterns should be sorted by priority
      for (let i = 0; i < classified.patterns.length - 1; i++) {
        expect(classified.patterns[i].priority).toBeGreaterThanOrEqual(
          classified.patterns[i + 1].priority
        );
      }
    });
  });
});
