# Autenticação

<cite>
**Arquivos Referenciados neste Documento**  
- [app/api/auth/signup/route.ts](file://app/api/auth/signup/route.ts)
- [app/api/auth/signin/route.ts](file://app/api/auth/signin/route.ts)
- [app/api/auth/signout/route.ts](file://app/api/auth/signout/route.ts)
- [app/api/auth/refresh/route.ts](file://app/api/auth/refresh/route.ts)
- [app/api/auth/me/route.ts](file://app/api/auth/me/route.ts)
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts)
- [backend/auth/types.ts](file://backend/auth/types.ts)
- [backend/auth/middleware.ts](file://backend/auth/middleware.ts)
- [lib/auth.ts](file://lib/auth.ts)
- [lib/roles.ts](file://lib/roles.ts)
- [backend/clients/database-auth.ts](file://backend/clients/database-auth.ts)
- [backend/swagger/auth.spec.ts](file://backend/swagger/auth.spec.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Endpoints de Autenticação](#endpoints-de-autenticação)
   - [Cadastro (POST /api/auth/signup)](#cadastro-post-apiauthsignup)
   - [Login (POST /api/auth/signin)](#login-post-apiauthsignin)
   - [Logout (POST /api/auth/signout)](#logout-post-apiauthsignout)
   - [Atualização de Token (POST /api/auth/refresh)](#atualização-de-token-post-apiauthrefresh)
   - [Obtenção do Usuário Atual (GET /api/auth/me)](#obtenção-do-usuário-atual-get-apiauthme)
3. [Modelos de Dados](#modelos-de-dados)
4. [Fluxos de Autenticação por Papel](#fluxos-de-autenticação-por-papel)
5. [Uso de JWT e Refresh Tokens](#uso-de-jwt-e-refresh-tokens)
6. [Exemplos de Uso](#exemplos-de-uso)
   - [cURL](#curl)
   - [Código Frontend (fetch)](#código-frontend-fetch)
7. [Estratégias de Segurança](#estratégias-de-segurança)
8. [Tratamento de Erros Comuns](#tratamento-de-erros-comuns)
9. [Considerações Finais](#considerações-finais)

## Introdução

O sistema de autenticação da **Área do Aluno** é baseado em JWT (JSON Web Tokens) e utiliza o Supabase Auth como provedor de identidade. A API oferece endpoints para cadastro, login, logout, renovação de sessão e obtenção dos dados do usuário autenticado. O sistema suporta múltiplos papéis (aluno, professor, superadmin), com controle de acesso baseado em roles e políticas de segurança rigorosas.

A autenticação é implementada em camadas, com middleware que valida tokens JWT e chaves de API, além de garantir que apenas usuários autorizados acessem recursos protegidos. O uso de refresh tokens permite a renovação segura de sessões sem exigir login frequente.

**Seção fontes**
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L4-L139)
- [backend/auth/types.ts](file://backend/auth/types.ts#L1-L36)
- [backend/auth/middleware.ts](file://backend/auth/middleware.ts#L1-L193)

## Endpoints de Autenticação

### Cadastro (POST /api/auth/signup)

Endpoint para criação de novos usuários. Atualmente, este endpoint é usado principalmente para cadastro de professores. O primeiro professor cadastrado automaticamente recebe o papel de `superadmin` via trigger no banco de dados.

**Padrão de URL:** `POST /api/auth/signup`

**Corpo da Requisição:**
```json
{
  "email": "professor@example.com",
  "password": "senha_segura",
  "fullName": "Nome Completo do Professor"
}
```

**Resposta de Sucesso (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "professor@example.com",
      "role": "professor",
      "isSuperAdmin": false
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

**Códigos de Status:**
- `201 Created`: Usuário criado com sucesso
- `400 Bad Request`: Erro de validação (campos ausentes ou inválidos)

**Cabeçalhos de Autenticação:** Não requeridos

**Seção fontes**
- [app/api/auth/signup/route.ts](file://app/api/auth/signup/route.ts#L1-L59)
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L5-L42)

### Login (POST /api/auth/signin)

Endpoint para autenticação de usuários existentes. Aceita credenciais de qualquer papel (aluno, professor, superadmin).

**Padrão de URL:** `POST /api/auth/signin`

**Corpo da Requisição:**
```json
{
  "email": "usuario@example.com",
  "password": "senha"
}
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "role": "aluno",
      "isSuperAdmin": false
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

**Códigos de Status:**
- `200 OK`: Login bem-sucedido
- `401 Unauthorized`: Credenciais inválidas

**Cabeçalhos de Autenticação:** Não requeridos

**Seção fontes**
- [app/api/auth/signin/route.ts](file://app/api/auth/signin/route.ts#L1-L39)
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L44-L75)

### Logout (POST /api/auth/signout)

Invalida a sessão do usuário atual no lado do servidor.

**Padrão de URL:** `POST /api/auth/signout`

**Corpo da Requisição:** Vazio

**Resposta de Sucesso (200):**
```json
{
  "success": true
}
```

**Códigos de Status:**
- `200 OK`: Logout bem-sucedido
- `400 Bad Request`: Erro ao processar logout

**Cabeçalhos de Autenticação:** `Authorization: Bearer <access_token>`

**Seção fontes**
- [app/api/auth/signout/route.ts](file://app/api/auth/signout/route.ts#L1-L17)
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L77-L84)

### Atualização de Token (POST /api/auth/refresh)

Renova o token de acesso usando um refresh token válido.

**Padrão de URL:** `POST /api/auth/refresh`

**Corpo da Requisição:**
```json
{
  "refreshToken": "refresh_token_do_usuario"
}
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "role": "aluno",
      "isSuperAdmin": false
    },
    "session": {
      "accessToken": "novo_jwt_token",
      "refreshToken": "novo_refresh_token"
    }
  }
}
```

**Códigos de Status:**
- `200 OK`: Token renovado com sucesso
- `400 Bad Request`: Refresh token ausente
- `401 Unauthorized`: Refresh token inválido ou expirado

**Cabeçalhos de Autenticação:** Não requeridos

**Seção fontes**
- [app/api/auth/refresh/route.ts](file://app/api/auth/refresh/route.ts#L1-L20)
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L106-L136)

### Obtenção do Usuário Atual (GET /api/auth/me)

Retorna os dados do usuário autenticado. Útil para verificar o estado de autenticação e obter informações do perfil.

**Padrão de URL:** `GET /api/auth/me`

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "aluno",
    "isSuperAdmin": false
  }
}
```

**Códigos de Status:**
- `200 OK`: Usuário autenticado
- `401 Unauthorized`: Token inválido, ausente ou expirado

**Cabeçalhos de Autenticação:** `Authorization: Bearer <access_token>`

**Seção fontes**
- [app/api/auth/me/route.ts](file://app/api/auth/me/route.ts#L1-L41)
- [backend/auth/middleware.ts](file://backend/auth/middleware.ts#L11-L51)

## Modelos de Dados

### AuthUser
Representa um usuário autenticado.

**Propriedades:**
- `id`: string (UUID)
- `email`: string
- `role`: 'aluno' | 'professor' | 'superadmin'
- `isSuperAdmin`: boolean (opcional)

### AuthResponse
Resposta padrão dos endpoints de autenticação.

**Propriedades:**
- `user`: AuthUser
- `session`: 
  - `accessToken`: string (JWT)
  - `refreshToken`: string

### SignUpInput
Dados para cadastro.

**Propriedades:**
- `email`: string
- `password`: string
- `fullName`: string (opcional)
- `role`: UserRole (opcional, padrão: 'aluno')

### SignInInput
Credenciais de login.

**Propriedades:**
- `email`: string
- `password`: string

**Seção fontes**
- [backend/auth/types.ts](file://backend/auth/types.ts#L1-L36)

## Fluxos de Autenticação por Papel

### Aluno
- Acesso via login com credenciais
- Redirecionado para `/aluno/dashboard`
- Permissões limitadas a recursos de aluno
- Não pode acessar áreas administrativas

### Professor
- Acesso via login com credenciais
- Redirecionado para `/tobias`
- Pode gerenciar alunos, cursos e conteúdos
- Pode criar e gerenciar agendamentos

### Superadmin
- Primeiro professor cadastrado torna-se superadmin automaticamente
- Herda todas as permissões de professor
- Pode gerenciar configurações do sistema
- Acesso irrestrito a todos os recursos

**Seção fontes**
- [lib/roles.ts](file://lib/roles.ts#L1-L47)
- [lib/auth.ts](file://lib/auth.ts#L7-L121)

## Uso de JWT e Refresh Tokens

### Duração
- **Access Token**: 24 horas
- **Refresh Token**: 30 dias

### Segurança
- Tokens assinados com algoritmo HMAC
- Refresh tokens armazenados com segurança no Supabase Auth
- Rotas protegidas validam a presença e validade do token
- Possibilidade de revogação manual no painel do Supabase

### Renovação
O fluxo de renovação ocorre automaticamente quando o access token expira:
1. Cliente detecta token expirado (401)
2. Envia refresh token para `/api/auth/refresh`
3. Recebe novo par de tokens
4. Atualiza o armazenamento local

**Seção fontes**
- [backend/auth/auth.service.ts](file://backend/auth/auth.service.ts#L106-L136)
- [backend/clients/database-auth.ts](file://backend/clients/database-auth.ts#L1-L68)

## Exemplos de Uso

### cURL

**Cadastro:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professor@example.com",
    "password": "senha_segura",
    "fullName": "João Silva"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha"
  }'
```

**Obter usuário atual:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer jwt_token_aqui"
```

### Código Frontend (fetch)

```javascript
// Login
async function login(email, password) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login falhou');
  }
  
  const data = await response.json();
  localStorage.setItem('access_token', data.data.session.accessToken);
  return data.data.user;
}

// Atualizar token
async function refreshSession(refreshToken) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (!response.ok) {
    throw new Error('Renovação falhou');
  }
  
  const data = await response.json();
  localStorage.setItem('access_token', data.data.session.accessToken);
  return data.data;
}

// Obter usuário atual
async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.data;
}
```

**Seção fontes**
- [app/api/auth/signin/route.ts](file://app/api/auth/signin/route.ts#L1-L39)
- [app/api/auth/refresh/route.ts](file://app/api/auth/refresh/route.ts#L1-L20)
- [app/api/auth/me/route.ts](file://app/api/auth/me/route.ts#L1-L41)

## Estratégias de Segurança

### Proteção contra CSRF
- Tokens JWT armazenados em cookies HttpOnly quando possível
- Validação de origem (Origin) em requisições sensíveis
- Uso de SameSite em cookies

### Proteção contra XSS
- Sanitização de entradas de usuário
- Headers de segurança (Content-Security-Policy, X-Content-Type-Options)
- Armazenamento seguro de tokens (evitar localStorage quando possível)

### Rate Limiting
- Limitação de tentativas de login por IP
- Proteção contra força bruta no endpoint de login
- Monitoramento de padrões suspeitos de acesso

**Seção fontes**
- [backend/auth/middleware.ts](file://backend/auth/middleware.ts#L1-L193)
- [backend/clients/database-auth.ts](file://backend/clients/database-auth.ts#L1-L68)

## Tratamento de Erros Comuns

### Credenciais Inválidas
- **Código HTTP:** 401
- **Mensagem:** "Failed to sign in: Invalid login credentials"
- **Ação:** Verificar email e senha, tentar novamente

### Conta Bloqueada
- **Código HTTP:** 401
- **Mensagem:** "Too many failed attempts"
- **Ação:** Aguardar tempo determinado ou redefinir senha

### Token Expirado
- **Código HTTP:** 401
- **Mensagem:** "Token inválido ou expirado"
- **Ação:** Usar refresh token para obter novo access token

### Sessão Ausente
- **Código HTTP:** 401
- **Mensagem:** "Auth session missing"
- **Ação:** Realizar login novamente

**Seção fontes**
- [app/api/auth/signin/route.ts](file://app/api/auth/signin/route.ts#L34-L36)
- [components/first-access-form.tsx](file://components/first-access-form.tsx#L52-L63)
- [index.ts](file://index.ts#L144-L182)

## Considerações Finais

A API de autenticação do sistema Área do Aluno é robusta, segura e projetada para suportar múltiplos papéis com controle de acesso granular. O uso de JWT e refresh tokens garante uma experiência de usuário fluida, enquanto as camadas de segurança protegem contra ameaças comuns.

Para integrações futuras, recomenda-se:
- Utilizar HTTPS em todos os ambientes
- Armazenar tokens com segurança no cliente
- Implementar renovação automática de sessão
- Monitorar tentativas de acesso suspeitas
- Documentar qualquer extensão de funcionalidade

**Seção fontes**
- [backend/swagger/auth.spec.ts](file://backend/swagger/auth.spec.ts#L55-L110)
- [docs/authentication.md](file://docs/authentication.md)