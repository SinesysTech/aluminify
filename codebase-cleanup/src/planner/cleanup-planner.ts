/**
 * CleanupPlanner - Generates actionable cleanup tasks from classified issues
 * 
 * This class is responsible for:
 * 1. Generating specific refactoring tasks for each issue
 * 2. Detecting dependencies between tasks
 * 3. Ordering tasks to minimize risk and respect dependencies
 */

import {
  ICleanupPlanner,
  CleanupPlan,
  CleanupTask,
  CleanupPhase,
  TaskDependency,
  RiskAssessment,
  ClassifiedIssues,
  IssuePattern,
  Issue,
  IssueCategory,
  EffortLevel,
  RiskLevel,
  Severity
} from '../types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of the CleanupPlanner interface
 */
export class CleanupPlanner implements ICleanupPlanner {
  /**
   * Generate a complete cleanup plan from classified issues and patterns
   * 
   * @param classified - Issues classified by severity
   * @param patterns - Detected issue patterns
   * @returns Complete cleanup plan with tasks, phases, and risk assessment
   */
  generatePlan(classified: ClassifiedIssues, patterns: IssuePattern[]): CleanupPlan {
    // Generate tasks from individual issues
    const issueTasks = this.generateTasksFromIssues(classified);
    
    // Generate tasks from patterns (systemic issues)
    const patternTasks = this.generateTasksFromPatterns(patterns);
    
    // Combine all tasks
    const allTasks = [...issueTasks, ...patternTasks];
    
    // Detect dependencies between tasks
    const dependencies = this.detectDependencies(allTasks);
    
    // Apply dependencies to tasks
    this.applyDependencies(allTasks, dependencies);
    
    // Order tasks by dependencies and phases
    const orderedTasks = this.orderTasks(allTasks);
    
    // Group tasks into phases
    const phases = this.groupIntoPhases(orderedTasks);
    
    // Assess overall risk
    const riskAssessment = this.assessRisk(orderedTasks);
    
    // Estimate total duration
    const estimatedDuration = this.estimateDuration(orderedTasks);
    
    return {
      tasks: orderedTasks,
      phases,
      estimatedDuration,
      riskAssessment
    };
  }

  /**
   * Order tasks by dependencies and phases
   * 
   * Uses topological sort to ensure dependencies are respected,
   * then assigns phases based on task category and dependencies.
   * 
   * @param tasks - Tasks to order
   * @returns Ordered tasks
   */
  orderTasks(tasks: CleanupTask[]): CleanupTask[] {
    // Build dependency graph
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();
    
    // Initialize graph
    for (const task of tasks) {
      graph.set(task.id, new Set(task.dependencies));
      inDegree.set(task.id, task.dependencies.length);
    }
    
    // Topological sort using Kahn's algorithm
    const queue: CleanupTask[] = [];
    const result: CleanupTask[] = [];
    
    // Find tasks with no dependencies
    for (const task of tasks) {
      if (inDegree.get(task.id) === 0) {
        queue.push(task);
      }
    }
    
    // Process tasks in dependency order
    while (queue.length > 0) {
      // Sort queue by phase and priority
      queue.sort((a, b) => {
        if (a.phase !== b.phase) return a.phase - b.phase;
        return this.getTaskPriority(a) - this.getTaskPriority(b);
      });
      
      const task = queue.shift()!;
      result.push(task);
      
      // Update dependent tasks
      for (const otherTask of tasks) {
        if (otherTask.dependencies.includes(task.id)) {
          const degree = inDegree.get(otherTask.id)! - 1;
          inDegree.set(otherTask.id, degree);
          
          if (degree === 0) {
            queue.push(otherTask);
          }
        }
      }
    }
    
    // Check for circular dependencies
    if (result.length !== tasks.length) {
      console.warn('Circular dependencies detected, some tasks may not be ordered correctly');
      // Add remaining tasks
      for (const task of tasks) {
        if (!result.includes(task)) {
          result.push(task);
        }
      }
    }
    
    return result;
  }

