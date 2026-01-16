# Implementation Plan: Codebase Cleanup and Refactoring

## Overview

This implementation plan breaks down the codebase cleanup analysis system into discrete coding tasks. The system will analyze Next.js/Supabase codebases to identify technical debt, generate reports, and create actionable cleanup plans. Implementation follows a bottom-up approach: core utilities → pattern analyzers → analysis engine → reporting → planning.

## Tasks

- [x] 1. Set up project structure and core types
  - Create TypeScript project with proper tsconfig.json
  - Install dependencies: ts-morph (AST manipulation), fast-check (property testing), vitest (testing)
  - Define core type definitions (FileInfo, Issue, IssuePattern, CodeLocation, etc.)
  - Set up testing framework with unit and property test directories
  - _Requirements: All requirements (foundation for entire system)_

- [x] 2. Implement File Scanner
  - [x] 2.1 Create FileScanner class with directory traversal
    - Implement recursive directory scanning with configurable depth
    - Apply include/exclude glob patterns using minimatch
    - Handle symbolic links and circular references safely
    - Categorize files by path patterns (component, api-route, service, etc.)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1, 15.1_
  
  - [x] 2.2 Write property test for file discovery completeness
    - **Property 1: Complete File Discovery**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1, 15.1**
    - Generate random directory structures, verify all matching files discovered
  
  - [x] 2.3 Write unit tests for FileScanner edge cases
    - Test empty directories, deeply nested structures, symbolic links
    - Test include/exclude pattern combinations
    - _Requirements: 1.1_

- [x] 3. Implement Pattern Analyzer base and utilities
  - [x] 3.1 Create PatternAnalyzer abstract base class
    - Define analyze() interface returning Issue[]
    - Implement common AST traversal utilities
    - Create helper methods for issue creation with location tracking
    - _Requirements: All pattern detection requirements_
  
  - [x] 3.2 Create AST parsing utilities
    - Implement file-to-AST parsing using ts-morph
    - Add error handling for invalid syntax
    - Create AST query helpers (find functions, find imports, find types, etc.)
    - _Requirements: All analysis requirements_
  
  - [x] 3.3 Write unit tests for AST utilities
    - Test parsing valid and invalid TypeScript/JavaScript
    - Test AST query helpers with various code structures
    - _Requirements: All analysis requirements_

- [-] 4. Implement CodeQualityAnalyzer
  - [-] 4.1 Implement confusing logic detection
    - Detect deeply nested conditionals (>3 levels)
    - Detect complex boolean expressions (>3 operators)
    - Detect unclear control flow patterns
    - _Requirements: 1.5_
  
  - [ ] 4.2 Implement code duplication detection
    - Use AST similarity comparison for duplicate functions
    - Detect similar code blocks with minor differences
    - Detect duplicate constants across files
    - _Requirements: 6.5, 8.1, 8.2, 8.4, 8.5, 15.2_
  
  - [ ] 4.3 Implement naming convention analysis
    - Detect single-letter variables (except loop counters)
    - Detect inconsistent naming patterns (camelCase vs snake_case)
    - Detect unclear function/variable names
    - _Requirements: 10.1, 10.4_
  
  - [ ] 4.4 Implement legacy code detection
    - Detect commented-out code blocks
    - Detect unused exports using import analysis
    - _Requirements: 1.3_
  
  - [ ] 4.5 Write property tests for code quality detection
    - **Property 3: Legacy Code Pattern Detection**
    - **Property 5: Confusing Logic Detection**
    - **Property 6: Code Quality Issue Detection**
    - **Property 14: Code Duplication Detection**
    - **Property 18: Naming Convention Inconsistency Detection**
    - **Validates: Requirements 1.3, 1.5, 1.6, 6.5, 8.1, 8.2, 8.4, 8.5, 10.1, 10.4, 15.2**
  
  - [ ] 4.6 Write unit tests for specific code quality patterns
    - Test specific examples of nested conditionals, duplicate code, poor naming
    - _Requirements: 1.3, 1.5, 1.6_

