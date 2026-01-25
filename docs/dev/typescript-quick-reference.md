# TypeScript & Supabase Quick Reference

> **For detailed documentation, see: [TYPESCRIPT_SUPABASE_GUIDE.md](./TYPESCRIPT_SUPABASE_GUIDE.md)**

## Essential Patterns

### 1. Import Database Types

```typescript
import type { Database } from '@/lib/database.types';
```

### 2. Create Typed Client

```typescript
import { createClient } from '@supabase/supabase-js';

// ✅ Always include <Database> type parameter
const client = createClient<Database>(url, key);
```

### 3. Extract Table Types

```typescript
// For any table, extract these three types:
type Row = Database['public']['Tables']['table_name']['Row'];
type Insert = Database['public']['Tables']['table_name']['Insert'];
type Update = Database['public']['Tables']['table_name']['Update'];
```

### 4. Query Pattern

```typescript
// Single row (may not exist)
const { data, error } = await client
  .from('table_name')
  .select('*')
  .eq('id', id)
  .maybeSingle();

// data is typed as Row | null

// Multiple rows
const { data, error } = await client
  .from('table_name')
  .select('*');

// data is typed as Row[] | null
```

### 5. Insert Pattern

```typescript
const insertData: Insert = {
  // Required fields must be present
  required_field: 'value',
  // Optional fields can be omitted or set to null
  optional_field: null,
};

const { data, error } = await client
  .from('table_name')
  .insert(insertData)
  .select('*')
  .single();
```

### 6. Update Pattern

```typescript
const updateData: Update = {
  // All fields are optional - only include what you want to update
  field_to_update: 'new value',
};

const { data, error } = await client
  .from('table_name')
  .update(updateData)
  .eq('id', id)
  .select('*')
  .single();
```

### 7. Handle Nullable Fields

```typescript
// Use optional chaining and nullish coalescing
const phone = data.telefone ?? 'Not provided';
const cpf = data.cpf?.trim();

// Conditional logic
if (data.biografia) {
  console.log('Biography:', data.biografia);
}
```

### 8. Type Assertions (Joins)

```typescript
// Query with join
const { data } = await client
  .from('professores')
  .select('*, empresas(nome)')
  .maybeSingle();

// Define expected type
type ProfessorWithEmpresa = Database['public']['Tables']['professores']['Row'] & {
  empresas: { nome: string } | null;
};

// Assert with comment
// Note: Type assertion needed because Supabase doesn't infer join types
const professor = data as ProfessorWithEmpresa | null;
```

## Common Mistakes to Avoid

### ❌ Missing Type Parameter

```typescript
// Wrong - queries return 'never'
const client = createClient(url, key);
```

### ❌ Manual Type Definitions

```typescript
// Wrong - types can drift from schema
type Teacher = {
  id: string;
  name: string;
  // ...
};
```

### ❌ Using .single() When Row Might Not Exist

```typescript
// Wrong - throws error if no row found
const { data } = await client
  .from('professores')
  .eq('id', id)
  .single();

// Right - returns null if no row found
const { data } = await client
  .from('professores')
  .eq('id', id)
  .maybeSingle();
```

### ❌ Not Handling Nullable Fields

```typescript
// Wrong - might crash if cpf is null
const upperCpf = data.cpf.toUpperCase();

// Right - handle null case
const upperCpf = data.cpf?.toUpperCase() ?? 'N/A';
```

## Client Functions

```typescript
import { getDatabaseClient, getDatabaseClientAsUser } from '@/app/shared/core/database/database';

// Server-side (bypasses RLS)
const client = getDatabaseClient();

// User-scoped (respects RLS)
const client = getDatabaseClientAsUser(accessToken);
```

## Regenerate Types After Schema Changes

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

## Key Files

- `lib/database.types.ts` - Generated database types (DO NOT EDIT)
- `backend/clients/database.ts` - Client setup functions
- `backend/services/teacher/teacher.repository.ts` - Example repository with full documentation
- `lib/auth.ts` - Example of type assertions for joins

## Need Help?

See the full guide: [TYPESCRIPT_SUPABASE_GUIDE.md](./TYPESCRIPT_SUPABASE_GUIDE.md)
