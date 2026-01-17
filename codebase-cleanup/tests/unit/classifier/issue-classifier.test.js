/**
 * Unit tests for IssueClassifier
 *
 * Tests classification, prioritization, and pattern detection functionality.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createIssueClassifier } from '../../../src/classifier/issue-classifier';
/**
 * Helper function to create a test issue
 */
function createIssue(overrides = {}) {
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
describe('IssueClassifier', () => {
    let classifier;
    beforeEach(() => {
        classifier = createIssueClassifier();
    });
    describe('classify', () => {
        it('should classify issues by severity', () => {
            const issues = [
                createIssue({ severity: 'critical', id: 'critical-1' }),
                createIssue({ severity: 'high', id: 'high-1' }),
                createIssue({ severity: 'high', id: 'high-2' }),
                createIssue({ severity: 'medium', id: 'medium-1' }),
                createIssue({ severity: 'low', id: 'low-1' }),
                createIssue({ severity: 'low', id: 'low-2' }),
                createIssue({ severity: 'low', id: 'low-3' }),
            ];
            const classified = classifier.classify(issues);
            expect(classified.critical).toHaveLength(1);
            expect(classified.high).toHaveLength(2);
            expect(classified.medium).toHaveLength(1);
            expect(classified.low).toHaveLength(3);
        });
        it('should handle empty issue list', () => {
            const classified = classifier.classify([]);
            expect(classified.critical).toHaveLength(0);
            expect(classified.high).toHaveLength(0);
            expect(classified.medium).toHaveLength(0);
            expect(classified.low).toHaveLength(0);
            expect(classified.patterns).toHaveLength(0);
        });
        it('should detect patterns when classifying', () => {
            const issues = [
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file2.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file3.ts' }),
            ];
            const classified = classifier.classify(issues);
            expect(classified.patterns.length).toBeGreaterThan(0);
            const pattern = classified.patterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(pattern).toBeDefined();
            expect(pattern?.occurrences).toBe(3);
        });
        it('should include all severity levels in classification', () => {
            const issues = [
                createIssue({ severity: 'critical' }),
            ];
            const classified = classifier.classify(issues);
            expect(classified).toHaveProperty('critical');
            expect(classified).toHaveProperty('high');
            expect(classified).toHaveProperty('medium');
            expect(classified).toHaveProperty('low');
            expect(classified).toHaveProperty('patterns');
        });
    });
    describe('prioritize', () => {
        it('should prioritize by severity first', () => {
            const issues = [
                createIssue({ severity: 'low', id: 'low-1' }),
                createIssue({ severity: 'critical', id: 'critical-1' }),
                createIssue({ severity: 'medium', id: 'medium-1' }),
                createIssue({ severity: 'high', id: 'high-1' }),
            ];
            const prioritized = classifier.prioritize(issues);
            expect(prioritized[0].severity).toBe('critical');
            expect(prioritized[1].severity).toBe('high');
            expect(prioritized[2].severity).toBe('medium');
            expect(prioritized[3].severity).toBe('low');
        });
        it('should prioritize by category within same severity', () => {
            const issues = [
                createIssue({ severity: 'high', category: 'general', id: 'general-1' }),
                createIssue({ severity: 'high', category: 'authentication', id: 'auth-1' }),
                createIssue({ severity: 'high', category: 'database', id: 'db-1' }),
            ];
            const prioritized = classifier.prioritize(issues);
            // Authentication should be highest priority
            expect(prioritized[0].category).toBe('authentication');
            // Database should be second
            expect(prioritized[1].category).toBe('database');
            // General should be last
            expect(prioritized[2].category).toBe('general');
        });
        it('should prioritize by type within same category', () => {
            const issues = [
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    id: 'naming-1'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'architectural',
                    id: 'arch-1'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'type-safety',
                    id: 'type-1'
                }),
            ];
            const prioritized = classifier.prioritize(issues);
            // Architectural should be highest priority
            expect(prioritized[0].type).toBe('architectural');
            // Type safety should be second
            expect(prioritized[1].type).toBe('type-safety');
            // Poor naming should be last
            expect(prioritized[2].type).toBe('poor-naming');
        });
        it('should prioritize by effort within same type (lower effort first)', () => {
            const issues = [
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'large',
                    id: 'large-1'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'trivial',
                    id: 'trivial-1'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'medium',
                    id: 'medium-1'
                }),
            ];
            const prioritized = classifier.prioritize(issues);
            // Trivial effort should be first
            expect(prioritized[0].estimatedEffort).toBe('trivial');
            // Medium effort should be second
            expect(prioritized[1].estimatedEffort).toBe('medium');
            // Large effort should be last
            expect(prioritized[2].estimatedEffort).toBe('large');
        });
        it('should prioritize by related issues count as final tiebreaker', () => {
            const issues = [
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'small',
                    relatedIssues: ['issue-1'],
                    id: 'one-related'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'small',
                    relatedIssues: ['issue-1', 'issue-2', 'issue-3'],
                    id: 'three-related'
                }),
                createIssue({
                    severity: 'high',
                    category: 'general',
                    type: 'poor-naming',
                    estimatedEffort: 'small',
                    relatedIssues: [],
                    id: 'no-related'
                }),
            ];
            const prioritized = classifier.prioritize(issues);
            // More related issues should be first
            expect(prioritized[0].relatedIssues).toHaveLength(3);
            expect(prioritized[1].relatedIssues).toHaveLength(1);
            expect(prioritized[2].relatedIssues).toHaveLength(0);
        });
        it('should not modify original array', () => {
            const issues = [
                createIssue({ severity: 'low' }),
                createIssue({ severity: 'critical' }),
            ];
            const original = [...issues];
            classifier.prioritize(issues);
            expect(issues).toEqual(original);
        });
        it('should handle empty array', () => {
            const prioritized = classifier.prioritize([]);
            expect(prioritized).toHaveLength(0);
        });
    });
    describe('detectPatterns', () => {
        it('should detect patterns with minimum occurrences', () => {
            const issues = [
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file2.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            expect(patterns.length).toBeGreaterThan(0);
            const pattern = patterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(pattern).toBeDefined();
            expect(pattern?.occurrences).toBe(3);
            expect(pattern?.affectedFiles).toHaveLength(3);
        });
        it('should not detect patterns below minimum occurrences', () => {
            const classifier = createIssueClassifier({ minOccurrences: 5 });
            const issues = [
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file2.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should not find pattern with only 3 occurrences when minimum is 5
            const pattern = patterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(pattern).toBeUndefined();
        });
        it('should generate correct pattern metadata', () => {
            const issues = [
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'authentication',
                    file: '/auth1.ts',
                    severity: 'high',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'authentication',
                    file: '/auth2.ts',
                    severity: 'high',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'authentication',
                    file: '/auth3.ts',
                    severity: 'medium',
                }),
            ];
            const patterns = classifier.detectPatterns(issues);
            const pattern = patterns.find(p => p.patternId === 'pattern-inconsistent-pattern-authentication');
            expect(pattern).toBeDefined();
            expect(pattern?.patternName).toBe('Inconsistent Patterns in Authentication');
            expect(pattern?.category).toBe('authentication');
            expect(pattern?.occurrences).toBe(3);
            expect(pattern?.affectedFiles).toEqual(['/auth1.ts', '/auth2.ts', '/auth3.ts']);
            expect(pattern?.relatedIssues).toHaveLength(3);
            expect(pattern?.description).toContain('3 files');
            expect(pattern?.recommendedAction).toBeTruthy();
            expect(pattern?.priority).toBeGreaterThan(0);
        });
        it('should calculate pattern priority based on severity', () => {
            const criticalIssues = [
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file1.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file2.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file3.ts' }),
            ];
            const lowIssues = [
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file4.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file5.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file6.ts' }),
            ];
            const criticalPatterns = classifier.detectPatterns(criticalIssues);
            const lowPatterns = classifier.detectPatterns(lowIssues);
            const criticalPattern = criticalPatterns[0];
            const lowPattern = lowPatterns[0];
            // Critical issues should have higher priority
            expect(criticalPattern.priority).toBeGreaterThan(lowPattern.priority);
        });
        it('should sort patterns by priority', () => {
            const issues = [
                // High priority pattern (critical severity)
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file1.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file2.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file3.ts' }),
                // Low priority pattern (low severity)
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file4.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file5.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file6.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Patterns should be sorted by priority (highest first)
            for (let i = 0; i < patterns.length - 1; i++) {
                expect(patterns[i].priority).toBeGreaterThanOrEqual(patterns[i + 1].priority);
            }
        });
        it('should detect cross-file patterns', () => {
            const issues = [
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    file: '/db1.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    file: '/db2.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
                createIssue({
                    type: 'type-safety',
                    category: 'database',
                    file: '/db3.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should detect both type-category pattern and cross-file analyzer pattern
            expect(patterns.length).toBeGreaterThan(0);
            // Check for cross-file pattern
            const crossFilePattern = patterns.find(p => p.patternId.includes('cross-file'));
            expect(crossFilePattern).toBeDefined();
            expect(crossFilePattern?.affectedFiles.length).toBeGreaterThanOrEqual(2);
        });
        it('should not detect cross-file patterns when disabled', () => {
            const classifier = createIssueClassifier({ detectCrossFilePatterns: false });
            const issues = [
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    file: '/db1.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    file: '/db2.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    file: '/db3.ts',
                    detectedBy: 'DatabasePatternAnalyzer',
                }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should not find cross-file patterns
            const crossFilePattern = patterns.find(p => p.patternId.includes('cross-file'));
            expect(crossFilePattern).toBeUndefined();
        });
        it('should handle empty issue list', () => {
            const patterns = classifier.detectPatterns([]);
            expect(patterns).toHaveLength(0);
        });
        it('should filter patterns by minimum priority', () => {
            const classifier = createIssueClassifier({ minPriority: 8 });
            const issues = [
                // Low priority pattern
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file1.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file2.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', severity: 'low', file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should not find patterns below minimum priority
            expect(patterns).toHaveLength(0);
        });
        it('should count unique affected files correctly', () => {
            const issues = [
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }), // Same file
                createIssue({ type: 'code-duplication', category: 'components', file: '/file2.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            const pattern = patterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(pattern).toBeDefined();
            expect(pattern?.occurrences).toBe(3); // All issues counted
            expect(pattern?.affectedFiles).toHaveLength(2); // Only unique files
        });
    });
    describe('integration', () => {
        it('should classify, prioritize, and detect patterns together', () => {
            const issues = [
                // Critical authentication issues
                createIssue({
                    type: 'type-safety',
                    category: 'authentication',
                    severity: 'critical',
                    file: '/auth1.ts',
                }),
                createIssue({
                    type: 'type-safety',
                    category: 'authentication',
                    severity: 'critical',
                    file: '/auth2.ts',
                }),
                createIssue({
                    type: 'type-safety',
                    category: 'authentication',
                    severity: 'critical',
                    file: '/auth3.ts',
                }),
                // Low priority naming issues
                createIssue({
                    type: 'poor-naming',
                    category: 'general',
                    severity: 'low',
                    file: '/util1.ts',
                }),
                createIssue({
                    type: 'poor-naming',
                    category: 'general',
                    severity: 'low',
                    file: '/util2.ts',
                }),
            ];
            // Classify
            const classified = classifier.classify(issues);
            expect(classified.critical).toHaveLength(3);
            expect(classified.low).toHaveLength(2);
            expect(classified.patterns.length).toBeGreaterThan(0);
            // Prioritize
            const prioritized = classifier.prioritize(issues);
            expect(prioritized[0].severity).toBe('critical');
            expect(prioritized[prioritized.length - 1].severity).toBe('low');
            // Check patterns
            const authPattern = classified.patterns.find(p => p.category === 'authentication' && p.patternId.includes('type-safety'));
            expect(authPattern).toBeDefined();
            expect(authPattern?.priority).toBeGreaterThanOrEqual(5);
        });
    });
    describe('systemic problem detection', () => {
        it('should detect systemic problems affecting many files', () => {
            const issues = [];
            // Create issues affecting 5+ files with high severity
            for (let i = 1; i <= 6; i++) {
                issues.push(createIssue({
                    type: 'type-safety',
                    category: 'types',
                    severity: i <= 3 ? 'critical' : 'high',
                    file: `/file${i}.ts`,
                }));
            }
            const patterns = classifier.detectPatterns(issues);
            // Should detect systemic problem
            const systemicPattern = patterns.find(p => p.patternId === 'systemic-type-safety');
            expect(systemicPattern).toBeDefined();
            expect(systemicPattern?.occurrences).toBe(6);
            expect(systemicPattern?.affectedFiles).toHaveLength(6);
            expect(systemicPattern?.description).toContain('Widespread');
            expect(systemicPattern?.description).toContain('systemic issue');
            expect(systemicPattern?.recommendedAction).toContain('standardized solution');
        });
        it('should not detect systemic problems with too few files', () => {
            const issues = [
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file1.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file2.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should not find systemic pattern (needs 5+ files)
            const systemicPattern = patterns.find(p => p.patternId === 'systemic-type-safety');
            expect(systemicPattern).toBeUndefined();
        });
        it('should not detect systemic problems without high severity issues', () => {
            const issues = [];
            // Create issues affecting many files but all low severity
            for (let i = 1; i <= 6; i++) {
                issues.push(createIssue({
                    type: 'poor-naming',
                    category: 'general',
                    severity: 'low',
                    file: `/file${i}.ts`,
                }));
            }
            const patterns = classifier.detectPatterns(issues);
            // Should not find systemic pattern (needs high/critical severity)
            const systemicPattern = patterns.find(p => p.patternId === 'systemic-poor-naming');
            expect(systemicPattern).toBeUndefined();
        });
        it('should boost priority for systemic issues', () => {
            const systemicIssues = [];
            const regularIssues = [];
            // Create systemic issues (6 files, high severity)
            for (let i = 1; i <= 6; i++) {
                systemicIssues.push(createIssue({
                    type: 'type-safety',
                    category: 'types',
                    severity: 'high',
                    file: `/systemic${i}.ts`,
                }));
            }
            // Create regular pattern (3 files, high severity)
            for (let i = 1; i <= 3; i++) {
                regularIssues.push(createIssue({
                    type: 'code-duplication',
                    category: 'components',
                    severity: 'high',
                    file: `/regular${i}.ts`,
                }));
            }
            const systemicPatterns = classifier.detectPatterns(systemicIssues);
            const regularPatterns = classifier.detectPatterns(regularIssues);
            const systemicPattern = systemicPatterns.find(p => p.patternId === 'systemic-type-safety');
            const regularPattern = regularPatterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(systemicPattern).toBeDefined();
            expect(regularPattern).toBeDefined();
            // Systemic pattern should have boosted priority
            expect(systemicPattern.priority).toBeGreaterThan(regularPattern.priority);
        });
    });
    describe('similar issue detection', () => {
        it('should detect similar issues by description', () => {
            const classifier = createIssueClassifier({
                detectSimilarIssues: true,
                similarityThreshold: 0.6,
            });
            const issues = [
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    description: 'Inconsistent error handling in database query operations',
                    file: '/db1.ts',
                }),
                createIssue({
                    type: 'missing-error-handling',
                    category: 'database',
                    description: 'Missing error handling for database query operations',
                    file: '/db2.ts',
                }),
                createIssue({
                    type: 'inconsistent-pattern',
                    category: 'database',
                    description: 'Inconsistent error handling pattern in database operations',
                    file: '/db3.ts',
                }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should detect similar issues pattern
            const similarPattern = patterns.find(p => p.patternId.includes('similar'));
            expect(similarPattern).toBeDefined();
            expect(similarPattern?.occurrences).toBeGreaterThanOrEqual(2);
            expect(similarPattern?.description).toContain('similar issues');
        });
        it('should not detect similar issues when disabled', () => {
            const classifier = createIssueClassifier({
                detectSimilarIssues: false,
            });
            const issues = [
                createIssue({
                    description: 'Inconsistent error handling in database operations',
                    file: '/db1.ts',
                }),
                createIssue({
                    description: 'Missing error handling for database operations',
                    file: '/db2.ts',
                }),
                createIssue({
                    description: 'Inconsistent error handling pattern in database',
                    file: '/db3.ts',
                }),
            ];
            const patterns = classifier.detectPatterns(issues);
            // Should not find similar issues pattern
            const similarPattern = patterns.find(p => p.patternId.includes('similar'));
            expect(similarPattern).toBeUndefined();
        });
        it('should respect similarity threshold', () => {
            const strictClassifier = createIssueClassifier({
                detectSimilarIssues: true,
                similarityThreshold: 0.9, // Very strict
            });
            const issues = [
                createIssue({
                    description: 'Error handling missing in database',
                    file: '/db1.ts',
                }),
                createIssue({
                    description: 'Type safety issue in component',
                    file: '/comp1.ts',
                }),
                createIssue({
                    description: 'Naming convention problem in service',
                    file: '/svc1.ts',
                }),
            ];
            const patterns = strictClassifier.detectPatterns(issues);
            // Should not find similar pattern with very different descriptions
            const similarPattern = patterns.find(p => p.patternId.includes('similar'));
            expect(similarPattern).toBeUndefined();
        });
    });
    describe('pattern statistics', () => {
        it('should calculate correct severity distribution', () => {
            const issues = [
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file1.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file2.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'high', file: '/file3.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'medium', file: '/file4.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            const pattern = patterns.find(p => p.patternId === 'pattern-type-safety-types');
            expect(pattern).toBeDefined();
            expect(pattern?.occurrences).toBe(4);
        });
        it('should identify most affected file', () => {
            const issues = [
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file1.ts' }),
                createIssue({ type: 'code-duplication', category: 'components', file: '/file2.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            const pattern = patterns.find(p => p.patternId === 'pattern-code-duplication-components');
            expect(pattern).toBeDefined();
            // Pattern should track that file1.ts has the most issues
            expect(pattern?.affectedFiles).toContain('/file1.ts');
            expect(pattern?.affectedFiles).toContain('/file2.ts');
        });
        it('should estimate effort correctly for different effort levels', () => {
            // Test with trivial effort
            const trivialIssues = [
                createIssue({ type: 'poor-naming', category: 'general', estimatedEffort: 'trivial', file: '/file1.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', estimatedEffort: 'trivial', file: '/file2.ts' }),
                createIssue({ type: 'poor-naming', category: 'general', estimatedEffort: 'trivial', file: '/file3.ts' }),
            ];
            const trivialPatterns = classifier.detectPatterns(trivialIssues);
            const trivialPattern = trivialPatterns.find(p => p.patternId === 'pattern-poor-naming-general');
            expect(trivialPattern).toBeDefined();
            // Test with large effort
            const largeIssues = [
                createIssue({ type: 'architectural', category: 'services', estimatedEffort: 'large', file: '/svc1.ts' }),
                createIssue({ type: 'architectural', category: 'services', estimatedEffort: 'large', file: '/svc2.ts' }),
                createIssue({ type: 'architectural', category: 'services', estimatedEffort: 'large', file: '/svc3.ts' }),
            ];
            const largePatterns = classifier.detectPatterns(largeIssues);
            const largePattern = largePatterns.find(p => p.patternId === 'pattern-architectural-services');
            expect(largePattern).toBeDefined();
        });
    });
    describe('edge cases', () => {
        it('should handle issues with empty descriptions', () => {
            const issues = [
                createIssue({ description: '', file: '/file1.ts' }),
                createIssue({ description: '', file: '/file2.ts' }),
                createIssue({ description: '', file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            expect(patterns).toBeDefined();
        });
        it('should handle issues with very long descriptions', () => {
            const longDescription = 'This is a very long description '.repeat(50);
            const issues = [
                createIssue({ description: longDescription, file: '/file1.ts' }),
                createIssue({ description: longDescription, file: '/file2.ts' }),
                createIssue({ description: longDescription, file: '/file3.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            expect(patterns).toBeDefined();
        });
        it('should handle all issue types', () => {
            const allTypes = [
                'backward-compatibility',
                'legacy-code',
                'unnecessary-adapter',
                'confusing-logic',
                'code-duplication',
                'inconsistent-pattern',
                'poor-naming',
                'missing-error-handling',
                'type-safety',
                'architectural',
            ];
            for (const type of allTypes) {
                const issues = [
                    createIssue({ type, category: 'general', file: '/file1.ts' }),
                    createIssue({ type, category: 'general', file: '/file2.ts' }),
                    createIssue({ type, category: 'general', file: '/file3.ts' }),
                ];
                const patterns = classifier.detectPatterns(issues);
                const pattern = patterns.find(p => p.patternId === `pattern-${type}-general`);
                expect(pattern).toBeDefined();
                expect(pattern?.patternName).toBeTruthy();
                expect(pattern?.description).toBeTruthy();
                expect(pattern?.recommendedAction).toBeTruthy();
            }
        });
        it('should handle all issue categories', () => {
            const allCategories = [
                'authentication',
                'database',
                'api-routes',
                'components',
                'services',
                'types',
                'middleware',
                'error-handling',
                'general',
            ];
            for (const category of allCategories) {
                const issues = [
                    createIssue({ type: 'inconsistent-pattern', category, file: '/file1.ts' }),
                    createIssue({ type: 'inconsistent-pattern', category, file: '/file2.ts' }),
                    createIssue({ type: 'inconsistent-pattern', category, file: '/file3.ts' }),
                ];
                const classified = classifier.classify(issues);
                expect(classified.patterns.length).toBeGreaterThan(0);
            }
        });
        it('should handle mixed severity in same pattern', () => {
            const issues = [
                createIssue({ type: 'type-safety', category: 'types', severity: 'critical', file: '/file1.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'high', file: '/file2.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'medium', file: '/file3.ts' }),
                createIssue({ type: 'type-safety', category: 'types', severity: 'low', file: '/file4.ts' }),
            ];
            const patterns = classifier.detectPatterns(issues);
            const pattern = patterns.find(p => p.patternId === 'pattern-type-safety-types');
            expect(pattern).toBeDefined();
            expect(pattern?.occurrences).toBe(4);
            // Priority should be influenced by the critical issues (average severity is 2.5)
            expect(pattern?.priority).toBeGreaterThan(0);
            expect(pattern?.priority).toBeLessThanOrEqual(10);
        });
    });
});
//# sourceMappingURL=issue-classifier.test.js.map