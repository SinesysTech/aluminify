/**
 * Unit tests for FileScanner implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileScannerImpl } from '../../../src/scanner/file-scanner.js';
import type { ScanOptions } from '../../../src/types.js';

describe('FileScannerImpl', () => {
  let scanner: FileScannerImpl;
  let testDir: string;

  beforeEach(async () => {
    scanner = new FileScannerImpl();
    // Create a temporary test directory
    testDir = path.join(process.cwd(), 'test-temp-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe('scanDirectory', () => {
    it('should discover all files in a simple directory structure', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'file2.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'file3.js'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(3);
      expect(files.map(f => path.basename(f.path)).sort()).toEqual([
        'file1.ts',
        'file2.tsx',
        'file3.js',
      ].sort());
    });

    it('should discover files in nested directories', async () => {
      // Create nested structure
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'root.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'index.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'components', 'Button.tsx'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(3);
      const relativePaths = files.map(f => f.relativePath.replace(/\\/g, '/')).sort();
      expect(relativePaths).toContain('root.ts');
      expect(relativePaths).toContain('src/index.ts');
      expect(relativePaths).toContain('src/components/Button.tsx');
    });

    it('should respect maxDepth option', async () => {
      // Create nested structure
      await fs.mkdir(path.join(testDir, 'level1'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'level1', 'level2'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'level1', 'level2', 'level3'), { recursive: true });
      
      await fs.writeFile(path.join(testDir, 'root.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'level1', 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'level1', 'level2', 'file2.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'level1', 'level2', 'level3', 'file3.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
        maxDepth: 2,
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find root.ts, level1/file1.ts, and level1/level2/file2.ts
      // Should NOT find level1/level2/level3/file3.ts (depth 3)
      expect(files).toHaveLength(3);
      const relativePaths = files.map(f => f.relativePath.replace(/\\/g, '/'));
      expect(relativePaths).toContain('root.ts');
      expect(relativePaths).toContain('level1/file1.ts');
      expect(relativePaths).toContain('level1/level2/file2.ts');
      expect(relativePaths).not.toContain('level1/level2/level3/file3.ts');
    });

    it('should handle empty directories', async () => {
      await fs.mkdir(path.join(testDir, 'empty'), { recursive: true });

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(0);
    });

    it('should return empty array for non-existent directory', async () => {
      const nonExistentDir = path.join(testDir, 'does-not-exist');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(nonExistentDir, options);

      expect(files).toHaveLength(0);
    });

    it('should handle symbolic links to files', async () => {
      const targetFile = path.join(testDir, 'target.ts');
      const linkFile = path.join(testDir, 'link.ts');
      
      await fs.writeFile(targetFile, 'content');
      
      try {
        await fs.symlink(targetFile, linkFile);
      } catch (_error) {
        // Skip test if symlinks are not supported (e.g., Windows without admin)
        console.log('Skipping symlink test - symlinks not supported');
        return;
      }

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find both the target and the link
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle symbolic links to directories without infinite loops', async () => {
      const subDir = path.join(testDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'file.ts'), 'content');

      const linkDir = path.join(testDir, 'link-to-subdir');

      try {
        await fs.symlink(subDir, linkDir, 'dir');
      } catch (_error) {
        // Skip test if symlinks are not supported
        console.log('Skipping symlink test - symlinks not supported');
        return;
      }

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find the file, but not get stuck in infinite loop
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('should populate FileInfo fields correctly', async () => {
      const fileName = 'test.ts';
      const filePath = path.join(testDir, fileName);
      const content = 'test content';
      await fs.writeFile(filePath, content);

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      const file = files[0];
      
      expect(file.path).toBe(filePath);
      expect(file.relativePath).toBe(fileName);
      expect(file.extension).toBe('.ts');
      expect(file.size).toBe(content.length);
      expect(file.lastModified).toBeInstanceOf(Date);
      expect(file.category).toBeDefined();
    });
  });

  describe('filterByPattern', () => {
    it('should filter files by include patterns', async () => {
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'file2.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'file3.js'), 'content');

      const options: ScanOptions = {
        includePatterns: ['**/*.ts', '**/*.tsx'],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(2);
      expect(files.every(f => f.extension === '.ts' || f.extension === '.tsx')).toBe(true);
    });

    it('should handle multiple include patterns', async () => {
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'src', 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'file2.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'file3.js'), 'content');

      const options: ScanOptions = {
        includePatterns: ['**/src/**/*.ts', '**/*.js'],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(2);
      const names = files.map(f => path.basename(f.path)).sort();
      expect(names).toEqual(['file1.ts', 'file3.js'].sort());
    });
  });

  describe('excludeByPattern', () => {
    it('should exclude files by exclude patterns', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'node_modules', 'package.js'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: ['**/node_modules/**'],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe('file1.ts');
    });

    it('should handle multiple exclude patterns', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.next'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'file1.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'node_modules', 'package.js'), 'content');
      await fs.writeFile(path.join(testDir, '.next', 'build.js'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: ['**/node_modules/**', '**/.next/**'],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe('file1.ts');
    });
  });

  describe('file categorization', () => {
    it('should categorize React components correctly', async () => {
      await fs.mkdir(path.join(testDir, 'components'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'components', 'Button.tsx'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('component');
    });

    it('should categorize API routes correctly', async () => {
      await fs.mkdir(path.join(testDir, 'app', 'api', 'users'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'app', 'api', 'users', 'route.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('api-route');
    });

    it('should categorize services correctly', async () => {
      await fs.mkdir(path.join(testDir, 'backend', 'services'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'backend', 'services', 'user-service.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('service');
    });

    it('should categorize type definition files correctly', async () => {
      await fs.mkdir(path.join(testDir, 'types'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'types', 'user.d.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('type');
    });

    it('should categorize utility files correctly', async () => {
      await fs.mkdir(path.join(testDir, 'utils'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'utils', 'format.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('util');
    });

    it('should categorize middleware files correctly', async () => {
      await fs.writeFile(path.join(testDir, 'middleware.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('middleware');
    });

    it('should categorize config files correctly', async () => {
      await fs.writeFile(path.join(testDir, 'next.config.js'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('config');
    });

    it('should categorize test files correctly', async () => {
      await fs.writeFile(path.join(testDir, 'component.test.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('test');
    });

    it('should categorize unknown files as other', async () => {
      await fs.writeFile(path.join(testDir, 'random.txt'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].category).toBe('other');
    });
  });

  describe('edge cases', () => {
    it('should handle files with no extension', async () => {
      await fs.writeFile(path.join(testDir, 'README'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].extension).toBe('');
    });

    it('should handle deeply nested directory structures (10+ levels)', async () => {
      let currentPath = testDir;
      for (let i = 0; i < 10; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        await fs.mkdir(currentPath, { recursive: true });
      }
      await fs.writeFile(path.join(currentPath, 'deep.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(files[0].relativePath).toContain('deep.ts');
      // Verify it's actually 10+ levels deep
      const pathParts = files[0].relativePath.split(path.sep);
      expect(pathParts.length).toBeGreaterThanOrEqual(11); // 10 levels + filename
    });

    it('should handle files with special characters in names', async () => {
      const specialName = 'file-with-special_chars.test.ts';
      await fs.writeFile(path.join(testDir, specialName), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe(specialName);
    });

    it('should handle complex include/exclude pattern combinations', async () => {
      // Create a complex directory structure
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'utils'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });

      await fs.writeFile(path.join(testDir, 'src', 'components', 'Button.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'components', 'Input.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'utils', 'format.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'utils', 'validate.js'), 'content');
      await fs.writeFile(path.join(testDir, 'tests', 'test.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'node_modules', 'package.js'), 'content');

      const options: ScanOptions = {
        includePatterns: ['**/src/**/*.ts', '**/src/**/*.tsx'],
        excludePatterns: ['**/node_modules/**', '**/tests/**'],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find: Button.tsx, Input.tsx, format.ts
      // Should NOT find: validate.js (wrong extension), test.ts (excluded), package.js (excluded)
      expect(files).toHaveLength(3);
      const names = files.map(f => path.basename(f.path)).sort();
      expect(names).toEqual(['Button.tsx', 'Input.tsx', 'format.ts'].sort());
    });

    it('should handle circular symbolic links without infinite loops', async () => {
      const dir1 = path.join(testDir, 'dir1');
      const dir2 = path.join(testDir, 'dir2');
      
      await fs.mkdir(dir1, { recursive: true });
      await fs.mkdir(dir2, { recursive: true });
      await fs.writeFile(path.join(dir1, 'file1.ts'), 'content');
      await fs.writeFile(path.join(dir2, 'file2.ts'), 'content');

      try {
        // Create circular symlinks: dir1/link -> dir2, dir2/link -> dir1
        await fs.symlink(dir2, path.join(dir1, 'link-to-dir2'), 'dir');
        await fs.symlink(dir1, path.join(dir2, 'link-to-dir1'), 'dir');
      } catch (_error) {
        console.log('Skipping circular symlink test - symlinks not supported');
        return;
      }

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      // This should complete without hanging
      const files = await scanner.scanDirectory(testDir, options);

      // Should find both files without getting stuck
      expect(files.length).toBeGreaterThanOrEqual(2);
      const names = files.map(f => path.basename(f.path));
      expect(names).toContain('file1.ts');
      expect(names).toContain('file2.ts');
    });

    it('should handle mixed file types in same directory', async () => {
      // Create various file types in the same directory
      await fs.writeFile(path.join(testDir, 'component.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'script.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'script.js'), 'content');
      await fs.writeFile(path.join(testDir, 'styles.css'), 'content');
      await fs.writeFile(path.join(testDir, 'data.json'), 'content');
      await fs.writeFile(path.join(testDir, 'README.md'), 'content');
      await fs.writeFile(path.join(testDir, 'image.png'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(7);
      
      // Verify all files are discovered
      const names = files.map(f => path.basename(f.path)).sort();
      expect(names).toEqual([
        'README.md',
        'component.tsx',
        'data.json',
        'image.png',
        'script.js',
        'script.ts',
        'styles.css',
      ].sort());
    });

    it('should handle empty nested directories', async () => {
      // Create nested empty directories
      await fs.mkdir(path.join(testDir, 'empty1', 'empty2', 'empty3'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'with-file'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'with-file', 'file.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should only find the one file, not count empty directories
      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe('file.ts');
    });

    it('should handle maxDepth with deeply nested structures', async () => {
      // Create 15 levels deep
      let currentPath = testDir;
      for (let i = 0; i < 15; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        await fs.mkdir(currentPath, { recursive: true });
        await fs.writeFile(path.join(currentPath, `file${i}.ts`), 'content');
      }

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
        maxDepth: 5,
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find files at depth 0-5 (6 files total)
      expect(files).toHaveLength(6);
      
      // Verify no files beyond depth 5
      for (const file of files) {
        const depth = file.relativePath.split(path.sep).length - 1;
        expect(depth).toBeLessThanOrEqual(5);
      }
    });

    it('should handle patterns with wildcards correctly', async () => {
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'test'), { recursive: true });
      
      await fs.writeFile(path.join(testDir, 'src', 'index.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'src', 'index.test.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'test', 'unit.test.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'README.md'), 'content');

      const options: ScanOptions = {
        includePatterns: ['**/*.ts'],
        excludePatterns: ['**/*.test.ts'],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should only find src/index.ts (not test files, not .md)
      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe('index.ts');
    });

    it('should handle files with multiple dots in names', async () => {
      await fs.writeFile(path.join(testDir, 'component.test.tsx'), 'content');
      await fs.writeFile(path.join(testDir, 'config.dev.ts'), 'content');
      await fs.writeFile(path.join(testDir, 'types.d.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(3);
      
      // Verify extensions are captured correctly
      const fileMap = new Map(files.map(f => [path.basename(f.path), f.extension]));
      expect(fileMap.get('component.test.tsx')).toBe('.tsx');
      expect(fileMap.get('config.dev.ts')).toBe('.ts');
      expect(fileMap.get('types.d.ts')).toBe('.ts');
    });

    it('should handle very long file paths', async () => {
      // Create a path with very long directory names
      const longDirName = 'a'.repeat(50);
      const deepPath = path.join(testDir, longDirName, longDirName, longDirName);
      await fs.mkdir(deepPath, { recursive: true });
      
      const longFileName = 'very-long-file-name-' + 'x'.repeat(100) + '.ts';
      await fs.writeFile(path.join(deepPath, longFileName), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe(longFileName);
    });

    it('should handle broken symbolic links gracefully', async () => {
      const targetFile = path.join(testDir, 'target.ts');
      const linkFile = path.join(testDir, 'link.ts');
      
      // Create a symlink to a non-existent file
      try {
        await fs.symlink(targetFile, linkFile);
      } catch (_error) {
        console.log('Skipping broken symlink test - symlinks not supported');
        return;
      }

      // Create a valid file
      await fs.writeFile(path.join(testDir, 'valid.ts'), 'content');

      const options: ScanOptions = {
        includePatterns: [],
        excludePatterns: [],
      };

      const files = await scanner.scanDirectory(testDir, options);

      // Should find the valid file and skip the broken symlink
      expect(files).toHaveLength(1);
      expect(path.basename(files[0].path)).toBe('valid.ts');
    });
  });
});
