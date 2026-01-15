# Design Document: TypeScript Type Fixes

## Overview

This design addresses 450 TypeScript type checking errors in a Next.js application with Supabase integration. The errors stem from four root causes:

1. **Duplicate Json type definition** in `lib/database.types.ts`
2. **Incomplete database type definitions** missing tables and columns from the actual schema
3. **Type inference failures** where Supabase query results are typed as `never`
4. **Missing type assertions** for complex queries and joins

The solution involves regenerating database types from the Supabase schema, removing duplicates, and adding proper type annotations throughout the codebase.

## Architecture

### Type Generation Flow

```
Supabase Database Schema
         ↓
    supabase gen types
         ↓
  lib/database.types.ts (Database interface)
         ↓
  Supabase Client (typed with Database generic)
         ↓
  Repository Layer (domain object mapping)
         ↓
  Service Layer (business logic)
         ↓
  API Routes / Components (presentation)
```

### Key Architectural Decisions

1. **Single Source of Truth**: Database types are generated from Supabase schema, not manually maintained
2. **Type Parameter Propagation**: The `Database` type is passed as a generic parameter to `createClient<Database>()`
3. **Domain Object Mapping**: Repository layer maps database rows to domain objects with proper types
4. **Explicit Type Assertions**: Complex queries use explicit type assertions with explanatory comments

## Components and Interfaces

### Database Types Module (`lib/database.types.ts`)

**Purpose**: Centralized type definitions for all database tables, generated from Supabase schema.

**Structure**:
```typescript
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [table_name]: {
        Row: { /* all columns */ }
        Insert: { /* required + optional columns */ }
        Update: { /* all optional columns */ }
      }
    }
    Views: { /* view definitions */ }
    Functions: { /* function signatures */ }
    Enums: { /* enum types */ }
  }
}
```

**Key Changes**:
- Remove duplicate Json type definition (keep only one)
- Regenerate all table definitions from current schema
- Include all columns with correct nullable/non-nullable types
- Add missing tables (all tables from public schema)

### Supabase Client Creation (`backend/clients/database.ts`, `lib/server.ts`, `lib/client.ts`)

**Current Pattern**:
```typescript
// Without type parameter - causes 'never' inference
const client = createClient(url, key)
```

**Fixed Pattern**:
```typescript
import type { Database } from '@/lib/database.types'

// With type parameter - enables proper inference
const client = createClient<Database>(url, key)
```

**Changes Required**:
- Add `Database` type parameter to all `createClient()` calls
- Update `getDatabaseClient()` return type to `SupabaseClient<Database>`
- Update `getDatabaseClientAsUser()` return type to `SupabaseClient<Database>`

### Repository Layer Pattern

**Current Pattern** (from `teacher.repository.ts`):
```typescript
// Manual type definition - can drift from schema
type TeacherRow = {
  id: string
  empresa_id: string
  // ... manual column definitions
}

// Query without type inference
const { data } = await client.from('professores').select('*')
// data is typed as 'never' or 'any'
```

**Fixed Pattern**:
```typescript
import type { Database } from '@/lib/database.types'

// Use generated types
type TeacherRow = Database['public']['Tables']['professores']['Row']
type TeacherInsert = Database['public']['Tables']['professores']['Insert']
type TeacherUpdate = Database['public']['Tables']['professores']['Update']

// Query with proper inference
const { data } = await client.from('professores').select('*')
// data is correctly typed as TeacherRow[] | null
```

**Benefits**:
- Types automatically stay in sync with schema
- No manual type maintenance
- Compile-time validation of column names and types

### Complex Query Type Assertions

For queries with joins, aggregations, or custom selections that TypeScript cannot infer:

```typescript
// Complex query with join
const { data } = await client
  .from('professores')
  .select('*, empresas(nome)')
  .eq('id', userId)
  .maybeSingle()

// Type assertion with explanation
type ProfessorWithEmpresa = Database['public']['Tables']['professores']['Row'] & {
  empresas: { nome: string } | null
}

// Cast with comment explaining why
const professor = data as ProfessorWithEmpresa | null
// Note: Type assertion needed because Supabase doesn't infer join types
```

## Data Models

### Database Type Structure

Each table in the database will have three type variants:

1. **Row**: Complete row as returned by SELECT queries
   - All columns present
   - Nullable columns typed as `T | null`
   - Non-nullable columns typed as `T`

