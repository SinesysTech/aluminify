# Cadastro de Empresas e Hierarquia de Permissões

Este documento explica completamente como funciona o cadastro de empresas no sistema e a hierarquia de permissões entre Super Admin, Admin da Empresa, Professor e Aluno.

## 1. Cadastro de Empresas

O sistema possui **dois fluxos principais** para criação de empresas:

### 1.1. Cadastro via Super Admin

**Endpoint**: `POST /api/empresas`

**Quem pode criar**: Apenas usuários com role `superadmin`

**Fluxo**:
1. Super Admin acessa a interface de criação de empresas (ex: `/superadmin/empresas/nova`)
2. Preenche dados da empresa:
   - `nome` (obrigatório)
   - `cnpj` (opcional, mas deve ser único)
   - `emailContato` (opcional)
   - `telefone` (opcional)
   - `plano` (opcional, padrão: `'basico'`)
3. Opcionalmente, pode criar o primeiro admin da empresa:
   - `primeiroAdminEmail`
   - `primeiroAdminNome`
   - `primeiroAdminPassword`
4. Sistema cria a empresa no banco de dados
5. Se fornecido, cria o primeiro admin:
   - Cria usuário no Supabase Auth com `role: 'professor'` e `is_admin: true`
   - Insere registro na tabela `professores` (via trigger `handle_new_user`)
   - Insere registro na tabela `empresa_admins` com `is_owner: true`

**Código de referência**: 
- `app/api/empresas/route.ts` (linhas 36-111)
- `backend/services/empresa/empresa.service.ts`

### 1.2. Auto-cadastro (Professor criando sua própria empresa)

**Endpoint**: `POST /api/auth/signup-with-empresa`

**Quem pode criar**: Qualquer professor que deseja criar sua própria instituição

**Fluxo**:
1. Professor acessa formulário de cadastro
2. Preenche seus dados:
   - `email`
   - `password`
   - `fullName`
   - `empresaNome` (opcional - se não fornecido, usa `${fullName} - Instituição`)
3. Sistema cria automaticamente:
   - Uma nova empresa com plano `'basico'`
   - O usuário no Supabase Auth com:
     - `role: 'professor'`
     - `empresa_id: <id_da_empresa_criada>`
     - `is_admin: true`
   - Registro na tabela `professores` (via trigger)
   - Registro na tabela `empresa_admins` com `is_owner: true`

**Código de referência**: 
- `app/api/auth/signup-with-empresa/route.ts`

### 1.3. Estrutura da Tabela de Empresas

```sql
-- Tabela: empresas
- id: uuid (PK)
- nome: text (obrigatório)
- slug: text (único, gerado automaticamente)
- cnpj: text (único, opcional)
- email_contato: text (opcional)
- telefone: text (opcional)
- logo_url: text (opcional)
- plano: enum ('basico', 'profissional', 'enterprise')
- ativo: boolean (default: true)
- configuracoes: jsonb
- created_at: timestamp
- updated_at: timestamp
```

**Migração**: `supabase/migrations/20251217105924_create_empresas_table.sql`

## 2. Hierarquia de Roles e Permissões

O sistema implementa uma hierarquia de 4 níveis:

### 2.1. Super Admin

**Identificação**:
- `user_metadata.role = 'superadmin'` OU
- `user_metadata.is_superadmin = true`

**Características**:
- Não possui registro na tabela `professores`
- Não está vinculado a nenhuma empresa específica
- Possui acesso total ao sistema, podendo:
  - Criar e gerenciar empresas
  - Acessar dados de qualquer empresa
  - Bypass de políticas RLS quando necessário
  - Gerenciar todos os recursos independentemente de quem criou

**Verificação no código**:
```typescript
// backend/auth/middleware.ts (linhas 30-31)
const role = (user.user_metadata?.role as UserRole) || 'aluno';
const isSuperAdmin = role === 'superadmin' || user.user_metadata?.is_superadmin === true;
```

**Acesso a empresas**:
- Pode listar todas as empresas: `GET /api/empresas`
- Pode criar empresas: `POST /api/empresas`
- Pode acessar qualquer empresa via query param `?empresa_id=<id>`
- Todas as políticas RLS permitem acesso para superadmin

### 2.2. Admin da Empresa

**Identificação**:
Um professor pode ser admin de empresa de duas formas:

