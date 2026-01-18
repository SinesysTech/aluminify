# Aluminify

A infraestrutura invisível da educação. Sistema completo de gerenciamento educacional multi-tenant para **cursos livres** (preparatórios para ENEM, concursos, residência médica).

## Arquitetura

### Hierarquia de Negócio

```
Empresa (Tenant/Cursinho)
├── Segmentos (ex: "ENEM", "Concursos") - por tenant
├── Disciplinas (ex: "Matemática", "Português") - por tenant
│   └── Frentes → Módulos → Aulas
├── Cursos (ex: "Extensivo ENEM 2025") - com data_inicio e data_fim
│   ├── cursos_disciplinas (N:N - quais disciplinas o curso oferece)
│   └── Turmas (opcional) - ex: "Manhã", "Tarde"
│       └── alunos_turmas (N:N)
├── Professores - por tenant
│   └── professores_disciplinas (flexível: geral, curso, turma, frente, módulo)
└── Alunos - por tenant
    ├── Cronograma inteligente (gerado pelo aluno)
    ├── Progresso (professor vê só da disciplina dele)
    └── Chat (isolado por empresa)
```

### Estrutura do Projeto

```
aluminify/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (REST endpoints)
│   │   ├── auth/                 # Autenticação
│   │   ├── chat/                 # Chat com IA
│   │   ├── cronograma/           # Cronogramas de estudo
│   │   ├── course/               # Cursos
│   │   ├── discipline/           # Disciplinas
│   │   ├── segment/              # Segmentos
│   │   ├── student/              # Alunos
│   │   ├── teacher/              # Professores
│   │   ├── empresas/             # Gestão de empresas
│   │   ├── agendamentos/         # Agendamentos
│   │   ├── dashboard/            # Analytics
│   │   └── admin/                # Endpoints administrativos
│   ├── (dashboard)/              # Rotas protegidas
│   │   ├── aluno/                # Dashboard do aluno
│   │   ├── professor/            # Dashboard do professor
│   │   ├── admin/                # Painel administrativo
│   │   ├── curso/                # Gestão de cursos
│   │   ├── disciplina/           # Gestão de disciplinas
│   │   ├── segmento/             # Gestão de segmentos
│   │   ├── agendamentos/         # Agenda
│   │   └── conteudos/            # Gestão de conteúdo
│   └── auth/                     # Páginas de autenticação
│
├── backend/                      # Serviços e lógica de negócio
│   ├── services/                 # Serviços modulares
│   │   ├── discipline/           # Serviço de Disciplinas
│   │   ├── segment/              # Serviço de Segmentos
│   │   ├── course/               # Serviço de Cursos
│   │   ├── student/              # Serviço de Alunos
│   │   ├── teacher/              # Serviço de Professores
│   │   ├── enrollment/           # Serviço de Matrículas
│   │   ├── course-material/      # Serviço de Materiais
│   │   ├── api-key/              # Serviço de API Keys
│   │   ├── chat/                 # Serviço de Chat/IA
│   │   ├── cronograma/           # Serviço de Cronogramas
│   │   ├── atividade/            # Serviço de Atividades
│   │   ├── empresa/              # Serviço de Empresas
│   │   ├── dashboard-analytics/  # Serviço de Analytics
│   │   ├── brand-customization/  # Customização de marca
│   │   └── cache/                # Gerenciamento de cache
│   ├── auth/                     # Sistema de autenticação
│   ├── clients/                  # Clientes de banco de dados
│   ├── middleware/               # Middlewares
│   └── swagger/                  # Documentação Swagger
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── shared/                   # Componentes compartilhados
│   ├── admin/                    # Componentes de admin
│   ├── aluno/                    # Componentes de aluno
│   ├── professor/                # Componentes de professor
│   ├── dashboard/                # Componentes de dashboard
│   └── layout/                   # Componentes de layout
│
├── lib/                          # Utilitários
│   ├── database.types.ts         # Tipos gerados do Supabase
│   ├── auth.ts                   # Utilitários de autenticação
│   ├── middleware.ts             # Lógica de middleware
│   └── services/                 # Serviços de alto nível
│
├── hooks/                        # React hooks customizados
├── types/                        # Definições TypeScript
│   ├── shared/                   # Tipos compartilhados
│   │   ├── entities/             # Tipos de entidades
│   │   ├── enums/                # Enumerações
│   │   └── dtos/                 # Data Transfer Objects
│   └── ...
│
├── supabase/                     # Banco de dados
│   ├── migrations/               # Migrations SQL (120+)
│   └── functions/                # Edge Functions
│
├── openspec/                     # Especificações e propostas
│   ├── AGENTS.md                 # Guia para agentes IA
│   └── changes/                  # Propostas de mudança
│
└── docs/                         # Documentação
```

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19.2, TypeScript 5, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI |
| Backend | Next.js API Routes, TypeScript |
| Banco de Dados | Supabase (PostgreSQL) com RLS |
| Cache | Upstash Redis |
| Autenticação | Supabase Auth (JWT) + API Keys |
| Integrações | N8N (Chat IA), Swagger/OpenAPI |
| Bibliotecas | React Query, React Table, React Hook Form, Zod |

