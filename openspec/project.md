# Project Context

## Purpose
**Aluminify** é uma plataforma open-source e white-label de portal do aluno para instituições educacionais. Oferece módulos para gestão de cursos, turmas, alunos, professores, agendamentos, flashcards com IA contextual, sala de estudos, cronograma, biblioteca de materiais, financeiro, foco (pomodoro), AI agents e analytics de desempenho — tudo dentro de uma arquitetura multi-tenant. Inclui também landing page pública e sistema de dashboard com métricas por papel (aluno, professor, instituição).

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime:** React 19.2.0
- **Linguagem:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 (PostCSS @tailwindcss/postcss)
- **Componentes UI:** shadcn/ui (Radix UI primitives)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State Management:** TanStack Query v5 (React Query)
- **Tabelas:** TanStack React Table v8
- **Forms:** React Hook Form + Zod
- **Temas:** next-themes (dark/light mode)
- **Animações:** Motion (framer-motion successor)
- **Gráficos:** Recharts
- **Rich Text:** TipTap v3
- **Calendário:** React Day Picker, date-fns v4
- **Drag & Drop:** @dnd-kit
- **Excel:** ExcelJS
- **PDF:** @react-pdf/renderer
- **AI:** Vercel AI SDK (@ai-sdk/openai), OpenAI SDK
- **Monitoramento:** Sentry (error tracking), React GA4 (analytics)

## Architecture

### Multi-Tenant Routing
O segmento dinâmico `[tenant]` é o primitivo de roteamento principal. Todas as páginas autenticadas ficam em `app/[tenant]/(modules)/`. Route groups organizam as responsabilidades:

```
app/
├── (landing-page)/          # Site público (marketing, pricing, docs, roadmap)
├── [tenant]/
│   ├── (modules)/           # Módulos protegidos (15 módulos ativos)
│   └── auth/                # Fluxos de auth com escopo de tenant
├── auth/                    # Auth global (sem tenant)
└── api/                     # Rotas RESTful organizadas por domínio (17 domínios, ~141 endpoints)
```

Isolamento de tenant é feito via RLS policies do Supabase. O param `[tenant]` resolve para `empresa_id` via middleware.

### Módulos Ativos (15)
| Módulo | Diretório | Descrição |
|--------|-----------|-----------|
| Dashboard | `dashboard/` | Analytics e métricas por papel |
| Cursos | `curso/` | Gestão de cursos, disciplinas, frentes, módulos |
| Agendamentos | `agendamentos/` | Sistema de horários, disponibilidade, bloqueios |
| Flashcards | `flashcards/` | Estudo com repetição espaçada e IA |
| Sala de Estudos | `sala-de-estudos/` | Ambiente de estudo colaborativo |
| Cronograma | `cronograma/` | Planejamento e timeline de estudos |
| Biblioteca | `biblioteca/` | Materiais e recursos educacionais |
| Financeiro | `financeiro/` | Transações, produtos, cupons, webhooks |
| Empresa | `empresa/` | Configurações da instituição |
| Usuários | `usuario/` | Gestão de usuários e papéis |
| Perfil | `perfil/` | Perfil do usuário |
| Settings | `settings/` | Configurações gerais |
| Foco | `foco/` | Timer pomodoro para estudos |
| AI Agents | `agente/` | Agentes de IA contextuais |

### Module Structure Convention
Cada módulo em `app/[tenant]/(modules)/` segue o padrão:

```
modulo/
├── (aluno)/        # Rotas do aluno
├── (gestao)/       # Rotas de gestão/admin
├── components/     # Componentes do módulo
├── services/       # Lógica de negócio / chamadas API
├── types/          # Tipos locais
└── page.tsx        # Entry point
```

### Data Layer
Dois padrões de cliente Supabase em `app/shared/core/database/`:

- **`getDatabaseClient()`** — Service-role. Bypassa RLS. Usar para operações admin/server-only.
- **`getDatabaseClientAsUser(token)`** — User-scoped. Respeita RLS. Usar para queries de usuário.
- **`getAuthenticatedClient(request)`** — Seleção automática baseada no tipo de auth (API key → service-role, JWT → user-scoped).

Tipos do banco são gerados automaticamente em `app/shared/core/database.types.ts` (não editar manualmente).

### Authentication
Funções core em `app/shared/core/auth.ts`:

- **`getAuthenticatedUser()`** — Wrapped com React `cache()`. Retorna contexto completo do usuário (papel, tenant, impersonação). Sessões cacheadas em Redis (30 min TTL).
- **`requireUser(options?)`** — Enforce autenticação, opcionalmente verifica papel/role. Redireciona para login se não autorizado.
- **`invalidateAuthSessionCache(userId)`** — Chamar em logout, troca de senha, ou mudança de papel.

### RBAC (Role-Based Access Control)
Definido em `app/shared/core/roles.ts` e `app/shared/types/entities/papel.ts`:

**Papéis base (AppUserRole):** `aluno`, `usuario`
**Tipos de papel (RoleTipo):** `professor`, `professor_admin`, `staff`, `admin`, `monitor`

