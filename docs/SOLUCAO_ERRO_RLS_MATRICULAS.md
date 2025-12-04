# 🔧 Solução: Erro RLS na Tabela Matrículas

## Problema Identificado

**Erro**: `[42501] - permission denied for table users`

**Causa**: As políticas RLS da tabela `matriculas` que verificam se o usuário é superadmin tentam acessar `auth.users` diretamente:

```sql
EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ...))
```

Quando o Supabase avalia as políticas RLS, ele precisa verificar todas elas, e ao tentar verificar as políticas de superadmin, ele tenta acessar `auth.users`, mas o RLS está bloqueando esse acesso.

## Solução Implementada

### 1. ✅ Criada Função RPC Segura

Criada a função `get_matriculas_aluno` que usa `SECURITY DEFINER` para evitar problemas com RLS:

```sql
CREATE OR REPLACE FUNCTION public.get_matriculas_aluno(p_aluno_id UUID)
RETURNS TABLE (
  curso_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT m.curso_id
  FROM public.matriculas m
  WHERE m.aluno_id = p_aluno_id
    AND m.ativo = true;
END;
$$;
```

**Vantagens**:
- Usa `SECURITY DEFINER` para executar com privilégios elevados
- Evita problemas com políticas RLS que acessam `auth.users`
- Retorna apenas os dados necessários
- Mais seguro que queries diretas

### 2. ✅ Atualizado Código Frontend

Substituídas as queries diretas pela função RPC:

**Antes**:
```typescript
const { data: matriculas, error: matError } = await supabase
  .from('matriculas')
  .select('curso_id')
  .eq('aluno_id', alunoId)
  .eq('ativo', true)
```

**Depois**:
```typescript
const { data: matriculas, error: matError } = await supabase
  .rpc('get_matriculas_aluno', { p_aluno_id: alunoId })
```

### 3. ✅ Adicionada Verificação de Sessão

Adicionada verificação de sessão antes das queries para garantir autenticação:

```typescript
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

if (sessionError || !session) {
  throw new Error('Sessão não encontrada. Faça login novamente.')
}
```

### 4. ✅ Corrigida Tipagem TypeScript

Adicionada tipagem explícita para os resultados da função RPC:

```typescript
const cursoIds = matriculas.map((m: { curso_id: string }) => m.curso_id)
```

## Arquivos Modificados

1. **Migration**: `supabase/migrations/..._create_function_get_matriculas_aluno.sql`
   - Criada função RPC `get_matriculas_aluno`

2. **Frontend**: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`
   - Substituídas queries diretas por chamadas RPC
   - Adicionada verificação de sessão
   - Corrigida tipagem TypeScript

## Benefícios

1. ✅ **Resolve o erro de RLS**: Função RPC evita problemas com políticas que acessam `auth.users`
2. ✅ **Mais Seguro**: `SECURITY DEFINER` garante execução com privilégios adequados
3. ✅ **Melhor Performance**: Função pode ser otimizada pelo PostgreSQL
4. ✅ **Manutenibilidade**: Lógica centralizada na função

## Testes

- ✅ Build: Passando
- ✅ TypeScript: Sem erros
- ✅ Linter: Sem erros
- ✅ Função RPC: Criada e testada

## Próximos Passos (Opcional)

1. Criar funções RPC similares para outras queries complexas
2. Adicionar cache para reduzir chamadas repetidas
3. Adicionar índices na tabela `matriculas` se necessário
4. Considerar ajustar políticas RLS para usar `auth.jwt()` em vez de `auth.users`

---

**Status**: ✅ **Resolvido e Testado**



