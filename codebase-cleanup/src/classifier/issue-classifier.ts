/**
 * Issue Classifier
 * 
 * Categorizes, prioritizes, and enriches issues detected by analyzers.
 * Groups related issues into patterns and assigns severity-based priorities.
 */

import type {
  IssueClassifier,
  ClassifiedIssues,
  Issue,
  IssuePattern,
  Severity,
  IssueType,
  IssueCategory,
} from '../types';

/**
 * Configuration for pattern detection
 */
export interface PatternDetectionConfig {
  /**
   * Minimum number of occurrences to consider something a pattern
   * @default 3
   */
  minOccurrences?: number;

  /**
   * Minimum priority for patterns (1-10)
   * @default 1
   */
  minPriority?: number;

  /**
   * Whether to detect cross-file patterns
   * @default true
   */
  detectCrossFilePatterns?: boolean;

  /**
   * Whether to detect similar issues by description
   * @default true
   */
  detectSimilarIssues?: boolean;

  /**
   * Similarity threshold for description matching (0-1)
   * @default 0.7
   */
  similarityThreshold?: number;
}

/**
 * Statistics about pattern occurrences
 */
export interface PatternStatistics {
  totalOccurrences: number;
  uniqueFiles: number;
  severityDistribution: Record<Severity, number>;
  categoryDistribution: Record<IssueCategory, number>;
  averageEffort: EffortLevel;
  estimatedTotalEffort: string;
  fileDistribution: Map<string, number>; // file -> count
  mostAffectedFile: { file: string; count: number } | null;
}

/**
 * Implementation of the Issue Classifier
 * 
 * Responsibilities:
 * 1. Classify issues by severity (critical, high, medium, low)
 * 2. Prioritize issues within each severity level
 * 3. Detect patterns of related issues across files
 * 4. Group similar issues for easier remediation
 */
export class IssueClassifierImpl implements IssueClassifier {
  private config: Required<PatternDetectionConfig>;

  constructor(config: PatternDetectionConfig = {}) {
    this.config = {
      minOccurrences: config.minOccurrences ?? 3,
      minPriority: config.minPriority ?? 1,
      detectCrossFilePatterns: config.detectCrossFilePatterns ?? true,
      detectSimilarIssues: config.detectSimilarIssues ?? true,
      similarityThreshold: config.similarityThreshold ?? 0.7,
    };
  }

