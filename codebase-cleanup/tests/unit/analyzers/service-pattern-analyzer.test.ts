/**
 * Unit tests for ServicePatternAnalyzer
 * 
 * Tests service discovery, dependency tracking, and circular dependency detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Project } from 'ts-morph';
import { ServicePatternAnalyzer } from '../../../src/analyzers/service-pattern-analyzer';
import type { FileInfo } from '../../../src/types';

describe('ServicePatternAnalyzer', () => {
  let analyzer: ServicePatternAnalyzer;
  let project: Project;

  beforeEach(() => {
    analyzer = new ServicePatternAnalyzer();
    project = new Project({
      useInMemoryFileSystem: true,
    });
  });

  describe('Basic Functionality', () => {
    it('should have correct name and supported file types', () => {
      expect(analyzer.name).toBe('ServicePatternAnalyzer');
      expect(analyzer.getSupportedFileTypes()).toEqual(['service']);
    });

    it('should discover service modules', async () => {
      const sourceFile = project.createSourceFile(
        'backend/services/user/index.ts',
        `
export function getUser(id: string) {
  return { id, name: 'Test User' };
}

export function createUser(data: any) {
  return { id: '123', ...data };
}
        `.trim()
      );

      const fileInfo: FileInfo = {
        path: '/project/backend/services/user/index.ts',
        relativePath: 'backend/services/user/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      await analyzer.analyze(fileInfo, sourceFile);

      const services = analyzer.getDiscoveredServices();
      expect(services.size).toBe(1);
      expect(services.has('user')).toBe(true);

      const userService = services.get('user');
      expect(userService?.name).toBe('user');
      expect(userService?.exports).toContain('getUser');
      expect(userService?.exports).toContain('createUser');
    });

    it('should track service dependencies', async () => {
      // Create service A that imports from service B
      const serviceA = project.createSourceFile(
        'backend/services/serviceA/index.ts',
        `
import { functionB } from '../serviceB';

export function functionA() {
  return functionB();
}
        `.trim()
      );

      const serviceB = project.createSourceFile(
        'backend/services/serviceB/index.ts',
        `
export function functionB() {
  return 'B';
}
        `.trim()
      );

      const fileInfoA: FileInfo = {
        path: '/project/backend/services/serviceA/index.ts',
        relativePath: 'backend/services/serviceA/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const fileInfoB: FileInfo = {
        path: '/project/backend/services/serviceB/index.ts',
        relativePath: 'backend/services/serviceB/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      await analyzer.analyze(fileInfoA, serviceA);
      await analyzer.analyze(fileInfoB, serviceB);

      const dependencies = analyzer.getServiceDependencies();
      expect(dependencies.length).toBeGreaterThan(0);
      
      const depAtoB = dependencies.find(d => d.from === 'serviceA' && d.to === 'serviceB');
      expect(depAtoB).toBeDefined();
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect simple circular dependency (A → B → A)', async () => {
      // Service A depends on Service B
      const serviceA = project.createSourceFile(
        'backend/services/serviceA/index.ts',
        `
import { functionB } from '../serviceB';

export function functionA() {
  return functionB();
}
        `.trim()
      );

      // Service B depends on Service A (creates cycle)
      const serviceB = project.createSourceFile(
        'backend/services/serviceB/index.ts',
        `
import { functionA } from '../serviceA';

export function functionB() {
  return functionA();
}
        `.trim()
      );

      const fileInfoA: FileInfo = {
        path: '/project/backend/services/serviceA/index.ts',
        relativePath: 'backend/services/serviceA/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const fileInfoB: FileInfo = {
        path: '/project/backend/services/serviceB/index.ts',
        relativePath: 'backend/services/serviceB/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const issuesA = await analyzer.analyze(fileInfoA, serviceA);
      const issuesB = await analyzer.analyze(fileInfoB, serviceB);

      const allIssues = [...issuesA, ...issuesB];
      const circularDepIssues = allIssues.filter(
        issue => issue.tags.includes('circular-dependency')
      );

      expect(circularDepIssues.length).toBeGreaterThan(0);
      expect(circularDepIssues[0].severity).toBe('high');
      expect(circularDepIssues[0].type).toBe('architectural');
      expect(circularDepIssues[0].description).toContain('Circular dependency detected');
    });

    it('should detect complex circular dependency (A → B → C → A)', async () => {
      // Service A depends on Service B
      const serviceA = project.createSourceFile(
        'backend/services/serviceA/index.ts',
        `
import { functionB } from '../serviceB';

export function functionA() {
  return functionB();
}
        `.trim()
      );

      // Service B depends on Service C
      const serviceB = project.createSourceFile(
        'backend/services/serviceB/index.ts',
        `
import { functionC } from '../serviceC';

export function functionB() {
  return functionC();
}
        `.trim()
      );

      // Service C depends on Service A (creates cycle: A → B → C → A)
      const serviceC = project.createSourceFile(
        'backend/services/serviceC/index.ts',
        `
import { functionA } from '../serviceA';

export function functionC() {
  return functionA();
}
        `.trim()
      );

      const fileInfoA: FileInfo = {
        path: '/project/backend/services/serviceA/index.ts',
        relativePath: 'backend/services/serviceA/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const fileInfoB: FileInfo = {
        path: '/project/backend/services/serviceB/index.ts',
        relativePath: 'backend/services/serviceB/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const fileInfoC: FileInfo = {
        path: '/project/backend/services/serviceC/index.ts',
        relativePath: 'backend/services/serviceC/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const issuesA = await analyzer.analyze(fileInfoA, serviceA);
      const issuesB = await analyzer.analyze(fileInfoB, serviceB);
      const issuesC = await analyzer.analyze(fileInfoC, serviceC);

      const allIssues = [...issuesA, ...issuesB, ...issuesC];
      const circularDepIssues = allIssues.filter(
        issue => issue.tags.includes('circular-dependency')
      );

      expect(circularDepIssues.length).toBeGreaterThan(0);
      
      // Check that the cycle description includes all three services
      const cycleDescription = circularDepIssues[0].description;
      expect(cycleDescription).toContain('serviceA');
      expect(cycleDescription).toContain('serviceB');
      expect(cycleDescription).toContain('serviceC');
    });

    it('should not report circular dependency when there is none', async () => {
      // Service A depends on Service B
      const serviceA = project.createSourceFile(
        'backend/services/serviceA/index.ts',
        `
import { functionB } from '../serviceB';

export function functionA() {
  return functionB();
}
        `.trim()
      );

      // Service B has no dependencies
      const serviceB = project.createSourceFile(
        'backend/services/serviceB/index.ts',
        `
export function functionB() {
  return 'B';
}
        `.trim()
      );

      const fileInfoA: FileInfo = {
        path: '/project/backend/services/serviceA/index.ts',
        relativePath: 'backend/services/serviceA/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const fileInfoB: FileInfo = {
        path: '/project/backend/services/serviceB/index.ts',
        relativePath: 'backend/services/serviceB/index.ts',
        extension: '.ts',
        size: 100,
        category: 'service',
        lastModified: new Date(),
      };

      const issuesA = await analyzer.analyze(fileInfoA, serviceA);
      const issuesB = await analyzer.analyze(fileInfoB, serviceB);

      const allIssues = [...issuesA, ...issuesB];
      const circularDepIssues = allIssues.filter(
        issue => issue.tags.includes('circular-dependency')
      );

      expect(circularDepIssues.length).toBe(0);
    });
  });

  describe('Issue Detection', () => {
    it('should detect service with no exports', async () => {
      const sourceFile = project.createSourceFile(
        'backend/services/empty/index.ts',
        `
// Empty service file
const internal = 'value';
        `.trim()
      );

      const fileInfo: FileInfo = {
        path: '/project/backend/services/empty/index.ts',
        relativePath: 'backend/services/empty/index.ts',
        extension: '.ts',
        size: 50,
        category: 'service',
        lastModified: new Date(),
      };

      const issues = await analyzer.analyze(fileInfo, sourceFile);

      const noExportsIssue = issues.find(
        issue => issue.description.includes('has no exports')
      );

      expect(noExportsIssue).toBeDefined();
      expect(noExportsIssue?.severity).toBe('medium');
    });

    it('should detect excessive service dependencies', async () => {
      const sourceFile = project.createSourceFile(
        'backend/services/complex/index.ts',
        `
import { a } from '../serviceA';
import { b } from '../serviceB';
import { c } from '../serviceC';
import { d } from '../serviceD';
import { e } from '../serviceE';
import { f } from '../serviceF';

export function complexFunction() {
  return a() + b() + c() + d() + e() + f();
}
        `.trim()
      );

      const fileInfo: FileInfo = {
        path: '/project/backend/services/complex/index.ts',
        relativePath: 'backend/services/complex/index.ts',
        extension: '.ts',
        size: 200,
        category: 'service',
        lastModified: new Date(),
      };

      const issues = await analyzer.analyze(fileInfo, sourceFile);

      const excessiveDepsIssue = issues.find(
        issue => issue.description.includes('depends on') && issue.description.includes('services')
      );

      expect(excessiveDepsIssue).toBeDefined();
      expect(excessiveDepsIssue?.severity).toBe('medium');
    });
  });
});
