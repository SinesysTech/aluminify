# Guia de Correção - Problemas Críticos

## 🎯 Correções Prioritárias

### 1. Corrigir Module Resolution (15 minutos)

**Problema**: Path aliases `@/` não estão sendo resolvidos

**Solução**:

```json
// tsconfig.json - Atualizar
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler", // ← IMPORTANTE
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "allowSyntheticDefaultImports": true, // ← ADICIONAR
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "codebase-cleanup"
  ]
}
```

**Testar**:
```bash
npx tsc --noEmit
```

---

### 2. Criar Tipos para Supabase (30 minutos)

**Problema**: Muitos `unknown` types causando erros

**Solução**: Criar arquivo de tipos centralizados

```typescript
// types/shared/entities/activity.ts
export interface Atividade {
  id: string;
  nome: string;
  frente_id: string;
  disciplina_id: string;
  status: 'pendente' | 'em_progresso' | 'concluida';
  dataInicio?: string;
  dataConclusao?: string;
  questoesTotais?: number;
  questoesAcertos?: number;
  dificuldadePercebida?: 1 | 2 | 3 | 4 | 5;
  anotacoesPessoais?: string;
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  curso_id: string;
  created_at: string;
  updated_at: string;
}

export interface Curso {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

export interface Modulo {
  id: string;
  nome: string;
  numero_modulo: number;
  frente_id: string;
  created_at: string;
  updated_at: string;
}

export interface Frente {
  id: string;
  nome: string;
  disciplina_id: string;
  created_at: string;
  updated_at: string;
}
```

**Usar nos arquivos**:

```typescript
// backend/services/atividade/atividade.repository-helper.ts
import type { Atividade, Disciplina, Curso, Modulo, Frente } from '@/types/shared/entities/activity';

// Antes
const nome = data.nome; // ❌ Error: Property 'nome' does not exist on type 'unknown'

// Depois
const atividade = data as Atividade; // ✅ Type-safe
const nome = atividade.nome;

// Ou melhor ainda com type guard
function isAtividade(data: unknown): data is Atividade {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'nome' in data &&
    'frente_id' in data
  );
}

if (isAtividade(data)) {
  const nome = data.nome; // ✅ Completamente type-safe
}
```

---

### 3. Padronizar React Imports (10 minutos)

**Problema**: Warnings sobre React UMD global

**Solução**: Adicionar import em todos os componentes

**Script de correção automática**:

```bash
# Criar script fix-react-imports.sh
cat > fix-react-imports.sh << 'EOF'
#!/bin/bash

# Encontrar todos os arquivos .tsx que não têm import React
find app components -name "*.tsx" -type f | while read file; do
  # Verificar se já tem import React
  if ! grep -q "^import.*React.*from.*react" "$file"; then
    # Verificar se usa JSX (tem tags <)
    if grep -q "<[A-Z]" "$file"; then
      echo "Fixing: $file"
      # Adicionar import no topo do arquivo
      sed -i '1i import React from "react";' "$file"
    fi
  fi
done
EOF

chmod +x fix-react-imports.sh
./fix-react-imports.sh
```

**Ou manualmente**: Adicionar em cada arquivo `.tsx`:

```typescript
import React from 'react';
```

---

### 4. Verificar Dependências (5 minutos)

**Problema**: Alguns pacotes podem não estar instalados

**Solução**:

```bash
# Reinstalar todas as dependências
rm -rf node_modules package-lock.json
npm install

# Verificar pacotes específicos
npm list @supabase/supabase-js
npm list lucide-react
npm list next
npm list use-debounce
npm list @upstash/redis

# Se algum estiver faltando, instalar
npm install @supabase/supabase-js lucide-react use-debounce @upstash/redis
```

---

## 🔧 Correções Específicas por Arquivo

### Arquivo: `backend/services/atividade/atividade.repository-helper.ts`

**Antes**:
```typescript
export async function getAtividadeWithDetails(supabase: SupabaseClient, atividadeId: string) {
  const { data, error } = await supabase
    .from('atividades')
    .select(`
      *,
      frente:frentes(*),
      disciplina:disciplinas(*),
      curso:cursos(*)
    `)
    .eq('id', atividadeId)
    .single();

  if (error) throw error;
  
  // ❌ Problema: data é unknown
  return {
    ...data,
    frente: data.frente,
    disciplina: data.disciplina,
    curso: data.curso
  };
}
```

