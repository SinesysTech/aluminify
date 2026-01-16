# Setup Instructions

## Project Structure

The codebase cleanup analyzer has been set up with the following structure:

```
codebase-cleanup/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # Core type definitions
│   ├── scanner/              # File scanning (Task 2)
│   ├── analyzers/            # Pattern analyzers (Tasks 4-14)
│   ├── engine/               # Analysis engine (Task 16)
│   ├── classifier/           # Issue classification (Task 17)
│   ├── reporter/             # Report generation (Task 18)
│   ├── planner/              # Cleanup planning (Task 19)
│   └── cli/                  # CLI interface (Task 21)
├── tests/
│   ├── unit/                 # Unit tests
│   │   └── types.test.ts     # Type definition tests
│   ├── property/             # Property-based tests
│   └── integration/          # Integration tests
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest test configuration
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```

## Core Type Definitions

All core types have been defined in `src/types.ts`:

### File Types
- `FileInfo`: Information about files to analyze
- `FileCategory`: Categorization (component, api-route, service, etc.)
- `ScanOptions`: Options for directory scanning

### Issue Types
- `Issue`: Detected code issues
- `IssueType`: Types of issues (backward-compatibility, legacy-code, etc.)
- `IssueCategory`: Categories for grouping (authentication, database, etc.)
- `Severity`: Issue severity levels (critical, high, medium, low)
- `CodeLocation`: Precise location in source code

### Pattern Types
- `IssuePattern`: Patterns of related issues across files

### Analysis Types
- `AnalysisResult`: Results from codebase analysis
- `IssueCollection`: Collection of issues with groupings
- `ClassifiedIssues`: Issues classified by severity

### Report Types
- `ReportSummary`: Summary of analysis findings
- `ReportData`: Complete report data structure
- `Recommendation`: Actionable recommendations

### Cleanup Planning Types
- `CleanupTask`: Specific refactoring tasks
- `CleanupPhase`: Phases of cleanup work
- `CleanupPlan`: Complete cleanup plan with dependencies
- `RiskLevel`: Risk assessment levels

### Interface Types
All major components have interface definitions:
- `FileScanner`
- `PatternAnalyzer`
- `AnalysisEngine`
- `IssueClassifier`
- `ReportGenerator`
- `CleanupPlanner`

## Dependencies

The project requires the following dependencies:

### Runtime Dependencies
- `ts-morph`: TypeScript AST manipulation
- `minimatch`: Glob pattern matching
- `commander`: CLI framework

### Development Dependencies
- `typescript`: TypeScript compiler
- `vitest`: Testing framework
- `fast-check`: Property-based testing
- `@vitest/coverage-v8`: Code coverage
- `eslint`: Linting
- `@typescript-eslint/*`: TypeScript ESLint plugins

## Installation

Due to disk space constraints, dependencies may need to be installed when space is available:

```bash
cd codebase-cleanup
npm install
```

## TypeScript Configuration

The project uses strict TypeScript settings:
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- No unused locals/parameters
- No implicit returns
- Source maps enabled

## Testing Configuration

Vitest is configured with:
- Node environment
- Global test APIs
- Coverage thresholds:
  - Lines: 80%
  - Branches: 75%
  - Functions: 85%
  - Statements: 80%

## Next Steps

Task 1 is now complete. The foundation is ready for:

1. **Task 2**: Implement File Scanner
2. **Task 3**: Implement Pattern Analyzer base and utilities
3. **Tasks 4-14**: Implement specialized pattern analyzers
4. **Task 16**: Implement Analysis Engine
5. **Task 17**: Implement Issue Classifier
6. **Task 18**: Implement Report Generator
7. **Task 19**: Implement Cleanup Planner
8. **Task 21**: Create CLI interface

## Validation

To verify the setup:

```bash
# Type check (requires dependencies)
npm run typecheck

# Run tests (requires dependencies)
npm test

# Build (requires dependencies)
npm run build
```

## Notes

- All type definitions follow the design document specifications
- The structure supports the bottom-up implementation approach
- Each component has a dedicated directory for future implementation
- Test directories are organized by test type (unit, property, integration)
- The project is configured for both development and production use
