# Task 17.1 Completion: Create IssueClassifier Class

## Overview

Successfully implemented the `IssueClassifier` class that categorizes, prioritizes, and enriches issues detected by analyzers. The classifier groups related issues into patterns and assigns severity-based priorities.

## Implementation Details

### Files Created

1. **`src/classifier/issue-classifier.ts`** - Main implementation
   - `IssueClassifierImpl` class implementing the `IssueClassifier` interface
   - `createIssueClassifier()` factory function
   - `PatternDetectionConfig` interface for configuration

2. **`src/classifier/index.ts`** - Module exports

3. **`tests/unit/classifier/issue-classifier.test.ts`** - Comprehensive unit tests (22 tests, all passing)

### Core Functionality

#### 1. `classify(issues: Issue[]): ClassifiedIssues`

Classifies issues by severity level:
- Groups issues into `critical`, `high`, `medium`, and `low` categories
- Detects patterns across all issues
- Returns a `ClassifiedIssues` object with all classifications

**Implementation:**
- Simple iteration through issues
- Switch statement for severity grouping
- Calls `detectPatterns()` to find related issues

#### 2. `prioritize(issues: Issue[]): Issue[]`

Prioritizes issues using a multi-level sorting strategy:

1. **Severity** (critical > high > medium > low)
2. **Category** (authentication > error-handling > database > api-routes > services > middleware > types > components > general)
3. **Type** (architectural > type-safety > missing-error-handling > inconsistent-pattern > confusing-logic > code-duplication > unnecessary-adapter > backward-compatibility > legacy-code > poor-naming)
4. **Effort** (trivial > small > medium > large - lower effort first)
5. **Related Issues Count** (more related issues = higher priority)

**Implementation:**
- Non-mutating sort (creates new array)
- Cascading comparison logic
- Priority maps for categories and types

#### 3. `detectPatterns(issues: Issue[]): IssuePattern[]`

Detects patterns of related issues across the codebase:

**Pattern Types:**
1. **Type-Category Patterns**: Issues with same type and category
2. **Cross-File Patterns**: Issues detected by same analyzer across multiple files

**Pattern Detection Logic:**
- Groups issues by type and category
- Filters by minimum occurrences (default: 3)
- Calculates priority based on:
  - Severity distribution (critical=4, high=3, medium=2, low=1)
  - Number of occurrences (boost up to 3)
  - Number of affected files (boost up to 2)
- Filters by minimum priority (default: 1)
- Sorts patterns by priority (highest first)

**Pattern Metadata Generation:**
- Pattern ID: `pattern-{type}-{category}`
- Pattern Name: Human-readable name
- Description: Contextual description with file count
- Recommended Action: Type-specific remediation advice
- Priority: 1-10 scale

### Configuration Options

```typescript
interface PatternDetectionConfig {
  minOccurrences?: number;           // Default: 3
  minPriority?: number;              // Default: 1
  detectCrossFilePatterns?: boolean; // Default: true
}
```

### Key Design Decisions

1. **Configurable Pattern Detection**: Allows users to adjust sensitivity of pattern detection
2. **Multi-Level Prioritization**: Ensures most important issues surface first
3. **Cross-File Pattern Detection**: Identifies systemic problems across the codebase
4. **Non-Mutating Operations**: All methods return new data structures
5. **Comprehensive Priority Calculation**: Considers multiple factors for pattern importance

## Test Coverage

### Test Suite: 22 tests, all passing ✅

**Classification Tests (4 tests):**
- ✅ Classifies issues by severity correctly
- ✅ Handles empty issue lists
- ✅ Detects patterns during classification
- ✅ Includes all severity levels in output

**Prioritization Tests (7 tests):**
- ✅ Prioritizes by severity first
- ✅ Prioritizes by category within same severity
- ✅ Prioritizes by type within same category
- ✅ Prioritizes by effort (lower effort first)
- ✅ Prioritizes by related issues count as tiebreaker
- ✅ Does not modify original array
- ✅ Handles empty arrays