- [ ] 5. Implement AuthPatternAnalyzer
  - [ ] 5.1 Implement auth client instantiation pattern detection
    - Detect multiple patterns for creating auth clients
    - Track all auth client creation locations
    - _Requirements: 2.1_
  
  - [ ] 5.2 Implement auth inconsistency detection
    - Detect inconsistent permission checking patterns
    - Detect inconsistent session management
    - Identify redundant auth middleware
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ] 5.3 Implement unnecessary auth adapter detection
    - Detect simple pass-through auth wrapper functions
    - Identify auth adapters that add no value
    - _Requirements: 2.5_
  
  - [ ] 5.4 Write property tests for auth pattern detection
    - **Property 7: Authentication Pattern Inconsistency Detection**
    - **Validates: Requirements 2.2, 2.3, 2.4**
    - Generate code with various auth patterns, verify inconsistencies detected
  
  - [ ] 5.5 Write unit tests for specific auth anti-patterns
    - Test examples of inconsistent auth, redundant middleware
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Implement DatabasePatternAnalyzer
  - [ ] 6.1 Implement database client pattern detection
    - Detect all Supabase client instantiation patterns
    - Track database access patterns
    - _Requirements: 3.1_
  
  - [ ] 6.2 Implement database inconsistency detection
    - Detect inconsistent error handling in database operations
    - Detect inconsistent type usage for database entities
    - Identify code bypassing established patterns
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [ ] 6.3 Implement unnecessary database adapter detection
    - Detect simple pass-through database wrappers
    - _Requirements: 3.3_
  
  - [ ] 6.4 Write property tests for database pattern detection
    - **Property 8: Database Access Inconsistency Detection**
    - **Validates: Requirements 3.2, 3.4, 3.5**
    - Generate database code with various patterns, verify detection
  
  - [ ] 6.5 Write unit tests for database anti-patterns
    - Test specific examples of inconsistent database access
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Implement ComponentPatternAnalyzer
  - [ ] 7.1 Implement component discovery and categorization
    - Identify all React components (function and class components)
    - Categorize components by type
    - _Requirements: 6.1_
  
  - [ ] 7.2 Implement prop drilling detection
    - Track prop passing depth through component trees
    - Flag prop drilling exceeding 3 levels
    - _Requirements: 6.3_
  
  - [ ] 7.3 Implement component pattern inconsistency detection
    - Detect inconsistent component composition patterns
    - Identify duplicate component logic
    - _Requirements: 6.4, 6.5_
  
  - [ ] 7.4 Write property tests for component pattern detection
    - **Property 12: Component Prop Drilling Detection**
    - **Property 13: Component Pattern Inconsistency Detection**
    - **Validates: Requirements 6.3, 6.4**
    - Generate component trees, verify prop drilling and pattern detection
  
  - [ ] 7.5 Write unit tests for component anti-patterns
    - Test specific examples of prop drilling, duplicate logic
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 8. Implement TypePatternAnalyzer
  - [ ] 8.1 Implement type definition discovery
    - Find all type definitions (interfaces, types, enums)
    - Track type usage across files
    - _Requirements: 7.1_
  
  - [ ] 8.2 Implement type inconsistency detection
    - Detect duplicate type definitions for same entities
    - Detect mismatches between Supabase types and manual types
    - _Requirements: 7.2, 7.4, 7.5_
  
  - [ ] 8.3 Implement type safety issue detection
    - Detect excessive 'any' type usage
    - Detect unnecessary type assertions
    - _Requirements: 7.3_
  
  - [ ] 8.4 Write property tests for type pattern detection
    - **Property 15: Type Definition Inconsistency Detection**
    - **Property 16: Type Safety Issue Detection**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
    - Generate code with type issues, verify detection
  
  - [ ] 8.5 Write unit tests for type anti-patterns
    - Test specific examples of duplicate types, 'any' usage
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Implement APIRoutePatternAnalyzer
  - [ ] 9.1 Implement API route discovery
    - Find all Next.js API route handlers
    - Categorize routes by pattern
    - _Requirements: 4.1_
  
  - [ ] 9.2 Implement route pattern inconsistency detection
    - Detect inconsistent request validation
    - Detect inconsistent error handling
    - Detect inconsistent response formats
    - Detect duplicate middleware usage
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 9.3 Write property tests for API route pattern detection
    - **Property 9: API Route Pattern Inconsistency Detection**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
    - Generate API routes with various patterns, verify detection
  
  - [ ] 9.4 Write unit tests for API route anti-patterns
    - Test specific examples of inconsistent routes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Implement ServicePatternAnalyzer
  - [ ] 10.1 Implement service discovery and analysis
    - Find all service modules
    - Analyze service dependencies and imports
    - _Requirements: 5.1_
  
  - [ ] 10.2 Implement circular dependency detection
    - Build dependency graph from imports
    - Detect cycles in dependency graph
    - _Requirements: 5.3_
  
  - [ ] 10.3 Implement service pattern inconsistency detection
    - Detect inconsistent initialization patterns
    - Identify unnecessary service abstraction layers
    - _Requirements: 5.4, 5.5_
  
  - [ ] 10.4 Write property tests for service pattern detection
    - **Property 10: Circular Dependency Detection**
    - **Property 11: Service Pattern Inconsistency Detection**
    - **Validates: Requirements 5.3, 5.4**
    - Generate services with circular deps, verify detection
  
  - [ ] 10.5 Write unit tests for service anti-patterns
    - Test specific examples of circular dependencies, inconsistent patterns
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 11. Implement MiddlewarePatternAnalyzer
  - [ ] 11.1 Implement middleware discovery
    - Find all middleware implementations
    - Track middleware usage across routes
    - _Requirements: 15.1_
  
  - [ ] 11.2 Implement middleware pattern detection
    - Detect duplicate middleware logic
    - Detect inconsistent middleware ordering
    - Identify consolidation opportunities
    - _Requirements: 15.2, 15.3, 15.5_
  
  - [ ] 11.3 Write property tests for middleware pattern detection
    - **Property 23: Middleware Pattern Inconsistency Detection**
    - **Validates: Requirements 15.3, 15.5**
    - Generate middleware with various patterns, verify detection
  
  - [ ] 11.4 Write unit tests for middleware anti-patterns
    - Test specific examples of duplicate middleware, inconsistent ordering
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [ ] 12. Implement ErrorHandlingPatternAnalyzer
  - [ ] 12.1 Implement error handling pattern discovery
    - Find all error handling patterns (try-catch, error returns, etc.)
    - Track error response formats
    - _Requirements: 9.1_
  
  - [ ] 12.2 Implement error handling inconsistency detection
    - Detect inconsistent error response formats
    - Detect missing error logging
    - Detect missing error recovery
    - Identify opportunities for typed errors
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 12.3 Write property tests for error handling detection
    - **Property 17: Error Handling Inconsistency Detection**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5**
    - Generate error handling code, verify inconsistency detection
  
  - [ ] 12.4 Write unit tests for error handling anti-patterns
    - Test specific examples of inconsistent error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Implement BackwardCompatibilityAnalyzer
  - [ ] 13.1 Implement backward compatibility pattern detection
    - Detect version checks and feature flags
    - Detect polyfills and shims
    - Detect migration code patterns
    - Detect dual implementations (old + new)
    - _Requirements: 1.2, 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 13.2 Write property tests for backward compatibility detection
    - **Property 2: Backward Compatibility Pattern Detection**
    - **Validates: Requirements 1.2, 13.1, 13.2, 13.3, 13.4**
    - Generate code with compatibility patterns, verify detection
  
  - [ ] 13.3 Write unit tests for backward compatibility patterns
    - Test specific examples of version checks, polyfills, migration code
    - _Requirements: 1.2, 13.1, 13.2, 13.3, 13.4_

