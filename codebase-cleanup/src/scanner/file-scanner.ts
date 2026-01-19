/**
 * FileScanner implementation for discovering and categorizing files in the codebase
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { minimatch } from 'minimatch';
import type { FileScanner, FileInfo, FileCategory, ScanOptions } from '../types.js';

/**
 * Implementation of FileScanner for recursive directory traversal and file categorization
 */
export class FileScannerImpl implements FileScanner {
  private visitedPaths = new Set<string>();

  /**
   * Scan a directory recursively and return information about all matching files
   * @param rootPath - The root directory to start scanning from
   * @param options - Scan options including include/exclude patterns and max depth
   * @returns Array of FileInfo objects for all discovered files
   */
  async scanDirectory(rootPath: string, options: ScanOptions): Promise<FileInfo[]> {
    // Reset visited paths for each scan
    this.visitedPaths.clear();

    const absoluteRoot = path.resolve(rootPath);
    const files: FileInfo[] = [];

    try {
      await this.scanRecursive(absoluteRoot, absoluteRoot, 0, options, files);
    } catch (error) {
      // If root path doesn't exist or is inaccessible, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || 
          (error as NodeJS.ErrnoException).code === 'EACCES') {
        return [];
      }
      throw error;
    }

    // Apply include patterns if specified
    let filteredFiles = files;
    if (options.includePatterns.length > 0) {
      filteredFiles = this.filterByPattern(filteredFiles, options.includePatterns);
    }

    // Apply exclude patterns
    if (options.excludePatterns.length > 0) {
      filteredFiles = this.excludeByPattern(filteredFiles, options.excludePatterns);
    }

