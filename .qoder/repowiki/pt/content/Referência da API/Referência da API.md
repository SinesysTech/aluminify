# Referência da API

<cite>
**Arquivos Referenciados neste Documento**   
- [route.ts](file://app/api/auth/signup/route.ts)
- [route.ts](file://app/api/auth/signin/route.ts)
- [route.ts](file://app/api/auth/me/route.ts)
- [route.ts](file://app/api/auth/refresh/route.ts)
- [route.ts](file://app/api/auth/signout/route.ts)
- [route.ts](file://app/api/api-key/route.ts)
- [route.ts](file://app/api/api-key/[id]/route.ts)
- [route.ts](file://app/api/chat/route.ts)
- [route.ts](file://app/api/conversations/route.ts)
- [route.ts](file://app/api/conversations/[id]/route.ts)
- [route.ts](file://app/api/cronograma/route.ts)
- [route.ts](file://app/api/cronograma/[id]/distribuicao-dias/route.ts)
- [route.ts](file://app/api/course/route.ts)
- [route.ts](file://app/api/course/[id]/route.ts)
- [route.ts](file://app/api/discipline/route.ts)
- [route.ts](file://app/api/discipline/[id]/route.ts)
- [route.ts](file://app/api/student/route.ts)
- [route.ts](file://app/api/student/[id]/route.ts)
- [route.ts](file://app/api/student/import/route.ts)
- [route.ts](file://app/api/teacher/route.ts)
- [route.ts](file://app/api/teacher/[id]/route.ts)
- [route.ts](file://app/api/enrollment/route.ts)
- [route.ts](file://app/api/enrollment/[id]/route.ts)
- [route.ts](file://app/api/course-material/route.ts)
- [route.ts](file://app/api/course-material/[id]/route.ts)
- [route.ts](file://app/api/docs/route.ts)
- [auth.spec.ts](file://backend/swagger/auth.spec.ts)
- [api-key.spec.ts](file://backend/swagger/api-key.spec.ts)
- [chat.spec.ts](file://backend/swagger/chat.spec.ts)
- [course.spec.ts](file://backend/swagger/course.spec.ts)
- [discipline.spec.ts](file://backend/swagger/discipline.spec.ts)
- [student.spec.ts](file://backend/swagger/student.spec.ts)
- [teacher.spec.ts](file://backend/swagger/teacher.spec.ts)
- [enrollment.spec.ts](file://backend/swagger/enrollment.spec.ts)
- [course-material.spec.ts](file://backend/swagger/course-material.spec.ts)
- [authentication.md](file://docs/authentication.md)
- [API.md](file://docs/API.md)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Visão Geral da API](#visão-geral-da-api)
3. [Autenticação e Autorização](#autenticação-e-autorização)
4. [Especificação OpenAPI e Swagger UI](#especificação-openapi-e-swagger-ui)
5. [Padrões de Versionamento, Rate Limiting e Logging](#padrões-de-versionamento-rate-limiting-e-logging)
6. [Tratamento de Erros Padronizado](#tratamento-de-erros-padronizado)
7. [Fluxos de Autenticação por Papel](#fluxos-de-autenticação-por-papel)
8. [Endpoints por Recurso](#endpoints-por-recurso)
9. [Exemplos de Uso](#exemplos-de-uso)
10. [Orientações para Clientes de API e Testes](#orientações-para-clientes-de-api-e-testes)

## Introdução

Este documento fornece uma referência completa da API RESTful do sistema Área do Aluno, detalhando todos os endpoints, esquemas de requisição e resposta, métodos de autenticação, códigos de status e exemplos de uso. A API é projetada com arquitetura API-First, seguindo princípios SOLID, KISS e YAGNI, sendo modularizada e independente do frontend.

**Seção fontes**
- [README.md](file://README.md#L3-L318)
- [API.md](file://docs/API.md#L1-L649)

## Visão Geral da API

A API do Área do Aluno é uma API RESTful que opera na base URL `http://localhost:3000/api` (ou URL de produção correspondente). A API suporta dois métodos principais de autenticação: JWT para interfaces de usuário e API Keys para integrações diretas com aplicações externas.

A arquitetura é modular, com serviços independentes para cada domínio funcional (disciplinas, cursos, alunos, professores, etc.), permitindo escalabilidade e manutenção simplificada. A comunicação é realizada via JSON, com respostas padronizadas para sucesso e erro.

**Seção fontes**
- [README.md](file://README.md#L3-L318)
- [API.md](file://docs/API.md#L1-L649)

## Autenticação e Autorização

O sistema implementa dois mecanismos de autenticação para atender diferentes cenários de uso:

### Autenticação via JWT (Interface de Usuário)

Para requisições feitas através da interface de usuário, utiliza-se autenticação JWT (JSON Web Token). O token deve ser enviado no header Authorization:

```
Authorization: Bearer <jwt_token>
```

O token JWT é obtido através dos endpoints de autenticação:
- `POST /api/auth/signup` - Cadastro de novo usuário
- `POST /api/auth/signin` - Login de usuário existente
- `POST /api/auth/refresh` - Atualização de token expirado

### Autenticação via API Key (Requisições Diretas)

Para integrações diretas com aplicações externas, utiliza-se API Keys. A chave deve ser enviada no header X-API-Key:

```
X-API-Key: <api_key>
```

As API Keys são criadas por professores através do endpoint `POST /api/api-key` e fornecem acesso direto ao backend, utilizando a Service Role Key do Supabase internamente, o que permite bypass das políticas RLS quando necessário.

**Seção fontes**
- [authentication.md](file://docs/authentication.md#L1-L137)
- [API.md](file://docs/API.md#L5-L42)
- [auth.spec.ts](file://backend/swagger/auth.spec.ts#L1-L260)
- [api-key.spec.ts](file://backend/swagger/api-key.spec.ts#L1-L330)

## Especificação OpenAPI e Swagger UI

A API fornece documentação completa e interativa através de dois endpoints:

### Especificação OpenAPI
A especificação OpenAPI completa está disponível em:
```
GET /api/docs
```
Este endpoint retorna a especificação OpenAPI 3.0.3 em formato JSON, contendo todos os endpoints, esquemas, parâmetros, respostas e códigos de status da API.

### Swagger UI
A documentação interativa está disponível em:
```
/swagger
```
A interface Swagger UI permite explorar, testar e experimentar todos os endpoints da API diretamente no navegador, com validação de parâmetros e exemplos de requisição e resposta.

**Seção fontes**
- [README.md](file://README.md#L127-L133)
- [API.md](file://docs/API.md#L593-L598)
- [route.ts](file://app/api/docs/route.ts#L1-L9)
- [index.ts](file://backend/swagger/index.ts#L1-L86)

## Padrões de Versionamento, Rate Limiting e Logging

### Versionamento
A API atualmente não implementa versionamento explícito nos endpoints. As mudanças são feitas de forma compatível com versões anteriores sempre que possível. Quando alterações que quebram compatibilidade são necessárias, serão introduzidas com prefixos de versão no caminho do endpoint (ex: `/api/v2/...`).

### Rate Limiting
O sistema implementa limitação de taxa para proteger contra uso excessivo e ataques de negação de serviço. Os limites são configurados no nível do servidor e variam conforme o tipo de endpoint:
- Endpoints de autenticação: limites mais restritivos para prevenir ataques de força bruta
- Endpoints de leitura: limites moderados
- Endpoints de escrita: limites mais flexíveis para usuários autenticados

### Logging
O sistema implementa logging abrangente para monitoramento, depuração e auditoria:
- Todas as requisições são registradas com timestamp, IP do cliente, endpoint acessado e código de status
- Operações de escrita e atualização registram o usuário responsável (campo `created_by` e `updated_by`)
- Erros são registrados com stack trace detalhado em ambiente de desenvolvimento
- O logging é configurável via variáveis de ambiente para diferentes níveis de verbosidade

**Seção fontes**
- [README.md](file://README.md#L201-L208)
- [API.md](file://docs/API.md#L599-L609)

## Tratamento de Erros Padronizado

A API utiliza um formato de resposta padronizado para erros, garantindo consistência e facilitando o tratamento por clientes:

### Formato de Resposta de Erro
```json
{
  "error": "Mensagem descritiva do erro"
}
```

### Códigos de Status HTTP
A API utiliza códigos de status HTTP padrão para indicar o resultado das operações:

- `200` - Sucesso (requisição processada com sucesso)
- `201` - Criado com sucesso (recurso criado)
- `400` - Erro de validação (dados da requisição inválidos)
- `401` - Não autenticado (credenciais ausentes ou inválidas)
- `403` - Sem permissão (usuário autenticado mas sem permissão para a operação)
- `404` - Não encontrado (recurso solicitado não existe)
- `409` - Conflito (recurso já existe ou operação conflitante)
- `500` - Erro interno do servidor (erro não esperado no servidor)

**Seção fontes**
- [API.md](file://docs/API.md#L599-L625)

## Fluxos de Autenticação por Papel

O sistema suporta três tipos principais de usuários, cada um com diferentes permissões e fluxos de autenticação:

### Aluno (student)
- Pode ver e editar seu próprio perfil
- Pode ver suas próprias matrículas
- Pode acessar materiais dos cursos em que está matriculado
- Acesso limitado aos dados próprios via RLS (Row Level Security)

### Professor (teacher)
- Pode criar e gerenciar cursos, disciplinas, segmentos e materiais
- Pode criar API Keys
- Pode ver e editar seu próprio perfil
- Pode gerenciar recursos que criou
- Requer autenticação JWT para operações administrativas

### Superadmin
- Todas as permissões de professor
- Acesso total a todas as tabelas (bypass RLS)
- Pode gerenciar todos os recursos, independente de quem criou
- Definido via metadata: `role: 'superadmin'` ou `is_superadmin: true`

**Seção fontes**
- [authentication.md](file://docs/authentication.md#L14-L31)
- [API.md](file://docs/API.md#L43-L59)

## Endpoints por Recurso

### auth

#### Cadastro de Usuário
- **Método HTTP**: POST
- **URL**: `/api/auth/signup`
- **Autenticação**: Nenhuma (público)
- **Requisição**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "João Silva",
  "role": "aluno" | "professor"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "aluno"
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação)

#### Login de Usuário
- **Método HTTP**: POST
- **URL**: `/api/auth/signin`
- **Autenticação**: Nenhuma (público)
- **Requisição**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "aluno"
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (credenciais inválidas)

#### Obter Usuário Atual
- **Método HTTP**: GET
- **URL**: `/api/auth/me`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "aluno"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado)

#### Atualizar Token
- **Método HTTP**: POST
- **URL**: `/api/auth/refresh`
- **Autenticação**: Nenhuma (requer refresh token)
- **Requisição**:
```json
{
  "refreshToken": "refresh_token"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "aluno"
    },
    "session": {
      "accessToken": "novo_jwt_token",
      "refreshToken": "novo_refresh_token"
    }
  }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (refresh token inválido)

#### Logout
- **Método HTTP**: POST
- **URL**: `/api/auth/signout`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado)

**Seção fontes**
- [auth.spec.ts](file://backend/swagger/auth.spec.ts#L80-L259)
- [API.md](file://docs/API.md#L63-L109)

### api-key

#### Listar API Keys
- **Método HTTP**: GET
- **URL**: `/api/api-key`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Production API Key",
      "createdBy": "uuid",
      "lastUsedAt": "timestamp",
      "expiresAt": "timestamp",
      "active": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 403 (sem permissão)

#### Criar API Key
- **Método HTTP**: POST
- **URL**: `/api/api-key`
- **Autenticação**: JWT (Bearer Token) - apenas professores
- **Requisição**:
```json
{
  "name": "Production API Key",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Production API Key",
    "key": "sk_live_abc123...", // Esta chave é mostrada apenas uma vez
    "createdBy": "uuid",
    "active": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 403 (sem permissão)

#### Atualizar API Key
- **Método HTTP**: PUT
- **URL**: `/api/api-key/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "active": false,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Production API Key",
    "createdBy": "uuid",
    "lastUsedAt": "timestamp",
    "expiresAt": "2026-12-31T23:59:59Z",
    "active": false,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado)

#### Deletar API Key
- **Método HTTP**: DELETE
- **URL**: `/api/api-key/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado)

**Seção fontes**
- [api-key.spec.ts](file://backend/swagger/api-key.spec.ts#L75-L329)
- [API.md](file://docs/API.md#L111-L159)

### chat

#### Enviar Mensagem ao Chat
- **Método HTTP**: POST
- **URL**: `/api/chat`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "message": "Qual é a fórmula do teorema de Pitágoras?",
  "sessionId": "session_id",
  "userId": "uuid-do-usuario"
}
```
- **Parâmetros de Query**:
  - `stream` (boolean): Habilita resposta em streaming (Server-Sent Events)
- **Resposta de Sucesso (200) - JSON**:
```json
{
  "data": {
    "output": "A fórmula do teorema de Pitágoras é a² + b² = c²"
  }
}
```
- **Resposta de Sucesso (200) - Streaming**:
```
data: {"chunk":"A fórmula"}
data: {"chunk":" do teorema"}
data: {"chunk":" de Pitágoras"}
data: [DONE]
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 500 (erro interno)

**Seção fontes**
- [chat.spec.ts](file://backend/swagger/chat.spec.ts#L75-L201)
- [API.md](file://docs/API.md#L417-L429)

### conversations

#### Listar Conversas
- **Método HTTP**: GET
- **URL**: `/api/conversations`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "session_id": "session_id",
      "user_id": "uuid",
      "title": "Conversa sobre Matemática",
      "active": true,
      "created_at": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado)

#### Obter Conversa Específica
- **Método HTTP**: GET
- **URL**: `/api/conversations/{id}`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "session_id": "session_id",
    "user_id": "uuid",
    "title": "Conversa sobre Matemática",
    "active": true,
    "history": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Qual é a fórmula do teorema de Pitágoras?",
        "timestamp": 1234567890
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "A fórmula do teorema de Pitágoras é a² + b² = c²",
        "timestamp": 1234567891
      }
    ],
    "created_at": "timestamp"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

#### Atualizar Conversa (Renomear)
- **Método HTTP**: PUT
- **URL**: `/api/conversations/{id}`
- **Autenticação**: JWT (Bearer Token)
- **Requisição**:
```json
{
  "title": "Novo título da conversa"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "session_id": "session_id",
    "user_id": "uuid",
    "title": "Novo título da conversa",
    "active": true,
    "created_at": "timestamp"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado)

#### Deletar Conversa
- **Método HTTP**: DELETE
- **URL**: `/api/conversations/{id}`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [API.md](file://docs/API.md#L454-L515)

### cronograma

#### Criar Cronograma
- **Método HTTP**: POST
- **URL**: `/api/cronograma`
- **Autenticação**: JWT (Bearer Token)
- **Requisição**:
```json
{
  "aluno_id": "uuid-do-aluno",
  "nome": "Meu plano ENEM",
  "data_inicio": "2025-02-01",
  "data_fim": "2025-06-30",
  "horas_dia": 3,
  "dias_semana": 5,
  "ferias": [
    {
      "inicio": "2025-04-01",
      "fim": "2025-04-07"
    }
  ],
  "disciplinas_ids": ["uuid-disciplina"],
  "prioridade_minima": 3,
  "modalidade": "paralelo" | "sequencial",
  "curso_alvo_id": "uuid-curso",
  "modulos_ids": ["uuid-modulo-1", "uuid-modulo-2"],
  "excluir_aulas_concluidas": true,
  "ordem_frentes_preferencia": ["Frente A", "Frente B"]
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "cronograma": { /* dados do cronograma */ },
  "estatisticas": {
    "total_aulas": 120,
    "total_semanas": 18,
    "semanas_uteis": 18,
    "capacidade_total_minutos": 16200,
    "custo_total_minutos": 15800,
    "frentes_distribuidas": 4
  }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado)

#### Obter Cronograma
- **Método HTTP**: GET
- **URL**: `/api/cronograma/{id}`
- **Autenticação**: JWT (Bearer Token)
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do cronograma completo */ }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

#### Atualizar Distribuição de Dias
- **Método HTTP**: PUT
- **URL**: `/api/cronograma/{id}/distribuicao-dias`
- **Autenticação**: JWT (Bearer Token)
- **Requisição**:
```json
{
  "itens": [
    {
      "id": "uuid-item",
      "semana_numero": 1,
      "ordem_na_semana": 1
    }
  ]
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "cronograma": { /* dados do cronograma atualizado */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [API.md](file://docs/API.md#L522-L591)

### course

#### Listar Cursos
- **Método HTTP**: GET
- **URL**: `/api/course`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "segmentId": "uuid",
      "disciplineId": "uuid",
      "name": "Matemática Básica",
      "modality": "EAD" | "LIVE",
      "type": "Extensivo" | "Intensivo" | "Superextensivo" | "Superintensivo" | "Revisão",
      "description": "Curso completo de matemática básica",
      "year": 2025,
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "accessMonths": 12,
      "planningUrl": "https://example.com/planning.pdf",
      "coverImageUrl": "https://example.com/cover.jpg",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso)

#### Criar Curso
- **Método HTTP**: POST
- **URL**: `/api/course`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "segmentId": "uuid",
  "disciplineId": "uuid",
  "name": "Matemática Básica",
  "modality": "EAD" | "LIVE",
  "type": "Extensivo" | "Intensivo" | "Superextensivo" | "Superintensivo" | "Revisão",
  "description": "Curso completo de matemática básica",
  "year": 2025,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "accessMonths": 12,
  "planningUrl": "https://example.com/planning.pdf",
  "coverImageUrl": "https://example.com/cover.jpg"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": { /* dados do curso criado */ }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 409 (conflito)

#### Obter Curso
- **Método HTTP**: GET
- **URL**: `/api/course/{id}`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do curso */ }
}
```
- **Códigos de Status**: 200 (sucesso), 404 (não encontrado)

#### Atualizar Curso
- **Método HTTP**: PUT
- **URL**: `/api/course/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "segmentId": "uuid",
  "disciplineId": "uuid",
  "name": "Matemática Avançada",
  "modality": "LIVE",
  "type": "Superintensivo",
  "description": "Curso avançado de matemática",
  "year": 2025,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "accessMonths": 12,
  "planningUrl": "https://example.com/planning.pdf",
  "coverImageUrl": "https://example.com/cover.jpg"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do curso atualizado */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado), 409 (conflito)

#### Deletar Curso
- **Método HTTP**: DELETE
- **URL**: `/api/course/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [course.spec.ts](file://backend/swagger/course.spec.ts#L113-L298)
- [API.md](file://docs/API.md#L238-L246)

### discipline

#### Listar Disciplinas
- **Método HTTP**: GET
- **URL**: `/api/discipline`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Matemática",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso)

#### Criar Disciplina
- **Método HTTP**: POST
- **URL**: `/api/discipline`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "name": "Matemática"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Matemática",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 409 (duplicado)

#### Obter Disciplina
- **Método HTTP**: GET
- **URL**: `/api/discipline/{id}`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Matemática",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 404 (não encontrado)

#### Atualizar Disciplina
- **Método HTTP**: PUT
- **URL**: `/api/discipline/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "name": "Matemática Avançada"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Matemática Avançada",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado), 409 (conflitante)

#### Deletar Disciplina
- **Método HTTP**: DELETE
- **URL**: `/api/discipline/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 404 (não encontrado)

**Seção fontes**
- [discipline.spec.ts](file://backend/swagger/discipline.spec.ts#L42-L228)
- [API.md](file://docs/API.md#L161-L177)

### student

#### Listar Alunos
- **Método HTTP**: GET
- **URL**: `/api/student`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "João Silva",
      "email": "joao.silva@example.com",
      "cpf": "12345678901",
      "phone": "11987654321",
      "birthDate": "2000-01-01",
      "address": "Rua das Flores, 123",
      "zipCode": "12345678",
      "enrollmentNumber": "MAT-2025-001",
      "instagram": "@joaosilva",
      "twitter": "@joaosilva",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 403 (sem permissão)

#### Criar Aluno
- **Método HTTP**: POST
- **URL**: `/api/student`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "id": "uuid",
  "email": "aluno@example.com",
  "fullName": "Maria Souza",
  "cpf": "12345678901",
  "phone": "11999990000",
  "birthDate": "2000-01-01",
  "address": "Avenida Central, 456",
  "zipCode": "87654321",
  "enrollmentNumber": "MAT-2025-002",
  "instagram": "@mariasouza",
  "twitter": "@mariasouza"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": { /* dados do aluno criado */ }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 409 (conflito)

#### Obter Aluno
- **Método HTTP**: GET
- **URL**: `/api/student/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do aluno */ }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado)

#### Atualizar Aluno
- **Método HTTP**: PUT
- **URL**: `/api/student/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "fullName": "Maria Souza Silva",
  "phone": "11988887777",
  "address": "Avenida Central, 456 - Apt 101"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do aluno atualizado */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 409 (conflito)

#### Deletar Aluno
- **Método HTTP**: DELETE
- **URL**: `/api/student/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado)

#### Importar Alunos via Planilha
- **Método HTTP**: POST
- **URL**: `/api/student/import`
- **Autenticação**: JWT (Bearer Token) - professor ou superadmin
- **Requisição**:
```json
{
  "rows": [
    {
      "rowNumber": 2,
      "fullName": "Maria Souza",
      "email": "maria@example.com",
      "cpf": "12345678901",
      "phone": "11999990000",
      "enrollmentNumber": "MAT-2025-001",
      "temporaryPassword": "Senha@123",
      "courses": ["Extensivo Medicina"]
    }
  ]
}
```
- **Campos obrigatórios por linha**: fullName, email, cpf (11 dígitos), phone (mín. 10 dígitos), enrollmentNumber, courses (nomes exatos cadastrados) e temporaryPassword (mín. 8 caracteres).
- **Resposta de Sucesso (200)**:
```json
{
  "data": {
    "total": 10,
    "created": 8,
    "skipped": 1,
    "failed": 1,
    "rows": [
      { "rowNumber": 2, "email": "maria@example.com", "status": "created" },
      { "rowNumber": 4, "email": "ana@example.com", "status": "failed", "message": "Cursos não encontrados: ..." }
    ]
  }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 403 (sem permissão)

**Seção fontes**
- [student.spec.ts](file://backend/swagger/student.spec.ts#L149-L334)
- [API.md](file://docs/API.md#L266-L328)

### teacher

#### Listar Professores
- **Método HTTP**: GET
- **URL**: `/api/teacher`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Prof. João Silva",
      "email": "joao.silva@example.com",
      "cpf": "12345678901",
      "phone": "11987654321",
      "biography": "Professor com 20 anos de experiência",
      "photoUrl": "https://example.com/photo.jpg",
      "specialty": "Doutor em História",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso)

#### Criar Professor
- **Método HTTP**: POST
- **URL**: `/api/teacher`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "id": "uuid",
  "fullName": "Prof. João Silva",
  "email": "joao.silva@example.com",
  "cpf": "12345678901",
  "phone": "11987654321",
  "biography": "Professor com 20 anos de experiência",
  "photoUrl": "https://example.com/photo.jpg",
  "specialty": "Doutor em História"
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": { /* dados do professor criado */ }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 409 (conflito)

#### Obter Professor
- **Método HTTP**: GET
- **URL**: `/api/teacher/{id}`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do professor */ }
}
```
- **Códigos de Status**: 200 (sucesso), 404 (não encontrado)

#### Atualizar Professor
- **Método HTTP**: PUT
- **URL**: `/api/teacher/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "fullName": "Prof. João Silva Jr.",
  "phone": "11988887777",
  "biography": "Professor com 21 anos de experiência"
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do professor atualizado */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado), 409 (conflito)

#### Deletar Professor
- **Método HTTP**: DELETE
- **URL**: `/api/teacher/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [teacher.spec.ts](file://backend/swagger/teacher.spec.ts#L113-L298)
- [API.md](file://docs/API.md#L330-L348)

### enrollment

#### Listar Matrículas
- **Método HTTP**: GET
- **URL**: `/api/enrollment?studentId={id}&courseId={id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Parâmetros de Query**:
  - `studentId`: Filtrar por ID do aluno
  - `courseId`: Filtrar por ID do curso
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "courseId": "uuid",
      "enrollmentDate": "timestamp",
      "accessStartDate": "2025-01-01",
      "accessEndDate": "2025-12-31",
      "active": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado)

#### Criar Matrícula
- **Método HTTP**: POST
- **URL**: `/api/enrollment`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "accessStartDate": "2025-01-01",
  "accessEndDate": "2025-12-31",
  "active": true
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": { /* dados da matrícula criada */ }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado), 409 (conflito)

#### Obter Matrícula
- **Método HTTP**: GET
- **URL**: `/api/enrollment/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados da matrícula */ }
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

#### Atualizar Matrícula
- **Método HTTP**: PUT
- **URL**: `/api/enrollment/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "accessStartDate": "2025-01-01",
  "accessEndDate": "2025-12-31",
  "active": false
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados da matrícula atualizada */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado)

#### Deletar Matrícula
- **Método HTTP**: DELETE
- **URL**: `/api/enrollment/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [enrollment.spec.ts](file://backend/swagger/enrollment.spec.ts#L72-L263)
- [API.md](file://docs/API.md#L350-L371)

### course-material

#### Listar Materiais de Curso
- **Método HTTP**: GET
- **URL**: `/api/course-material?courseId={id}`
- **Autenticação**: Nenhuma (público)
- **Parâmetros de Query**:
  - `courseId`: Filtrar por ID do curso
- **Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "title": "Apostila 1",
      "description": "Primeira apostila do curso",
      "type": "Apostila" | "Lista de Exercícios" | "Planejamento" | "Resumo" | "Gabarito" | "Outros",
      "fileUrl": "https://example.com/materials/apostila1.pdf",
      "order": 0,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```
- **Códigos de Status**: 200 (sucesso)

#### Criar Material de Curso
- **Método HTTP**: POST
- **URL**: `/api/course-material`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "courseId": "uuid",
  "title": "Apostila 1",
  "description": "Primeira apostila do curso",
  "type": "Apostila",
  "fileUrl": "https://example.com/materials/apostila1.pdf",
  "order": 0
}
```
- **Resposta de Sucesso (201)**:
```json
{
  "data": { /* dados do material criado */ }
}
```
- **Códigos de Status**: 201 (criado), 400 (erro de validação), 401 (não autenticado)

#### Obter Material de Curso
- **Método HTTP**: GET
- **URL**: `/api/course-material/{id}`
- **Autenticação**: Nenhuma (público)
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do material */ }
}
```
- **Códigos de Status**: 200 (sucesso), 404 (não encontrado)

#### Atualizar Material de Curso
- **Método HTTP**: PUT
- **URL**: `/api/course-material/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Requisição**:
```json
{
  "title": "Apostila 1 - Atualizada",
  "description": "Primeira apostila do curso - versão atualizada",
  "type": "Apostila",
  "fileUrl": "https://example.com/materials/apostila1-v2.pdf",
  "order": 0
}
```
- **Resposta de Sucesso (200)**:
```json
{
  "data": { /* dados do material atualizado */ }
}
```
- **Códigos de Status**: 200 (sucesso), 400 (erro de validação), 401 (não autenticado), 404 (não encontrado)

#### Deletar Material de Curso
- **Método HTTP**: DELETE
- **URL**: `/api/course-material/{id}`
- **Autenticação**: JWT (Bearer Token) ou API Key
- **Resposta de Sucesso (200)**:
```json
{
  "success": true
}
```
- **Códigos de Status**: 200 (sucesso), 401 (não autenticado), 404 (não encontrado)

**Seção fontes**
- [course-material.spec.ts](file://backend/swagger/course-material.spec.ts#L98-L275)
- [API.md](file://docs/API.md#L394-L414)

## Exemplos de Uso

### Exemplo 1: Criar Disciplina (JWT)
```bash
curl -X POST http://localhost:3000/api/discipline \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Física"}'
```

### Exemplo 2: Criar Disciplina (API Key)
```bash
curl -X POST http://localhost:3000/api/discipline \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Física"}'
```

### Exemplo 3: Listar Cursos (Público)
```bash
curl http://localhost:3000/api/course
```

### Exemplo 4: Criar Aluno com API Key
```bash
curl -X POST http://localhost:3000/api/student \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo.aluno@example.com",
    "fullName": "Novo Aluno",
    "cpf": "12345678901",
    "phone": "11987654321"
  }'
```

### Exemplo 5: Enviar Mensagem ao Chat
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual é a fórmula do teorema de Pitágoras?",
    "sessionId": "minha-sessao-123",
    "userId": "meu-uuid"
  }'
```

**Seção fontes**
- [API.md](file://docs/API.md#L626-L648)

## Orientações para Clientes de API e Testes

### Geração de SDKs
A especificação OpenAPI completa disponível em `/api/docs` pode ser utilizada para gerar SDKs automaticamente para diversas linguagens de programação (JavaScript, Python, Java, etc.) usando ferramentas como OpenAPI Generator, Swagger Codegen ou bibliotecas específicas de cada linguagem.

### Testes de Integração
Para testar a API de forma eficaz, recomenda-se:

1. **Testes de Autenticação**: Verificar todos os fluxos de autenticação (signup, signin, refresh, me)
2. **Testes de Permissão**: Validar que cada tipo de usuário tem acesso apenas aos recursos permitidos
3. **Testes de Validação**: Testar cenários de entrada inválida para todos os endpoints
4. **Testes de Integridade**: Verificar que operações de escrita persistem corretamente no banco de dados
5. **Testes de Desempenho**: Avaliar o tempo de resposta e comportamento sob carga

### Boas Práticas para Clientes
- Utilizar API Keys para integrações servidor-a-servidor
- Implementar retry com backoff exponencial para falhas temporárias
- Armazenar tokens JWT com segurança (nunca em localStorage para aplicações web)
- Validar respostas da API antes de processar
- Tratar erros de forma amigável para o usuário final
- Monitorar o uso da API para detectar padrões incomuns

**Seção fontes**
- [README.md](file://README.md#L209-L221)
- [API.md](file://docs/API.md#L626-L648)