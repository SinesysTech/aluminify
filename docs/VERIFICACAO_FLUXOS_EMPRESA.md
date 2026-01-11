# Verificação: Ambos os Fluxos de Criação de Empresa Estão Salvando no Supabase?

## Análise dos Fluxos

### 1. Fluxo via Super Admin (`POST /api/empresas`)

**Código**: `app/api/empresas/route.ts` (linhas 36-111)

**Cliente usado**: `getDatabaseClient()` (linha 48)
- Usa `SUPABASE_SECRET_KEY` OU `SUPABASE_SERVICE_ROLE_KEY` OU `SUPABASE_ANON_KEY`
- Comentário no código: "Usar cliente admin para bypass de RLS"

**Operações**:
1. Valida se usuário é superadmin (linha 40)
2. Chama `service.create()` que usa `repository.create()`
3. `repository.create()` executa: `this.client.from('empresas').insert(insertData)`

**Resultado esperado**: ✅ **SALVA NO BANCO**
- Se usar SERVICE_ROLE_KEY ou SECRET_KEY: Bypass RLS, salva sempre
- Se usar ANON_KEY: Ainda salva porque usuário autenticado é superadmin (passa na política RLS)

### 2. Fluxo de Auto-cadastro (`POST /api/auth/signup-with-empresa`)

**Código**: `app/api/auth/signup-with-empresa/route.ts` (linhas 11-121)

**Cliente usado**: `getDatabaseClient()` (linha 23)
- Usa `SUPABASE_SECRET_KEY` OU `SUPABASE_SERVICE_ROLE_KEY` OU `SUPABASE_ANON_KEY`
- Comentário no código: "Usar adminClient (service role) para bypass de RLS" (linha 26)

**Operações**:
1. **NÃO valida autenticação** (endpoint público para cadastro)
2. Chama `service.create()` que usa `repository.create()`
3. `repository.create()` executa: `this.client.from('empresas').insert(insertData)`

**Resultado esperado**: ⚠️ **DEPENDE DA CHAVE CONFIGURADA**

#### Cenário A: Usando SERVICE_ROLE_KEY ou SECRET_KEY
✅ **SALVA NO BANCO**
- Service role key faz bypass completo de RLS
- Política "Apenas superadmin pode criar empresas" é ignorada
- Empresa é criada com sucesso

#### Cenário B: Usando ANON_KEY
❌ **FALHA AO SALVAR**
- ANON_KEY respeita políticas RLS
- Política RLS verifica se `auth.uid()` tem role 'superadmin'
- Como é um endpoint de cadastro (sem usuário autenticado), `auth.uid()` é NULL
- Política RLS bloqueia a inserção
- Erro: "new row violates row-level security policy"

## Política RLS Relevante

```sql
-- supabase/migrations/20251217105924_create_empresas_table.sql (linhas 79-91)
create policy "Apenas superadmin pode criar empresas"
    on public.empresas
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from auth.users
            where id = (select auth.uid())
            and raw_user_meta_data->>'role' = 'superadmin'
        )
    );
```

Esta política:
- Aplica apenas a usuários `authenticated`
- Verifica se `auth.uid()` existe e tem role 'superadmin'
- **É BYPASSADA por SERVICE_ROLE_KEY/SECRET_KEY**
- **É RESPEITADA por ANON_KEY**

## Conclusão

### ✅ Fluxo 1 (Super Admin): SEMPRE SALVA
- Funciona com qualquer tipo de chave
- Se ANON_KEY: Passa pela política RLS (usuário é superadmin)
- Se SERVICE_ROLE_KEY: Bypass de RLS

### ⚠️ Fluxo 2 (Auto-cadastro): DEPENDE DA CONFIGURAÇÃO

**Configuração correta** (recomendada):
```env
SUPABASE_SECRET_KEY=your_service_role_key
# ou
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
✅ **SALVA NO BANCO** - Ambos os fluxos funcionam

**Configuração incorreta**:
```env
SUPABASE_ANON_KEY=your_anon_key
# (sem SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY)
```
❌ **FALHA NO AUTO-CADASTRO** - Apenas o fluxo de Super Admin funciona

## Recomendações

1. **Garantir uso de SERVICE_ROLE_KEY/SECRET_KEY**:
   - O código assume que `getDatabaseClient()` usa service role key
   - Verificar variáveis de ambiente
   - O comentário no código diz "service role" mas a função pode usar ANON_KEY

2. **Verificar configuração atual**:
   - Verificar qual chave está sendo usada em produção
   - Verificar logs de erro se o auto-cadastro falhar

3. **Possível melhoria**:
   - Criar função específica `getServiceRoleClient()` que garanta uso de service role key
   - Usar essa função explicitamente nos endpoints que precisam bypass RLS

## Código de Verificação

Para verificar qual chave está sendo usada, adicionar log temporário:

```typescript
// backend/clients/database.ts
export function getDatabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const { DATABASE_URL, DATABASE_KEY } = getDatabaseCredentials();
    
    // Log temporário para debug
    const keyType = process.env.SUPABASE_SECRET_KEY ? 'SECRET_KEY' :
                   process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' :
                   process.env.SUPABASE_ANON_KEY ? 'ANON_KEY' : 'UNKNOWN';
    console.log('[Database Client] Using key type:', keyType);
    
    cachedClient = createClient(DATABASE_URL, DATABASE_KEY, {
      // ...
    });
  }
  return cachedClient;
}
```

## Resposta Direta

**Sim, ambos os fluxos DEVEM estar salvando no banco SE a configuração estiver correta.**

- ✅ **Fluxo 1 (Super Admin)**: Sempre funciona
- ✅ **Fluxo 2 (Auto-cadastro)**: Funciona apenas se `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` estiver configurado

Se o auto-cadastro não estiver funcionando, verificar se está usando `SUPABASE_ANON_KEY` ao invés de service role key.




