/**
 * Core type definitions for the codebase cleanup and refactoring analysis system
 */

// ============================================================================
// File Information Types
// ============================================================================

/**
 * Categorization of files for analysis purposes
 */
export type FileCategory =
  | 'component'      // React components
  | 'api-route'      // Next.js API routes
  | 'service'        // Backend services
  | 'type'           // Type definition files
  | 'util'           // Utility functions
  | 'middleware'     // Middleware files
  | 'config'         // Configuration files
  | 'test'           // Test files
  | 'other';         // Uncategorized

/**
 * Information about a file to be analyzed
 */
export interface FileInfo {
  path: string;              // Absolute path
  relativePath: string;      // Relative to project root
  extension: string;         // '.ts', '.tsx', etc.
  size: number;             // File size in bytes
  category: FileCategory;   // Categorization for analysis
  lastModified: Date;       // File modification timestamp
}

// ============================================================================
// Issue Types
// ============================================================================

/**
 * Types of issues that can be detected
 */
export type IssueType =
  | 'backward-compatibility'
  | 'legacy-code'
  | 'unnecessary-adapter'
  | 'confusing-logic'
  | 'code-duplication'
  | 'inconsistent-pattern'
  | 'poor-naming'
  | 'missing-error-handling'
  | 'type-safety'
  | 'architectural';

/**
 * Categories for grouping issues
 */
export type IssueCategory =
  | 'authentication'
  | 'database'
  | 'api-routes'
  | 'components'
  | 'services'
  | 'types'
  | 'middleware'
  | 'error-handling'
  | 'general';

/**
 * Severity levels for issues
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Effort levels for fixing issues
 */
export type EffortLevel = 'trivial' | 'small' | 'medium' | 'large';

/**
 * Precise location of code within a file
 */
export interface CodeLocation {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

/**
 * Represents a detected issue in the codebase
 */
export interface Issue {
  id: string;                    // Unique identifier (UUID)
  type: IssueType;              // Type of issue
  severity: Severity;           // Severity level
  category: IssueCategory;      // Category for grouping
  file: string;                 // File path
  location: CodeLocation;       // Precise location in file
  description: string;          // Human-readable description
  codeSnippet: string;         // Relevant code excerpt
  recommendation: string;       // Suggested fix
  estimatedEffort: EffortLevel; // Effort to fix
  tags: string[];              // Additional tags for filtering
  detectedBy: string;          // Analyzer that detected it
  detectedAt: Date;            // Detection timestamp
  relatedIssues: string[];     // IDs of related issues
}

// ============================================================================
// Pattern Types
// ============================================================================

/**
 * Represents a pattern of related issues across the codebase
 */
export interface IssuePattern {
  patternId: string;           // Unique pattern identifier
  patternName: string;         // Human-readable name
  description: string;         // Pattern description
  occurrences: number;         // Number of times detected
  affectedFiles: string[];     // Files where pattern appears
  relatedIssues: Issue[];      // Issues that match this pattern
  recommendedAction: string;   // How to address the pattern
  priority: number;            // Priority for addressing (1-10)
  category: IssueCategory;     // Category for grouping
}

// ============================================================================
// Scanner Types
// ============================================================================

/**
 * Options for scanning directories
 */
export interface ScanOptions {
  includePatterns: string[];  // e.g., ["**/*.ts", "**/*.tsx"]
  excludePatterns: string[];  // e.g., ["**/node_modules/**", "**/.next/**"]
  maxDepth?: number;          // Maximum directory depth
}

/**
 * Interface for file scanning functionality
 */
export interface FileScanner {
  scanDirectory(rootPath: string, options: ScanOptions): Promise<FileInfo[]>;
  filterByPattern(files: FileInfo[], patterns: string[]): FileInfo[];
  excludeByPattern(files: FileInfo[], patterns: string[]): FileInfo[];
}

// ============================================================================
// Analyzer Types
// ============================================================================

/**
 * Base interface for all pattern analyzers
 */
export interface PatternAnalyzer {
  name: string;
  analyze(file: FileInfo, ast: any): Promise<Issue[]>;
  getSupportedFileTypes(): FileCategory[];
}

// ============================================================================
// Analysis Engine Types
// ============================================================================

/**
 * Collection of issues with various groupings
 */
export interface IssueCollection {
  issues: Issue[];
  groupedByFile: Map<string, Issue[]>;
  groupedByType: Map<IssueType, Issue[]>;
  groupedByCategory: Map<IssueCategory, Issue[]>;
}

/**
 * Result of analyzing the codebase
 */
export interface AnalysisResult {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  issuesByType: Map<IssueType, Issue[]>;
  issuesByCategory: Map<IssueCategory, Issue[]>;
  issuesBySeverity: Map<Severity, Issue[]>;
  analysisTimestamp: Date;
  analysisDuration: number;
}

/**
 * Interface for the analysis engine
 */
export interface AnalysisEngine {
  analyze(files: FileInfo[], analyzers: PatternAnalyzer[]): Promise<AnalysisResult>;
  parseFile(file: FileInfo): Promise<any>;
  aggregateIssues(issues: Issue[]): IssueCollection;
}

// ============================================================================
// Classifier Types
// ============================================================================

/**
 * Issues classified by severity
 */
export interface ClassifiedIssues {
  critical: Issue[];
  high: Issue[];
  medium: Issue[];
  low: Issue[];
  patterns: IssuePattern[];
}

/**
 * Interface for issue classification
 */
export interface IssueClassifier {
  classify(issues: Issue[]): ClassifiedIssues;
  prioritize(issues: Issue[]): Issue[];
  detectPatterns(issues: Issue[]): IssuePattern[];
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Summary of the analysis report
 */
export interface ReportSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  topPatterns: IssuePattern[];
  mostAffectedFiles: string[];
  estimatedCleanupEffort: string;
}

/**
 * Recommendation for addressing issues
 */
export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  affectedIssues: string[];
  estimatedImpact: string;
  estimatedEffort: string;
}