**Pattern Detection Tests (10 tests):**
- ✅ Detects patterns with minimum occurrences
- ✅ Respects minimum occurrence threshold
- ✅ Generates correct pattern metadata
- ✅ Calculates priority based on severity
- ✅ Sorts patterns by priority
- ✅ Detects cross-file patterns
- ✅ Respects cross-file pattern configuration
- ✅ Handles empty issue lists
- ✅ Filters by minimum priority
- ✅ Counts unique affected files correctly

**Integration Test (1 test):**
- ✅ Classifies, prioritizes, and detects patterns together

## Requirements Validation

### Requirement 11.3: Report Prioritization ✅

**Acceptance Criteria:**
- "WHEN generating reports, THE System SHALL prioritize issues by severity and impact"

**Implementation:**
- `prioritize()` method sorts issues by severity first
- Then by category (impact on system)
- Then by type (architectural impact)
- Then by effort (quick wins)
- Finally by related issues (scope of impact)

**Validation:**
- Test: "should prioritize by severity first" ✅
- Test: "should prioritize by category within same severity" ✅
- Test: "should prioritize by type within same category" ✅

### Requirement 11.4: Pattern Grouping ✅

**Acceptance Criteria:**
- "WHEN generating reports, THE System SHALL group related issues by pattern type"

**Implementation:**
- `detectPatterns()` method groups issues by type and category
- Creates `IssuePattern` objects with:
  - Pattern ID and name
  - List of related issues
  - Affected files
  - Occurrence count
  - Recommended action
  - Priority score

**Validation:**
- Test: "should detect patterns with minimum occurrences" ✅
- Test: "should generate correct pattern metadata" ✅
- Test: "should detect cross-file patterns" ✅
- Test: "should count unique affected files correctly" ✅

## Usage Example

```typescript
import { createIssueClassifier } from './classifier';

// Create classifier with custom config
const classifier = createIssueClassifier({
  minOccurrences: 3,
  minPriority: 5,
  detectCrossFilePatterns: true,
});

// Classify issues
const classified = classifier.classify(issues);
console.log(`Critical: ${classified.critical.length}`);
console.log(`Patterns: ${classified.patterns.length}`);

// Prioritize issues
const prioritized = classifier.prioritize(issues);
console.log(`Top issue: ${prioritized[0].description}`);

// Detect patterns
const patterns = classifier.detectPatterns(issues);
for (const pattern of patterns) {
  console.log(`${pattern.patternName}: ${pattern.occurrences} occurrences`);
  console.log(`  Priority: ${pattern.priority}/10`);
  console.log(`  Action: ${pattern.recommendedAction}`);
}
```

## Integration with Analysis Engine

The IssueClassifier integrates seamlessly with the AnalysisEngine:

```typescript
// 1. Run analysis
const result = await analysisEngine.analyze(files, analyzers);

// 2. Classify issues
const classified = classifier.classify(result.issuesByType.values());

// 3. Use classified issues in reports
const report = reportGenerator.generateMarkdownReport(result, classified);
```

## Next Steps

The IssueClassifier is now complete and ready for integration with:

1. **Task 17.2**: Implement pattern detection logic (already included in this implementation)
2. **Task 18**: Implement Report Generator (will consume `ClassifiedIssues`)
3. **Task 19**: Implement Cleanup Planner (will use patterns for task generation)

## Performance Characteristics

- **Time Complexity:**
  - `classify()`: O(n) where n = number of issues
  - `prioritize()`: O(n log n) due to sorting
  - `detectPatterns()`: O(n * m) where m = number of unique type-category combinations

- **Space Complexity:**
  - O(n) for storing classified issues
  - O(p) for storing patterns where p = number of detected patterns

- **Scalability:**
  - Handles thousands of issues efficiently
  - Pattern detection scales with number of unique type-category combinations
  - Cross-file pattern detection adds minimal overhead

## Conclusion

Task 17.1 is complete with a robust, well-tested IssueClassifier implementation that:
- ✅ Classifies issues by severity
- ✅ Prioritizes issues using multi-level sorting
- ✅ Detects patterns across the codebase
- ✅ Provides configurable pattern detection
- ✅ Validates Requirements 11.3 and 11.4
- ✅ Includes comprehensive test coverage (22 tests, all passing)
- ✅ Ready for integration with Report Generator and Cleanup Planner
