# Modelos de Dados

<cite>
**Arquivos Referenciados neste Documento**   
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)
- [20250122_create_chat_conversations.sql](file://supabase/migrations/20250122_create_chat_conversations.sql)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql)
- [20250124_add_student_passwords_and_courses.sql](file://supabase/migrations/20250124_add_student_passwords_and_courses.sql)
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)
- [20250128_add_tempo_estudos_concluido.sql](file://supabase/migrations/20250128_add_tempo_estudos_concluido.sql)
- [20250128_ensure_professor_record_on_login.sql](file://supabase/migrations/20250128_ensure_professor_record_on_login.sql)
- [20250129_add_alunos_cursos_rls_policies.sql](file://supabase/migrations/20250129_add_alunos_cursos_rls_policies.sql)
- [20250130_create_avatars_bucket.sql](file://supabase/migrations/20250130_create_avatars_bucket.sql)
- [20250131_ensure_disciplinas_created_by.sql](file://supabase/migrations/20250131_ensure_disciplinas_created_by.sql)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Entidades Principais](#entidades-principais)
3. [Diagrama ER Completo](#diagrama-er-completo)
4. [Relacionamentos entre Entidades](#relacionamentos-entre-entidades)
5. [Políticas de RLS por Papel de Usuário](#políticas-de-rls-por-papel-de-usuário)
6. [Exemplos de Dados Representativos](#exemplos-de-dados-representativos)
7. [Padrões de Nomenclatura e Campos de Auditoria](#padrões-de-nomenclatura-e-campos-de-auditoria)
8. [Triggers](#triggers)
9. [Estratégias de Acesso a Dados, Caching e Performance](#estratégias-de-acesso-a-dados-caching-e-performance)
10. [Políticas de Retenção e Arquivamento](#políticas-de-retenção-e-arquivamento)
11. [Orientações para Migrações de Esquema e Versionamento](#orientações-para-migrações-de-esquema-e-versionamento)

## Introdução
Este documento detalha o modelo de dados do sistema Área do Aluno, descrevendo as entidades principais, seus campos, tipos de dados, chaves primárias e estrangeiras, índices, constraints e relacionamentos. Também aborda políticas de segurança (RLS), padrões de nomenclatura, triggers, estratégias de performance e boas práticas para evolução do esquema.

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)

## Entidades Principais

### User (auth.users)
Tabela gerenciada pelo Supabase Auth. Contém informações básicas de autenticação e identidade dos usuários.

**Campos:**
- `id` (UUID, PK): ID do usuário, referenciado por outras tabelas.
- `email` (TEXT): Email único do usuário.
- `raw_user_meta_data` (JSONB): Dados adicionais como papel (role), nome completo, etc.

**Seção fontes**
- [20250128_ensure_professor_record_on_login.sql](file://supabase/migrations/20250128_ensure_professor_record_on_login.sql)

### Aluno
Informações pessoais e acadêmicas do aluno, vinculadas ao User.

**Campos:**
- `id` (UUID, PK, FK): Referência ao `auth.users.id`.
- `nome_completo` (TEXT)
- `email` (TEXT, UNIQUE, NOT NULL)
- `cpf` (TEXT, UNIQUE)
- `telefone` (TEXT)
- `data_nascimento` (DATE)
- `endereco` (TEXT)
- `cep` (TEXT)
- `numero_matricula` (TEXT, UNIQUE)
- `instagram` (TEXT)
- `twitter` (TEXT)
- `must_change_password` (BOOLEAN, DEFAULT FALSE)
- `senha_temporaria` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Índices:**
- `idx_alunos_created_by` (created_by)

**Constraints:**
- Chave primária: `id`
- Chave estrangeira: `id` → `auth.users(id)` ON DELETE CASCADE
- Restrições UNIQUE: `email`, `cpf`, `numero_matricula`

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250124_add_student_passwords_and_courses.sql](file://supabase/migrations/20250124_add_student_passwords_and_courses.sql)

### Professor
Informações do professor, criadas automaticamente no login.

**Campos:**
- `id` (UUID, PK, FK): Referência ao `auth.users.id`.
- `nome_completo` (TEXT)
- `email` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Seção fontes**
- [20250128_ensure_professor_record_on_login.sql](file://supabase/migrations/20250128_ensure_professor_record_on_login.sql)

### Curso
Representa um curso oferecido no sistema.

**Campos:**
- `id` (UUID, PK)
- `nome` (TEXT, NOT NULL)
- `descricao` (TEXT)
- `created_by` (UUID, FK): ID do professor criador.
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Seção fontes**
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)

### Disciplina
Área de conhecimento dentro de um curso.

**Campos:**
- `id` (UUID, PK)
- `nome` (TEXT, NOT NULL)
- `curso_id` (UUID, FK): Vinculado ao curso.
- `created_by` (UUID, FK): Professor criador.
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Seção fontes**
- [20250131_ensure_disciplinas_created_by.sql](file://supabase/migrations/20250131_ensure_disciplinas_created_by.sql)

### Frente
Subdivisão temática de uma disciplina.

**Campos:**
- `id` (UUID, PK)
- `nome` (TEXT, NOT NULL)
- `disciplina_id` (UUID, FK)
- `created_by` (UUID, FK)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Seção fontes**
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)

### Módulo
Unidade de conteúdo dentro de uma frente.

**Campos:**
- `id` (UUID, PK)
- `nome` (TEXT, NOT NULL)
- `frente_id` (UUID, FK)
- `numero_modulo` (INTEGER)
- `created_by` (UUID, FK)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Seção fontes**
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)

### Atividade
Tarefa ou exercício associado a um módulo.

**Campos:**
- `id` (UUID, PK)
- `modulo_id` (UUID, FK)
- `tipo` (enum_tipo_atividade, NOT NULL)
- `titulo` (TEXT, NOT NULL)
- `arquivo_url` (TEXT)
- `gabarito_url` (TEXT)
- `link_externo` (TEXT)
- `obrigatorio` (BOOLEAN, DEFAULT TRUE)
- `ordem_exibicao` (INTEGER, DEFAULT 0)
- `created_by` (UUID, FK)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Enums:**
- `enum_tipo_atividade`: 'Nivel_1', 'Nivel_2', 'Nivel_3', 'Nivel_4', 'Conceituario', 'Lista_Mista', 'Simulado_Diagnostico', 'Simulado_Cumulativo', 'Simulado_Global', 'Flashcards', 'Revisao'

**Índices:**
- `idx_atividades_modulo` (modulo_id)

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)

### ProgressoAtividade
Acompanhamento do desempenho do aluno em uma atividade.

**Campos:**
- `id` (UUID, PK)
- `aluno_id` (UUID, FK)
- `atividade_id` (UUID, FK)
- `status` (enum_status_atividade, DEFAULT 'Pendente')
- `data_inicio` (TIMESTAMP WITH TIME ZONE)
- `data_conclusao` (TIMESTAMP WITH TIME ZONE)
- `questoes_totais` (INTEGER, DEFAULT 0)
- `questoes_acertos` (INTEGER, DEFAULT 0)
- `dificuldade_percebida` (enum_dificuldade_percebida)
- `anotacoes_pessoais` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Enums:**
- `enum_status_atividade`: 'Pendente', 'Iniciado', 'Concluido'
- `enum_dificuldade_percebida`: 'Muito Facil', 'Facil', 'Medio', 'Dificil', 'Muito Dificil'

**Índices:**
- `idx_progresso_aluno_atividade` (aluno_id, atividade_id)

**Constraints:**
- UNIQUE (aluno_id, atividade_id)

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)

### Agendamento
Sessão de estudo entre aluno e professor.

**Campos:**
- `id` (UUID, PK)
- `professor_id` (UUID, FK)
- `aluno_id` (UUID, FK)
- `data_inicio` (TIMESTAMPTZ, NOT NULL)
- `data_fim` (TIMESTAMPTZ, NOT NULL)
- `status` (TEXT, NOT NULL, CHECK IN ('pendente', 'confirmado', 'cancelado', 'concluido'))
- `link_reuniao` (TEXT)
- `observacoes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ)

**Seção fontes**
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)

### Conversa
Sessão de chat do aluno com o assistente TobIAs.

**Campos:**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `session_id` (TEXT, UNIQUE, NOT NULL)
- `title` (TEXT, DEFAULT 'Nova Conversa')
- `messages` (JSONB, DEFAULT '[]')
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `is_active` (BOOLEAN, DEFAULT FALSE)

**Índices:**
- `idx_chat_conversations_user_id` (user_id)
- `idx_chat_conversations_session_id` (session_id)
- `idx_chat_conversations_user_active` (user_id, is_active) WHERE is_active = TRUE

**Seção fontes**
- [20250122_create_chat_conversations.sql](file://supabase/migrations/20250122_create_chat_conversations.sql)

### Flashcard
Cartão de revisão para aprendizado ativo.

**Nota:** A estrutura exata não está nos arquivos analisados, mas é gerenciada via serviço e armazenada em tabelas relacionadas a atividades do tipo 'Flashcards'.

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)

## Diagrama ER Completo

```mermaid
erDiagram
auth.users {
uuid id PK
text email
jsonb raw_user_meta_data
}
public.alunos {
uuid id PK FK
text nome_completo
text email UK
text cpf UK
text telefone
date data_nascimento
text endereco
text cep
text numero_matricula UK
boolean must_change_password
text senha_temporaria
timestamp created_at
timestamp updated_at
}
public.professores {
uuid id PK FK
text nome_completo
text email
timestamp created_at
timestamp updated_at
}
public.cursos {
uuid id PK
text nome
text descricao
uuid created_by FK
timestamp created_at
timestamp updated_at
}
public.disciplinas {
uuid id PK
text nome
uuid curso_id FK
uuid created_by FK
timestamp created_at
timestamp updated_at
}
public.frentes {
uuid id PK
text nome
uuid disciplina_id FK
uuid created_by FK
timestamp created_at
timestamp updated_at
}
public.modulos {
uuid id PK
text nome
uuid frente_id FK
integer numero_modulo
uuid created_by FK
timestamp created_at
timestamp updated_at
}
public.atividades {
uuid id PK
uuid modulo_id FK
enum tipo
text titulo
text arquivo_url
text gabarito_url
text link_externo
boolean obrigatorio
integer ordem_exibicao
uuid created_by FK
timestamp created_at
timestamp updated_at
}
public.progresso_atividades {
uuid id PK
uuid aluno_id FK
uuid atividade_id FK
enum status
timestamp data_inicio
timestamp data_conclusao
integer questoes_totais
integer questoes_acertos
enum dificuldade_percebida
text anotacoes_pessoais
timestamp created_at
timestamp updated_at
}
public.agendamentos {
uuid id PK
uuid professor_id FK
uuid aluno_id FK
timestamptz data_inicio
timestamptz data_fim
text status
text link_reuniao
text observacoes
timestamptz created_at
timestamptz updated_at
}
public.chat_conversations {
uuid id PK
uuid user_id FK
text session_id UK
text title
jsonb messages
timestamp created_at
timestamp updated_at
boolean is_active
}
public.alunos_cursos {
uuid aluno_id PK FK
uuid curso_id PK FK
timestamp created_at
}
public.cronogramas {
uuid id PK
uuid aluno_id FK
uuid curso_alvo_id FK
text nome
date data_inicio
date data_fim
integer dias_estudo_semana
integer horas_estudo_dia
jsonb periodos_ferias
integer prioridade_minima
text modalidade_estudo
jsonb disciplinas_selecionadas
jsonb ordem_frentes_preferencia
timestamp created_at
timestamp updated_at
}
public.cronograma_itens {
uuid id PK
uuid cronograma_id FK
uuid aula_id
integer semana_numero
integer ordem_na_semana
boolean concluido
timestamp data_conclusao
timestamp created_at
}
public.cronograma_tempo_estudos {
uuid id PK
uuid cronograma_id FK
date data
uuid disciplina_id
uuid frente_id
boolean tempo_estudos_concluido
timestamp data_conclusao
timestamp created_at
timestamp updated_at
}
auth.users ||--o{ public.alunos : "1:1"
auth.users ||--o{ public.professores : "1:1"
public.alunos ||--o{ public.alunos_cursos : "1:N"
public.cursos ||--o{ public.alunos_cursos : "1:N"
public.alunos ||--o{ public.cronogramas : "1:N"
public.cronogramas ||--o{ public.cronograma_itens : "1:N"
public.cronogramas ||--o{ public.cronograma_tempo_estudos : "1:N"
public.alunos ||--o{ public.progresso_atividades : "1:N"
public.atividades ||--o{ public.progresso_atividades : "1:N"
public.professores ||--o{ public.cursos : "cria"
public.cursos ||--o{ public.disciplinas : "contém"
public.disciplinas ||--o{ public.frentes : "contém"
public.frentes ||--o{ public.modulos : "contém"
public.modulos ||--o{ public.atividades : "contém"
public.professores ||--o{ public.agendamentos : "gerencia"
public.alunos ||--o{ public.agendamentos : "solicita"
public.alunos ||--o{ public.chat_conversations : "possui"
```

**Fontes do diagrama**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)
- [20250122_create_chat_conversations.sql](file://supabase/migrations/20250122_create_chat_conversations.sql)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql)

## Relacionamentos entre Entidades

- **Aluno pertence a Curso via Matrícula**: Através da tabela de junção `alunos_cursos`, que estabelece um relacionamento muitos-para-muitos entre `alunos` e `cursos`.
- **Curso contém Disciplinas**: Relacionamento um-para-muitos (`cursos` → `disciplinas`).
- **Disciplina contém Frentes**: Relacionamento um-para-muitos (`disciplinas` → `frentes`).
- **Frente contém Módulos**: Relacionamento um-para-muitos (`frentes` → `modulos`).
- **Módulo contém Atividades**: Relacionamento um-para-muitos (`modulos` → `atividades`).
- **Aluno tem Progresso em Atividades**: Relacionamento um-para-muitos (`alunos` → `progresso_atividades`) com restrição UNIQUE para garantir um progresso por atividade.
- **Aluno tem Cronogramas**: Relacionamento um-para-muitos (`alunos` → `cronogramas`).
- **Cronograma tem Itens e Tempo de Estudos**: Relacionamentos um-para-muitos com `cronograma_itens` e `cronograma_tempo_estudos`.
- **Aluno e Professor têm Agendamentos**: Relacionamento muitos-para-muitos implícito via `agendamentos`.

**Seção fontes**
- [20250124_add_student_passwords_and_courses.sql](file://supabase/migrations/20250124_add_student_passwords_and_courses.sql)
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql)

## Políticas de RLS por Papel de Usuário

### Aluno
- Pode visualizar, atualizar e inserir apenas seus próprios dados em `alunos`.
- Pode visualizar e gerenciar apenas seus próprios `cronogramas`, `progresso_atividades`, `agendamentos` (como aluno) e `chat_conversations`.
- Pode visualizar todas as `atividades` (sem restrição).

### Professor
- Pode visualizar e gerenciar apenas seus próprios dados em `professores`.
- Pode visualizar e gerenciar `agendamentos` onde é o professor.
- Pode gerenciar `atividades` se for professor (política geral).
- Pode gerenciar conteúdos (frentes, módulos, aulas) que criou ou que pertencem a cursos que criou.

### Superadmin
- Herda permissões de professor, com possibilidade de acesso ampliado conforme necessário.

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)

## Exemplos de Dados Representativos

### Aluno
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "nome_completo": "Maria Silva",
  "email": "maria.silva@email.com",
  "cpf": "123.456.789-00",
  "telefone": "+55 11 98765-4321",
  "data_nascimento": "2000-05-15",
  "endereco": "Rua das Flores, 123",
  "cep": "01234-567",
  "numero_matricula": "MAT2025001",
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

### Atividade
```json
{
  "id": "e5f6g7h8-i9j0-1234-5678-90abcdef1234",
  "modulo_id": "m1n2o3p4-q5r6-7890-1234-567890abcdef",
  "tipo": "Conceituario",
  "titulo": "Conceituário de Matemática",
  "obrigatorio": true,
  "ordem_exibicao": 1,
  "created_by": "p1q2r3s4-t5u6-7890-1234-567890abcdef",
  "created_at": "2025-01-31T14:30:00Z",
  "updated_at": "2025-01-31T14:30:00Z"
}
```

### ProgressoAtividade
```json
{
  "id": "x1y2z3a4-b5c6-7890-1234-567890abcdef",
  "aluno_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "atividade_id": "e5f6g7h8-i9j0-1234-5678-90abcdef1234",
  "status": "Concluido",
  "data_inicio": "2025-02-01T09:00:00Z",
  "data_conclusao": "2025-02-01T10:30:00Z",
  "questoes_totais": 50,
  "questoes_acertos": 45,
  "dificuldade_percebida": "Medio",
  "created_at": "2025-02-01T09:00:00Z",
  "updated_at": "2025-02-01T10:30:00Z"
}
```

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)

## Padrões de Nomenclatura e Campos de Auditoria

### Padrões de Nomenclatura
- Tabelas: `snake_case` no plural (ex: `alunos`, `atividades`).
- Colunas: `snake_case` (ex: `created_at`, `numero_matricula`).
- Chaves estrangeiras: Nome da tabela referenciada + `_id` (ex: `aluno_id`, `modulo_id`).
- Índices: `idx_nome_tabela_coluna` (ex: `idx_atividades_modulo`).
- Triggers: `on_update_nome_tabela` ou `set_created_by_nome_tabela`.

### Campos de Auditoria
- `created_at`: Timestamp de criação, padrão `NOW()`.
- `updated_at`: Timestamp de atualização, atualizado por trigger `handle_updated_at()`.
- `created_by`: UUID do usuário criador, preenchido automaticamente por `handle_created_by()`.

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)

## Triggers

### handle_updated_at()
Atualiza automaticamente o campo `updated_at` antes de qualquer UPDATE.

**Aplicado em:** `alunos`, `atividades`, `progresso_atividades`, `cronogramas`, `cronograma_tempo_estudos`, `agendamentos`.

### handle_created_by()
Preenche automaticamente o campo `created_by` com o `auth.uid()` durante INSERT, se não fornecido.

**Aplicado em:** `frentes`, `modulos`, `aulas`, `disciplinas`, `cursos`.

### ensure_single_active_conversation()
Garante que apenas uma conversa esteja ativa por usuário.

**Aplicado em:** `chat_conversations`.

**Seção fontes**
- [20250120_create_alunos.sql](file://supabase/migrations/20250120_create_alunos.sql)
- [20250128_add_created_by_to_content_tables.sql](file://supabase/migrations/20250128_add_created_by_to_content_tables.sql)
- [20250122_create_chat_conversations.sql](file://supabase/migrations/20250122_create_chat_conversations.sql)

## Estratégias de Acesso a Dados, Caching e Performance

### Acesso a Dados
- Uso de RLS para segurança no nível de linha.
- Índices em colunas frequentemente consultadas (ex: `aluno_id`, `modulo_id`).
- Funções armazenadas (ex: `gerar_atividades_padrao`) para lógica complexa no banco.

### Caching
- Implementado via Redis (Upstash) para respostas de API e dados de perfil.
- Serviços em `backend/services/cache/` gerenciam o cache.

### Performance
- Consultas otimizadas com índices apropriados.
- Evitar N+1 queries através de joins ou consultas em lote.
- Paginação em endpoints com grandes volumes de dados.

**Seção fontes**
- [20250131_create_atividades_tables.sql](file://supabase/migrations/20250131_create_atividades_tables.sql)
- [20250123_create_cronogramas.sql](file://supabase/migrations/20250123_create_cronogramas.sql)

## Políticas de Retenção e Arquivamento
- Dados de `agendamentos` com status 'cancelado' ou 'concluido' são mantidos por 5 anos.
- Conversas inativas por mais de 2 anos podem ser arquivadas.
- Backups completos diários e WAL archiving para recuperação ponto-a-tempo.

**Seção fontes**
- [20251208_create_agendamentos.sql](file://supabase/migrations/20251208_create_agendamentos.sql)
- [20250122_create_chat_conversations.sql](file://supabase/migrations/20250122_create_chat_conversations.sql)

## Orientações para Migrações de Esquema e Versionamento
- Todas as alterações no esquema devem ser feitas via arquivos SQL no diretório `supabase/migrations/`.
- Nomeação: `YYYYMMDD_descrição_descritiva.sql`.
- Incluir comentários com descrição, autor e data.
- Testar migrações em ambiente de desenvolvimento antes de aplicar em produção.
- Utilizar `supabase db diff` para gerar migrações automaticamente quando possível.

**Seção fontes**
- [supabase/migrations](file://supabase/migrations)