- [ ] 14. Implement AdapterPatternAnalyzer
  - [ ] 14.1 Implement adapter pattern detection
    - Find all wrapper functions and abstraction layers
    - Analyze function bodies to detect pass-through behavior
    - Identify adapters that add no meaningful value
    - _Requirements: 1.4, 14.1, 14.2, 14.4_
  
  - [ ] 14.2 Write property tests for adapter detection
    - **Property 4: Unnecessary Adapter Detection**
    - **Validates: Requirements 1.4, 2.5, 3.3, 5.5, 14.1, 14.2, 14.4**
    - Generate wrapper functions, verify unnecessary ones detected
  
  - [ ] 14.3 Write unit tests for adapter anti-patterns
    - Test specific examples of pass-through wrappers
    - _Requirements: 1.4, 14.1, 14.2, 14.4_

- [ ] 15. Checkpoint - Ensure all pattern analyzers work correctly
  - Run all analyzer tests
  - Verify each analyzer detects its target patterns
  - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Implement Analysis Engine
  - [ ] 16.1 Create AnalysisEngine class
    - Implement analyze() method coordinating all analyzers
    - Parse files to AST using ts-morph
    - Run applicable analyzers based on file category
    - Aggregate issues from all analyzers
    - Handle parsing errors gracefully
    - _Requirements: All requirements (orchestration)_
  
  - [ ] 16.2 Implement progress tracking and performance monitoring
    - Track analysis progress (files processed, issues found)
    - Measure analysis duration per file and overall
    - Log performance metrics
    - _Requirements: All requirements_
  
  - [ ] 16.3 Write unit tests for AnalysisEngine
    - Test analyzer coordination
    - Test error handling for invalid files
    - Test progress tracking
    - _Requirements: All requirements_

- [ ] 17. Implement Issue Classifier
  - [ ] 17.1 Create IssueClassifier class
    - Implement classify() to categorize by severity
    - Implement prioritize() to order issues
    - Implement detectPatterns() to group related issues
    - _Requirements: 11.3, 11.4_
  
  - [ ] 17.2 Implement pattern detection logic
    - Group similar issues across files
    - Identify systemic problems
    - Calculate pattern occurrence statistics
    - _Requirements: 11.4_
  
  - [ ] 17.3 Write unit tests for IssueClassifier
    - Test severity classification
    - Test pattern grouping
    - Test prioritization logic
    - _Requirements: 11.3, 11.4_

