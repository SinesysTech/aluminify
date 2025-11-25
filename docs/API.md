# Documentação da API - Área do Aluno

## Visão Geral

A API do Área do Aluno é uma API RESTful que suporta duas formas de autenticação:
1. **JWT (JSON Web Token)** - Para interface de usuário
2. **API Key** - Para requisições diretas de aplicações externas

## Base URL

```
http://localhost:3000/api
```

## Autenticação

### JWT (Interface de Usuário)

Para requisições autenticadas via interface de usuário:

```
Authorization: Bearer <jwt_token>
```

O token JWT é obtido através dos endpoints de autenticação:
- `POST /api/auth/signup` - Cadastro
- `POST /api/auth/signin` - Login
- `POST /api/auth/refresh` - Atualizar token

### API Key (Requisições Diretas)

Para requisições de aplicações externas:

```
X-API-Key: <api_key>
```

A API Key é obtida através de:
- `POST /api/api-key` - Criar nova API Key (requer autenticação de professor)

**Nota:** API Keys usam a Service Role Key do Supabase internamente, permitindo bypass de RLS quando necessário.

## Tipos de Usuários

### 1. Aluno (student)
- Pode ver e editar seu próprio perfil
- Pode ver suas próprias matrículas
- Pode acessar materiais dos cursos em que está matriculado

### 2. Professor (teacher)
- Pode criar e gerenciar cursos, disciplinas, segmentos e materiais
- Pode criar API Keys
- Pode ver e editar seu próprio perfil

### 3. Superadmin
- Todas as permissões de professor
- Acesso total a todas as tabelas (bypass RLS)
- Pode gerenciar todos os recursos, independente de quem criou
- Definido via metadata: `role: 'superadmin'` ou `is_superadmin: true`

## Endpoints

### Autenticação

#### Cadastro
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "João Silva",
  "role": "aluno" | "professor"
}
```

#### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Obter Usuário Atual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/signout
Authorization: Bearer <token>
```

#### Atualizar Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### API Keys

#### Listar API Keys
```http
GET /api/api-key
Authorization: Bearer <token>
```

#### Criar API Key
```http
POST /api/api-key
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production API Key",
  "expiresAt": "2026-12-31T23:59:59Z" // opcional
}
```

**Resposta:**
```json
{
  "data": {
    "id": "...",
    "name": "Production API Key",
    "key": "sk_live_abc123...", // Salvar esta chave!
    ...
  }
}
```

#### Atualizar API Key
```http
PUT /api/api-key/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "active": false,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

#### Deletar API Key
```http
DELETE /api/api-key/{id}
Authorization: Bearer <token>
```

### Disciplinas

#### Listar Disciplinas (Público)
```http
GET /api/discipline
```

#### Criar Disciplina (Professor ou API Key)
```http
POST /api/discipline
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "name": "Matemática"
}
```

#### Buscar Disciplina (Público)
```http
GET /api/discipline/{id}
```

#### Atualizar Disciplina (Criador, Superadmin ou API Key)
```http
PUT /api/discipline/{id}
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "name": "Matemática Avançada"
}
```

#### Deletar Disciplina (Criador, Superadmin ou API Key)
```http
DELETE /api/discipline/{id}
Authorization: Bearer <token> | X-API-Key: <key>
```

### Segmentos

#### Listar Segmentos (Público)
```http
GET /api/segment
```

#### Criar Segmento (Professor ou API Key)
```http
POST /api/segment
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "name": "Pré-vestibular",
  "slug": "pre-vestibular" // opcional
}
```

#### Buscar Segmento (Público)
```http
GET /api/segment/{id}
```

#### Atualizar Segmento (Criador, Superadmin ou API Key)
```http
PUT /api/segment/{id}
Authorization: Bearer <token> | X-API-Key: <key>
```

#### Deletar Segmento (Criador, Superadmin ou API Key)
```http
DELETE /api/segment/{id}
Authorization: Bearer <token> | X-API-Key: <key>
```

### Cursos

#### Listar Cursos (Público)
```http
GET /api/course
```

#### Criar Curso (Professor ou API Key)
```http
POST /api/course
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "segmentId": "...",
  "disciplineId": "...",
  "name": "Matemática Básica",
  "modality": "EAD" | "LIVE",
  "type": "Extensivo" | "Intensivo" | "Superextensivo" | "Superintensivo" | "Revisão",
  "year": 2025,
  "description": "...",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "accessMonths": 12,
  "planningUrl": "...",
  "coverImageUrl": "..."
}
```

### Alunos

#### Listar Alunos (Superadmin ou API Key)
```http
GET /api/student
Authorization: Bearer <token> | X-API-Key: <key>
```

#### Criar Aluno
```http
POST /api/student
Content-Type: application/json