  /**
   * Classify issues by severity level
   * 
   * @param issues All detected issues
   * @returns Issues classified by severity with detected patterns
   */
  classify(issues: Issue[]): ClassifiedIssues {
    // Group issues by severity
    const critical: Issue[] = [];
    const high: Issue[] = [];
    const medium: Issue[] = [];
    const low: Issue[] = [];

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          critical.push(issue);
          break;
        case 'high':
          high.push(issue);
          break;
        case 'medium':
          medium.push(issue);
          break;
        case 'low':
          low.push(issue);
          break;
      }
    }

    // Detect patterns across all issues
    const patterns = this.detectPatterns(issues);

    return {
      critical,
      high,
      medium,
      low,
      patterns,
    };
  }

  /**
   * Prioritize issues within their severity level
   * 
   * Priority is determined by:
   * 1. Severity (critical > high > medium > low)
   * 2. Impact (issues affecting more files ranked higher)
   * 3. Effort (lower effort issues ranked higher within same severity)
   * 4. Category (certain categories like security ranked higher)
   * 
   * @param issues Issues to prioritize
   * @returns Issues sorted by priority (highest first)
   */
  prioritize(issues: Issue[]): Issue[] {
    return [...issues].sort((a, b) => {
      // 1. Sort by severity first
      const severityOrder: Record<Severity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // 2. Within same severity, prioritize by category
      const categoryPriority = this.getCategoryPriority(b.category) - this.getCategoryPriority(a.category);
      if (categoryPriority !== 0) return categoryPriority;

      // 3. Within same category, prioritize by type
      const typePriority = this.getTypePriority(b.type) - this.getTypePriority(a.type);
      if (typePriority !== 0) return typePriority;

      // 4. Within same type, prioritize by effort (lower effort first)
      const effortOrder: Record<string, number> = {
        trivial: 4,
        small: 3,
        medium: 2,
        large: 1,
      };

      const effortDiff = effortOrder[b.estimatedEffort] - effortOrder[a.estimatedEffort];
      if (effortDiff !== 0) return effortDiff;

      // 5. Finally, sort by number of related issues (more related = higher priority)
      return b.relatedIssues.length - a.relatedIssues.length;
    });
  }

  /**
   * Detect patterns of related issues across the codebase
   * 
   * Patterns are identified by:
   * - Same issue type occurring multiple times
   * - Same issue type in same category
   * - Issues with similar descriptions
   * - Issues detected by the same analyzer
   * 
   * @param issues All detected issues
   * @returns Detected patterns
   */
  detectPatterns(issues: Issue[]): IssuePattern[] {
    const patterns: IssuePattern[] = [];

    // Group issues by type and category
    const groupedByTypeAndCategory = this.groupByTypeAndCategory(issues);

    // Detect patterns for each type-category combination
    for (const [key, groupedIssues] of groupedByTypeAndCategory.entries()) {
      if (groupedIssues.length < this.config.minOccurrences) {
        continue; // Not enough occurrences to be a pattern
      }

      const [type, category] = key.split('::') as [IssueType, IssueCategory];
      
      // Get unique files affected
      const affectedFiles = [...new Set(groupedIssues.map(issue => issue.file))];

      // Calculate priority based on occurrences and severity
      const priority = this.calculatePatternPriority(groupedIssues);

      if (priority < this.config.minPriority) {
        continue; // Priority too low
      }

      // Create pattern
      const pattern: IssuePattern = {
        patternId: this.generatePatternId(type, category),
        patternName: this.generatePatternName(type, category),
        description: this.generatePatternDescription(type, category, groupedIssues),
        occurrences: groupedIssues.length,
        affectedFiles,
        relatedIssues: groupedIssues,
        recommendedAction: this.generateRecommendedAction(type, category, groupedIssues),
        priority,
        category,
      };

      patterns.push(pattern);
    }

    // Detect cross-file patterns if enabled
    if (this.config.detectCrossFilePatterns) {
      const crossFilePatterns = this.detectCrossFilePatterns(issues);
      patterns.push(...crossFilePatterns);
    }

    // Sort patterns by priority (highest first)
    return patterns.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Group issues by type and category
   * 
   * @param issues Issues to group
   * @returns Map of "type::category" to issues
   */
  private groupByTypeAndCategory(issues: Issue[]): Map<string, Issue[]> {
    const grouped = new Map<string, Issue[]>();

    for (const issue of issues) {
      const key = `${issue.type}::${issue.category}`;
      const group = grouped.get(key) || [];
      group.push(issue);
      grouped.set(key, group);
    }

    return grouped;
  }

  /**
   * Detect patterns that span multiple files
   * 
   * @param issues All issues
   * @returns Cross-file patterns
   */
  private detectCrossFilePatterns(issues: Issue[]): IssuePattern[] {
    const patterns: IssuePattern[] = [];

    // Group by analyzer (issues detected by same analyzer often indicate systemic problems)
    const byAnalyzer = new Map<string, Issue[]>();
    for (const issue of issues) {
      const group = byAnalyzer.get(issue.detectedBy) || [];
      group.push(issue);
      byAnalyzer.set(issue.detectedBy, group);
    }

    // Create patterns for analyzers that found many issues across multiple files
    for (const [analyzer, analyzerIssues] of byAnalyzer.entries()) {
      const affectedFiles = [...new Set(analyzerIssues.map(i => i.file))];
      
      // Only create pattern if it affects multiple files
      if (affectedFiles.length >= 2 && analyzerIssues.length >= this.config.minOccurrences) {
        const priority = this.calculatePatternPriority(analyzerIssues);
        
        if (priority >= this.config.minPriority) {
          // Determine the most common category
          const categoryCount = new Map<IssueCategory, number>();
          for (const issue of analyzerIssues) {
            categoryCount.set(issue.category, (categoryCount.get(issue.category) || 0) + 1);
          }
          const mostCommonCategory = [...categoryCount.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];

          // Calculate statistics for this pattern
          const statistics = this.calculatePatternStatistics(analyzerIssues);

          patterns.push({
            patternId: `cross-file-${analyzer.toLowerCase().replace(/\s+/g, '-')}`,
            patternName: `Systemic ${analyzer} Issues`,
            description: this.generateSystemicPatternDescription(analyzer, analyzerIssues, statistics),
            occurrences: analyzerIssues.length,
            affectedFiles,
            relatedIssues: analyzerIssues,
            recommendedAction: `Review and standardize patterns across all affected files. Consider creating shared utilities or establishing coding standards.`,
            priority,
            category: mostCommonCategory,
          });
        }
      }
    }

    // Detect similar issues by description if enabled
    if (this.config.detectSimilarIssues) {
      const similarPatterns = this.detectSimilarIssuePatterns(issues);
      patterns.push(...similarPatterns);
    }

    // Detect systemic problems (issues affecting many files with same root cause)
    const systemicPatterns = this.detectSystemicProblems(issues);
    patterns.push(...systemicPatterns);

    return patterns;
  }

  /**
   * Detect patterns of similar issues based on description similarity
   * 
   * Groups issues that have similar descriptions even if they have different types,
   * which can indicate the same underlying problem manifesting in different ways.
   * 
   * @param issues All issues
   * @returns Patterns of similar issues
   */
  private detectSimilarIssuePatterns(issues: Issue[]): IssuePattern[] {
    const patterns: IssuePattern[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < issues.length; i++) {
      if (processed.has(issues[i].id)) continue;

      const similarIssues: Issue[] = [issues[i]];
      processed.add(issues[i].id);

      // Find similar issues
      for (let j = i + 1; j < issues.length; j++) {
        if (processed.has(issues[j].id)) continue;

        const similarity = this.calculateDescriptionSimilarity(
          issues[i].description,
          issues[j].description
        );

        if (similarity >= this.config.similarityThreshold) {
          similarIssues.push(issues[j]);
          processed.add(issues[j].id);
        }
      }

      // Create pattern if we found enough similar issues
      if (similarIssues.length >= this.config.minOccurrences) {
        const affectedFiles = [...new Set(similarIssues.map(i => i.file))];
        const priority = this.calculatePatternPriority(similarIssues);

        if (priority >= this.config.minPriority && affectedFiles.length >= 2) {
          // Determine most common category and type
          const categoryCount = new Map<IssueCategory, number>();
          const typeCount = new Map<IssueType, number>();
          
          for (const issue of similarIssues) {
            categoryCount.set(issue.category, (categoryCount.get(issue.category) || 0) + 1);
            typeCount.set(issue.type, (typeCount.get(issue.type) || 0) + 1);
          }

          const mostCommonCategory = [...categoryCount.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];
          const mostCommonType = [...typeCount.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];

          const statistics = this.calculatePatternStatistics(similarIssues);

          patterns.push({
            patternId: `similar-${mostCommonType}-${Date.now()}`,
            patternName: `Similar ${this.getTypeDisplayName(mostCommonType)} Issues`,
            description: `${similarIssues.length} similar issues detected across ${affectedFiles.length} files with related descriptions, suggesting a common root cause.`,
            occurrences: similarIssues.length,
            affectedFiles,
            relatedIssues: similarIssues,
            recommendedAction: `Investigate the root cause of these similar issues and apply a consistent fix across all affected files.`,
            priority,
            category: mostCommonCategory,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect systemic problems that affect many files
   * 
   * Identifies widespread issues that indicate architectural or process problems
   * rather than isolated code issues.
   * 
   * @param issues All issues
   * @returns Systemic problem patterns
   */
  private detectSystemicProblems(issues: Issue[]): IssuePattern[] {
    const patterns: IssuePattern[] = [];

    // Group by type to find widespread issues
    const byType = new Map<IssueType, Issue[]>();
    for (const issue of issues) {
      const group = byType.get(issue.type) || [];
      group.push(issue);
      byType.set(issue.type, group);
    }

    // Identify systemic problems (affecting many files with high severity)
    for (const [type, typeIssues] of byType.entries()) {
      const affectedFiles = [...new Set(typeIssues.map(i => i.file))];
      
      // Systemic problem criteria:
      // 1. Affects many files (>= 5)
      // 2. Has enough occurrences
      // 3. Has significant severity (at least some high/critical issues)
      const highSeverityCount = typeIssues.filter(i => 
        i.severity === 'critical' || i.severity === 'high'
      ).length;

      if (
        affectedFiles.length >= 5 &&
        typeIssues.length >= this.config.minOccurrences &&
        highSeverityCount > 0
      ) {
        const priority = this.calculatePatternPriority(typeIssues);

        if (priority >= this.config.minPriority) {
          const statistics = this.calculatePatternStatistics(typeIssues);
          
          // Determine most common category
          const categoryCount = new Map<IssueCategory, number>();
          for (const issue of typeIssues) {
            categoryCount.set(issue.category, (categoryCount.get(issue.category) || 0) + 1);
          }
          const mostCommonCategory = [...categoryCount.entries()]
            .sort((a, b) => b[1] - a[1])[0][0];

          patterns.push({
            patternId: `systemic-${type}`,
            patternName: `Systemic ${this.getTypeDisplayName(type)} Problem`,
            description: this.generateSystemicProblemDescription(type, typeIssues, statistics),
            occurrences: typeIssues.length,
            affectedFiles,
            relatedIssues: typeIssues,
            recommendedAction: this.generateSystemicRecommendation(type, statistics),
            priority: Math.min(priority + 1, 10), // Boost priority for systemic issues
            category: mostCommonCategory,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Calculate detailed statistics for a pattern
   * 
   * @param issues Issues in the pattern
   * @returns Pattern statistics
   */
  private calculatePatternStatistics(issues: Issue[]): PatternStatistics {
    // Count by severity
    const severityDistribution: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Count by category
    const categoryDistribution: Record<IssueCategory, number> = {
      authentication: 0,
      database: 0,
      'api-routes': 0,
      components: 0,
      services: 0,
      types: 0,
      middleware: 0,
      'error-handling': 0,
      general: 0,
    };

    // Count by file
    const fileDistribution = new Map<string, number>();

    // Effort tracking
    const effortScores: Record<EffortLevel, number> = {
      trivial: 1,
      small: 2,
      medium: 3,
      large: 4,
    };
    let totalEffortScore = 0;

    for (const issue of issues) {
      severityDistribution[issue.severity]++;
      categoryDistribution[issue.category]++;
      fileDistribution.set(issue.file, (fileDistribution.get(issue.file) || 0) + 1);
      totalEffortScore += effortScores[issue.estimatedEffort];
    }

    // Calculate average effort
    const avgEffortScore = totalEffortScore / issues.length;
    const averageEffort: EffortLevel = 
      avgEffortScore <= 1.5 ? 'trivial' :
      avgEffortScore <= 2.5 ? 'small' :
      avgEffortScore <= 3.5 ? 'medium' : 'large';

    // Estimate total effort
    const estimatedTotalEffort = this.estimateTotalEffort(issues.length, averageEffort);

    // Find most affected file
    let mostAffectedFile: { file: string; count: number } | null = null;
    for (const [file, count] of fileDistribution.entries()) {
      if (!mostAffectedFile || count > mostAffectedFile.count) {
        mostAffectedFile = { file, count };
      }
    }

    return {
      totalOccurrences: issues.length,
      uniqueFiles: fileDistribution.size,
      severityDistribution,
      categoryDistribution,
      averageEffort,
      estimatedTotalEffort,
      fileDistribution,
      mostAffectedFile,
    };
  }

  /**
   * Calculate similarity between two descriptions
   * 
   * Uses a simple word-based similarity metric (Jaccard similarity)
   * 
   * @param desc1 First description
   * @param desc2 Second description
   * @returns Similarity score (0-1)
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    // Normalize and tokenize
    const words1 = new Set(
      desc1.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3) // Ignore short words
    );

    const words2 = new Set(
      desc2.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Estimate total effort to fix all issues in a pattern
   * 
   * @param count Number of issues
   * @param averageEffort Average effort per issue
   * @returns Human-readable effort estimate
   */
  private estimateTotalEffort(count: number, averageEffort: EffortLevel): string {
    const effortHours: Record<EffortLevel, number> = {
      trivial: 0.5,
      small: 2,
      medium: 4,
      large: 8,
    };

    const totalHours = count * effortHours[averageEffort];

    if (totalHours < 1) return 'Less than 1 hour';
    if (totalHours < 8) return `${Math.round(totalHours)} hours`;
    
    const days = Math.round(totalHours / 8);
    if (days === 1) return '1 day';
    if (days < 5) return `${days} days`;
    
    const weeks = Math.round(days / 5);
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  }

  /**
   * Generate description for systemic pattern detected by analyzer
   * 
   * @param analyzer Analyzer name
   * @param issues Issues in pattern
   * @param statistics Pattern statistics
   * @returns Description
   */
  private generateSystemicPatternDescription(
    analyzer: string,
    issues: Issue[],
    statistics: PatternStatistics
  ): string {
    const { totalOccurrences, uniqueFiles, severityDistribution, mostAffectedFile } = statistics;
    
    const criticalCount = severityDistribution.critical;
    const highCount = severityDistribution.high;
    
    let severityNote = '';
    if (criticalCount > 0) {
      severityNote = ` including ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}`;
    } else if (highCount > 0) {
      severityNote = ` including ${highCount} high-severity issue${highCount > 1 ? 's' : ''}`;
    }

    let fileNote = '';
    if (mostAffectedFile) {
      fileNote = ` The most affected file is ${mostAffectedFile.file} with ${mostAffectedFile.count} issue${mostAffectedFile.count > 1 ? 's' : ''}.`;
    }

    return `${totalOccurrences} issues detected by ${analyzer} across ${uniqueFiles} files${severityNote}, indicating a systemic problem.${fileNote}`;
  }

  /**
   * Generate description for systemic problem
   * 
   * @param type Issue type
   * @param issues Issues in pattern
   * @param statistics Pattern statistics
   * @returns Description
   */
  private generateSystemicProblemDescription(
    type: IssueType,
    issues: Issue[],
    statistics: PatternStatistics
  ): string {
    const { totalOccurrences, uniqueFiles, severityDistribution, estimatedTotalEffort } = statistics;
    
    const criticalCount = severityDistribution.critical;
    const highCount = severityDistribution.high;
    const mediumCount = severityDistribution.medium;
    const lowCount = severityDistribution.low;

    const severityBreakdown = [
      criticalCount > 0 ? `${criticalCount} critical` : null,
      highCount > 0 ? `${highCount} high` : null,
      mediumCount > 0 ? `${mediumCount} medium` : null,
      lowCount > 0 ? `${lowCount} low` : null,
    ].filter(Boolean).join(', ');

    return `Widespread ${this.getTypeDisplayName(type).toLowerCase()} problem affecting ${uniqueFiles} files with ${totalOccurrences} occurrences (${severityBreakdown}). This systemic issue requires coordinated remediation. Estimated effort: ${estimatedTotalEffort}.`;
  }

  /**
   * Generate recommendation for systemic problem
   * 
   * @param type Issue type
   * @param statistics Pattern statistics
   * @returns Recommendation
   */
  private generateSystemicRecommendation(
    type: IssueType,
    statistics: PatternStatistics
  ): string {
    const baseAction = this.generateRecommendedAction(type, 'general', []);
    
    return `${baseAction} Given the systemic nature (${statistics.uniqueFiles} files affected), consider: 1) Creating a standardized solution or utility, 2) Documenting the correct pattern, 3) Applying fixes in batches to minimize risk, 4) Adding automated checks to prevent recurrence.`;
  }

  /**
   * Get display name for issue type
   * 
   * @param type Issue type
   * @returns Display name
   */
  private getTypeDisplayName(type: IssueType): string {
    const typeNames: Record<IssueType, string> = {
      'backward-compatibility': 'Backward Compatibility',
      'legacy-code': 'Legacy Code',
      'unnecessary-adapter': 'Unnecessary Adapters',
      'confusing-logic': 'Confusing Logic',
      'code-duplication': 'Code Duplication',
      'inconsistent-pattern': 'Inconsistent Patterns',
      'poor-naming': 'Poor Naming',
      'missing-error-handling': 'Missing Error Handling',
      'type-safety': 'Type Safety Issues',
      'architectural': 'Architectural Issues',
    };

    return typeNames[type];
  }

  /**
   * Calculate priority for a pattern based on its issues
   * 
   * Priority factors:
   * - Number of occurrences (more = higher priority)
   * - Severity of issues (critical/high = higher priority)
   * - Number of files affected (more = higher priority)
   * 
   * @param issues Issues in the pattern
   * @returns Priority score (1-10)
   */
  private calculatePatternPriority(issues: Issue[]): number {
    // Count issues by severity
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const issue of issues) {
      severityCounts[issue.severity]++;
    }

    // Calculate base priority from severity distribution
    let basePriority = 0;
    basePriority += severityCounts.critical * 4;
    basePriority += severityCounts.high * 3;
    basePriority += severityCounts.medium * 2;
    basePriority += severityCounts.low * 1;

    // Normalize to 0-10 scale based on number of issues
    const avgSeverityScore = basePriority / issues.length;
    
    // Boost priority based on number of occurrences
    const occurrenceBoost = Math.min(issues.length / 10, 3); // Max boost of 3
    
    // Boost priority based on number of files affected
    const affectedFiles = new Set(issues.map(i => i.file)).size;
    const fileBoost = Math.min(affectedFiles / 5, 2); // Max boost of 2

    // Calculate final priority (capped at 10)
    const priority = Math.min(avgSeverityScore + occurrenceBoost + fileBoost, 10);

    return Math.round(priority);
  }

  /**
   * Generate a unique pattern ID
   * 
   * @param type Issue type
   * @param category Issue category
   * @returns Pattern ID
   */
  private generatePatternId(type: IssueType, category: IssueCategory): string {
    return `pattern-${type}-${category}`.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Generate a human-readable pattern name
   * 
   * @param type Issue type
   * @param category Issue category
   * @returns Pattern name
   */
  private generatePatternName(type: IssueType, category: IssueCategory): string {
    const typeNames: Record<IssueType, string> = {
      'backward-compatibility': 'Backward Compatibility',
      'legacy-code': 'Legacy Code',
      'unnecessary-adapter': 'Unnecessary Adapters',
      'confusing-logic': 'Confusing Logic',
      'code-duplication': 'Code Duplication',
      'inconsistent-pattern': 'Inconsistent Patterns',
      'poor-naming': 'Poor Naming',
      'missing-error-handling': 'Missing Error Handling',
      'type-safety': 'Type Safety Issues',
      'architectural': 'Architectural Issues',
    };

    const categoryNames: Record<IssueCategory, string> = {
      'authentication': 'Authentication',
      'database': 'Database',
      'api-routes': 'API Routes',
      'components': 'Components',
      'services': 'Services',
      'types': 'Types',
      'middleware': 'Middleware',
      'error-handling': 'Error Handling',
      'general': 'General',
    };

    return `${typeNames[type]} in ${categoryNames[category]}`;
  }

  /**
   * Generate a description for a pattern
   * 
   * @param type Issue type
   * @param category Issue category
   * @param issues Issues in the pattern
   * @returns Pattern description
   */
  private generatePatternDescription(
    type: IssueType,
    category: IssueCategory,
    issues: Issue[]
  ): string {
    const affectedFiles = new Set(issues.map(i => i.file)).size;
    
    const descriptions: Record<IssueType, string> = {
      'backward-compatibility': `Backward compatibility code found in ${affectedFiles} files, indicating unnecessary legacy support that can be removed.`,
      'legacy-code': `Legacy code patterns detected in ${affectedFiles} files, including commented code, unused exports, or outdated implementations.`,
      'unnecessary-adapter': `Unnecessary adapter layers found in ${affectedFiles} files, adding complexity without providing value.`,
      'confusing-logic': `Confusing logic patterns detected in ${affectedFiles} files, including deeply nested conditionals or complex boolean expressions.`,
      'code-duplication': `Code duplication found across ${affectedFiles} files, indicating opportunities for consolidation.`,
      'inconsistent-pattern': `Inconsistent implementation patterns found across ${affectedFiles} files, reducing code maintainability.`,
      'poor-naming': `Poor naming conventions detected in ${affectedFiles} files, affecting code readability.`,
      'missing-error-handling': `Missing or inconsistent error handling found in ${affectedFiles} files, potentially causing runtime issues.`,
      'type-safety': `Type safety issues detected in ${affectedFiles} files, including excessive 'any' usage or type assertions.`,
      'architectural': `Architectural issues found in ${affectedFiles} files, indicating structural problems in the codebase.`,
    };

    return descriptions[type];
  }

  /**
   * Generate recommended action for a pattern
   * 
   * @param type Issue type
   * @param category Issue category
   * @param issues Issues in the pattern
   * @returns Recommended action
   */
  private generateRecommendedAction(
    type: IssueType,
    category: IssueCategory,
    issues: Issue[]
  ): string {
    const actions: Record<IssueType, string> = {
      'backward-compatibility': 'Remove backward compatibility code and update to use current patterns consistently.',
      'legacy-code': 'Remove commented code, delete unused exports, and update outdated implementations.',
      'unnecessary-adapter': 'Remove adapter layers and use direct implementations where the adapter adds no value.',
      'confusing-logic': 'Refactor complex logic into smaller, well-named functions with clear control flow.',
      'code-duplication': 'Extract common logic into shared utilities or helper functions.',
      'inconsistent-pattern': 'Standardize implementation patterns across all affected files.',
      'poor-naming': 'Rename variables, functions, and files to follow consistent naming conventions.',
      'missing-error-handling': 'Add consistent error handling, logging, and recovery mechanisms.',
      'type-safety': 'Replace "any" types with proper type definitions and remove unnecessary type assertions.',
      'architectural': 'Refactor to address structural issues and improve overall architecture.',
    };

    return actions[type];
  }

  /**
   * Get priority score for a category
   * 
   * @param category Issue category
   * @returns Priority score (higher = more important)
   */
  private getCategoryPriority(category: IssueCategory): number {
    const priorities: Record<IssueCategory, number> = {
      'authentication': 10,      // Security-critical
      'error-handling': 9,       // Reliability-critical
      'database': 8,             // Data integrity
      'api-routes': 7,           // User-facing
      'services': 6,             // Business logic
      'middleware': 5,           // Infrastructure
      'types': 4,                // Type safety
      'components': 3,           // UI
      'general': 2,              // Miscellaneous
    };

    return priorities[category] || 1;
  }

  /**
   * Get priority score for an issue type
   * 
   * @param type Issue type
   * @returns Priority score (higher = more important)
   */
  private getTypePriority(type: IssueType): number {
    const priorities: Record<IssueType, number> = {
      'architectural': 10,           // Structural problems
      'type-safety': 9,              // Type safety issues
      'missing-error-handling': 8,   // Error handling gaps
      'inconsistent-pattern': 7,     // Consistency issues
      'confusing-logic': 6,          // Readability issues
      'code-duplication': 5,         // Maintainability
      'unnecessary-adapter': 4,      // Complexity
      'backward-compatibility': 3,   // Legacy support
      'legacy-code': 2,              // Old code
      'poor-naming': 1,              // Style issues
    };

    return priorities[type] || 1;
  }
}

/**
 * Create a new issue classifier instance
 * 
 * @param config Configuration options
 * @returns Issue classifier instance
 */
export function createIssueClassifier(config?: PatternDetectionConfig): IssueClassifier {
  return new IssueClassifierImpl(config);
}