2. **Insert**: Type for INSERT operations
   - Required columns (non-nullable without defaults) are required
   - Optional columns (nullable or with defaults) are optional
   - Auto-generated columns (id, timestamps) are optional

3. **Update**: Type for UPDATE operations
   - All columns are optional (partial updates)
   - Maintains same nullable/non-nullable semantics

### Example: Professores Table

```typescript
export interface Database {
  public: {
    Tables: {
      professores: {
        Row: {
          id: string                    // UUID, primary key
          empresa_id: string            // UUID, foreign key, required
          is_admin: boolean             // boolean, default false
          nome_completo: string         // text, required
          email: string                 // text, required
          cpf: string | null            // text, nullable
          telefone: string | null       // text, nullable
          biografia: string | null      // text, nullable
          foto_url: string | null       // text, nullable
          especialidade: string | null  // text, nullable
          created_at: string            // timestamp, auto-generated
          updated_at: string            // timestamp, auto-generated
        }
        Insert: {
          id: string                    // Required (links to auth.users)
          empresa_id: string            // Required
          is_admin?: boolean            // Optional (has default)
          nome_completo: string         // Required
          email: string                 // Required
          cpf?: string | null           // Optional (nullable)
          telefone?: string | null      // Optional (nullable)
          biografia?: string | null     // Optional (nullable)
          foto_url?: string | null      // Optional (nullable)
          especialidade?: string | null // Optional (nullable)
          created_at?: string           // Optional (auto-generated)
          updated_at?: string           // Optional (auto-generated)
        }
        Update: {
          id?: string                    // All fields optional
          empresa_id?: string
          is_admin?: boolean
          nome_completo?: string
          email?: string
          cpf?: string | null
          telefone?: string | null
          biografia?: string | null
          foto_url?: string | null
          especialidade?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Type Generation Completeness
*For any* table in the public schema, the generated Database type SHALL include Row, Insert, and Update type definitions with all columns from the actual schema.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Nullable Type Accuracy
*For any* column in the database schema, if the column is nullable then the generated type SHALL include `| null`, and if non-nullable then the type SHALL not include `| null`.
**Validates: Requirements 2.4**

### Property 3: Enum Type Representation
*For any* column with an enum constraint, the generated type SHALL use a TypeScript union type of the enum values.
**Validates: Requirements 2.5**

### Property 4: Query Result Type Inference
*For any* Supabase query using `.select()`, `.maybeSingle()`, or `.single()`, the result data SHALL be typed according to the table schema and query method (array for select, nullable for maybeSingle, non-nullable for single), not as `never`.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: Insert Operation Type Safety
*For any* insert operation, the System SHALL accept objects matching the Insert type (with all required fields present and correct types), SHALL reject objects missing required fields, and SHALL accept objects with optional fields omitted.
**Validates: Requirements 4.1, 4.3, 4.4, 4.5**

### Property 6: Update Operation Type Safety
*For any* update operation, the System SHALL accept objects matching the Update type (with all fields optional and correct types), and SHALL reject objects with invalid field types.
**Validates: Requirements 4.2, 4.5**

### Property 7: Service Layer Type Preservation
*For any* repository method that returns data, the return type SHALL be a properly typed domain object (not `any` or `never`), and *for any* service method parameter, the parameter type SHALL enforce correct types at compile time.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Component Prop Type Safety
*For any* React component that receives Supabase data as props or uses hooks that fetch data, the props and returned data SHALL have correct types matching the database schema, and loading/error states SHALL be properly typed.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 9: Compilation Success
*For all* TypeScript files in the project, running `tsc --noEmit` SHALL complete with zero type errors and exit code 0.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 10: Backward Compatibility
*For all* existing function signatures and queries, after applying type fixes, the System SHALL maintain the same signatures and runtime behavior, and all existing tests SHALL pass.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Type Generation Errors

**Error**: Supabase CLI not installed or not authenticated
**Handling**: 
- Check for `supabase` CLI in PATH
- Verify authentication with `supabase status`
- Provide clear error message with installation instructions

**Error**: Database connection failure during type generation
**Handling**:
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Check network connectivity
- Provide error message with troubleshooting steps

### Compilation Errors

**Error**: Type errors persist after regeneration
**Handling**:
- Identify specific error patterns (e.g., missing type parameters, incorrect assertions)
- Add explicit type annotations where inference fails
- Document why type assertions are necessary

**Error**: Breaking changes in generated types
**Handling**:
- Compare old and new type definitions
- Identify affected code locations
- Update code to match new types
- Run tests to verify behavior unchanged

### Runtime Errors

**Error**: Type assertions cause runtime errors (incorrect casts)
**Handling**:
- Add runtime validation for type assertions
- Use type guards to verify structure
- Log warnings for unexpected data shapes

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage (unit tests catch concrete bugs, property tests verify general correctness)

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**:
   - Test that a specific query returns correctly typed data
   - Test that a specific insert operation accepts valid data
   - Test that a specific component prop is correctly typed

2. **Edge Cases**:
   - Nullable fields with null values
   - Optional fields omitted from inserts
   - Empty query results

3. **Error Conditions**:
   - Missing required fields in inserts
   - Invalid field types
   - Type assertion failures

**Example Unit Test**:
```typescript
describe('Teacher Repository', () => {
  it('should return properly typed teacher data', async () => {
    const teacher = await repository.findById('123')
    
    // TypeScript should infer correct types
    expect(teacher?.id).toBe('123')
    expect(teacher?.fullName).toBe('John Doe')
    expect(teacher?.email).toBe('john@example.com')
  })
  
  it('should accept valid insert data', async () => {
    const insertData: CreateTeacherInput = {
      id: '123',
      empresaId: '456',
      fullName: 'John Doe',
      email: 'john@example.com',
      isAdmin: false
    }
    
    const teacher = await repository.create(insertData)
    expect(teacher.id).toBe('123')
  })
})
```

### Property-Based Testing

Property tests should verify universal properties using a property-based testing library (e.g., `fast-check` for TypeScript).

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: typescript-type-fixes, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check'

describe('Property Tests', () => {
  // Feature: typescript-type-fixes, Property 4: Query Result Type Inference
  it('should properly type query results for any table', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('professores', 'alunos', 'empresas'),
        async (tableName) => {
          const { data } = await client.from(tableName).select('*').limit(1)
          
          // Verify data is not typed as 'never'
          // This is a compile-time check - if it compiles, the property holds
          expect(data).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })
  
  // Feature: typescript-type-fixes, Property 5: Insert Operation Type Safety
  it('should accept valid insert data for any table', async () => {
    // Generate valid insert data for different tables
    await fc.assert(
      fc.asyncProperty(
        generateValidInsertData(),
        async (insertData) => {
          // If this compiles, TypeScript accepts the insert data
          const { error } = await client
            .from(insertData.table)
            .insert(insertData.data)
          
          // Verify no type errors (compilation check)
          expect(error).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Type Checking Tests

In addition to runtime tests, we need compile-time type checking tests:

```typescript
// type-tests.ts - These tests verify TypeScript compilation
import type { Database } from '@/lib/database.types'
import { createClient } from '@supabase/supabase-js'

