# Implementation Plan: TypeScript Type Fixes

## Overview

This plan addresses 450 TypeScript errors by regenerating database types, removing duplicates, and adding proper type annotations throughout the codebase. The implementation follows a systematic approach: fix the root cause (database types), then propagate fixes through the layers (client → repository → service → API → components).

## Tasks

- [ ] 1. Fix duplicate Json type definition
  - Remove one of the duplicate `Json` type definitions in `lib/database.types.ts`
  - Keep the recursive definition that supports nested JSON structures
  - Verify no "Duplicate identifier" errors remain
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Regenerate database types from Supabase schema
  - Run `npx supabase gen types typescript --local > lib/database.types.ts` (or use project URL if not local)
  - Verify all tables from public schema are included
  - Verify each table has Row, Insert, and Update types
  - Verify all columns are present with correct nullable/non-nullable types
  - Verify enum columns have union types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Update Supabase client creation with Database type parameter
  - [ ] 3.1 Update `backend/clients/database.ts`
    - Import `Database` type from `@/lib/database.types`
    - Add `<Database>` type parameter to both `createClient()` calls
    - Update return types to `SupabaseClient<Database>`
    - _Requirements: 3.1, 3.5_
  
  - [ ] 3.2 Update `lib/server.ts` (if exists)
    - Import `Database` type
    - Add `<Database>` type parameter to `createClient()`
    - Update return type to `SupabaseClient<Database>`
    - _Requirements: 3.1, 3.5_
  
  - [ ] 3.3 Update `lib/client.ts` (if exists)
    - Import `Database` type
    - Add `<Database>` type parameter to `createClient()`
    - Update return type to `SupabaseClient<Database>`
    - _Requirements: 3.1, 3.5_

- [ ] 4. Checkpoint - Verify client type propagation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Fix repository layer types
  - [ ] 5.1 Update `backend/services/teacher/teacher.repository.ts`
    - Replace manual `TeacherRow` type with `Database['public']['Tables']['professores']['Row']`
    - Add `TeacherInsert` and `TeacherUpdate` type aliases from Database types
    - Update `mapRow` function parameter type
    - Verify query results are properly typed (not `never`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.3_
  
  - [ ] 5.2 Update other repository files in `backend/services/`
    - Apply same pattern to all repository files
    - Replace manual row types with Database types
    - Add Insert and Update type aliases
    - Update mapper functions
    - _Requirements: 3.1, 3.5, 6.1, 6.3_

- [ ] 5.3 Write property test for query result type inference
  - **Property 4: Query Result Type Inference**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [ ] 6. Fix insert and update operations
  - [ ] 6.1 Update insert operations in repositories
    - Use Insert types for insert data
    - Verify required fields are enforced
    - Verify optional fields can be omitted
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  
  - [ ] 6.2 Update update operations in repositories
    - Use Update types for update data
    - Verify all fields are optional
    - Verify type safety is maintained
    - _Requirements: 4.2, 4.5_

- [ ] 6.3 Write property tests for insert/update type safety
  - **Property 5: Insert Operation Type Safety**
  - **Validates: Requirements 4.1, 4.3, 4.4, 4.5**
  - **Property 6: Update Operation Type Safety**
  - **Validates: Requirements 4.2, 4.5**

- [ ] 7. Add type assertions for complex queries
  - [ ] 7.1 Identify queries with joins in `lib/auth.ts`
    - Find queries using `.select()` with join syntax (e.g., `'*, empresas(nome)'`)
    - Add type definitions for joined results
    - Add type assertions with explanatory comments
    - _Requirements: 3.1, 3.5_
  
  - [ ] 7.2 Identify queries with joins in `backend/services/`
    - Find all complex queries with joins or aggregations
    - Add type definitions for complex query results
    - Add type assertions with explanatory comments
    - Document why assertions are necessary
    - _Requirements: 3.1, 3.5_

- [ ] 8. Checkpoint - Verify backend type safety
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Fix API route types
  - [ ] 9.1 Update API routes in `app/api/empresas/`
    - Verify Supabase queries are properly typed
    - Add type assertions where needed
    - Ensure request/response types are correct
    - _Requirements: 3.1, 3.5, 6.1, 6.2_
  
  - [ ] 9.2 Update API routes in `app/api/` (user profile, agendamentos, etc.)
    - Apply same fixes to all API routes
    - Verify query results are properly typed
    - Add type assertions for complex queries
    - _Requirements: 3.1, 3.5, 6.1, 6.2_

- [ ] 9.3 Write property test for service layer type preservation
  - **Property 7: Service Layer Type Preservation**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 10. Fix component types
  - [ ] 10.1 Update components in `components/aluno/`
    - Verify props receiving Supabase data are properly typed
    - Update hook return types
    - Fix loading/error state types
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 10.2 Update components in `components/professor/`
    - Apply same fixes to professor components
    - Verify data props are properly typed
    - Fix hook and state types
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 10.3 Update components in `components/shared/`
    - Apply same fixes to shared components
    - Verify generic component props work with typed data
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10.4 Write property test for component prop type safety
  - **Property 8: Component Prop Type Safety**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 11. Verify compilation success
  - Run `tsc --noEmit` and verify zero errors
  - Run `npm run build` and verify successful build
  - Check specific directories: backend/services/, app/api/, components/
  - Verify lib/auth.ts and utility files compile
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 11.1 Write property test for compilation success
  - **Property 9: Compilation Success**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

- [ ] 12. Verify backward compatibility
  - Run all existing tests and verify they pass
  - Compare function signatures before and after
  - Verify no runtime behavior changes
  - Check that existing queries still work
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 12.1 Write property test for backward compatibility
  - **Property 10: Backward Compatibility**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 13. Add documentation
  - Add comments documenting correct Supabase query patterns
  - Add examples of properly typed insert/update operations
  - Document when and why type assertions are necessary
  - Add guidance on handling nullable fields
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify zero TypeScript errors
  - Verify build succeeds
  - Confirm all 450 original errors are resolved

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The fix follows a bottom-up approach: database types → client → repository → service → API → components