## Banco de Dados

### Tabelas Principais

#### Entidades Core
| Tabela | Descrição |
|--------|-----------|
| `empresas` | Tenants (cursinhos) |
| `alunos` | Perfis de alunos |
| `professores` | Perfis de professores |
| `segmentos` | Segmentos educacionais (ENEM, Concursos) |
| `disciplinas` | Disciplinas por tenant |
| `cursos` | Cursos com datas de início/fim |

#### Estrutura de Conteúdo
| Tabela | Descrição |
|--------|-----------|
| `frentes` | Frentes de uma disciplina |
| `modulos` | Módulos dentro de frentes |
| `aulas` | Aulas individuais |
| `materiais_curso` | Materiais de apoio |

#### Relacionamentos
| Tabela | Descrição |
|--------|-----------|
| `cursos_disciplinas` | Disciplinas oferecidas por curso (N:N) |
| `turmas` | Turmas dentro de cursos (Manhã, Tarde) |
| `alunos_turmas` | Vínculo aluno-turma |
| `alunos_cursos` | Matrículas de alunos em cursos |
| `professores_disciplinas` | Vínculo flexível professor-disciplina |

#### Cronograma e Progresso
| Tabela | Descrição |
|--------|-----------|
| `cronogramas` | Cronogramas de estudo dos alunos |
| `cronograma_aulas` | Aulas no cronograma |
| `cronograma_semanas_dias` | Dias da semana do cronograma |
| `aulas_concluidas` | Registro de aulas concluídas |
| `sessoes_estudo` | Sessões de estudo |

#### Atividades e Flashcards
| Tabela | Descrição |
|--------|-----------|
| `atividades` | Atividades/exercícios |
| `progresso_atividades` | Progresso nas atividades |
| `flashcards` | Flashcards para revisão |
| `progresso_flashcards` | Progresso nos flashcards |

#### Chat e Agendamentos
| Tabela | Descrição |
|--------|-----------|
| `chat_conversations` | Conversas do chat (isolado por empresa) |
| `chat_conversation_history` | Histórico de mensagens |
| `agendamentos` | Agendamentos |
| `agendamento_recorrencia` | Recorrência de agendamentos |

### Funções Helper (RLS)

| Função | Descrição |
|--------|-----------|
| `get_user_empresa_id()` | Retorna empresa_id do usuário logado |
| `get_user_role()` | Retorna role do usuário (aluno/professor/superadmin) |
| `is_admin_da_empresa(empresa_id)` | Verifica se é admin da empresa |
| `is_professor_da_disciplina(disciplina_id)` | Verifica se é professor da disciplina |
| `get_professor_disciplinas()` | Retorna array de disciplinas do professor |
| `professor_tem_acesso_modulo(modulo_id)` | Verifica acesso a módulo |
| `professor_tem_acesso_frente(frente_id)` | Verifica acesso a frente |
| `aluno_em_turma(turma_id)` | Verifica se aluno está na turma |

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com isolamento por:
- **Tenant** (`empresa_id`) - Dados isolados por cursinho
- **Role** - Aluno, Professor, Admin têm acessos diferentes
- **Disciplina** - Professor vê apenas dados de suas disciplinas

## API Routes

### Autenticação
```
POST /api/auth/signup              # Cadastro de aluno
POST /api/auth/professor/signup    # Cadastro de professor (cria empresa)
POST /api/auth/signin              # Login
POST /api/auth/signout             # Logout
GET  /api/auth/me                  # Usuário atual
POST /api/auth/refresh             # Refresh token
POST /api/auth/impersonate         # Impersonar usuário (admin)
```