// Test 1: Client is properly typed
const client = createClient<Database>('url', 'key')

// Test 2: Query results are properly typed
async function testQueryTypes() {
  const { data } = await client.from('professores').select('*')
  // @ts-expect-error - data should not be 'never'
  const _check: never = data
  
  // data should be TeacherRow[] | null
  if (data) {
    const teacher = data[0]
    const _name: string = teacher.nome_completo // Should compile
  }
}

// Test 3: Insert operations are properly typed
async function testInsertTypes() {
  // Valid insert - should compile
  await client.from('professores').insert({
    id: '123',
    empresa_id: '456',
    nome_completo: 'John Doe',
    email: 'john@example.com'
  })
  
  // Invalid insert - should NOT compile
  // @ts-expect-error - missing required field
  await client.from('professores').insert({
    id: '123',
    // missing empresa_id
    nome_completo: 'John Doe',
    email: 'john@example.com'
  })
}
```

### Integration Testing

Test the complete flow from database query to component rendering:

1. Query data from Supabase
2. Map to domain objects in repository
3. Process in service layer
4. Pass to React components
5. Verify types are preserved throughout

### Validation Checklist

Before considering the fix complete:

- [ ] Run `tsc --noEmit` - should report 0 errors
- [ ] Run `npm run build` - should complete successfully
- [ ] Run all existing tests - should pass
- [ ] Run new property tests - should pass with 100+ iterations
- [ ] Verify no `any` types except where documented
- [ ] Verify all type assertions have explanatory comments
- [ ] Check that generated types match database schema