  /**
   * Detect dependencies between tasks
   * 
   * Analyzes tasks to identify relationships where one task must
   * complete before another can begin.
   * 
   * @param tasks - Tasks to analyze
   * @returns Array of task dependencies
   */
  detectDependencies(tasks: CleanupTask[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];
    
    for (const task of tasks) {
      const deps: string[] = [];
      
      // Check for file-based dependencies
      for (const otherTask of tasks) {
        if (task.id === otherTask.id) continue;
        
        // If tasks affect the same files, check for ordering requirements
        const sharedFiles = task.affectedFiles.filter(f => 
          otherTask.affectedFiles.includes(f)
        );
        
        if (sharedFiles.length > 0) {
          // Determine which task should come first based on category and type
          if (this.shouldDependOn(task, otherTask)) {
            deps.push(otherTask.id);
          }
        }
      }
      
      // Check for category-based dependencies
      const categoryDeps = this.getCategoryDependencies(task, tasks);
      deps.push(...categoryDeps);
      
      if (deps.length > 0) {
        dependencies.push({
          taskId: task.id,
          dependsOn: deps,
          reason: this.getDependencyReason(task, deps, tasks)
        });
      }
    }
    
    return dependencies;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate tasks from individual issues
   */
  private generateTasksFromIssues(classified: ClassifiedIssues): CleanupTask[] {
    const tasks: CleanupTask[] = [];
    
    // Process all issues by severity
    const allIssues = [
      ...classified.critical,
      ...classified.high,
      ...classified.medium,
      ...classified.low
    ];
    
    // Group issues by file and category for better task generation
    const issuesByFile = this.groupIssuesByFile(allIssues);
    
    for (const [file, issues] of issuesByFile.entries()) {
      // Group issues in the same file by category
      const issuesByCategory = this.groupIssuesByCategory(issues);
      
      for (const [category, categoryIssues] of issuesByCategory.entries()) {
        // Create a task for each group of related issues
        const task = this.createTaskFromIssues(file, category, categoryIssues);
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  /**
   * Generate tasks from patterns (systemic issues)
   */
  private generateTasksFromPatterns(patterns: IssuePattern[]): CleanupTask[] {
    const tasks: CleanupTask[] = [];
    
    for (const pattern of patterns) {
      const task: CleanupTask = {
        id: uuidv4(),
        title: `Address pattern: ${pattern.patternName}`,
        description: `${pattern.description}\n\nThis pattern affects ${pattern.occurrences} locations across ${pattern.affectedFiles.length} files.`,
        category: pattern.category,
        relatedIssues: pattern.relatedIssues.map(i => i.id),
        dependencies: [],
        estimatedEffort: this.estimatePatternEffort(pattern),
        riskLevel: this.assessPatternRisk(pattern),
        requiresTests: pattern.occurrences > 5, // Patterns affecting many files need tests
        actionSteps: [
          `Review all ${pattern.occurrences} occurrences of this pattern`,
          pattern.recommendedAction,
          'Update affected files systematically',
          'Run tests to verify changes',
          'Update documentation if needed'
        ],
        affectedFiles: pattern.affectedFiles,
        phase: this.determinePhase(pattern.category)
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * Create a task from a group of related issues
   */
  private createTaskFromIssues(file: string, category: IssueCategory, issues: Issue[]): CleanupTask {
    const highestSeverity = this.getHighestSeverity(issues);
    const totalEffort = this.aggregateEffort(issues);
    
    return {
      id: uuidv4(),
      title: `Fix ${issues.length} ${category} issue(s) in ${this.getFileName(file)}`,
      description: this.generateTaskDescription(issues),
      category,
      relatedIssues: issues.map(i => i.id),
      dependencies: [],
      estimatedEffort: totalEffort,
      riskLevel: this.severityToRisk(highestSeverity),
      requiresTests: highestSeverity === 'critical' || highestSeverity === 'high',
      actionSteps: this.generateActionSteps(issues),
      affectedFiles: [file],
      phase: this.determinePhase(category)
    };
  }

  /**
   * Apply dependencies to tasks
   */
  private applyDependencies(tasks: CleanupTask[], dependencies: TaskDependency[]): void {
    const depMap = new Map(dependencies.map(d => [d.taskId, d.dependsOn]));
    
    for (const task of tasks) {
      const deps = depMap.get(task.id);
      if (deps) {
        task.dependencies = [...new Set([...task.dependencies, ...deps])];
      }
    }
  }

  /**
   * Group tasks into phases
   */
  private groupIntoPhases(tasks: CleanupTask[]): CleanupPhase[] {
    const phaseMap = new Map<number, CleanupTask[]>();
    
    for (const task of tasks) {
      const phaseTasks = phaseMap.get(task.phase) || [];
      phaseTasks.push(task);
      phaseMap.set(task.phase, phaseTasks);
    }
    
    const phases: CleanupPhase[] = [];
    const phaseNames = [
      'Foundation',
      'Infrastructure',
      'Services',
      'API Routes',
      'Components',
      'Polish'
    ];
    
    for (let i = 1; i <= 6; i++) {
      const phaseTasks = phaseMap.get(i) || [];
      if (phaseTasks.length > 0) {
        phases.push({
          phaseNumber: i,
          phaseName: phaseNames[i - 1],
          tasks: phaseTasks,
          description: this.getPhaseDescription(i)
        });
      }
    }
    
    return phases;
  }

  /**
   * Assess overall risk of the cleanup plan
   */
  private assessRisk(tasks: CleanupTask[]): RiskAssessment {
    const highRiskTasks = tasks.filter(t => 
      t.riskLevel === 'high' || t.riskLevel === 'critical'
    );
    
    const criticalCount = tasks.filter(t => t.riskLevel === 'critical').length;
    const highCount = tasks.filter(t => t.riskLevel === 'high').length;
    
    let overallRisk: RiskLevel;
    if (criticalCount > 0) {
      overallRisk = 'critical';
    } else if (highCount > tasks.length * 0.3) {
      overallRisk = 'high';
    } else if (highCount > 0) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }
    
    const mitigationStrategies = [
      'Create comprehensive test coverage before making changes',
      'Implement changes incrementally with frequent testing',
      'Use feature flags for risky changes',
      'Maintain rollback capability for all changes',
      'Conduct code reviews for all high-risk tasks',
      'Test in staging environment before production deployment'
    ];
    
    return {
      overallRisk,
      highRiskTasks,
      mitigationStrategies
    };
  }

  /**
   * Estimate total duration for all tasks
   */
  private estimateDuration(tasks: CleanupTask[]): string {
    let totalDays = 0;
    
    for (const task of tasks) {
      switch (task.estimatedEffort) {
        case 'trivial':
          totalDays += 0.25;
          break;
        case 'small':
          totalDays += 0.5;
          break;
        case 'medium':
          totalDays += 1;
          break;
        case 'large':
          totalDays += 3;
          break;
      }
    }
    
    // Add buffer for testing and review
    totalDays *= 1.3;
    
    if (totalDays < 1) {
      return `${Math.ceil(totalDays * 8)} hours`;
    } else if (totalDays < 5) {
      return `${Math.ceil(totalDays)} days`;
    } else {
      const weeks = Math.ceil(totalDays / 5);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
  }

  /**
   * Determine if task A should depend on task B
   */
  private shouldDependOn(taskA: CleanupTask, taskB: CleanupTask): boolean {
    // Type definitions should come before code that uses them
    if (taskB.category === 'types' && taskA.category !== 'types') {
      return true;
    }
    
    // Infrastructure changes before application code
    if (taskB.phase < taskA.phase) {
      return true;
    }
    
    // Critical issues should be fixed first
    if (taskB.riskLevel === 'critical' && taskA.riskLevel !== 'critical') {
      return true;
    }
    
    return false;
  }

  /**
   * Get category-based dependencies
   */
  private getCategoryDependencies(task: CleanupTask, allTasks: CleanupTask[]): string[] {
    const deps: string[] = [];
    
    // Define category dependency rules
    const dependencyRules: Record<IssueCategory, IssueCategory[]> = {
      'types': [],
      'middleware': ['types'],
      'database': ['types'],
      'authentication': ['types', 'database'],
      'services': ['types', 'database', 'authentication'],
      'api-routes': ['types', 'services', 'authentication', 'middleware'],
      'components': ['types', 'services'],
      'error-handling': ['types'],
      'general': []
    };
    
    const requiredCategories = dependencyRules[task.category] || [];
    
    for (const otherTask of allTasks) {
      if (task.id === otherTask.id) continue;
      
      if (requiredCategories.includes(otherTask.category)) {
        deps.push(otherTask.id);
      }
    }
    
    return deps;
  }

  /**
   * Get dependency reason
   */
  private getDependencyReason(task: CleanupTask, deps: string[], allTasks: CleanupTask[]): string {
    const depTasks = allTasks.filter(t => deps.includes(t.id));
    
    if (depTasks.length === 0) {
      return 'No dependencies';
    }
    
    const reasons: string[] = [];
    
    for (const depTask of depTasks) {
      if (depTask.category === 'types') {
        reasons.push('Depends on type definitions');
      } else if (depTask.phase < task.phase) {
        reasons.push(`Must complete ${depTask.category} changes first`);
      } else {
        reasons.push(`Shares files with ${depTask.category} task`);
      }
    }
    
    return reasons.join('; ');
  }

  /**
   * Get task priority for sorting
   */
  private getTaskPriority(task: CleanupTask): number {
    let priority = 0;
    
    // Risk level affects priority
    switch (task.riskLevel) {
      case 'critical': priority += 1000; break;
      case 'high': priority += 100; break;
      case 'medium': priority += 10; break;
      case 'low': priority += 1; break;
    }
    
    // Effort affects priority (smaller tasks first within same risk level)
    switch (task.estimatedEffort) {
      case 'trivial': priority += 0; break;
      case 'small': priority += 1; break;
      case 'medium': priority += 2; break;
      case 'large': priority += 3; break;
    }
    
    return -priority; // Negative for descending sort
  }

  /**
   * Group issues by file
   */
  private groupIssuesByFile(issues: Issue[]): Map<string, Issue[]> {
    const map = new Map<string, Issue[]>();
    
    for (const issue of issues) {
      const fileIssues = map.get(issue.file) || [];
      fileIssues.push(issue);
      map.set(issue.file, fileIssues);
    }
    
    return map;
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(issues: Issue[]): Map<IssueCategory, Issue[]> {
    const map = new Map<IssueCategory, Issue[]>();
    
    for (const issue of issues) {
      const categoryIssues = map.get(issue.category) || [];
      categoryIssues.push(issue);
      map.set(issue.category, categoryIssues);
    }
    
    return map;
  }

  /**
   * Get highest severity from issues
   */
  private getHighestSeverity(issues: Issue[]): Severity {
    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      if (issues.some(i => i.severity === severity)) {
        return severity;
      }
    }
    
    return 'low';
  }

  /**
   * Aggregate effort from multiple issues
   */
  private aggregateEffort(issues: Issue[]): EffortLevel {
    let totalEffort = 0;
    
    for (const issue of issues) {
      switch (issue.estimatedEffort) {
        case 'trivial': totalEffort += 1; break;
        case 'small': totalEffort += 2; break;
        case 'medium': totalEffort += 4; break;
        case 'large': totalEffort += 8; break;
      }
    }
    
    if (totalEffort <= 2) return 'trivial';
    if (totalEffort <= 4) return 'small';
    if (totalEffort <= 8) return 'medium';
    return 'large';
  }

  /**
   * Convert severity to risk level
   */
  private severityToRisk(severity: Severity): RiskLevel {
    const mapping: Record<Severity, RiskLevel> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[severity];
  }

  /**
   * Estimate effort for a pattern
   */
  private estimatePatternEffort(pattern: IssuePattern): EffortLevel {
    if (pattern.occurrences <= 3) return 'small';
    if (pattern.occurrences <= 10) return 'medium';
    return 'large';
  }

  /**
   * Assess risk for a pattern
   */
  private assessPatternRisk(pattern: IssuePattern): RiskLevel {
    // More occurrences = higher risk of breaking something
    if (pattern.occurrences > 20) return 'high';
    if (pattern.occurrences > 10) return 'medium';
    return 'low';
  }

  /**
   * Determine phase based on category
   */
  private determinePhase(category: IssueCategory): number {
    const phaseMap: Record<IssueCategory, number> = {
      'types': 1,              // Phase 1: Foundation
      'database': 2,           // Phase 2: Infrastructure
      'authentication': 2,     // Phase 2: Infrastructure
      'middleware': 2,         // Phase 2: Infrastructure
      'services': 3,           // Phase 3: Services
      'api-routes': 4,         // Phase 4: API Routes
      'components': 5,         // Phase 5: Components
      'error-handling': 2,     // Phase 2: Infrastructure
      'general': 6             // Phase 6: Polish
    };
    
    return phaseMap[category] || 6;
  }

  /**
   * Get phase description
   */
  private getPhaseDescription(phase: number): string {
    const descriptions = [
      'Establish type definitions and core interfaces',
      'Set up infrastructure: database, auth, middleware, error handling',
      'Refactor service layer and business logic',
      'Clean up API routes and endpoints',
      'Improve component structure and patterns',
      'Final polish: naming, formatting, documentation'
    ];
    
    return descriptions[phase - 1] || '';
  }

  /**
   * Generate task description from issues
   */
  private generateTaskDescription(issues: Issue[]): string {
    const descriptions = issues.map(i => `- ${i.description}`).join('\n');
    return `This task addresses the following issues:\n\n${descriptions}`;
  }

  /**
   * Generate action steps from issues
   */
  private generateActionSteps(issues: Issue[]): string[] {
    const steps: string[] = [
      'Review all related issues and their recommendations',
      'Create or update tests for affected functionality'
    ];
    
    // Add specific steps from issue recommendations
    for (const issue of issues) {
      if (issue.recommendation) {
        steps.push(issue.recommendation);
      }
    }
    
    steps.push('Run tests to verify changes');
    steps.push('Update documentation if needed');
    
    return steps;
  }

  /**
   * Get file name from path
   */
  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }
}
