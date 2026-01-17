/**
 * Report Generator
 * 
 * Generates human-readable and machine-readable reports from analysis results.
 * Produces Markdown reports for human consumption and JSON reports for programmatic access.
 */

import type {
  ReportGenerator,
  AnalysisResult,
  ClassifiedIssues,
  ReportData,
  ReportSummary,
  Recommendation,
  Issue,
  IssuePattern,
  Severity,
  IssueCategory,
  IssueType,
} from '../types';

/**
 * Configuration for report generation
 */
export interface ReportGeneratorConfig {
  /**
   * Whether to include code snippets in reports
   * @default true
   */
  includeCodeSnippets?: boolean;

  /**
   * Maximum length of code snippets
   * @default 200
   */
  maxSnippetLength?: number;

  /**
   * Whether to include detailed recommendations
   * @default true
   */
  includeRecommendations?: boolean;

  /**
   * Maximum number of top patterns to include in summary
   * @default 5
   */
  maxTopPatterns?: number;

  /**
   * Maximum number of most affected files to include in summary
   * @default 10
   */
  maxAffectedFiles?: number;

  /**
   * Whether to group issues by file in the report
   * @default true
   */
  groupByFile?: boolean;

  /**
   * Whether to include issue IDs in the report
   * @default false
   */
  includeIssueIds?: boolean;
}

/**
 * Implementation of the Report Generator
 * 
 * Responsibilities:
 * 1. Generate human-readable Markdown reports
 * 2. Generate machine-readable JSON reports
 * 3. Generate executive summaries
 * 4. Format issues with proper context
 * 5. Generate actionable recommendations
 */
export class ReportGeneratorImpl implements ReportGenerator {
  private config: Required<ReportGeneratorConfig>;

  constructor(config: ReportGeneratorConfig = {}) {
    this.config = {
      includeCodeSnippets: config.includeCodeSnippets ?? true,
      maxSnippetLength: config.maxSnippetLength ?? 200,
      includeRecommendations: config.includeRecommendations ?? true,
      maxTopPatterns: config.maxTopPatterns ?? 5,
      maxAffectedFiles: config.maxAffectedFiles ?? 10,
      groupByFile: config.groupByFile ?? true,
      includeIssueIds: config.includeIssueIds ?? false,
    };
  }

  /**
   * Generate a human-readable Markdown report
   * 
   * @param result Analysis result
   * @param classified Classified issues
   * @returns Markdown report
   */
  generateMarkdownReport(result: AnalysisResult, classified: ClassifiedIssues): string {
    const summary = this.generateSummary(result);
    const recommendations = this.generateRecommendations(classified);

    const sections: string[] = [];

    // Title
    sections.push('# Codebase Cleanup Analysis Report\n');

    // Timestamp
    sections.push(`**Generated:** ${result.analysisTimestamp.toLocaleString()}\n`);
    sections.push(`**Analysis Duration:** ${this.formatDuration(result.analysisDuration)}\n`);

    // Executive Summary
    sections.push('## Executive Summary\n');
    sections.push(this.formatSummarySection(summary));

    // Top Patterns
    if (classified.patterns.length > 0) {
      sections.push('## Top Patterns Detected\n');
      sections.push(this.formatPatternsSection(classified.patterns));
    }

    // Recommendations
    if (this.config.includeRecommendations && recommendations.length > 0) {
      sections.push('## Recommendations\n');
      sections.push(this.formatRecommendationsSection(recommendations));
    }

    // Issues by Category
    sections.push('## Issues by Category\n');
    sections.push(this.formatIssuesByCategory(result, classified));

    // Issues by Severity
    sections.push('## Issues by Severity\n');
    sections.push(this.formatIssuesBySeverity(classified));

    // Most Affected Files
    if (summary.mostAffectedFiles.length > 0) {
      sections.push('## Most Affected Files\n');
      sections.push(this.formatMostAffectedFiles(summary.mostAffectedFiles, result));
    }

    return sections.join('\n');
  }

