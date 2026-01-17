/**
 * Unit tests for core type definitions
 *
 * These tests verify that the type system is correctly defined
 * and that type guards work as expected.
 */
import { describe, it, expect } from 'vitest';
describe('Core Types', () => {
    describe('FileInfo', () => {
        it('should create a valid FileInfo object', () => {
            const fileInfo = {
                path: '/absolute/path/to/file.ts',
                relativePath: 'src/file.ts',
                extension: '.ts',
                size: 1024,
                category: 'component',
                lastModified: new Date('2024-01-01'),
            };
            expect(fileInfo.path).toBe('/absolute/path/to/file.ts');
            expect(fileInfo.category).toBe('component');
            expect(fileInfo.size).toBe(1024);
        });
        it('should support all file categories', () => {
            const categories = [
                'component',
                'api-route',
                'service',
                'type',
                'util',
                'middleware',
                'config',
                'test',
                'other',
            ];
            categories.forEach((category) => {
                const fileInfo = {
                    path: '/path/to/file.ts',
                    relativePath: 'file.ts',
                    extension: '.ts',
                    size: 100,
                    category,
                    lastModified: new Date(),
                };
                expect(fileInfo.category).toBe(category);
            });
        });
    });
    describe('Issue', () => {
        it('should create a valid Issue object', () => {
            const location = {
                startLine: 10,
                endLine: 15,
                startColumn: 5,
                endColumn: 20,
            };
            const issue = {
                id: 'issue-123',
                type: 'confusing-logic',
                severity: 'high',
                category: 'components',
                file: 'src/components/MyComponent.tsx',
                location,
                description: 'Deeply nested conditional logic',
                codeSnippet: 'if (a) { if (b) { if (c) { ... } } }',
                recommendation: 'Refactor to reduce nesting',
                estimatedEffort: 'small',
                tags: ['complexity', 'readability'],
                detectedBy: 'CodeQualityAnalyzer',
                detectedAt: new Date('2024-01-01'),
                relatedIssues: [],
            };
            expect(issue.id).toBe('issue-123');
            expect(issue.type).toBe('confusing-logic');
            expect(issue.severity).toBe('high');
            expect(issue.location.startLine).toBe(10);
        });
        it('should support all severity levels', () => {
            const severities = ['critical', 'high', 'medium', 'low'];
            severities.forEach((severity) => {
                expect(['critical', 'high', 'medium', 'low']).toContain(severity);
            });
        });
        it('should support all effort levels', () => {
            const efforts = ['trivial', 'small', 'medium', 'large'];
            efforts.forEach((effort) => {
                expect(['trivial', 'small', 'medium', 'large']).toContain(effort);
            });
        });
        it('should support all issue types', () => {
            const types = [
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
            types.forEach((type) => {
                expect([
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
                ]).toContain(type);
            });
        });
        it('should support all issue categories', () => {
            const categories = [
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
            categories.forEach((category) => {
                expect([
                    'authentication',
                    'database',
                    'api-routes',
                    'components',
                    'services',
                    'types',
                    'middleware',
                    'error-handling',
                    'general',
                ]).toContain(category);
            });
        });
    });
    describe('CodeLocation', () => {
        it('should create a valid CodeLocation object', () => {
            const location = {
                startLine: 1,
                endLine: 10,
                startColumn: 0,
                endColumn: 50,
            };
            expect(location.startLine).toBe(1);
            expect(location.endLine).toBe(10);
            expect(location.startColumn).toBe(0);
            expect(location.endColumn).toBe(50);
        });
        it('should support single-line locations', () => {
            const location = {
                startLine: 5,
                endLine: 5,
                startColumn: 10,
                endColumn: 30,
            };
            expect(location.startLine).toBe(location.endLine);
        });
    });
    describe('RiskLevel', () => {
        it('should support all risk levels', () => {
            const risks = ['low', 'medium', 'high', 'critical'];
            risks.forEach((risk) => {
                expect(['low', 'medium', 'high', 'critical']).toContain(risk);
            });
        });
    });
});
//# sourceMappingURL=types.test.js.map