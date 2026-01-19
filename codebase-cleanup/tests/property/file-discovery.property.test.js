/**
 * Property-based tests for file discovery completeness
 *
 * Feature: codebase-cleanup, Property 1: Complete File Discovery
 *
 * **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1, 15.1**
 *
 * Property: For any directory structure with TypeScript/JavaScript files,
 * scanning should discover all files matching the specified patterns without
 * missing any files.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileScannerImpl } from '../../src/scanner/file-scanner.js';
describe('Property 1: Complete File Discovery', () => {
    const testBaseDir = path.join(process.cwd(), 'tests', 'property', 'temp-test-dirs');
    let testDirCounter = 0;
    beforeEach(async () => {
        // Ensure base test directory exists
        await fs.mkdir(testBaseDir, { recursive: true });
    });
    afterEach(async () => {
        // Clean up test directories after each test
        try {
            await fs.rm(testBaseDir, { recursive: true, force: true });
        }
        catch (_error) {
            // Ignore cleanup errors
        }
    });
    /**
     * Helper to create a unique test directory
     */
    async function createTestDir() {
        const dirName = `test-${Date.now()}-${testDirCounter++}`;
        const dirPath = path.join(testBaseDir, dirName);
        await fs.mkdir(dirPath, { recursive: true });
        return dirPath;
    }
    /**
     * Helper to create a directory structure with files
     */
    async function createDirectoryStructure(rootPath, structure) {
        for (const [name, content] of Object.entries(structure)) {
            const fullPath = path.join(rootPath, name);
            if (typeof content === 'string') {
                // It's a file
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content, 'utf-8');
            }
            else {
                // It's a directory
                await fs.mkdir(fullPath, { recursive: true });
                await createDirectoryStructure(fullPath, content);
            }
        }
    }
    /**
     * Helper to count expected files matching patterns
     */
    function countExpectedFiles(structure, includePatterns, excludePatterns, basePath = '') {
        let count = 0;
        for (const [name, content] of Object.entries(structure)) {
            const relativePath = basePath ? `${basePath}/${name}` : name;
            if (typeof content === 'string') {
                // It's a file - check if it matches patterns
                const matchesInclude = includePatterns.length === 0 ||
                    includePatterns.some(pattern => matchPattern(relativePath, pattern));
                const matchesExclude = excludePatterns.some(pattern => matchPattern(relativePath, pattern));
                if (matchesInclude && !matchesExclude) {
                    count++;
                }
            }
            else {
                // It's a directory - recurse
                count += countExpectedFiles(content, includePatterns, excludePatterns, relativePath);
            }
        }
        return count;
    }
    /**
     * Simple glob pattern matcher for testing
     */
    function matchPattern(filePath, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(filePath);
    }
    /**
     * Arbitrary generator for file extensions
     */
    const fileExtensionArb = fc.constantFrom('.ts', '.tsx', '.js', '.jsx', '.json', '.md');
    /**
     * Arbitrary generator for file names
     */
    const fileNameArb = fc.tuple(fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/), fileExtensionArb).map(([name, ext]) => `${name}${ext}`);
    /**
     * Arbitrary generator for directory names
     */
    const dirNameArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/);
    /**
     * Arbitrary generator for simple directory structures
     */
    const simpleStructureArb = fc.dictionary(fileNameArb, fc.constant('// test file content'));
    /**
     * Arbitrary generator for nested directory structures
     */
    const nestedStructureArb = fc.letrec(tie => ({
        structure: fc.oneof(
        // Leaf: just files
        fc.dictionary(fileNameArb, fc.constant('// test file content'), { minKeys: 1, maxKeys: 5 }), 
        // Branch: mix of files and subdirectories
        fc.dictionary(fc.oneof(fileNameArb, dirNameArb), fc.oneof(fc.constant('// test file content'), tie('structure')), { minKeys: 1, maxKeys: 3 }))
    })).structure;
    it('should discover all TypeScript/JavaScript files in a flat directory', async () => {
        await fc.assert(fc.asyncProperty(simpleStructureArb, async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            const expectedCount = countExpectedFiles(structure, options.includePatterns, options.excludePatterns);
            expect(files.length).toBe(expectedCount);
        }), { numRuns: 100 });
    });
    it('should discover all files in nested directory structures', async () => {
        await fc.assert(fc.asyncProperty(nestedStructureArb, async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            const expectedCount = countExpectedFiles(structure, options.includePatterns, options.excludePatterns);
            expect(files.length).toBe(expectedCount);
        }), { numRuns: 100 });
    });
    it('should respect include patterns and discover only matching files', async () => {
        await fc.assert(fc.asyncProperty(simpleStructureArb, fc.constantFrom(['**/*.ts'], ['**/*.tsx'], ['**/*.js', '**/*.jsx'], ['**/*.ts', '**/*.tsx']), async (structure, includePatterns) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns,
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            const expectedCount = countExpectedFiles(structure, options.includePatterns, options.excludePatterns);
            expect(files.length).toBe(expectedCount);
            // Verify all discovered files match at least one include pattern
            files.forEach(file => {
                const matches = includePatterns.some(pattern => matchPattern(file.relativePath, pattern));
                expect(matches).toBe(true);
            });
        }), { numRuns: 100 });
    });
    it('should respect exclude patterns and skip excluded files', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            'src/file1.ts': fc.constant('// content'),
            'src/file2.ts': fc.constant('// content'),
            'node_modules/lib.ts': fc.constant('// content'),
            'dist/output.ts': fc.constant('// content'),
        }), async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts'],
                excludePatterns: ['**/node_modules/**', '**/dist/**'],
            };
            const files = await scanner.scanDirectory(testDir, options);
            // Should find only src files, not node_modules or dist
            expect(files.length).toBe(2);
            expect(files.every(f => !f.relativePath.includes('node_modules'))).toBe(true);
            expect(files.every(f => !f.relativePath.includes('dist'))).toBe(true);
        }), { numRuns: 100 });
    });
    it('should respect maxDepth option and not scan beyond specified depth', async () => {
        await fc.assert(fc.asyncProperty(fc.integer({ min: 0, max: 3 }), async (maxDepth) => {
            const testDir = await createTestDir();
            // Create a deep structure: level0/level1/level2/level3/file.ts
            const deepStructure = {
                'level0': {
                    'file0.ts': '// level 0',
                    'level1': {
                        'file1.ts': '// level 1',
                        'level2': {
                            'file2.ts': '// level 2',
                            'level3': {
                                'file3.ts': '// level 3',
                            }
                        }
                    }
                }
            };
            await createDirectoryStructure(testDir, deepStructure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts'],
                excludePatterns: [],
                maxDepth,
            };
            const files = await scanner.scanDirectory(testDir, options);
            // Count files at or below maxDepth
            // maxDepth 0: file0.ts (1 file)
            // maxDepth 1: file0.ts, file1.ts (2 files)
            // maxDepth 2: file0.ts, file1.ts, file2.ts (3 files)
            // maxDepth 3: all 4 files
            const expectedCount = Math.min(maxDepth + 1, 4);
            expect(files.length).toBe(expectedCount);
        }), { numRuns: 100 });
    });
    it('should handle empty directories without errors', async () => {
        await fc.assert(fc.asyncProperty(fc.constant({}), async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts'],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            expect(files.length).toBe(0);
        }), { numRuns: 100 });
    });
    it('should discover all files when no include patterns are specified', async () => {
        await fc.assert(fc.asyncProperty(simpleStructureArb, async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: [],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            const expectedCount = Object.keys(structure).length;
            expect(files.length).toBe(expectedCount);
        }), { numRuns: 100 });
    });
    it('should correctly categorize discovered files', async () => {
        const testStructure = {
            'components/Button.tsx': '// component',
            'app/api/users/route.ts': '// api route',
            'backend/services/auth.ts': '// service',
            'types/user.d.ts': '// types',
            'utils/helpers.ts': '// util',
            'middleware.ts': '// middleware',
            'config.ts': '// config',
            'tests/unit/test.test.ts': '// test',
            'other.ts': '// other',
        };
        await fc.assert(fc.asyncProperty(fc.constant(testStructure), async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts', '**/*.tsx'],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            // Verify categorization
            const buttonFile = files.find(f => f.relativePath.includes('Button.tsx'));
            expect(buttonFile?.category).toBe('component');
            const routeFile = files.find(f => f.relativePath.includes('route.ts'));
            expect(routeFile?.category).toBe('api-route');
            const serviceFile = files.find(f => f.relativePath.includes('auth.ts'));
            expect(serviceFile?.category).toBe('service');
            const typeFile = files.find(f => f.relativePath.includes('user.d.ts'));
            expect(typeFile?.category).toBe('type');
            const utilFile = files.find(f => f.relativePath.includes('helpers.ts'));
            expect(utilFile?.category).toBe('util');
            const middlewareFile = files.find(f => f.relativePath.includes('middleware.ts'));
            expect(middlewareFile?.category).toBe('middleware');
            const configFile = files.find(f => f.relativePath.includes('config.ts'));
            expect(configFile?.category).toBe('config');
            const testFile = files.find(f => f.relativePath.includes('test.test.ts'));
            expect(testFile?.category).toBe('test');
        }), { numRuns: 100 });
    });
    it('should provide correct file metadata for all discovered files', async () => {
        await fc.assert(fc.asyncProperty(simpleStructureArb, async (structure) => {
            const testDir = await createTestDir();
            await createDirectoryStructure(testDir, structure);
            const scanner = new FileScannerImpl();
            const options = {
                includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                excludePatterns: [],
            };
            const files = await scanner.scanDirectory(testDir, options);
            // Verify all files have required metadata
            files.forEach(file => {
                expect(file.path).toBeTruthy();
                expect(file.relativePath).toBeTruthy();
                expect(file.extension).toBeTruthy();
                expect(file.size).toBeGreaterThanOrEqual(0);
                expect(file.category).toBeTruthy();
                expect(file.lastModified).toBeInstanceOf(Date);
                // Verify path consistency
                expect(file.path).toContain(file.relativePath);
            });
        }), { numRuns: 100 });
    });
    it('should handle symbolic links safely without infinite loops', async () => {
        const testDir = await createTestDir();
        // Create a directory with a file
        const realDir = path.join(testDir, 'real');
        await fs.mkdir(realDir, { recursive: true });
        await fs.writeFile(path.join(realDir, 'file.ts'), '// content', 'utf-8');
        // Create a symbolic link pointing back to parent (potential circular reference)
        const linkPath = path.join(realDir, 'link-to-parent');
        try {
            await fs.symlink(testDir, linkPath, 'dir');
        }
        catch (_error) {
            // Skip test if symlinks are not supported (e.g., Windows without admin)
            return;
        }
        const scanner = new FileScannerImpl();
        const options = {
            includePatterns: ['**/*.ts'],
            excludePatterns: [],
        };
        // Should complete without hanging or errors
        const files = await scanner.scanDirectory(testDir, options);
        // Should find the file but not loop infinitely
        expect(files.length).toBeGreaterThan(0);
        expect(files.some(f => f.relativePath.includes('file.ts'))).toBe(true);
    });
});
//# sourceMappingURL=file-discovery.property.test.js.map