  /**
   * Generate a machine-readable JSON report
   * 
   * @param result Analysis result
   * @param classified Classified issues
   * @returns JSON report data
   */
  generateJsonReport(result: AnalysisResult, classified: ClassifiedIssues): ReportData {
    const summary = this.generateSummary(result);
    const recommendations = this.generateRecommendations(classified);

    // Collect all issues
    const allIssues = [
      ...classified.critical,
      ...classified.high,
      ...classified.medium,
      ...classified.low,
    ];

    return {
      summary,
      issues: allIssues,
      patterns: classified.patterns,
      recommendations,
    };
  }

  /**
   * Generate an executive summary
   * 
   * @param result Analysis result
   * @returns Report summary
   */
  generateSummary(result: AnalysisResult): ReportSummary {
    // Count issues by severity
    const criticalIssues = result.issuesBySeverity.get('critical')?.length || 0;
    const highIssues = result.issuesBySeverity.get('high')?.length || 0;
    const mediumIssues = result.issuesBySeverity.get('medium')?.length || 0;
    const lowIssues = result.issuesBySeverity.get('low')?.length || 0;

    // Get top patterns (will be populated by classifier)
    const topPatterns: IssuePattern[] = [];

    // Find most affected files
    const mostAffectedFiles = this.findMostAffectedFiles(result);

    // Estimate cleanup effort
    const estimatedCleanupEffort = this.estimateCleanupEffort(result);

    return {
      totalIssues: result.totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      topPatterns,
      mostAffectedFiles,
      estimatedCleanupEffort,
    };
  }

  /**
   * Generate actionable recommendations
   * 
   * @param classified Classified issues
   * @returns List of recommendations
   */
  private generateRecommendations(classified: ClassifiedIssues): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let priority = 1;

    // Recommendation 1: Address critical issues first
    if (classified.critical.length > 0) {
      recommendations.push({
        priority: priority++,
        title: 'Address Critical Issues Immediately',
        description: `${classified.critical.length} critical issues require immediate attention. These issues may affect security, data integrity, or core functionality.`,
        affectedIssues: classified.critical.map(i => i.id),
        estimatedImpact: 'High - Prevents potential security vulnerabilities and data loss',
        estimatedEffort: this.estimateEffortForIssues(classified.critical),
      });
    }

    // Recommendation 2: Address patterns with high occurrence
    const highOccurrencePatterns = classified.patterns
      .filter(p => p.occurrences >= 5 && p.priority >= 7)
      .slice(0, 3);

    if (highOccurrencePatterns.length > 0) {
      for (const pattern of highOccurrencePatterns) {
        recommendations.push({
          priority: priority++,
          title: `Resolve ${pattern.patternName}`,
          description: `${pattern.description} ${pattern.recommendedAction}`,
          affectedIssues: pattern.relatedIssues.map(i => i.id),
          estimatedImpact: `Medium-High - Affects ${pattern.affectedFiles.length} files`,
          estimatedEffort: this.estimateEffortForIssues(pattern.relatedIssues),
        });
      }
    }

    // Recommendation 3: Standardize inconsistent patterns
    const inconsistentPatterns = classified.patterns.filter(p => 
      p.patternName.toLowerCase().includes('inconsistent')
    );

    if (inconsistentPatterns.length > 0) {
      const totalAffectedFiles = new Set(
        inconsistentPatterns.flatMap(p => p.affectedFiles)
      ).size;

      recommendations.push({
        priority: priority++,
        title: 'Standardize Inconsistent Patterns',
        description: `Multiple inconsistent patterns detected across ${totalAffectedFiles} files. Establishing and documenting standard patterns will improve maintainability.`,
        affectedIssues: inconsistentPatterns.flatMap(p => p.relatedIssues.map(i => i.id)),
        estimatedImpact: 'Medium - Improves code consistency and maintainability',
        estimatedEffort: this.estimateEffortForIssues(
          inconsistentPatterns.flatMap(p => p.relatedIssues)
        ),
      });
    }

    // Recommendation 4: Remove legacy code
    const legacyIssues = [
      ...classified.critical,
      ...classified.high,
      ...classified.medium,
      ...classified.low,
    ].filter(i => i.type === 'legacy-code' || i.type === 'backward-compatibility');