- [ ] 18. Implement Report Generator
  - [ ] 18.1 Create ReportGenerator class
    - Implement generateMarkdownReport() for human-readable output
    - Implement generateJsonReport() for programmatic access
    - Implement generateSummary() for executive overview
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [ ] 18.2 Implement report formatting
    - Format issues with file paths, line numbers, code snippets
    - Group issues by category and severity
    - Include actionable recommendations
    - Generate summary statistics
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 18.3 Write property tests for report generation
    - **Property 19: Report Completeness**
    - **Property 20: Report Prioritization**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
    - Generate random issues, verify report completeness and ordering
  
  - [ ] 18.4 Write unit tests for report formatting
    - Test Markdown formatting
    - Test JSON structure
    - Test summary generation
    - _Requirements: 11.1, 11.2, 11.5_

- [ ] 19. Implement Cleanup Planner
  - [ ] 19.1 Create CleanupPlanner class
    - Implement generatePlan() to create cleanup tasks
    - Implement orderTasks() to sequence tasks by dependencies
    - Implement detectDependencies() to find task relationships
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 19.2 Implement task generation logic
    - Generate specific tasks for each issue
    - Estimate effort and risk for each task
    - Flag tasks requiring test coverage
    - Create actionable step-by-step instructions
    - _Requirements: 12.1, 12.4, 12.5_
  
  - [ ] 19.3 Implement dependency detection and ordering
    - Detect dependencies between tasks (type changes before code changes, etc.)
    - Order tasks into phases (foundation → infrastructure → services → routes → components)
    - Ensure dependencies are respected in ordering
    - _Requirements: 12.2, 12.3_
  
  - [ ] 19.4 Write property tests for cleanup planning
    - **Property 21: Cleanup Task Generation**
    - **Property 22: Task Dependency Detection**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    - Generate random issues, verify tasks and dependencies
  
  - [ ] 19.5 Write unit tests for cleanup planner
    - Test task generation from issues
    - Test dependency detection
    - Test task ordering
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 20. Checkpoint - Ensure end-to-end flow works
  - Run integration tests with test codebase
  - Verify analysis → classification → reporting → planning flow
  - Ensure all tests pass, ask the user if questions arise

- [ ] 21. Create CLI interface
  - [ ] 21.1 Implement command-line interface
    - Create CLI using commander or yargs
    - Add commands: analyze, report, plan
    - Add options: --path, --output, --format, --include, --exclude
    - Implement progress display for long-running analysis
    - _Requirements: All requirements (user interface)_
  
  - [ ] 21.2 Implement configuration file support
    - Support .cleanuprc.json for default options
    - Allow configuration of analyzers, severity thresholds, patterns
    - _Requirements: All requirements_
  
  - [ ] 21.3 Write unit tests for CLI
    - Test command parsing
    - Test configuration loading
    - _Requirements: All requirements_

- [ ] 22. Create example usage and documentation
  - [ ] 22.1 Create example test codebase
    - Build small Next.js project with known anti-patterns
    - Include examples of each pattern type
    - Document expected analysis results
    - _Requirements: All requirements (validation)_
  
  - [ ] 22.2 Write usage documentation
    - Document CLI commands and options
    - Provide examples of running analysis
    - Explain report structure and interpretation
    - Document how to customize analyzers
    - _Requirements: All requirements_
  
  - [ ] 22.3 Create README with quick start guide
    - Installation instructions
    - Basic usage examples
    - Link to full documentation
    - _Requirements: All requirements_

- [ ] 23. Final integration testing and validation
  - [ ] 23.1 Run full test suite
    - Execute all unit tests
    - Execute all property tests (100+ iterations each)
    - Execute integration tests
    - Verify test coverage meets goals (80% line, 75% branch)
  
  - [ ] 23.2 Run analysis on example codebase
    - Execute full analysis on test codebase
    - Verify all expected issues detected
    - Verify report quality and accuracy
    - Verify cleanup plan is actionable
    - _Requirements: All requirements_
  
  - [ ] 23.3 Performance testing
    - Test on large codebase (1000+ files)
    - Measure analysis time and memory usage
    - Optimize bottlenecks if needed
    - _Requirements: All requirements_

- [ ] 24. Final checkpoint - Ensure system is production-ready
  - All tests passing
  - Documentation complete
  - Example codebase analysis successful
  - Performance acceptable
  - Ask the user if questions arise or if ready for deployment

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Implementation follows bottom-up approach: utilities → analyzers → engine → reporting → planning
- TypeScript provides type safety for AST manipulation and complex data structures
- ts-morph library simplifies TypeScript AST parsing and traversal
- fast-check library enables property-based testing with automatic test case generation
