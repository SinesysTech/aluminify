# TypeScript & Supabase Type Safety Guide

## Overview

This guide documents best practices for working with TypeScript and Supabase in this project. Following these patterns ensures type safety, prevents runtime errors, and maintains consistency across the codebase.

## Table of Contents

1. [Database Types](#database-types)
2. [Supabase Client Setup](#supabase-client-setup)
3. [Query Patterns](#query-patterns)
4. [Insert Operations](#insert-operations)
5. [Update Operations](#update-operations)
6. [Type Assertions](#type-assertions)
7. [Nullable Fields](#nullable-fields)
8. [Common Patterns](#common-patterns)

---

## Database Types

### Generated Types

All database types are automatically generated from the Supabase schema and stored in `lib/database.types.ts`. **Never manually edit this file.**

To regenerate types after schema changes:

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

### Type Structure

Each table has three type variants:

- **Row**: Complete row as returned by SELECT queries
- **Insert**: Type for INSERT operations (required fields + optional fields)
- **Update**: Type for UPDATE operations (all fields optional)

Example:

```typescript
import type { Database } from '@/lib/database.types';

// Extract types for a specific table
type TeacherRow = Database['public']['Tables']['professores']['Row'];
type TeacherInsert = Database['public']['Tables']['professores']['Insert'];
type TeacherUpdate = Database['public']['Tables']['professores']['Update'];
```

---

## Supabase Client Setup

### Always Use Type Parameters

**❌ Wrong** - Without type parameter, queries return `never`:

```typescript
const client = createClient(url, key);
```

**✅ Correct** - With type parameter, queries are properly typed:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const client = createClient<Database>(url, key);
```

### Client Functions

Use the centralized client functions from `backend/clients/database.ts`:

```typescript
import { getDatabaseClient, getDatabaseClientAsUser } from '@/app/shared/core/database/database';

// For server-side operations (service role)
const client = getDatabaseClient();

// For user-scoped operations (respects RLS)
const client = getDatabaseClientAsUser(accessToken);
```

---

## Query Patterns

### Basic SELECT Queries

**Pattern**: Use `.select()` with proper error handling

```typescript
// Select all columns
const { data, error } = await client
  .from('professores')
  .select('*');

if (error) {
  throw new Error(`Failed to fetch teachers: ${error.message}`);
}

// data is typed as TeacherRow[] | null
const teachers = data ?? [];
```

### Single Row Queries

**Pattern**: Use `.maybeSingle()` for queries that may return no results

```typescript
const { data, error } = await client
  .from('professores')
  .select('*')
  .eq('id', teacherId)
  .maybeSingle();

if (error) {
  throw new Error(`Failed to fetch teacher: ${error.message}`);
}

// data is typed as TeacherRow | null
if (data) {
  console.log(data.nome_completo); // TypeScript knows all properties
}
```

**Pattern**: Use `.single()` when you expect exactly one result

```typescript
const { data, error } = await client
  .from('professores')
  .select('*')
  .eq('id', teacherId)
  .single();

if (error) {
  throw new Error(`Failed to fetch teacher: ${error.message}`);
}

// data is typed as TeacherRow (not nullable)
console.log(data.nome_completo);
```

### Filtered Queries

```typescript
// Multiple filters
const { data, error } = await client
  .from('professores')
  .select('*')
  .eq('empresa_id', empresaId)
  .eq('is_admin', true)
  .order('nome_completo', { ascending: true });

// data is typed as TeacherRow[] | null
```

### Pagination

```typescript
const page = 1;
const perPage = 50;
const from = (page - 1) * perPage;
const to = from + perPage - 1;

const { data, error } = await client
  .from('professores')
  .select('*')
  .range(from, to);

// data is typed as TeacherRow[] | null
```

---

## Insert Operations

### Basic Insert

**Pattern**: Use the Insert type for insert data

```typescript
import type { Database } from '@/lib/database.types';

type TeacherInsert = Database['public']['Tables']['professores']['Insert'];

const insertData: TeacherInsert = {
  id: userId, // Required (links to auth.users)
  empresa_id: empresaId, // Required
  nome_completo: 'John Doe', // Required
  email: 'john@example.com', // Required
  // Optional fields can be omitted or set to null
  cpf: null,
  telefone: '+55 11 98765-4321',
  biografia: null,
  foto_url: null,
  especialidade: 'Mathematics',
  is_admin: false, // Optional (has default)
};

const { data, error } = await client
  .from('professores')
  .insert(insertData)
  .select('*')
  .single();

if (error) {
  throw new Error(`Failed to create teacher: ${error.message}`);
}

// data is typed as TeacherRow
return data;
```

### Insert with Partial Data

TypeScript enforces required fields:

```typescript
// ❌ This will NOT compile - missing required fields
const invalidData: TeacherInsert = {
  nome_completo: 'John Doe',
  // Missing: id, empresa_id, email
};

// ✅ This compiles - all required fields present
const validData: TeacherInsert = {
  id: userId,
  empresa_id: empresaId,
  nome_completo: 'John Doe',
  email: 'john@example.com',
  // Optional fields can be omitted
};
```

### Bulk Insert

```typescript
const teachers: TeacherInsert[] = [
  {
    id: 'user-1',
    empresa_id: empresaId,
    nome_completo: 'Teacher 1',
    email: 'teacher1@example.com',
  },
  {
    id: 'user-2',
    empresa_id: empresaId,
    nome_completo: 'Teacher 2',
    email: 'teacher2@example.com',
  },
];

const { data, error } = await client
  .from('professores')
  .insert(teachers)
  .select('*');

// data is typed as TeacherRow[] | null
```

---

## Update Operations

### Basic Update

**Pattern**: Use the Update type for update data (all fields optional)

```typescript
import type { Database } from '@/lib/database.types';

type TeacherUpdate = Database['public']['Tables']['professores']['Update'];

const updateData: TeacherUpdate = {
  nome_completo: 'Jane Doe',
  telefone: '+55 11 91234-5678',
  // Only include fields you want to update
};

const { data, error } = await client
  .from('professores')
  .update(updateData)
  .eq('id', teacherId)
  .select('*')
  .single();

if (error) {
  throw new Error(`Failed to update teacher: ${error.message}`);
}

// data is typed as TeacherRow
return data;
```

### Conditional Updates

```typescript
// Build update object conditionally
const updateData: TeacherUpdate = {};

if (fullName !== undefined) {
  updateData.nome_completo = fullName;
}

if (email !== undefined) {
  updateData.email = email.toLowerCase();
}

if (phone !== undefined) {
  updateData.telefone = phone;
}

// Only update if there are changes
if (Object.keys(updateData).length > 0) {
  const { error } = await client
    .from('professores')
    .update(updateData)
    .eq('id', teacherId);
    
  if (error) {
    throw new Error(`Failed to update teacher: ${error.message}`);
  }
}
```

### Setting Nullable Fields

```typescript
// Set a field to null
const updateData: TeacherUpdate = {
  biografia: null, // Clear the biography
  foto_url: null, // Clear the photo URL
};

const { error } = await client
  .from('professores')
  .update(updateData)
  .eq('id', teacherId);
```

---

## Type Assertions

### When Type Assertions Are Necessary

Type assertions are needed when:

1. **Complex queries with joins** - Supabase doesn't infer joined table types
2. **Custom selections** - When selecting specific columns or computed fields
3. **Aggregations** - When using count, sum, etc.

### Pattern: Joins

**Why needed**: Supabase cannot infer the structure of joined data.

```typescript
// Query with join
const { data, error } = await client
  .from('professores')
  .select('*, empresas(nome, slug)')
  .eq('id', teacherId)
  .maybeSingle();

// Define the expected type
type TeacherWithEmpresa = Database['public']['Tables']['professores']['Row'] & {
  empresas: {
    nome: string;
    slug: string;
  } | null;
};

// Type assertion with explanatory comment
// Note: Type assertion needed because Supabase doesn't infer join types
const teacher = data as TeacherWithEmpresa | null;

if (teacher) {
  console.log(teacher.nome_completo);
  console.log(teacher.empresas?.nome); // Safely access joined data
}
```

### Pattern: Custom Selections

```typescript
// Select specific columns
const { data, error } = await client
  .from('professores')
  .select('id, nome_completo, email');

// Define the expected type
type TeacherBasic = Pick<
  Database['public']['Tables']['professores']['Row'],
  'id' | 'nome_completo' | 'email'
>;

// Type assertion
// Note: Type assertion needed for custom column selection
const teachers = data as TeacherBasic[] | null;
```

### Pattern: Aggregations

```typescript
// Count query
const { count, error } = await client
  .from('professores')
  .select('*', { count: 'exact', head: true })
  .eq('empresa_id', empresaId);

// count is already typed as number | null
const totalTeachers = count ?? 0;
```

### ⚠️ Type Assertion Best Practices

1. **Always add a comment** explaining why the assertion is necessary
2. **Prefer generic type parameters** over assertions when possible
3. **Validate at runtime** if the assertion involves external data
4. **Keep assertions close** to the query for maintainability

```typescript
// ❌ Bad - No explanation
const teacher = data as TeacherWithEmpresa;

// ✅ Good - Clear explanation
// Note: Type assertion needed because Supabase doesn't infer join types
const teacher = data as TeacherWithEmpresa | null;
```

---

## Nullable Fields

### Understanding Nullable Fields

In the database schema:
- **Nullable columns** are typed as `T | null`
- **Non-nullable columns** are typed as `T`

Example from `professores` table:

```typescript
type TeacherRow = {
  id: string;              // Non-nullable
  nome_completo: string;   // Non-nullable
  email: string;           // Non-nullable
  cpf: string | null;      // Nullable
  telefone: string | null; // Nullable
  biografia: string | null; // Nullable
  // ...
};
```

### Handling Nullable Fields in Queries

**Pattern**: Use optional chaining and nullish coalescing

```typescript
const { data } = await client
  .from('professores')
  .select('*')
  .eq('id', teacherId)
  .maybeSingle();

if (data) {
  // Safe access with optional chaining
  const cpf = data.cpf?.trim();
  
  // Provide default values with nullish coalescing
  const phone = data.telefone ?? 'Not provided';
  
  // Conditional logic
  if (data.biografia) {
    console.log('Biography:', data.biografia);
  }
}
```

### Handling Nullable Fields in Inserts

```typescript
type TeacherInsert = Database['public']['Tables']['professores']['Insert'];

// Option 1: Omit optional nullable fields
const insertData: TeacherInsert = {
  id: userId,
  empresa_id: empresaId,
  nome_completo: 'John Doe',
  email: 'john@example.com',
  // cpf, telefone, biografia are omitted
};

// Option 2: Explicitly set to null
const insertData2: TeacherInsert = {
  id: userId,
  empresa_id: empresaId,
  nome_completo: 'John Doe',
  email: 'john@example.com',
  cpf: null,
  telefone: null,
  biografia: null,
};

// Option 3: Conditionally include values
const insertData3: TeacherInsert = {
  id: userId,
  empresa_id: empresaId,
  nome_completo: 'John Doe',
  email: 'john@example.com',
  cpf: cpfValue || null, // Use null if cpfValue is empty
  telefone: phoneValue || null,
};
```

### Handling Nullable Fields in Updates

```typescript
type TeacherUpdate = Database['public']['Tables']['professores']['Update'];

// Clear a nullable field by setting to null
const updateData: TeacherUpdate = {
  biografia: null, // Explicitly clear the biography
};

// Update only if value is provided
const updateData2: TeacherUpdate = {};

if (newBiography !== undefined) {
  updateData2.biografia = newBiography || null; // Set to null if empty string
}
```

### Type Guards for Nullable Fields

```typescript
function isValidPhone(phone: string | null): phone is string {
  return phone !== null && phone.trim().length > 0;
}

const { data } = await client
  .from('professores')
  .select('*')
  .eq('id', teacherId)
  .maybeSingle();

if (data && isValidPhone(data.telefone)) {
  // TypeScript knows data.telefone is string here
  console.log('Phone:', data.telefone.toUpperCase());
}
```

---

## Common Patterns

### Repository Pattern

**Pattern**: Encapsulate database access in repository classes

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type TeacherRow = Database['public']['Tables']['professores']['Row'];
type TeacherInsert = Database['public']['Tables']['professores']['Insert'];
type TeacherUpdate = Database['public']['Tables']['professores']['Update'];

export class TeacherRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Teacher | null> {
    const { data, error } = await this.client
      .from('professores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch teacher: ${error.message}`);
    }

    return data ? this.mapRow(data) : null;
  }

  async create(input: CreateTeacherInput): Promise<Teacher> {
    const insertData: TeacherInsert = {
      id: input.id,
      empresa_id: input.empresaId,
      nome_completo: input.fullName,
      email: input.email.toLowerCase(),
      cpf: input.cpf ?? null,
      telefone: input.phone ?? null,
    };

    const { data, error } = await this.client
      .from('professores')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create teacher: ${error.message}`);
    }

    return this.mapRow(data);
  }

  private mapRow(row: TeacherRow): Teacher {
    return {
      id: row.id,
      empresaId: row.empresa_id,
      fullName: row.nome_completo,
      email: row.email,
      cpf: row.cpf,
      phone: row.telefone,
      biography: row.biografia,
      photoUrl: row.foto_url,
      specialty: row.especialidade,
      isAdmin: row.is_admin,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
```

### Error Handling

**Pattern**: Consistent error handling across queries

```typescript
async function fetchTeacher(id: string): Promise<Teacher | null> {
  const { data, error } = await client
    .from('professores')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    // Log the error for debugging
    console.error('Database error:', error);
    
    // Throw a user-friendly error
    throw new Error(`Failed to fetch teacher: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}
```

### Transaction Pattern

**Pattern**: Use Supabase RPC for transactions

```typescript
// Define RPC function in Supabase
// CREATE OR REPLACE FUNCTION create_teacher_with_profile(...)

const { data, error } = await client
  .rpc('create_teacher_with_profile', {
    teacher_id: userId,
    teacher_name: 'John Doe',
    teacher_email: 'john@example.com',
    empresa_id: empresaId,
  });

if (error) {
  throw new Error(`Failed to create teacher: ${error.message}`);
}
```

### Enum Types

**Pattern**: Use TypeScript union types for enum columns

```typescript
// Enum is automatically typed from database schema
type TeacherRow = Database['public']['Tables']['professores']['Row'];

// The plano field in empresas table is typed as:
// plano: "basico" | "profissional" | "enterprise"

const { data, error } = await client
  .from('empresas')
  .select('*')
  .eq('plano', 'profissional'); // TypeScript validates this value

// ❌ This will NOT compile
await client
  .from('empresas')
  .eq('plano', 'invalid-plan'); // Error: Type '"invalid-plan"' is not assignable
```

---

## Summary

### Key Principles

1. **Always use `Database` type parameter** when creating Supabase clients
2. **Use generated types** from `lib/database.types.ts` - never manually define table types
3. **Use Insert types for inserts** and Update types for updates
4. **Handle nullable fields** with optional chaining and nullish coalescing
5. **Add type assertions only when necessary** and always document why
6. **Prefer `.maybeSingle()`** over `.single()` when a row might not exist
7. **Always handle errors** from Supabase queries
8. **Use repository pattern** to encapsulate database access

### Quick Reference

```typescript
// Import types
import type { Database } from '@/lib/database.types';

// Create typed client
const client = createClient<Database>(url, key);

// Extract table types
type Row = Database['public']['Tables']['table_name']['Row'];
type Insert = Database['public']['Tables']['table_name']['Insert'];
type Update = Database['public']['Tables']['table_name']['Update'];

// Query
const { data, error } = await client.from('table_name').select('*');

// Insert
const insertData: Insert = { /* ... */ };
await client.from('table_name').insert(insertData);

// Update
const updateData: Update = { /* ... */ };
await client.from('table_name').update(updateData).eq('id', id);
```

---

## Additional Resources

- [Supabase TypeScript Documentation](https://supabase.com/docs/reference/javascript/typescript-support)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- Project-specific: `lib/database.types.ts` - Generated database types
- Project-specific: `backend/clients/database.ts` - Client setup functions