### Gestão de Entidades
```
# Cursos
GET    /api/course                 # Listar cursos
POST   /api/course                 # Criar curso
GET    /api/course/[id]            # Obter curso
PUT    /api/course/[id]            # Atualizar curso
DELETE /api/course/[id]            # Remover curso

# Disciplinas
GET    /api/discipline             # Listar disciplinas
POST   /api/discipline             # Criar disciplina
GET    /api/discipline/[id]        # Obter disciplina
PUT    /api/discipline/[id]        # Atualizar disciplina
DELETE /api/discipline/[id]        # Remover disciplina

# Segmentos, Alunos, Professores, Matrículas - mesmo padrão
```

### Cronograma
```
POST /api/cronograma                              # Criar cronograma
GET  /api/cronograma/[id]                         # Obter cronograma
PUT  /api/cronograma/[id]/distribuicao-dias       # Atualizar distribuição
GET  /api/cronograma/[id]/estatisticas-semanas    # Estatísticas
POST /api/cronograma/[id]/export/xlsx             # Exportar Excel
POST /api/cronograma/[id]/export/ics              # Exportar iCalendar
```

### Chat com IA
```
POST /api/chat                     # Enviar mensagem
GET  /api/conversations            # Listar conversas
GET  /api/conversations/[id]       # Obter conversa
PUT  /api/conversations/[id]       # Atualizar conversa
```

### Dashboard e Analytics
```
GET /api/dashboard/analytics       # Analytics geral
GET /api/dashboard/institution     # Analytics da instituição
GET /api/dashboard/professor       # Analytics do professor
GET /api/dashboard/performance     # Métricas de performance
```

## Autenticação

### Métodos Suportados

1. **JWT (Supabase Auth)** - Interface web
   ```
   Authorization: Bearer <jwt_token>
   ```

2. **API Key** - Integrações externas
   ```
   X-API-Key: sb_secret_...
   ```

### Tipos de Usuário

| Role | Acesso |
|------|--------|
| **Aluno** | Próprios dados, cronograma, chat |
| **Professor** | Dados de suas disciplinas, gestão de conteúdo |
| **Admin** | Gestão completa da empresa |
| **Superadmin** | Acesso total ao sistema |

## Configuração

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxx

# Redis (opcional, recomendado para produção)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# N8N (Chat com IA)
N8N_WEBHOOK_URL=https://xxx
```

### Instalação

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint
npm run typecheck     # Verificação de tipos
npm run check:colors  # Verificar tokens de cor semânticos
npm run check         # Lint + typecheck + colors + tests
npm test              # Testes Jest
```

## Estrutura de um Serviço

Cada serviço segue o padrão:

```
service-name/
├── service-name.types.ts       # Tipos e DTOs
├── service-name.service.ts     # Lógica de negócio
├── service-name.repository.ts  # Acesso a dados
├── errors.ts                   # Erros específicos
└── index.ts                    # Exportações
```

## Convenções

### Cores de Status

Use tokens semânticos em `app/globals.css`:

```css
/* Erro */
bg-status-error, text-status-error-text, border-status-error-border

/* Alerta */
bg-status-warning, text-status-warning-text, border-status-warning-border

/* Info */
bg-status-info, text-status-info-text, border-status-info-border

/* Sucesso */
bg-status-success, text-status-success-text, border-status-success-border
```

### Princípios

- **SOLID** - Separação de responsabilidades
- **KISS** - Simplicidade e clareza
- **YAGNI** - Apenas o necessário
- **API-First** - Backend independente do frontend
- **Multi-tenant** - Isolamento por empresa

## Documentação

- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/api/docs`
- **Documentação**: [docs/README.md](./docs/README.md)

## Funcionalidades

### Implementadas
- Multi-tenant com subdomínio/domínio customizado
- Autenticação JWT + API Keys
- CRUD completo de cursos, disciplinas, segmentos
- Gestão de turmas e vínculo professor-disciplina
- Matrículas e binding de alunos
- Geração de cronogramas inteligentes
- Chat com IA via N8N
- Sistema de atividades e flashcards
- Exportação de cronograma (Excel, iCalendar)
- Importação de alunos (CSV/Excel)
- Dashboards por role
- Customização de marca por tenant
- Cache distribuído (Redis)
- Row Level Security (RLS)
- Analytics e métricas

---

**Última atualização:** Janeiro 2025