1. **Via flag `is_admin` na tabela `professores`**:
   - Campo `professores.is_admin = true`
   - Definido no `user_metadata.is_admin` durante criação/atualização

2. **Via tabela `empresa_admins`**:
   - Registro na tabela `empresa_admins` com `empresa_id` e `user_id`
   - Pode ter `is_owner: true` (owner/administrador principal) ou `false` (admin comum)

**Hierarquia dentro de Admins**:
- **Owner (`is_owner: true`)**: 
  - Primeiro admin criado (automaticamente owner)
  - Pode adicionar/remover outros admins
  - Pode gerenciar a empresa
  - Não pode remover a si mesmo se for o único owner

- **Admin comum (`is_owner: false`)**:
  - Pode gerenciar recursos da empresa
  - Não pode adicionar/remover outros admins
  - Pode ser removido pelo owner

**Permissões de Admin da Empresa**:
- Gerenciar dados da própria empresa (via `validateEmpresaAccess`)
- Criar e gerenciar professores da empresa
- Criar e gerenciar cursos, disciplinas, segmentos
- Visualizar e gerenciar alunos da empresa
- Adicionar/remover outros admins (apenas owner)

**Criação de Admins**:
- Owner ou Super Admin podem adicionar admins: `POST /api/empresas/[id]/admins`
- Owner ou Super Admin podem remover admins: `DELETE /api/empresas/[id]/admins/[userId]`

**Código de referência**:
- `supabase/migrations/20251217105926_create_empresa_admins.sql`
- `app/api/empresas/[id]/admins/route.ts`

### 2.3. Professor

**Identificação**:
- `user_metadata.role = 'professor'`
- Registro na tabela `professores` com `empresa_id` (obrigatório)
- `professores.is_admin` pode ser `true` ou `false`

**Características**:
- Sempre vinculado a uma empresa (`professores.empresa_id`)
- Se `is_admin = false`, é um professor comum (não admin)
- Se `is_admin = true`, também é admin da empresa (ver seção 2.2)

**Permissões de Professor Comum**:
- Criar e gerenciar cursos, disciplinas, segmentos da sua empresa
- Criar e gerenciar materiais didáticos
- Ver alunos da sua empresa
- Gerenciar agendamentos
- Criar API Keys
- Visualizar e editar próprio perfil

**Criação de Professores**:
- Admin da empresa ou Super Admin podem criar: `POST /api/empresas/[id]/professores`
- Trigger `handle_new_user()` cria automaticamente registro em `professores` quando usuário com `role: 'professor'` é criado

**Código de referência**:
- `supabase/migrations/20251217105929_update_handle_new_user_function.sql` (linhas 29-72)

### 2.4. Aluno

**Identificação**:
- `user_metadata.role = 'aluno'` OU não especificado (default)
- Registro na tabela `alunos`
- **NÃO possui `empresa_id` diretamente**

**Características**:
- Não vinculado diretamente a empresa
- Vinculação à empresa acontece via matrículas em cursos (`alunos_cursos`)
- Cada curso pertence a uma empresa, então aluno acessa empresas através de seus cursos

**Permissões de Aluno**:
- Visualizar e editar próprio perfil
- Ver próprias matrículas (`alunos_cursos`)
- Acessar materiais dos cursos em que está matriculado
- Usar funcionalidades: cronograma, flashcards, chat com IA
- Ver próprios agendamentos
- Acesso restrito apenas aos seus próprios dados (via RLS)

**Criação de Alunos**:
- Qualquer professor/admin da empresa pode criar alunos
- Trigger `handle_new_user()` cria automaticamente registro em `alunos` quando usuário com `role: 'aluno'` (ou default) é criado

**Código de referência**:
- `supabase/migrations/20251217105929_update_handle_new_user_function.sql` (linhas 76-94)

## 3. Fluxo de Autorização e Acesso

### 3.1. Verificação de Autenticação

O sistema usa middleware para verificar autenticação:

```typescript
// backend/auth/middleware.ts
- getAuthUser(): Extrai usuário do JWT token
- Verifica role e is_superadmin dos user_metadata
- Retorna AuthUser com role elevado para superadmin se necessário
```

### 3.2. Contexto de Empresa

O sistema utiliza contexto de empresa para validar acessos:

```typescript
// backend/middleware/empresa-context.ts
- getEmpresaContext(): Extrai empresa_id do professor logado
- Super Admin pode acessar qualquer empresa via query param
- validateEmpresaAccess(): Valida se usuário tem acesso à empresa
```