    return filteredFiles;
  }

  /**
   * Recursively scan a directory
   * @param currentPath - Current directory being scanned
   * @param rootPath - Original root path for calculating relative paths
   * @param depth - Current depth in the directory tree
   * @param options - Scan options
   * @param files - Accumulator for discovered files
   */
  private async scanRecursive(
    currentPath: string,
    rootPath: string,
    depth: number,
    options: ScanOptions,
    files: FileInfo[]
  ): Promise<void> {
    // Check max depth
    if (options.maxDepth !== undefined && depth > options.maxDepth) {
      return;
    }

    // Check for circular references using real path
    let realPath: string;
    try {
      realPath = await fs.realpath(currentPath);
    } catch (_error) {
      // If we can't resolve the real path (permission denied, etc.), skip this path
      return;
    }

    if (this.visitedPaths.has(realPath)) {
      // Circular reference detected, skip
      return;
    }
    this.visitedPaths.add(realPath);

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (_error) {
      // Permission denied or other error, skip this directory
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanRecursive(fullPath, rootPath, depth + 1, options, files);
        } else if (entry.isFile()) {
          // Add file to results
          const fileInfo = await this.createFileInfo(fullPath, rootPath);
          files.push(fileInfo);
        } else if (entry.isSymbolicLink()) {
          // Handle symbolic links
          await this.handleSymbolicLink(fullPath, rootPath, depth, options, files);
        }
      } catch (_error) {
        // Skip files/directories that cause errors (permission denied, etc.)
        continue;
      }
    }
  }

  /**
   * Handle symbolic links safely
   * @param linkPath - Path to the symbolic link
   * @param rootPath - Original root path
   * @param depth - Current depth
   * @param options - Scan options
   * @param files - Accumulator for discovered files
   */
  private async handleSymbolicLink(
    linkPath: string,
    rootPath: string,
    depth: number,
    options: ScanOptions,
    files: FileInfo[]
  ): Promise<void> {
    try {
      const stats = await fs.stat(linkPath);
      
      if (stats.isDirectory()) {
        // Follow symbolic link to directory
        await this.scanRecursive(linkPath, rootPath, depth + 1, options, files);
      } else if (stats.isFile()) {
        // Add symbolic link to file
        const fileInfo = await this.createFileInfo(linkPath, rootPath);
        files.push(fileInfo);
      }
    } catch (_error) {
      // Broken symbolic link or permission denied, skip
      return;
    }
  }

  /**
   * Create FileInfo object for a file
   * @param filePath - Absolute path to the file
   * @param rootPath - Root path for calculating relative path
   * @returns FileInfo object
   */
  private async createFileInfo(filePath: string, rootPath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(rootPath, filePath);
    const extension = path.extname(filePath);
    const category = this.categorizeFile(relativePath, extension);

    return {
      path: filePath,
      relativePath,
      extension,
      size: stats.size,
      category,
      lastModified: stats.mtime,
    };
  }

  /**
   * Categorize a file based on its path and extension
   * @param relativePath - Relative path to the file
   * @param extension - File extension
   * @returns FileCategory
   */
  private categorizeFile(relativePath: string, extension: string): FileCategory {
    const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();

    // Debug log (remove after fixing)
    // console.log('Categorizing:', { relativePath, normalizedPath, extension });

    // Test files
    if (
      normalizedPath.includes('.test.') ||
      normalizedPath.includes('.spec.') ||
      normalizedPath.includes('/__tests__/') ||
      normalizedPath.includes('/tests/') ||
      normalizedPath.includes('/test/')
    ) {
      return 'test';
    }

    // Type definition files
    if (
      extension === '.d.ts' ||
      normalizedPath.includes('/types/') ||
      normalizedPath.startsWith('types/') ||
      normalizedPath.includes('/type/') ||
      normalizedPath.startsWith('type/') ||
      normalizedPath.endsWith('types.ts') ||
      normalizedPath.endsWith('types.tsx')
    ) {
      return 'type';
    }

    // API routes (Next.js patterns)
    if (
      normalizedPath.includes('/api/') ||
      normalizedPath.includes('/route.ts') ||
      normalizedPath.includes('/route.tsx') ||
      normalizedPath.match(/\/app\/.*\/route\.(ts|tsx|js|jsx)$/)
    ) {
      return 'api-route';
    }

    // React components
    if (
      (extension === '.tsx' || extension === '.jsx') &&
      (normalizedPath.includes('/components/') ||
       normalizedPath.startsWith('components/') ||
       normalizedPath.includes('/component/') ||
       normalizedPath.startsWith('component/') ||
       normalizedPath.match(/\/app\/.*\/(page|layout|loading|error|not-found)\.(tsx|jsx)$/))
    ) {
      return 'component';
    }

    // Services
    if (
      normalizedPath.includes('/services/') ||
      normalizedPath.includes('/service/') ||
      normalizedPath.includes('/backend/') ||
      normalizedPath.endsWith('service.ts') ||
      normalizedPath.endsWith('service.tsx')
    ) {
      return 'service';
    }

    // Middleware
    if (
      normalizedPath.includes('/middleware/') ||
      normalizedPath.includes('middleware.ts') ||
      normalizedPath.includes('middleware.tsx') ||
      normalizedPath.includes('middleware.js') ||
      normalizedPath.includes('middleware.jsx')
    ) {
      return 'middleware';
    }

    // Configuration files
    if (
      normalizedPath.includes('/config/') ||
      normalizedPath.includes('config.ts') ||
      normalizedPath.includes('config.js') ||
      normalizedPath.match(/\.(config|rc)\.(ts|js|json)$/) ||
      normalizedPath.endsWith('.config.ts') ||
      normalizedPath.endsWith('.config.js')
    ) {
      return 'config';
    }

    // Utility files
    if (
      normalizedPath.includes('/utils/') ||
      normalizedPath.startsWith('utils/') ||
      normalizedPath.includes('/util/') ||
      normalizedPath.startsWith('util/') ||
      normalizedPath.includes('/helpers/') ||
      normalizedPath.startsWith('helpers/') ||
      normalizedPath.includes('/helper/') ||
      normalizedPath.startsWith('helper/') ||
      normalizedPath.includes('/lib/') ||
      normalizedPath.startsWith('lib/') ||
      normalizedPath.endsWith('util.ts') ||
      normalizedPath.endsWith('utils.ts') ||
      normalizedPath.endsWith('helper.ts') ||
      normalizedPath.endsWith('helpers.ts')
    ) {
      return 'util';
    }

    // Default to 'other' for uncategorized files
    return 'other';
  }

  /**
   * Filter files by include patterns
   * @param files - Array of FileInfo objects
   * @param patterns - Glob patterns to match
   * @returns Filtered array of FileInfo objects
   */
  filterByPattern(files: FileInfo[], patterns: string[]): FileInfo[] {
    if (patterns.length === 0) {
      return files;
    }

    return files.filter(file => {
      const normalizedPath = file.relativePath.replace(/\\/g, '/');
      return patterns.some(pattern => minimatch(normalizedPath, pattern));
    });
  }

  /**
   * Exclude files by exclude patterns
   * @param files - Array of FileInfo objects
   * @param patterns - Glob patterns to exclude
   * @returns Filtered array of FileInfo objects
   */
  excludeByPattern(files: FileInfo[], patterns: string[]): FileInfo[] {
    if (patterns.length === 0) {
      return files;
    }

    return files.filter(file => {
      const normalizedPath = file.relativePath.replace(/\\/g, '/');
      return !patterns.some(pattern => minimatch(normalizedPath, pattern));
    });
  }
}
