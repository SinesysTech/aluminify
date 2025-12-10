# Gestão de Usuários

<cite>
**Arquivos Referenciados neste Documento**  
- [student.service.ts](file://backend/services/student/student.service.ts)
- [teacher.service.ts](file://backend/services/teacher/teacher.service.ts)
- [student.types.ts](file://backend/services/student/student.types.ts)
- [teacher.types.ts](file://backend/services/teacher/teacher.types.ts)
- [student.repository.ts](file://backend/services/student/student.repository.ts)
- [teacher.repository.ts](file://backend/services/teacher/teacher.repository.ts)
- [student-import.service.ts](file://backend/services/student/student-import.service.ts)
- [roles.ts](file://lib/roles.ts)
- [user.ts](file://types/user.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Endpoints de Criação de Usuários](#endpoints-de-criação-de-usuários)
3. [Endpoints de Listagem de Usuários](#endpoints-de-listagem-de-usuários)
4. [Endpoint de Importação em Massa de Alunos](#endpoint-de-importação-em-massa-de-alunos)
5. [Estrutura de Requisição e Resposta](#estrutura-de-requisição-e-resposta)
6. [Campos Obrigatórios para Importação](#campos-obrigatórios-para-importação)
7. [Tratamento de Erros por Linha](#tratamento-de-erros-por-linha)
8. [Papéis de Usuário e Permissões](#papéis-de-usuário-e-permissões)
9. [Exemplos de Uso](#exemplos-de-uso)
10. [Validações de Dados e Políticas de Segurança](#validações-de-dados-e-políticas-de-segurança)
11. [Fluxo de Criação de Conta e Tratamento de Duplicatas](#fluxo-de-criação-de-conta-e-tratamento-de-duplicatas)

## Introdução
Este documento fornece uma documentação completa dos endpoints de gestão de usuários no sistema Área do Aluno. Ele abrange a criação, listagem e importação em massa de alunos e professores, detalhando esquemas de requisição e resposta, validações, políticas de segurança e exemplos práticos. O sistema utiliza autenticação baseada em Supabase com papéis definidos (aluno, professor, superadmin) e segue práticas rigorosas de validação de dados.

## Endpoints de Criação de Usuários
Os endpoints de criação de usuários permitem adicionar novos alunos e professores ao sistema. A criação envolve a validação de dados, verificação de unicidade e integração com o serviço de autenticação.

### Criação de Aluno (POST /api/student)
Este endpoint cria um novo aluno no sistema. O processo inclui:
- Validação de campos obrigatórios
- Verificação de unicidade de email, CPF e número de matrícula
- Geração automática de senha temporária baseada em CPF e curso
- Criação do usuário no sistema de autenticação (Supabase Auth)

**Método HTTP**: POST  
**URL**: `/api/student`

**Section sources**
- [student.service.ts](file://backend/services/student/student.service.ts#L38-L132)
- [student.repository.ts](file://backend/services/student/student.repository.ts#L157-L193)

### Criação de Professor (POST /api/teacher)
Este endpoint cria um novo professor no sistema. Inclui:
- Validação de campos obrigatórios
- Verificação de unicidade de email e CPF
- Integração com o sistema de autenticação
- Atualização de metadados do usuário

**Método HTTP**: POST  
**URL**: `/api/teacher`

**Section sources**
- [teacher.service.ts](file://backend/services/teacher/teacher.service.ts#L33-L133)
- [teacher.repository.ts](file://backend/services/teacher/teacher.repository.ts#L94-L122)

## Endpoints de Listagem de Usuários
Os endpoints de listagem permitem recuperar todos os usuários registrados no sistema.

### Listagem de Alunos (GET /api/student)
Retorna uma lista de todos os alunos ordenados por nome completo.

**Método HTTP**: GET  
**URL**: `/api/student`

**Section sources**
- [student.service.ts](file://backend/services/student/student.service.ts#L34-L36)
- [student.repository.ts](file://backend/services/student/student.repository.ts#L76-L87)

### Listagem de Professores (GET /api/teacher)
Retorna uma lista de todos os professores ordenados por nome completo.

**Método HTTP**: GET  
**URL**: `/api/teacher`

**Section sources**
- [teacher.service.ts](file://backend/services/teacher/teacher.service.ts#L29-L31)
- [teacher.repository.ts](file://backend/services/teacher/teacher.repository.ts#L47-L58)

## Endpoint de Importação em Massa de Alunos
Este endpoint permite a importação em massa de alunos através de um processo batch.

### Importação de Alunos (POST /api/student/import)
Permite criar múltiplos alunos em uma única requisição. O sistema processa cada linha individualmente, fornecendo um resumo detalhado do resultado.

**Método HTTP**: POST  
**URL**: `/api/student/import`

**Section sources**
- [student-import.service.ts](file://backend/services/student/student-import.service.ts#L56-L130)
- [student.service.ts](file://backend/services/student/student.service.ts#L38-L132)

## Estrutura de Requisição e Resposta
Esta seção detalha os esquemas JSON para requisições e respostas dos endpoints.

### Esquema de Requisição para Criação de Aluno
```json
{
  "fullName": "string",
  "email": "string",
  "cpf": "string",
  "phone": "string",
  "birthDate": "string (ISO 8601)",
  "address": "string",
  "zipCode": "string",
  "enrollmentNumber": "string",
  "instagram": "string",
  "twitter": "string",
  "courseIds": ["string"],
  "temporaryPassword": "string"
}
```

**Section sources**
- [student.types.ts](file://backend/services/student/student.types.ts#L25-L40)

### Esquema de Requisição para Criação de Professor
```json
{
  "fullName": "string",
  "email": "string",
  "cpf": "string",
  "phone": "string",
  "biography": "string",
  "photoUrl": "string",
  "specialty": "string"
}
```

**Section sources**
- [teacher.types.ts](file://backend/services/teacher/teacher.types.ts#L14-L23)

### Esquema de Resposta para Aluno
```json
{
  "id": "string",
  "fullName": "string | null",
  "email": "string",
  "cpf": "string | null",
  "phone": "string | null",
  "birthDate": "string (ISO 8601) | null",
  "address": "string | null",
  "zipCode": "string | null",
  "enrollmentNumber": "string | null",
  "instagram": "string | null",
  "twitter": "string | null",
  "courses": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "mustChangePassword": "boolean",
  "temporaryPassword": "string | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**Section sources**
- [student.types.ts](file://backend/services/student/student.types.ts#L6-L23)

### Esquema de Resposta para Professor
```json
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "cpf": "string | null",
  "phone": "string | null",
  "biography": "string | null",
  "photoUrl": "string | null",
  "specialty": "string | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**Section sources**
- [teacher.types.ts](file://backend/services/teacher/teacher.types.ts#L1-L12)

## Campos Obrigatórios para Importação
Para a importação em massa de alunos, os seguintes campos são obrigatórios:

- **fullName**: Nome completo do aluno
- **email**: Endereço de email válido
- **cpf**: CPF com 11 dígitos numéricos
- **phone**: Número de telefone com 10-15 dígitos
- **enrollmentNumber**: Número de matrícula
- **courses**: Lista de nomes de cursos
- **temporaryPassword**: Senha temporária com pelo menos 8 caracteres

**Section sources**
- [student-import.service.ts](file://backend/services/student/student-import.service.ts#L41-L48)

## Tratamento de Erros por Linha
O processo de importação em massa trata erros em nível de linha, permitindo que registros válidos sejam processados mesmo quando outros falham.

### Status de Resultado por Linha
- **created**: Aluno criado com sucesso
- **skipped**: Aluno ignorado (já existente)
- **failed**: Falha na criação do aluno

### Exemplo de Resposta de Importação
```json
{
  "total": 3,
  "created": 2,
  "skipped": 1,
  "failed": 0,
  "rows": [
    {
      "rowNumber": 1,
      "email": "aluno1@exemplo.com",
      "status": "created"
    },
    {
      "rowNumber": 2,
      "email": "aluno2@exemplo.com",
      "status": "created"
    },
    {
      "rowNumber": 3,
      "email": "aluno3@exemplo.com",
      "status": "skipped",
      "message": "Student with email \"aluno3@exemplo.com\" already exists"
    }
  ]
}
```

**Section sources**
- [student-import.service.ts](file://backend/services/student/student-import.service.ts#L24-L39)

## Papéis de Usuário e Permissões
O sistema implementa um modelo de autorização baseado em papéis com três níveis principais.

### Papéis Disponíveis
- **aluno**: Usuário comum do sistema
- **professor**: Educador com acesso a funcionalidades de ensino
- **superadmin**: Administrador com privilégios elevados

### Hierarquia de Permissões
O papel **superadmin** possui todas as permissões do papel **professor**, criando uma hierarquia onde superadmin > professor > aluno.

### Mapeamento de Rotas por Papel
- **aluno**: Redirecionado para `/aluno/dashboard`
- **professor**: Redirecionado para `/tobias`
- **superadmin**: Redirecionado para `/tobias`

**Section sources**
- [roles.ts](file://lib/roles.ts#L1-L28)
- [user.ts](file://types/user.ts#L1-L12)

## Exemplos de Uso
Esta seção fornece exemplos práticos de utilização dos endpoints.

### Exemplo com curl - Criação de Aluno
```bash
curl -X POST https://api.areadoaluno.com/api/student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fullName": "João Silva",
    "email": "joao.silva@exemplo.com",
    "cpf": "12345678901",
    "phone": "11987654321",
    "enrollmentNumber": "MAT123456",
    "courseIds": ["cursoid123"],
    "temporaryPassword": "12345678"
  }'
```

### Exemplo com curl - Importação em Massa
```bash
curl -X POST https://api.areadoaluno.com/api/student/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '[
    {
      "rowNumber": 1,
      "fullName": "Maria Santos",
      "email": "maria.santos@exemplo.com",
      "cpf": "98765432100",
      "phone": "21987654321",
      "enrollmentNumber": "MAT789012",
      "courses": ["Direito", "Administração"],
      "temporaryPassword": "senha123"
    }
  ]'
```

### Exemplo Frontend - Criação de Aluno
```typescript
async function criarAluno(dadosAluno) {
  const response = await fetch('/api/student', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dadosAluno)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}
```

## Validações de Dados e Políticas de Segurança
O sistema implementa rigorosas validações de dados e políticas de segurança.

### Validações de Dados
- **CPF**: Exatamente 11 dígitos numéricos
- **Telefone**: Entre 10 e 15 dígitos numéricos
- **Email**: Formato RFC 5322 válido
- **Senha temporária**: Mínimo de 8 caracteres
- **Nome completo**: Entre 3 e 200 caracteres

### Políticas de Segurança
- Todos os endpoints requerem autenticação JWT
- Validação de papéis para acesso a recursos
- Confirmação automática de email na criação
- Senhas armazenadas com hash (via Supabase Auth)
- Metadata de usuário com papel definido

**Section sources**
- [student.service.ts](file://backend/services/student/student.service.ts#L237-L356)
- [teacher.service.ts](file://backend/services/teacher/teacher.service.ts#L205-L296)

## Fluxo de Criação de Conta e Tratamento de Duplicatas
Este fluxo detalha o processo completo de criação de contas e como duplicatas são tratadas.

### Fluxo de Criação de Aluno
1. Receber dados do aluno
2. Validar todos os campos obrigatórios
3. Verificar unicidade de email, CPF e matrícula
4. Criar usuário no sistema de autenticação
5. Gerar senha temporária (se necessário)
6. Criar registro do aluno no banco de dados
7. Vincular aluno aos cursos selecionados

### Tratamento de Duplicatas
O sistema previne duplicatas através de:
- Verificação de email único
- Verificação de CPF único
- Verificação de número de matrícula único
- Tratamento especial na importação em massa (status "skipped")

**Section sources**
- [student.service.ts](file://backend/services/student/student.service.ts#L38-L132)
- [student-import.service.ts](file://backend/services/student/student-import.service.ts#L56-L130)