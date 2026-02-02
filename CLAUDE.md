# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aluminify is an open-source, white-label student portal platform for educational institutions. It provides modules for course management, scheduling, flashcards, study rooms, financial management, and analytics — all within a multi-tenant architecture.

**Stack:** Next.js 16 (App Router, Turbopack) | React 19 | TypeScript 5 (strict) | Tailwind CSS v4 | shadcn/ui (Radix UI) | Supabase (PostgreSQL + Auth + Storage) | TanStack Query v5

## Common Commands

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint (cached)
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript type checking
npm run test             # Run Jest tests
npm run test:watch       # Jest watch mode
npm run check            # Full check: lint + typecheck + color validation + tests
npm run check:ci         # CI mode (zero warnings tolerance)
npm run check:colors     # Validate design system color palette
```

Tests live in `tests/` with `*.test.ts` pattern. Run a single test with `npx jest tests/path/to/file.test.ts`.

## Architecture

### Multi-Tenant Routing

The `[tenant]` dynamic segment is the core routing primitive. All authenticated module pages live under `app/[tenant]/(modules)/`. Route groups organize concerns:

```
app/
├── (landing-page)/          # Public marketing site
├── [tenant]/
│   ├── (modules)/           # Protected modules (dashboard, curso, flashcards, etc.)
│   └── auth/                # Tenant-scoped auth flows
├── auth/                    # Global auth (non-tenant)
└── api/                     # RESTful API routes organized by domain
```

Tenant isolation is enforced through Supabase RLS policies. The `[tenant]` param resolves to an `empresa_id` via middleware.

### Path Aliases

Defined in `tsconfig.json`:

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `./*` (project root) |
| `@/components/*` | `app/shared/components/*` and `app/shared/components/ui/*` |
| `@/hooks/*` | `app/shared/hooks/*` |
| `@/lib/*` | `app/shared/library/*` and `app/shared/core/*` |
| `@/shared/*` | `app/shared/*` |
| `@/lib/database.types` | `app/shared/core/database.types` |

### Data Layer

Two Supabase client patterns:

- **`getDatabaseClient()`** — Service-role client. Bypasses RLS. Use for admin/server-only operations. Located in `app/shared/core/database/database.ts`.
- **`getDatabaseClientAsUser(token)`** — User-scoped client. Respects RLS policies. Use for user-facing queries.

Database types are auto-generated in `app/shared/core/database.types.ts` (do not edit manually).

### Authentication

Core auth functions in `app/shared/core/auth.ts`:

- `getAuthenticatedUser()` — React `cache()`-wrapped. Returns full user context with role, tenant, and impersonation status. Sessions cached in Redis (30 min TTL).
- `requireUser(roles?)` — Enforces authentication, optionally checks role. Redirects to login if unauthorized.
- `invalidateAuthSessionCache(userId)` — Call on logout, password change, or role change.

Roles (`RoleTipo`): `aluno` (student), `usuario` (general), `admin`, `superadmin`, `professor` (legacy). RBAC permissions are defined in `app/shared/core/roles.ts` via `hasPermission(permissions, resource, action)`.

### Module Structure Convention

Each feature module under `app/[tenant]/(modules)/` typically follows:

```
modulo/
├── (aluno)/        # Student-facing routes
├── (gestao)/       # Admin/management routes
├── components/     # Module-specific components
├── services/       # Business logic / API calls
├── types/          # Local types
└── page.tsx        # Entry point
```

### Shared Code

All shared code lives under `app/shared/`:

- `components/ui/` — shadcn/ui primitives (Radix-based)
- `core/` — Auth, database clients, env validation, tenant resolution, services (cache, rate-limit, OAuth)
- `core/env.ts` — Zod-validated environment variables
- `hooks/` — Custom React hooks
- `types/` — Shared entities, DTOs, enums
- `library/utils.ts` — Tailwind `cn()` utility

### API Routes

RESTful endpoints under `app/api/`, organized by domain: `curso/`, `agendamentos/`, `usuario/`, `empresa/`, `financeiro/`, `flashcards/`, `sala-de-estudos/`, `cronograma/`, `biblioteca/`, `dashboard/`, `ai-agents/`, `webhooks/`.

## Code Conventions

- File names in **kebab-case**, components in **PascalCase**
- Prefer **Server Components** by default; use `"use client"` only when needed
- Styling via **Tailwind utility classes** (not CSS modules)
- Forms use **React Hook Form + Zod** for validation
- Server state managed with **TanStack Query**
- Unused variables prefixed with `_` (ESLint rule)
- Primary language in code/UI: Portuguese (Brazilian)

## Environment Variables

Validated at runtime via Zod in `app/shared/core/env.ts`. Required:

- `SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` — Public client key
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` — Server-side key
- `OAUTH_ENCRYPTION_KEY` — 32+ char encryption key

See `.env.example` for full list.

## OpenSpec Change Management

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

Specs live in `openspec/specs/`, active proposals in `openspec/changes/`. Project conventions are in `openspec/project.md`. Skip proposals for bug fixes, typos, dependency updates, and config changes.
