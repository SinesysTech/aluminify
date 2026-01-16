# Codebase Cleanup and Refactoring Analyzer

A systematic codebase cleanup and refactoring analysis tool for Next.js/Supabase applications. This tool performs static code analysis to detect anti-patterns, generate comprehensive reports, and produce actionable cleanup plans.

## Features

- **Pattern Detection**: Identifies technical debt patterns including:
  - Backward compatibility code
  - Legacy code patterns
  - Unnecessary adapters
  - Confusing logic
  - Code duplication
  - Inconsistent patterns
  - Poor naming conventions
  - Missing error handling
  - Type safety issues
  - Architectural problems

- **Specialized Analyzers**:
  - Authentication pattern analyzer
  - Database access pattern analyzer
  - API route pattern analyzer
  - Component pattern analyzer
  - Type definition analyzer
  - Service layer analyzer
  - Middleware analyzer
  - Error handling analyzer

- **Comprehensive Reports**: Generates detailed reports with:
  - Issue categorization by type and severity
  - Pattern detection across files
  - Actionable recommendations
  - Code snippets and locations

- **Cleanup Planning**: Creates structured cleanup plans with:
  - Task generation from detected issues
  - Dependency detection and ordering
  - Risk assessment
  - Effort estimation

## Installation

```bash
cd codebase-cleanup
npm install
```

## Usage

```bash
# Build the project
npm run build

# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run property-based tests only
npm run test:property

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

## Project Structure

```
codebase-cleanup/
├── src/
│   ├── types.ts              # Core type definitions
│   ├── scanner/              # File scanning utilities
│   ├── analyzers/            # Pattern analyzers
│   ├── engine/               # Analysis engine
│   ├── classifier/           # Issue classification
│   ├── reporter/             # Report generation
│   ├── planner/              # Cleanup planning
│   └── cli/                  # Command-line interface
├── tests/
│   ├── unit/                 # Unit tests
│   ├── property/             # Property-based tests
│   └── integration/          # Integration tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Development

This project uses:
- **TypeScript** for type safety
- **ts-morph** for AST manipulation
- **Vitest** for testing
- **fast-check** for property-based testing

## Testing Strategy

The project employs a dual testing approach:

### Unit Tests
- Test specific examples of each anti-pattern
- Test edge cases (empty files, large files, etc.)
- Test error conditions
- Test integration between components

### Property-Based Tests
- Test universal properties across all codebases
- Test pattern detection accuracy with randomized code
- Test completeness of file discovery
- Test consistency of analysis results

## License

MIT
