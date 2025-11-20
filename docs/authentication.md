# Sistema de Autenticação

O sistema suporta duas formas de autenticação:

## 1. Autenticação via JWT (Interface de Usuário)

Usuários autenticados através da interface recebem um JWT token que identifica o usuário e suas permissões.

### Headers
```
Authorization: Bearer <jwt_token>
```

### Tipos de Usuários

1. **Aluno (student)**: Usuário da tabela `alunos`
   - Pode ver e editar seu próprio perfil
   - Pode ver suas próprias matrículas
   - Pode acessar materiais dos cursos em que está matriculado

2. **Professor (teacher)**: Usuário da tabela `professores`
   - Pode criar e gerenciar cursos, disciplinas, segmentos e materiais
   - Pode criar API Keys
   - Pode ver e editar seu próprio perfil

3. **Superadmin**: Professor com acesso total
   - Todas as permissões de professor
   - Acesso total a todas as tabelas (bypass RLS)
   - Pode gerenciar todos os recursos, independente de quem criou
   - Definido via metadata: `role: 'superadmin'` ou `is_superadmin: true`

## 2. Autenticação via API Key (Requisições Diretas)

Para aplicações externas que precisam fazer requisições diretas ao backend.

### Headers
```
X-API-Key: <api_key>
```

### Como Funciona

1. **Criação de API Key**: Apenas professores podem criar API Keys
   - Endpoint: `POST /api/api-key`
   - Requer autenticação JWT de professor
   - Retorna a chave plain apenas uma vez (formato: `sk_live_...`)

2. **Uso da API Key**: 
   - Enviar no header `X-API-Key`
   - O backend valida a chave e usa a **Service Role Key** do Supabase para fazer operações
   - Isso permite bypass das políticas RLS quando necessário
   - A chave é armazenada como hash SHA-256 no banco

3. **Gerenciamento**:
   - `GET /api/api-key` - Listar suas API Keys
   - `GET /api/api-key/{id}` - Ver detalhes
   - `PUT /api/api-key/{id}` - Atualizar (ativar/desativar, expiração)
   - `DELETE /api/api-key/{id}` - Deletar

### Segurança

- API Keys são armazenadas como hash SHA-256
- Podem ter data de expiração
- Podem ser desativadas sem deletar
- Último uso é rastreado
- Apenas o criador (ou superadmin) pode gerenciar

## Middleware Disponível

### `requireAuth`
Aceita tanto JWT quanto API Key:
```typescript
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  // request.user ou request.apiKey estará disponível
});
```

### `requireUserAuth`
Apenas JWT (usuário autenticado):
```typescript
export const GET = requireUserAuth(async (request: AuthenticatedRequest) => {
  // request.user estará disponível
});
```

### `requireRole(role)`
Apenas usuários com role específica:
```typescript
export const GET = requireRole('professor')(async (request: AuthenticatedRequest) => {
  // request.user.role === 'professor' ou 'superadmin'
});
```

### `requireSuperAdmin`
Apenas superadmin:
```typescript
export const GET = requireSuperAdmin(async (request: AuthenticatedRequest) => {
  // request.user.isSuperAdmin === true
});
```

## Exemplo de Uso

### Criar API Key (como professor)
```bash
POST /api/api-key
Authorization: Bearer <jwt_token>
{
  "name": "Production API Key",
  "expiresAt": "2026-12-31T23:59:59Z"
}

Response:
{
  "data": {
    "id": "...",
    "name": "Production API Key",
    "key": "sk_live_abc123...", // Salvar esta chave!
    ...
  }
}
```

### Usar API Key
```bash
GET /api/discipline
X-API-Key: sk_live_abc123...
```

## Políticas RLS

- **Alunos**: Veem apenas seus próprios dados
- **Professores**: Podem criar e gerenciar seus próprios recursos
- **Superadmin**: Acesso total a tudo (bypass RLS quando usando JWT)
- **API Keys**: Usam Service Role Key (bypass RLS completo)

