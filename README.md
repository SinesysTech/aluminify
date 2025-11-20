# Área do Aluno - Backend API

Sistema de gerenciamento educacional com arquitetura API-First, modularizada e baseada em princípios SOLID, KISS e YAGNI.

## 🏗️ Arquitetura

### Estrutura do Projeto

```
backend/
├── services/          # Serviços modulares independentes
│   ├── discipline/   # Serviço de Disciplinas
│   ├── segment/       # Serviço de Segmentos
│   ├── course/        # Serviço de Cursos
│   ├── student/       # Serviço de Alunos
│   ├── teacher/       # Serviço de Professores
│   ├── enrollment/    # Serviço de Matrículas
│   ├── course-material/ # Serviço de Materiais
│   └── api-key/       # Serviço de API Keys
├── auth/              # Sistema de autenticação
├── clients/            # Clientes de banco de dados
└── swagger/            # Documentação Swagger

app/
└── api/                # Rotas Next.js API Routes
    ├── auth/           # Autenticação
    ├── api-key/        # Gerenciamento de API Keys
    ├── discipline/     # Disciplinas
    ├── segment/        # Segmentos
    ├── course/         # Cursos
    ├── student/        # Alunos
    ├── teacher/        # Professores
    ├── enrollment/     # Matrículas
    ├── course-material/ # Materiais
    └── docs/           # Documentação OpenAPI
```

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Supabase** - Banco de dados PostgreSQL
- **Swagger/OpenAPI** - Documentação de API

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase configurada
- Variáveis de ambiente configuradas

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
# Supabase Configuration
SUPABASE_URL=your-project-url
SUPABASE_SECRET_KEY=sb_secret_...  # Recomendado para backend
# ou
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Legacy
```

### Instalação

```bash
npm install
```

### Executar em Desenvolvimento

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação

### Swagger UI

Acesse a documentação interativa em:
- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/api/docs`

### Documentação Adicional

- [Sistema de Autenticação](./docs/authentication.md)
- [Documentação da API](./docs/API.md)
- [Schema do Banco de Dados](./docs/schema/schema.md)

## 🔐 Autenticação

O sistema suporta duas formas de autenticação:

1. **JWT** - Para interface de usuário (`Authorization: Bearer <token>`)
2. **API Key** - Para requisições diretas (`X-API-Key: <key>`)

Veja [docs/authentication.md](./docs/authentication.md) para mais detalhes.

## 👥 Tipos de Usuários

1. **Aluno** - Acesso limitado aos próprios dados
2. **Professor** - Pode criar e gerenciar recursos educacionais
3. **Superadmin** - Acesso total ao sistema

## 📦 Serviços Implementados

- ✅ Disciplinas
- ✅ Segmentos
- ✅ Cursos
- ✅ Alunos
- ✅ Professores
- ✅ Matrículas
- ✅ Materiais de Curso
- ✅ API Keys
- ✅ Autenticação

## 🗄️ Banco de Dados

O banco de dados está configurado no Supabase com:
- Tabelas criadas via migrations
- Row Level Security (RLS) configurado
- Triggers para auditoria (`created_by`, `updated_at`)
- Políticas de acesso por tipo de usuário

## 🧪 Testes

```bash
npm run lint
```

## 📝 Estrutura de um Serviço

Cada serviço segue o mesmo padrão:

```
service-name/
├── service-name.types.ts      # Tipos e DTOs
├── service-name.service.ts     # Lógica de negócio
├── service-name.repository.ts  # Interface e implementação
├── errors.ts                   # Erros específicos
└── index.ts                   # Exportações
```

## 🔄 Princípios Aplicados

- **SOLID** - Separação de responsabilidades, inversão de dependências
- **KISS** - Simplicidade e clareza
- **YAGNI** - Apenas o necessário, sem over-engineering
- **API-First** - Backend independente do frontend
- **Modularização** - Serviços independentes e reutilizáveis

## 📄 Licença

Este projeto é privado e proprietário.
