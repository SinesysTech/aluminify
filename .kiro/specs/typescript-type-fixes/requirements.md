# Requirements Document

## Introduction

This document specifies the requirements for fixing TypeScript type checking errors in a Next.js application with Supabase integration. The application currently has 450 TypeScript errors across 32 files, primarily related to Supabase query result types being inferred as `never`, duplicate type definitions, and missing type assertions.

## Glossary

- **Supabase_Client**: The TypeScript client library for interacting with Supabase database
- **Database_Types**: TypeScript type definitions generated from the Supabase database schema
- **Type_Inference**: The process by which TypeScript automatically determines types
- **Never_Type**: A TypeScript type representing values that never occur, often indicating a type error
- **Type_Assertion**: Explicit type annotation to override TypeScript's type inference
- **RLS**: Row Level Security policies in Supabase
- **Query_Builder**: Supabase's fluent API for constructing database queries

## Requirements

### Requirement 1: Fix Duplicate Type Definitions

**User Story:** As a developer, I want to eliminate duplicate type definitions, so that TypeScript compilation succeeds without identifier conflicts.

#### Acceptance Criteria

1. THE System SHALL contain exactly one definition of the Json type in lib/database.types.ts
2. WHEN TypeScript compiles the codebase, THEN the System SHALL not report any "Duplicate identifier" errors
3. THE System SHALL preserve the correct Json type definition that supports recursive JSON structures

### Requirement 2: Regenerate Database Types from Schema

**User Story:** As a developer, I want accurate database type definitions, so that Supabase queries are properly typed throughout the application.

#### Acceptance Criteria

1. WHEN the Supabase CLI generates types, THEN the System SHALL create type definitions for all tables in the public schema
2. THE Database_Types SHALL include Row, Insert, and Update types for each table
3. THE Database_Types SHALL include all columns present in the actual database schema
4. THE Database_Types SHALL reflect the correct nullable/non-nullable status of each column
5. THE Database_Types SHALL include enum types for columns with enum constraints
6. THE Database_Types SHALL include foreign key relationships where applicable

### Requirement 3: Fix Query Result Type Inference

**User Story:** As a developer, I want Supabase query results to have correct types, so that I can access properties without TypeScript errors.

#### Acceptance Criteria

1. WHEN a query uses .select() without type parameters, THEN the System SHALL infer the correct table row type
2. WHEN a query uses .select() with specific columns, THEN the System SHALL infer a type containing only those columns
3. WHEN a query uses .maybeSingle(), THEN the System SHALL return a type of TableRow | null
4. WHEN a query uses .single(), THEN the System SHALL return a type of TableRow
5. WHEN a query result is accessed, THEN the System SHALL not infer the type as never

### Requirement 4: Fix Insert and Update Operation Types

**User Story:** As a developer, I want insert and update operations to accept correctly typed data, so that I can perform database mutations without type errors.

#### Acceptance Criteria

1. WHEN calling .insert() with data, THEN the System SHALL accept objects matching the Insert type
2. WHEN calling .update() with data, THEN the System SHALL accept objects matching the Update type
3. WHEN required fields are missing from insert data, THEN the System SHALL report a TypeScript error
4. WHEN optional fields are omitted from insert data, THEN the System SHALL not report a TypeScript error
5. WHEN invalid field types are provided, THEN the System SHALL report a TypeScript error at compile time

### Requirement 5: Add Type Assertions for Complex Queries

**User Story:** As a developer, I want type assertions for queries that TypeScript cannot infer, so that I can work with query results safely.

#### Acceptance Criteria

1. WHEN a query uses joins or complex selections, THEN the System SHALL include explicit type assertions
2. WHEN a query result is cast to a specific type, THEN the System SHALL validate the cast is reasonable
3. WHEN type assertions are added, THEN the System SHALL include comments explaining why the assertion is necessary
4. THE System SHALL prefer generic type parameters over type assertions where possible

### Requirement 6: Ensure Type Safety Across Service Layer

**User Story:** As a developer, I want the service layer to have proper types, so that business logic is type-safe.

#### Acceptance Criteria

1. WHEN repository methods return data, THEN the System SHALL return properly typed domain objects
2. WHEN service methods accept parameters, THEN the System SHALL enforce correct parameter types
3. WHEN mapping database rows to domain objects, THEN the System SHALL preserve type information
4. THE System SHALL not use `any` type except where explicitly documented as necessary

### Requirement 7: Fix Component Type Errors

**User Story:** As a developer, I want React components to have correct prop types, so that component usage is type-safe.

#### Acceptance Criteria

1. WHEN components receive Supabase data as props, THEN the System SHALL correctly type those props
2. WHEN components use hooks that fetch data, THEN the System SHALL correctly type the returned data
3. WHEN components handle loading and error states, THEN the System SHALL correctly type those states
4. THE System SHALL not report type errors for valid component prop usage

### Requirement 8: Validate Type Fixes Across All Affected Files

**User Story:** As a developer, I want all TypeScript errors resolved, so that the application compiles successfully.

#### Acceptance Criteria

1. WHEN running TypeScript compilation, THEN the System SHALL report zero type errors
2. THE System SHALL successfully type-check all files in backend/services/
3. THE System SHALL successfully type-check all files in app/api/
4. THE System SHALL successfully type-check all files in components/
5. THE System SHALL successfully type-check lib/auth.ts and related utility files
6. WHEN running the build process, THEN the System SHALL complete without type errors

### Requirement 9: Maintain Backward Compatibility

**User Story:** As a developer, I want type fixes to maintain existing functionality, so that no runtime behavior changes.

#### Acceptance Criteria

1. WHEN types are updated, THEN the System SHALL preserve all existing function signatures
2. WHEN database types are regenerated, THEN the System SHALL maintain compatibility with existing queries
3. WHEN type assertions are added, THEN the System SHALL not change runtime behavior
4. THE System SHALL pass all existing tests after type fixes are applied

### Requirement 10: Document Type Patterns

**User Story:** As a developer, I want documentation of common type patterns, so that I can write type-safe code consistently.

#### Acceptance Criteria

1. THE System SHALL include comments documenting the correct way to type Supabase queries
2. THE System SHALL include examples of properly typed insert/update operations
3. THE System SHALL document when and why type assertions are necessary
4. THE System SHALL provide guidance on handling nullable fields from database queries