/**
 * Complete report data structure
 */
export interface ReportData {
  summary: ReportSummary;
  issues: Issue[];
  patterns: IssuePattern[];
  recommendations: Recommendation[];
}

/**
 * Interface for report generation
 */
export interface ReportGenerator {
  generateMarkdownReport(result: AnalysisResult, classified: ClassifiedIssues): string;
  generateJsonReport(result: AnalysisResult, classified: ClassifiedIssues): ReportData;
  generateSummary(result: AnalysisResult): ReportSummary;
}

// ============================================================================
// Cleanup Planning Types
// ============================================================================

/**
 * Risk levels for cleanup tasks
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * A specific cleanup task to address issues
 */
export interface CleanupTask {
  id: string;                  // Unique task identifier
  title: string;               // Short task title
  description: string;         // Detailed description
  category: IssueCategory;     // Category for grouping
  relatedIssues: string[];     // Issue IDs this task addresses
  dependencies: string[];      // Task IDs that must complete first
  estimatedEffort: EffortLevel; // Effort estimate
  riskLevel: RiskLevel;        // Risk of making this change
  requiresTests: boolean;      // Whether tests needed before change
  actionSteps: string[];       // Step-by-step instructions
  affectedFiles: string[];     // Files that will be modified
  phase: number;               // Which phase this belongs to
}

/**
 * Dependency relationship between tasks
 */
export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  reason: string;
}

/**
 * A phase of cleanup work
 */
export interface CleanupPhase {
  phaseNumber: number;
  phaseName: string;
  tasks: CleanupTask[];
  description: string;
}

/**
 * Risk assessment for the cleanup plan
 */
export interface RiskAssessment {
  overallRisk: RiskLevel;
  highRiskTasks: CleanupTask[];
  mitigationStrategies: string[];
}

/**
 * Complete cleanup plan
 */
export interface CleanupPlan {
  tasks: CleanupTask[];
  phases: CleanupPhase[];
  estimatedDuration: string;
  riskAssessment: RiskAssessment;
}

/**
 * Interface for cleanup planning
 */
export interface CleanupPlanner {
  generatePlan(classified: ClassifiedIssues, patterns: IssuePattern[]): CleanupPlan;
  orderTasks(tasks: CleanupTask[]): CleanupTask[];
  detectDependencies(tasks: CleanupTask[]): TaskDependency[];
}