    if (legacyIssues.length > 0) {
      recommendations.push({
        priority: priority++,
        title: 'Remove Legacy and Backward Compatibility Code',
        description: `${legacyIssues.length} instances of legacy or backward compatibility code can be safely removed to reduce technical debt.`,
        affectedIssues: legacyIssues.map(i => i.id),
        estimatedImpact: 'Low-Medium - Reduces code complexity and maintenance burden',
        estimatedEffort: this.estimateEffortForIssues(legacyIssues),
      });
    }

    // Recommendation 5: Improve type safety
    const typeSafetyIssues = [
      ...classified.critical,
      ...classified.high,
      ...classified.medium,
      ...classified.low,
    ].filter(i => i.type === 'type-safety');

    if (typeSafetyIssues.length > 0) {
      recommendations.push({
        priority: priority++,
        title: 'Improve Type Safety',
        description: `${typeSafetyIssues.length} type safety issues detected. Replacing 'any' types with proper definitions will catch bugs at compile time.`,
        affectedIssues: typeSafetyIssues.map(i => i.id),
        estimatedImpact: 'Medium - Prevents runtime errors and improves developer experience',
        estimatedEffort: this.estimateEffortForIssues(typeSafetyIssues),
      });
    }

    return recommendations;
  }

  /**
   * Format the summary section
   * 
   * @param summary Report summary
   * @returns Formatted summary
   */
  private formatSummarySection(summary: ReportSummary): string {
    const lines: string[] = [];

    lines.push(`- **Total Issues:** ${summary.totalIssues}`);
    lines.push(`- **Critical:** ${summary.criticalIssues}`);
    lines.push(`- **High:** ${summary.highIssues}`);
    lines.push(`- **Medium:** ${summary.mediumIssues}`);
    lines.push(`- **Low:** ${summary.lowIssues}`);
    lines.push(`- **Estimated Cleanup Effort:** ${summary.estimatedCleanupEffort}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Format the patterns section
   * 
   * @param patterns Detected patterns
   * @returns Formatted patterns
   */
  private formatPatternsSection(patterns: IssuePattern[]): string {
    const lines: string[] = [];
    const topPatterns = patterns.slice(0, this.config.maxTopPatterns);

    for (let i = 0; i < topPatterns.length; i++) {
      const pattern = topPatterns[i];
      lines.push(`### ${i + 1}. ${pattern.patternName} (${pattern.occurrences} occurrences)\n`);
      lines.push(`**Priority:** ${pattern.priority}/10\n`);
      lines.push(`**Description:** ${pattern.description}\n`);
      lines.push(`**Affected Files:** ${pattern.affectedFiles.length} files\n`);
      lines.push(`**Recommended Action:** ${pattern.recommendedAction}\n`);
    }

    return lines.join('\n');
  }

  /**
   * Format the recommendations section
   * 
   * @param recommendations List of recommendations
   * @returns Formatted recommendations
   */
  private formatRecommendationsSection(recommendations: Recommendation[]): string {
    const lines: string[] = [];

    for (const rec of recommendations) {
      lines.push(`### ${rec.priority}. ${rec.title}\n`);
      lines.push(`**Description:** ${rec.description}\n`);
      lines.push(`**Impact:** ${rec.estimatedImpact}\n`);
      lines.push(`**Effort:** ${rec.estimatedEffort}\n`);
      lines.push(`**Affected Issues:** ${rec.affectedIssues.length}\n`);
    }

    return lines.join('\n');
  }

  /**
   * Format issues by category
   * 
   * @param result Analysis result
   * @param classified Classified issues
   * @returns Formatted issues by category
   */
  private formatIssuesByCategory(result: AnalysisResult, classified: ClassifiedIssues): string {
    const lines: string[] = [];
    const categories = Array.from(result.issuesByCategory.keys()).sort();

    for (const category of categories) {
      const issues = result.issuesByCategory.get(category) || [];
      if (issues.length === 0) continue;

      lines.push(`### ${this.formatCategoryName(category)} (${issues.length} issues)\n`);

      // Group by severity within category
      const bySeverity = this.groupBySeverity(issues);

      for (const severity of ['critical', 'high', 'medium', 'low'] as Severity[]) {
        const severityIssues = bySeverity[severity];
        if (severityIssues.length === 0) continue;

        lines.push(`#### ${this.formatSeverityName(severity)} Issues\n`);

        for (const issue of severityIssues) {
          lines.push(this.formatIssue(issue));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Format issues by severity
   * 
   * @param classified Classified issues
   * @returns Formatted issues by severity
   */
  private formatIssuesBySeverity(classified: ClassifiedIssues): string {
    const lines: string[] = [];

    const severities: Array<{ name: Severity; issues: Issue[] }> = [
      { name: 'critical', issues: classified.critical },
      { name: 'high', issues: classified.high },
      { name: 'medium', issues: classified.medium },
      { name: 'low', issues: classified.low },
    ];

    for (const { name, issues } of severities) {
      if (issues.length === 0) continue;

      lines.push(`### ${this.formatSeverityName(name)} (${issues.length} issues)\n`);

      if (this.config.groupByFile) {
        // Group by file
        const byFile = this.groupByFile(issues);
        const files = Array.from(byFile.keys()).sort();

        for (const file of files) {
          const fileIssues = byFile.get(file) || [];
          lines.push(`#### ${file}\n`);

          for (const issue of fileIssues) {
            lines.push(this.formatIssue(issue));
          }
        }
      } else {
        // List all issues
        for (const issue of issues) {
          lines.push(this.formatIssue(issue));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Format a single issue
   * 
   * @param issue Issue to format
   * @returns Formatted issue
   */
  private formatIssue(issue: Issue): string {
    const lines: string[] = [];

    // Issue header
    const idPart = this.config.includeIssueIds ? ` [${issue.id}]` : '';
    lines.push(`**${this.formatIssueTypeName(issue.type)}**${idPart}`);

    // Location
    lines.push(`- **File:** ${issue.file}:${issue.location.startLine}`);

    // Description
    lines.push(`- **Description:** ${issue.description}`);

    // Code snippet
    if (this.config.includeCodeSnippets && issue.codeSnippet) {
      const snippet = this.truncateSnippet(issue.codeSnippet);
      lines.push(`- **Code:**`);
      lines.push('  ```typescript');
      lines.push(`  ${snippet}`);
      lines.push('  ```');
    }

    // Recommendation
    lines.push(`- **Recommendation:** ${issue.recommendation}`);

    // Effort
    lines.push(`- **Effort:** ${this.formatEffortLevel(issue.estimatedEffort)}`);

    lines.push(''); // Empty line between issues

    return lines.join('\n');
  }

  /**
   * Format most affected files
   * 
   * @param files List of file paths
   * @param result Analysis result
   * @returns Formatted file list
   */
  private formatMostAffectedFiles(files: string[], result: AnalysisResult): string {
    const lines: string[] = [];

    // Count issues per file
    const fileCounts = new Map<string, number>();
    for (const [, issues] of result.issuesByCategory) {
      for (const issue of issues) {
        fileCounts.set(issue.file, (fileCounts.get(issue.file) || 0) + 1);
      }
    }

    // Sort by count
    const sortedFiles = files
      .map(file => ({ file, count: fileCounts.get(file) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.config.maxAffectedFiles);

    for (const { file, count } of sortedFiles) {
      lines.push(`- **${file}** - ${count} issue${count !== 1 ? 's' : ''}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Find most affected files
   * 
   * @param result Analysis result
   * @returns List of most affected file paths
   */
  private findMostAffectedFiles(result: AnalysisResult): string[] {
    const fileCounts = new Map<string, number>();

    // Count issues per file
    for (const [, issues] of result.issuesByCategory) {
      for (const issue of issues) {
        fileCounts.set(issue.file, (fileCounts.get(issue.file) || 0) + 1);
      }
    }

    // Sort by count and return top files
    return Array.from(fileCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.maxAffectedFiles)
      .map(([file]) => file);
  }

  /**
   * Estimate cleanup effort for all issues
   * 
   * @param result Analysis result
   * @returns Human-readable effort estimate
   */
  private estimateCleanupEffort(result: AnalysisResult): string {
    const effortHours: Record<string, number> = {
      trivial: 0.5,
      small: 2,
      medium: 4,
      large: 8,
    };

    let totalHours = 0;

    // Sum effort for all issues
    for (const [, issues] of result.issuesBySeverity) {
      for (const issue of issues) {
        totalHours += effortHours[issue.estimatedEffort] || 0;
      }
    }

    return this.formatEffortHours(totalHours);
  }

  /**
   * Estimate effort for a list of issues
   * 
   * @param issues List of issues
   * @returns Human-readable effort estimate
   */
  private estimateEffortForIssues(issues: Issue[]): string {
    const effortHours: Record<string, number> = {
      trivial: 0.5,
      small: 2,
      medium: 4,
      large: 8,
    };

    let totalHours = 0;
    for (const issue of issues) {
      totalHours += effortHours[issue.estimatedEffort] || 0;
    }

    return this.formatEffortHours(totalHours);
  }

  /**
   * Format effort hours into human-readable string
   * 
   * @param hours Total hours
   * @returns Formatted effort
   */
  private formatEffortHours(hours: number): string {
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 8) return `${Math.round(hours)} hours`;

    const days = Math.round(hours / 8);
    if (days === 1) return '1 day';
    if (days < 5) return `${days} days`;

    const weeks = Math.round(days / 5);
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  }

  /**
   * Group issues by severity
   * 
   * @param issues Issues to group
   * @returns Issues grouped by severity
   */
  private groupBySeverity(issues: Issue[]): Record<Severity, Issue[]> {
    const grouped: Record<Severity, Issue[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const issue of issues) {
      grouped[issue.severity].push(issue);
    }

    return grouped;
  }

  /**
   * Group issues by file
   * 
   * @param issues Issues to group
   * @returns Issues grouped by file
   */
  private groupByFile(issues: Issue[]): Map<string, Issue[]> {
    const grouped = new Map<string, Issue[]>();

    for (const issue of issues) {
      const group = grouped.get(issue.file) || [];
      group.push(issue);
      grouped.set(issue.file, group);
    }

    return grouped;
  }

  /**
   * Truncate code snippet to maximum length
   * 
   * @param snippet Code snippet
   * @returns Truncated snippet
   */
  private truncateSnippet(snippet: string): string {
    if (snippet.length <= this.config.maxSnippetLength) {
      return snippet;
    }

    return snippet.substring(0, this.config.maxSnippetLength) + '...';
  }

  /**
   * Format duration in milliseconds to human-readable string
   * 
   * @param ms Duration in milliseconds
   * @returns Formatted duration
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format category name for display
   * 
   * @param category Issue category
   * @returns Formatted name
   */
  private formatCategoryName(category: IssueCategory): string {
    const names: Record<IssueCategory, string> = {
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

    return names[category] || category;
  }

  /**
   * Format severity name for display
   * 
   * @param severity Issue severity
   * @returns Formatted name
   */
  private formatSeverityName(severity: Severity): string {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  }

  /**
   * Format issue type name for display
   * 
   * @param type Issue type
   * @returns Formatted name
   */
  private formatIssueTypeName(type: IssueType): string {
    const names: Record<IssueType, string> = {
      'backward-compatibility': 'Backward Compatibility',
      'legacy-code': 'Legacy Code',
      'unnecessary-adapter': 'Unnecessary Adapter',
      'confusing-logic': 'Confusing Logic',
      'code-duplication': 'Code Duplication',
      'inconsistent-pattern': 'Inconsistent Pattern',
      'poor-naming': 'Poor Naming',
      'missing-error-handling': 'Missing Error Handling',
      'type-safety': 'Type Safety',
      'architectural': 'Architectural',
    };

    return names[type] || type;
  }

  /**
   * Format effort level for display
   * 
   * @param effort Effort level
   * @returns Formatted effort
   */
  private formatEffortLevel(effort: string): string {
    return effort.charAt(0).toUpperCase() + effort.slice(1);
  }
}

/**
 * Create a new report generator instance
 * 
 * @param config Configuration options
 * @returns Report generator instance
 */
export function createReportGenerator(config?: ReportGeneratorConfig): ReportGenerator {
  return new ReportGeneratorImpl(config);
}