**Fluxo**:
1. Sistema busca `empresa_id` do professor na tabela `professores`
2. Se superadmin, pode usar `?empresa_id=<id>` para acessar qualquer empresa
3. Validação compara `context.empresaId` com `empresaId` solicitado
4. Super Admin sempre passa na validação

### 3.3. Row Level Security (RLS)

O banco de dados implementa políticas RLS que filtram dados automaticamente:

**Para Empresas**:
- Professores veem apenas sua empresa
- Super Admin vê todas as empresas
- Apenas Super Admin pode criar empresas
- Admins da empresa ou Super Admin podem atualizar

**Para Professores**:
- Professores veem apenas professores de sua empresa
- Super Admin vê todos os professores

**Para Cursos, Disciplinas, etc.**:
- Professores veem apenas recursos de sua empresa (`empresa_id = get_user_empresa_id()`)
- Super Admin vê todos os recursos
- Alunos veem apenas recursos dos cursos em que estão matriculados

**Função auxiliar**:
```sql
-- get_user_empresa_id(): Retorna empresa_id do professor logado
-- Usada em todas as políticas RLS
```

### 3.4. Verificação de Admin da Empresa

O sistema verifica se um professor é admin de duas formas:

1. **Função SQL `is_empresa_admin()`**:
   ```sql
   -- Verifica se usuário está em empresa_admins OU
   -- se tem professores.is_admin = true para a empresa
   ```

2. **Verificação via código**:
   ```typescript
   // Verifica tabela empresa_admins para is_owner
   // Verifica professores.is_admin
   ```

## 4. Resumo da Hierarquia

```
Super Admin
├── Acesso total ao sistema
├── Pode criar/gerenciar empresas
├── Pode acessar qualquer empresa
└── Bypass de RLS

Admin da Empresa (Owner)
├── Gerenciar própria empresa
├── Adicionar/remover outros admins
├── Gerenciar professores da empresa
└── Todas as permissões de Professor

Admin da Empresa (Comum)
├── Gerenciar recursos da empresa
├── Gerenciar professores da empresa
└── Todas as permissões de Professor

Professor (não admin)
├── Criar cursos/disciplinas da empresa
├── Gerenciar materiais
├── Ver alunos da empresa
└── Gerenciar agendamentos

Aluno
├── Ver próprio perfil
├── Ver próprias matrículas
├── Acessar materiais dos cursos matriculados
└── Usar funcionalidades de estudo
```

## 5. Fluxos de Cadastro Resumidos

### Cadastro de Empresa (Super Admin)
```
Super Admin → POST /api/empresas
→ Cria empresa
→ (Opcional) Cria primeiro admin com is_owner=true
```

### Auto-cadastro de Empresa (Professor)
```
Professor → POST /api/auth/signup-with-empresa
→ Cria empresa automaticamente
→ Cria usuário como professor
→ Define is_admin=true
→ Define is_owner=true em empresa_admins
```

### Cadastro de Professor (Admin/Super Admin)
```
Admin/Super Admin → POST /api/empresas/[id]/professores
→ Cria usuário no Auth com role='professor'
→ Trigger handle_new_user() cria registro em professores
→ Se is_admin=true, também cria em empresa_admins
```

### Cadastro de Aluno
```
Professor/Admin → Cria usuário no Auth com role='aluno'
→ Trigger handle_new_user() cria registro em alunos
→ Aluno é vinculado a empresa via matrícula em curso
```

## 6. Arquivos Importantes

- **Autenticação e Autorização**:
  - `backend/auth/middleware.ts` - Middleware de autenticação
  - `backend/middleware/empresa-context.ts` - Contexto de empresa
  - `lib/roles.ts` - Funções de roles

- **Empresas**:
  - `app/api/empresas/route.ts` - CRUD de empresas
  - `backend/services/empresa/` - Serviços de empresa
  - `supabase/migrations/20251217105924_create_empresas_table.sql` - Schema

- **Admins**:
  - `app/api/empresas/[id]/admins/route.ts` - Gerenciamento de admins
  - `supabase/migrations/20251217105926_create_empresa_admins.sql` - Schema

- **Triggers**:
  - `supabase/migrations/20251217105929_update_handle_new_user_function.sql` - Trigger de criação de usuários

- **Auto-cadastro**:
  - `app/api/auth/signup-with-empresa/route.ts` - Endpoint de auto-cadastro