{
  "id": "...", // opcional (geralmente do auth.users)
  "email": "aluno@example.com",
  "fullName": "João Silva",
  "cpf": "12345678901",
  ...
}
```

#### Importar alunos via planilha
```http
POST /api/student/import
Authorization: Bearer <token> (professor ou superadmin)
Content-Type: application/json

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

Campos obrigatórios por linha:
- `fullName`, `email`, `cpf` (11 dígitos), `phone` (mín. 10 dígitos), `enrollmentNumber`, `courses` (nomes exatos cadastrados) e `temporaryPassword` (mín. 8 caracteres).
- Cursos duplicados na mesma linha são ignorados automaticamente.

**Resposta**
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

### Professores

#### Listar Professores (Público)
```http
GET /api/teacher
```

#### Criar Professor
```http
POST /api/teacher
Content-Type: application/json

{
  "id": "...", // opcional (geralmente do auth.users)
  "email": "professor@example.com",
  "fullName": "Prof. João Silva",
  ...
}
```

### Matrículas

#### Listar Matrículas
```http
GET /api/enrollment?studentId={id} | ?courseId={id}
Authorization: Bearer <token> | X-API-Key: <key>
```

#### Criar Matrícula
```http
POST /api/enrollment
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "studentId": "...",
  "courseId": "...",
  "accessStartDate": "2025-01-01",
  "accessEndDate": "2025-12-31",
  "active": true
}
```

### Materiais de Curso

#### Listar Materiais
```http
GET /api/course-material?courseId={id}
```

#### Criar Material (Professor ou API Key)
```http
POST /api/course-material
Authorization: Bearer <token> | X-API-Key: <key>
Content-Type: application/json

{
  "courseId": "...",
  "title": "Apostila 1",
  "description": "...",
  "type": "Apostila" | "Lista de Exercícios" | "Planejamento" | "Resumo" | "Gabarito" | "Outros",
  "fileUrl": "https://...",
  "order": 0
}
```

### Cronogramas

#### Gerar cronograma personalizado
```http
POST /api/cronograma
Authorization: Bearer <token>
Content-Type: application/json

{
  "aluno_id": "uuid-do-aluno",
  "nome": "Meu plano ENEM",
  "data_inicio": "2025-02-01",
  "data_fim": "2025-06-30",
  "horas_dia": 3,
  "dias_semana": 5,
  "ferias": [{ "inicio": "2025-04-01", "fim": "2025-04-07" }],
  "disciplinas_ids": ["uuid-disciplina"],
  "prioridade_minima": 3,
  "modalidade": "paralelo",
  "curso_alvo_id": "uuid-curso",
  "modulos_ids": ["uuid-modulo-1", "uuid-modulo-2"],
  "excluir_aulas_concluidas": true
}
```

Notas importantes:
- Aulas com `prioridade = 0` são sempre ignoradas pelo gerador e nunca aparecem no cronograma do aluno.
- `curso_alvo_id` define qual conjunto de aulas/módulos será utilizado. Quando informado, apenas aulas vinculadas a esse curso são consideradas.
- `modulos_ids` permite restringir o cronograma aos módulos selecionados no wizard (opcional). Caso não seja enviado, todos os módulos do curso são utilizados.
- `excluir_aulas_concluidas` (padrão `true`) remove automaticamente aulas já concluídas (historicamente ou via tabela `aulas_concluidas`).

**Resposta de sucesso**
```json
{
  "success": true,
  "cronograma": { ... },
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

## Documentação Swagger

A documentação completa da API está disponível em:
- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/api/docs`

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `409` - Conflito (duplicado)
- `500` - Erro interno do servidor

## Formato de Resposta

### Sucesso
```json
{
  "data": { ... }
}
```

### Erro
```json
{
  "error": "Mensagem de erro"
}
```

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