**Depois**:
```typescript
import type { Atividade, Frente, Disciplina, Curso } from '@/types/shared/entities/activity';

interface AtividadeWithDetails extends Atividade {
  frente: Frente;
  disciplina: Disciplina;
  curso: Curso;
}

export async function getAtividadeWithDetails(
  supabase: SupabaseClient, 
  atividadeId: string
): Promise<AtividadeWithDetails> {
  const { data, error } = await supabase
    .from('atividades')
    .select(`
      *,
      frente:frentes(*),
      disciplina:disciplinas(*),
      curso:cursos(*)
    `)
    .eq('id', atividadeId)
    .single();

  if (error) throw error;
  
  // ✅ Type assertion com validação
  if (!data) throw new Error('Atividade não encontrada');
  
  return data as AtividadeWithDetails;
}
```

---

### Arquivo: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`

**Antes**:
```typescript
const disciplinaId = atividade.disciplina_id; // ❌ Error
```

**Depois**:
```typescript
import type { Atividade } from '@/types/shared/entities/activity';

interface Props {
  atividades: Atividade[]; // ✅ Typed
}

export function SalaEstudosClient({ atividades }: Props) {
  const disciplinaId = atividades[0]?.disciplina_id; // ✅ Type-safe
  // ...
}
```

---

## 📋 Checklist de Correção

### Fase 1: Configuração (Fazer Agora)
- [ ] Atualizar `tsconfig.json` com as configurações corretas
- [ ] Adicionar `allowSyntheticDefaultImports: true`
- [ ] Verificar que `moduleResolution: "bundler"` está configurado
- [ ] Executar `npx tsc --noEmit` para verificar

### Fase 2: Tipos (Fazer Hoje)
- [ ] Criar `types/shared/entities/activity.ts` com todos os tipos
- [ ] Criar `types/shared/entities/user.ts` se não existir
- [ ] Atualizar `backend/services/atividade/atividade.repository-helper.ts`
- [ ] Atualizar `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`

### Fase 3: React (Fazer Hoje)
- [ ] Executar script de correção de imports React
- [ ] Ou adicionar manualmente `import React from 'react'` nos arquivos principais
- [ ] Verificar que warnings diminuíram

### Fase 4: Dependências (Fazer Agora)
- [ ] Executar `npm install` para garantir todas as dependências
- [ ] Verificar `node_modules` está completo
- [ ] Testar build: `npm run build`

---

## 🧪 Testes Após Correções

```bash
# 1. Verificar TypeScript
npx tsc --noEmit

# 2. Executar linter
npm run lint

# 3. Tentar build
npm run build

# 4. Executar analyzer novamente
cd codebase-cleanup
npm run build
node dist/cli/index.js analyze \
  --path ../backend/services \
  --output ../reports/after-fix \
  --format both
```

---

## 📊 Métricas de Sucesso

**Antes das Correções**:
- ❌ ~300+ warnings de TypeScript
- ❌ Module resolution errors
- ❌ Type safety issues

**Depois das Correções** (Esperado):
- ✅ <50 warnings de TypeScript
- ✅ Sem module resolution errors
- ✅ Type safety melhorado em 80%

---

## 💡 Dicas

1. **Faça as correções em ordem**: Configuração → Tipos → React → Dependências
2. **Teste após cada fase**: Use `npx tsc --noEmit` frequentemente
3. **Commit incremental**: Faça commits após cada fase concluída
4. **Use o analyzer**: Execute após correções para medir progresso

---

## 🆘 Problemas Comuns

### "Cannot find module '@/...'"
**Solução**: Verificar `tsconfig.json` e reiniciar VS Code

### "React refers to UMD global"
**Solução**: Adicionar `import React from 'react'`

### "Property does not exist on type 'unknown'"
**Solução**: Criar interface e usar type assertion ou type guard

### Build muito lento
**Solução**: Adicionar mais exclusões no `tsconfig.json`:
```json
{
  "exclude": [
    "node_modules",
    "codebase-cleanup",
    ".next",
    "dist",
    "build"
  ]
}
```

---

**Tempo Estimado Total**: 1-2 horas  
**Impacto**: Alto - Melhora significativa na qualidade do código