**Permissões granulares (RolePermissions):** Cada recurso pode ter `view`, `create`, `edit`, `delete`:
- Recursos: `dashboard`, `cursos`, `disciplinas`, `alunos`, `usuarios`, `agendamentos`, `flashcards`, `materiais`, `configuracoes`, `branding`, `relatorios`

**Helpers:**
- `hasPermission(permissions, resource, action)` — Verifica permissão específica
- `isTeachingRoleTipo(tipo)` — professor, professor_admin, monitor
- `isAdminRoleTipo(tipo)` — admin, professor_admin
- `canImpersonate(role, roleType?)` — Apenas admin types

### Cache Layer
Redis (Upstash) para caching em `app/shared/core/services/cache/`:
- `cache.service.ts` — Wrapper Redis genérico
- `activity-cache.service.ts` — Cache de atividades
- `course-structure-cache.service.ts` — Cache de estrutura de cursos
- `user-profile-cache.service.ts` — Cache de perfis
- `cache-monitor.service.ts` — Monitoramento de cache

### Shared Code
Todo código compartilhado em `app/shared/`:

- `components/ui/` — ~59 componentes shadcn/ui (Radix-based) + custom
- `components/providers/` — 5 context providers (user, theme, permissions, module-visibility, student-organizations)
- `core/` — Auth, database, env, tenant, RBAC, services (cache, rate-limit, OAuth, API keys)
- `hooks/` — 8 hooks custom (breakpoint, mobile, module-visibility, study-timer, swipe, tenant-branding, toast, plantao-quota)
- `types/` — Entidades, DTOs, enums
- `library/` — utils.ts (cn()), api-client.ts, br.ts (CPF, telefone), slugify, download-file

### API Routes
Endpoints RESTful em `app/api/`, organizados por domínio (~17 domínios, ~141 endpoints):
`auth/`, `curso/`, `agendamentos/`, `usuario/`, `empresa/`, `financeiro/`, `flashcards/`, `sala-de-estudos/`, `cronograma/`, `biblioteca/`, `dashboard/`, `ai-agents/`, `aluno/`, `cache/`, `webhooks/`, `health/`, `docs/` (Swagger)

### Path Aliases (tsconfig.json)
| Alias | Resolve para |
|-------|-------------|
| `@/*` | `./` (raiz do projeto) |
| `@/components/*` | `app/shared/components/*` e `app/shared/components/ui/*` |
| `@/components/shared/*` | `app/shared/components/ui/*` |
| `@/hooks/*` | `app/shared/hooks/*` |
| `@/lib/*` | `app/shared/library/*` e `app/shared/core/*` |
| `@/shared/*` | `app/shared/*` |
| `@/lib/database.types` | `app/shared/core/database.types` |

## Project Conventions

### Code Style
- ESLint para linting (cached)
- Nomes de arquivos em **kebab-case**
- Componentes em **PascalCase**
- CSS via **Tailwind utility classes** (não CSS modules)
- Variáveis não utilizadas prefixadas com `_` (regra ESLint)
- Idioma primário em código/UI: **Português (Brasileiro)**
- Preferência por **Server Components**; `"use client"` apenas quando necessário

### Testing Strategy
- Jest para unit tests
- Fast-check para property-based testing
- Testes em `tests/` com padrão `*.test.ts`
- Rodar teste individual: `npx jest tests/path/to/file.test.ts`

### Git Workflow
- Branch principal: `main`
- Feature branches para desenvolvimento
- Commits com Co-Authored-By para contribuições de IA

## Domain Context
- **Tenants:** Suporte multi-tenant (instituições educacionais diferentes), isolamento via `empresa_id` + RLS
- **Papéis base:** `aluno` (estudante), `usuario` (staff/admin)
- **Tipos de papel:** `professor`, `professor_admin`, `staff`, `admin`, `monitor`
- **Turmas:** Classes/grupos de alunos vinculados a cursos
- **Cursos:** Programas educacionais com estrutura hierárquica (Curso → Disciplina → Frente → Módulo)
- **Agendamentos:** Sistema de horários, disponibilidade, recorrência e bloqueios
- **Flashcards:** Estudo com repetição espaçada e feedback de IA
- **Financeiro:** Transações, produtos, cupons, integração Hotmart
- **Dashboard:** Analytics por papel (aluno, professor, instituição)

## Important Constraints
- Node.js >=20 <25
- Supabase como backend principal (PostgreSQL, Auth, Storage, RLS)
- Mobile-first design implementado (~93% cobertura)
- Idioma da UI: Português (Brasileiro)

## External Dependencies
- **Supabase:** Auth, Database, Storage, Realtime
- **Upstash Redis:** Caching e rate limiting
- **AWS S3:** Storage alternativo
- **Vercel AI SDK + OpenAI:** Integração com LLMs (AI agents, flashcards)
- **Sentry:** Error tracking e monitoramento
- **Google Analytics (GA4):** Analytics de uso
- **Google Calendar / Zoom:** Integração em agendamentos (via OAuth)
- **Hotmart:** Webhook de pagamentos (módulo financeiro)
