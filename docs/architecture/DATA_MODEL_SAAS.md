# Aluminify - Modelagem de Dados SaaS Multi-Tenant

> Documento gerado a partir da base de dados Supabase (produção) e do código-fonte.
> Data: 2026-01-29

---

## Sumario

1. [Visao Geral da Arquitetura](#1-visao-geral-da-arquitetura)
2. [Tenant (Empresa)](#2-tenant-empresa)
3. [Modelo de Usuarios e Papeis](#3-modelo-de-usuarios-e-papeis)
4. [Hierarquia Academica](#4-hierarquia-academica)
5. [Matriculas e Turmas](#5-matriculas-e-turmas)
6. [Progresso do Aluno](#6-progresso-do-aluno)
7. [Agendamentos](#7-agendamentos)
8. [Branding e Personalizacao](#8-branding-e-personalizacao)
9. [Comercial (Produtos, Pagamentos, Cupons)](#9-comercial-produtos-pagamentos-cupons)
10. [Chat e IA](#10-chat-e-ia)
11. [Enums do Sistema](#11-enums-do-sistema)
12. [Mapa Completo de Tabelas](#12-mapa-completo-de-tabelas)
13. [Row Level Security (RLS)](#13-row-level-security-rls)
14. [Autenticacao e Autorizacao](#14-autenticacao-e-autorizacao)
15. [Resolucao de Tenant](#15-resolucao-de-tenant)
16. [Diagrama de Relacionamentos](#16-diagrama-de-relacionamentos)

---

## 1. Visao Geral da Arquitetura

O Aluminify e uma plataforma SaaS educacional (cursinhos preparatorios) com arquitetura **multi-tenant por banco de dados compartilhado** (_shared database, shared schema_). Cada empresa (cursinho) e um **tenant** isolado por meio da coluna `empresa_id` presente em praticamente todas as tabelas.

### Principios de Isolamento

| Estrategia              | Implementacao                                                |
| ----------------------- | ------------------------------------------------------------ |
| **Isolamento de dados** | Coluna `empresa_id` (FK para `empresas`) em todas as tabelas |
| **Enforcement no DB**   | Row Level Security (RLS) do PostgreSQL                       |
| **Enforcement no app**  | Middleware de tenant + contexto de autenticacao              |
| **Roteamento**          | Subdominio, dominio customizado ou slug na URL               |

### Numeros

- **55 tabelas** no schema `public`
- **100+ foreign keys** entre tabelas
- **16 enums** personalizados
- **3 planos** de assinatura (basico, profissional, enterprise)
- **5 tipos de papel** (professor, professor_admin, staff, admin, monitor)

---

## 2. Tenant (Empresa)

A tabela `empresas` e a **entidade raiz** de todo o modelo multi-tenant. Cada registro representa um cursinho/instituicao.

### Tabela: `empresas` (14 colunas)

| Coluna                | Tipo               | Nullable | Default             | Descricao                                |
| --------------------- | ------------------ | -------- | ------------------- | ---------------------------------------- |
| `id`                  | uuid               | NO       | `gen_random_uuid()` | PK - Identificador unico                 |
| `nome`                | text               | NO       | -                   | Nome da instituicao                      |
| `slug`                | text (UNIQUE)      | NO       | -                   | Identificador URL-friendly               |
| `cnpj`                | text (UNIQUE)      | YES      | -                   | CNPJ da empresa                          |
| `email_contato`       | text               | YES      | -                   | Email de contato                         |
| `telefone`            | text               | YES      | -                   | Telefone                                 |
| `logo_url`            | text               | YES      | -                   | URL do logo principal                    |
| `plano`               | enum_plano_empresa | NO       | `'basico'`          | Plano de assinatura                      |
| `ativo`               | boolean            | NO       | `true`              | Se a empresa esta ativa                  |
| `configuracoes`       | jsonb              | YES      | `'{}'`              | Configuracoes customizaveis (JSON livre) |
| `dominio_customizado` | text               | YES      | -                   | Dominio proprio (ex: escola.com.br)      |
| `subdomain`           | text               | YES      | -                   | Subdominio (ex: escola.aluminify.com.br) |
| `created_at`          | timestamptz        | NO       | `now()`             | Data de criacao                          |
| `updated_at`          | timestamptz        | NO       | `now()`             | Data de atualizacao                      |

**Indices**: `slug`, `cnpj` (parcial), `ativo`

**Codigo-fonte**: [20251217105924_create_empresas_table.sql](supabase/migrations/20251217105924_create_empresas_table.sql)

### Planos de Assinatura

```
enum_plano_empresa: 'basico' | 'profissional' | 'enterprise'
```

O plano esta armazenado na tabela `empresas`, porem **nao existe ainda logica de limitacao de features por plano**. O campo `configuracoes` (JSONB) e extensivel para guardar configuracoes especificas por plano.

---

## 3. Modelo de Usuarios e Papeis

O sistema possui **3 niveis de usuario** na aplicacao e **5 tipos de papel** para staff.

### 3.1 Tipos de Usuario (AppUserRole)

Definido em [user.ts](app/shared/types/entities/user.ts):

```
AppUserRole = 'aluno' | 'usuario' | 'professor' | 'empresa'
```

| Role        | Descricao                                     | Vinculo ao Tenant                         |
| ----------- | --------------------------------------------- | ----------------------------------------- |
| `aluno`     | Estudante                                     | Via `alunos.empresa_id` + `alunos_cursos` |
| `usuario`   | Staff da instituicao (professor, admin, etc.) | Via `usuarios.empresa_id`                 |
| `professor` | (legado, normalizado para `usuario`)          | Via `professores.empresa_id`              |
| `empresa`   | (legado, normalizado para `usuario`)          | Via contexto                              |

> **Nota**: O role `superadmin` foi removido em 2026-01-29. A gestao cross-tenant sera feita por um app admin separado. O service role key do Supabase ja faz bypass de RLS para operacoes server-side.

### 3.2 Tabela: `alunos` (25 colunas)

| Coluna                 | Tipo               | Nullable | Descricao                           |
| ---------------------- | ------------------ | -------- | ----------------------------------- |
| `id`                   | uuid               | NO       | PK (= `auth.users.id`)              |
| `empresa_id`           | uuid (FK empresas) | NO       | Tenant do aluno                     |
| `nome_completo`        | text               | YES      | Nome completo                       |
| `email`                | text               | NO       | Email (unico)                       |
| `cpf`                  | text               | YES      | CPF                                 |
| `telefone`             | text               | YES      | Telefone                            |
| `data_nascimento`      | date               | YES      | Data de nascimento                  |
| `endereco`             | text               | YES      | Endereco                            |
| `cep`                  | text               | YES      | CEP                                 |
| `cidade`               | text               | YES      | Cidade                              |
| `estado`               | text               | YES      | Estado (UF)                         |
| `bairro`               | text               | YES      | Bairro                              |
| `pais`                 | text               | YES      | Pais (default: 'Brasil')            |
| `numero_endereco`      | text               | YES      | Numero                              |
| `complemento`          | text               | YES      | Complemento                         |
| `numero_matricula`     | text               | YES      | Numero de matricula                 |
| `instagram`            | text               | YES      | Instagram                           |
| `twitter`              | text               | YES      | Twitter/X                           |
| `hotmart_id`           | text               | YES      | ID Hotmart (integracao)             |
| `origem_cadastro`      | text               | YES      | Origem (default: 'manual')          |
| `must_change_password` | boolean            | NO       | Deve trocar senha no primeiro login |
| `senha_temporaria`     | text               | YES      | Senha temporaria (provisioning)     |
| `deleted_at`           | timestamptz        | YES      | Soft delete                         |
| `created_at`           | timestamptz        | NO       | Data de criacao                     |
| `updated_at`           | timestamptz        | NO       | Data de atualizacao                 |

**Codigo-fonte do tipo**: [user.ts:42-69](app/shared/types/entities/user.ts#L42-L69)

### 3.3 Tabela: `professores` (13 colunas)

| Coluna          | Tipo               | Nullable | Descricao                   |
| --------------- | ------------------ | -------- | --------------------------- |
| `id`            | uuid               | NO       | PK (= `auth.users.id`)      |
| `empresa_id`    | uuid (FK empresas) | NO       | Tenant                      |
| `nome_completo` | text               | NO       | Nome completo               |
| `email`         | text               | NO       | Email                       |
| `cpf`           | text               | YES      | CPF                         |
| `telefone`      | text               | YES      | Telefone                    |
| `biografia`     | text               | YES      | Biografia                   |
| `foto_url`      | text               | YES      | Foto de perfil              |
| `especialidade` | text               | YES      | Area de especialidade       |
| `chave_pix`     | text               | YES      | Chave PIX                   |
| `is_admin`      | boolean            | NO       | Se e administrador (legado) |
| `created_at`    | timestamptz        | NO       | Data de criacao             |
| `updated_at`    | timestamptz        | NO       | Data de atualizacao         |

**Codigo-fonte do tipo**: [user.ts:122-136](app/shared/types/entities/user.ts#L122-L136)

### 3.4 Tabela: `usuarios` (15 colunas) - Staff Moderno

| Coluna          | Tipo               | Nullable | Descricao                     |
| --------------- | ------------------ | -------- | ----------------------------- |
| `id`            | uuid               | NO       | PK (= `auth.users.id`)        |
| `empresa_id`    | uuid (FK empresas) | NO       | Tenant                        |
| `papel_id`      | uuid (FK papeis)   | NO       | Papel/role atribuido          |
| `nome_completo` | text               | NO       | Nome completo                 |
| `email`         | text               | NO       | Email                         |
| `cpf`           | text               | YES      | CPF                           |
| `telefone`      | text               | YES      | Telefone                      |
| `chave_pix`     | text               | YES      | Chave PIX                     |
| `foto_url`      | text               | YES      | Foto de perfil                |
| `biografia`     | text               | YES      | Biografia                     |
| `especialidade` | text               | YES      | Especialidade                 |
| `ativo`         | boolean            | NO       | Se esta ativo (default: true) |
| `deleted_at`    | timestamptz        | YES      | Soft delete                   |
| `created_at`    | timestamptz        | NO       | Data de criacao               |
| `updated_at`    | timestamptz        | NO       | Data de atualizacao           |

### 3.5 Tabela: `papeis` (9 colunas) - Roles RBAC

| Coluna       | Tipo               | Nullable | Descricao                                               |
| ------------ | ------------------ | -------- | ------------------------------------------------------- |
| `id`         | uuid               | NO       | PK                                                      |
| `empresa_id` | uuid (FK empresas) | YES      | NULL = papel template do sistema                        |
| `nome`       | text               | NO       | Nome do papel (ex: "Professor")                         |
| `tipo`       | text               | NO       | Tipo: professor, professor_admin, staff, admin, monitor |
| `descricao`  | text               | YES      | Descricao                                               |
| `permissoes` | jsonb              | NO       | Permissoes granulares (ver abaixo)                      |
| `is_system`  | boolean            | NO       | Se e papel do sistema (nao editavel)                    |
| `created_at` | timestamptz        | NO       | Data de criacao                                         |
| `updated_at` | timestamptz        | NO       | Data de atualizacao                                     |

**Codigo-fonte do tipo**: [papel.ts](app/shared/types/entities/papel.ts)

### 3.6 Permissoes Granulares (RBAC)

Cada papel tem um JSON de permissoes com a estrutura:

```typescript
interface RolePermissions {
  dashboard: { view: boolean };
  cursos: { view; create; edit; delete };
  disciplinas: { view; create; edit; delete };
  alunos: { view; create; edit; delete };
  usuarios: { view; create; edit; delete };
  agendamentos: { view; create; edit; delete };
  flashcards: { view; create; edit; delete };
  materiais: { view; create; edit; delete };
  configuracoes: { view; edit };
  branding: { view; edit };
  relatorios: { view };
}
```

### 3.7 Permissoes Padrao por Tipo de Papel

| Recurso           | professor | professor_admin | staff | admin | monitor |
| ----------------- | --------- | --------------- | ----- | ----- | ------- |
| dashboard.view    | Y         | Y               | Y     | Y     | Y       |
| cursos.CRUD       | R---      | CRUD            | R---  | CRUD  | R---    |
| disciplinas.CRUD  | R---      | CRUD            | R---  | CRUD  | R---    |
| alunos.CRUD       | R---      | CRUD            | RCU-  | CRUD  | R---    |
| usuarios.CRUD     | ----      | CRUD            | R---  | CRUD  | ----    |
| agendamentos.CRUD | CRUD      | CRUD            | RCU-  | CRUD  | RCU-    |
| flashcards.CRUD   | CRUD      | CRUD            | R---  | CRUD  | R---    |
| materiais.CRUD    | CRUD      | CRUD            | R---  | CRUD  | R---    |
| configuracoes     | ----      | RU              | ----  | RU    | ----    |
| branding          | ----      | RU              | ----  | RU    | ----    |
| relatorios.view   | ----      | Y               | Y     | Y     | ----    |

_Legenda: R=Read, C=Create, U=Update, D=Delete, -=sem acesso_

**Codigo-fonte**: [papel.ts:79-145](app/shared/types/entities/papel.ts#L79-L145)

### 3.8 Tabela: `empresa_admins` (5 colunas) - Vinculo Admin-Empresa

| Coluna       | Tipo                 | Nullable | Descricao             |
| ------------ | -------------------- | -------- | --------------------- |
| `empresa_id` | uuid (FK empresas)   | NO       | PK composta           |
| `user_id`    | uuid (FK auth.users) | NO       | PK composta           |
| `is_owner`   | boolean              | NO       | Se e dono da empresa  |
| `permissoes` | jsonb                | YES      | Permissoes adicionais |
| `created_at` | timestamptz          | NO       | Data de criacao       |

**Codigo-fonte**: [20251217105926_create_empresa_admins.sql](supabase/migrations/20251217105926_create_empresa_admins.sql)

---

## 4. Hierarquia Academica

A estrutura de conteudo segue uma hierarquia rigida dentro de cada tenant:

```
EMPRESA
 └── SEGMENTO (ex: Medicina, Direito)
      └── CURSO (ex: Extensivo Medicina 2026)
           └── DISCIPLINA (ex: Biologia)    [via cursos_disciplinas N:N]
                └── FRENTE (ex: Zoologia)
                     └── MODULO (ex: Modulo 1 - Invertebrados)
                          ├── AULA (ex: Aula 1 - Poriferos)
                          ├── ATIVIDADE (ex: Lista Nivel 1)
                          └── FLASHCARD (ex: Pergunta/Resposta)
```

### 4.1 Tabela: `segmentos` (7 colunas)

| Coluna       | Tipo        | Nullable | Descricao        |
| ------------ | ----------- | -------- | ---------------- |
| `id`         | uuid        | NO       | PK               |
| `empresa_id` | uuid (FK)   | NO       | Tenant           |
| `nome`       | text        | NO       | Nome do segmento |
| `slug`       | text        | YES      | Slug             |
| `created_by` | uuid        | YES      | Criador          |
| `created_at` | timestamptz | NO       | -                |
| `updated_at` | timestamptz | NO       | -                |

### 4.2 Tabela: `cursos` (18 colunas)

| Coluna             | Tipo                  | Nullable | Descricao                      |
| ------------------ | --------------------- | -------- | ------------------------------ |
| `id`               | uuid                  | NO       | PK                             |
| `empresa_id`       | uuid (FK)             | NO       | Tenant                         |
| `segmento_id`      | uuid (FK segmentos)   | YES      | Segmento do curso              |
| `disciplina_id`    | uuid (FK disciplinas) | YES      | Disciplina principal (legado)  |
| `nome`             | text                  | NO       | Nome do curso                  |
| `modalidade`       | enum_modalidade       | NO       | EAD ou LIVE                    |
| `tipo`             | enum_tipo_curso       | NO       | Extensivo, Intensivo, etc.     |
| `descricao`        | text                  | YES      | Descricao                      |
| `ano_vigencia`     | integer               | NO       | Ano de vigencia                |
| `data_inicio`      | date                  | YES      | Data de inicio                 |
| `data_termino`     | date                  | YES      | Data de termino                |
| `meses_acesso`     | integer               | YES      | Meses de acesso                |
| `planejamento_url` | text                  | YES      | URL do planejamento            |
| `imagem_capa_url`  | text                  | YES      | Imagem de capa                 |
| `usa_turmas`       | boolean               | NO       | Se usa turmas (default: false) |
| `created_by`       | uuid                  | YES      | Criador                        |
| `created_at`       | timestamptz           | NO       | -                              |
| `updated_at`       | timestamptz           | NO       | -                              |

### 4.3 Tabela: `cursos_disciplinas` (3 colunas) - Junction N:N

| Coluna          | Tipo                  | Descricao  |
| --------------- | --------------------- | ---------- |
| `curso_id`      | uuid (FK cursos)      | Curso      |
| `disciplina_id` | uuid (FK disciplinas) | Disciplina |
| `created_at`    | timestamptz           | -          |

### 4.4 Tabela: `disciplinas` (6 colunas)

| Coluna       | Tipo        | Nullable | Descricao           |
| ------------ | ----------- | -------- | ------------------- |
| `id`         | uuid        | NO       | PK                  |
| `empresa_id` | uuid (FK)   | NO       | Tenant              |
| `nome`       | text        | NO       | Nome (ex: Biologia) |
| `created_by` | uuid        | YES      | Criador             |
| `created_at` | timestamptz | NO       | -                   |
| `updated_at` | timestamptz | NO       | -                   |

### 4.5 Tabela: `frentes` (7 colunas)

| Coluna          | Tipo                  | Nullable | Descricao              |
| --------------- | --------------------- | -------- | ---------------------- |
| `id`            | uuid                  | NO       | PK                     |
| `empresa_id`    | uuid (FK)             | NO       | Tenant                 |
| `disciplina_id` | uuid (FK disciplinas) | YES      | Disciplina             |
| `curso_id`      | uuid (FK cursos)      | YES      | Curso (binding direto) |
| `nome`          | text                  | NO       | Nome (ex: Zoologia)    |
| `created_by`    | uuid                  | YES      | Criador                |
| `created_at`    | timestamptz           | YES      | -                      |

### 4.6 Tabela: `modulos` (8 colunas)

| Coluna          | Tipo                    | Nullable | Descricao                |
| --------------- | ----------------------- | -------- | ------------------------ |
| `id`            | uuid                    | NO       | PK                       |
| `empresa_id`    | uuid (FK)               | NO       | Tenant                   |
| `frente_id`     | uuid (FK frentes)       | YES      | Frente                   |
| `curso_id`      | uuid (FK cursos)        | YES      | Curso                    |
| `nome`          | text                    | NO       | Nome do modulo           |
| `numero_modulo` | integer                 | YES      | Numero sequencial        |
| `importancia`   | enum_importancia_modulo | YES      | Alta, Media, Baixa, Base |
| `created_at`    | timestamptz             | YES      | -                        |

### 4.7 Tabela: `aulas` (11 colunas)

| Coluna                    | Tipo              | Nullable | Descricao                   |
| ------------------------- | ----------------- | -------- | --------------------------- |
| `id`                      | uuid              | NO       | PK                          |
| `empresa_id`              | uuid (FK)         | NO       | Tenant                      |
| `modulo_id`               | uuid (FK modulos) | YES      | Modulo                      |
| `curso_id`                | uuid (FK cursos)  | YES      | Curso                       |
| `nome`                    | text              | NO       | Nome da aula                |
| `numero_aula`             | integer           | YES      | Numero sequencial           |
| `tempo_estimado_minutos`  | integer           | YES      | Duracao estimada (minutos)  |
| `tempo_estimado_interval` | interval          | YES      | Duracao estimada (interval) |
| `prioridade`              | integer           | YES      | Prioridade para cronograma  |
| `video_url`               | text              | YES      | URL do video                |
| `created_at`              | timestamptz       | YES      | -                           |

### 4.8 Tabela: `atividades` (13 colunas)

| Coluna           | Tipo                | Nullable | Descricao                              |
| ---------------- | ------------------- | -------- | -------------------------------------- |
| `id`             | uuid                | NO       | PK                                     |
| `empresa_id`     | uuid (FK)           | NO       | Tenant                                 |
| `modulo_id`      | uuid (FK modulos)   | YES      | Modulo                                 |
| `tipo`           | enum_tipo_atividade | NO       | Nivel_1..4, Simulado, Flashcards, etc. |
| `titulo`         | text                | NO       | Titulo                                 |
| `arquivo_url`    | text                | YES      | URL do arquivo (PDF, etc.)             |
| `gabarito_url`   | text                | YES      | URL do gabarito                        |
| `link_externo`   | text                | YES      | Link externo                           |
| `obrigatorio`    | boolean             | YES      | Se e obrigatoria (default: true)       |
| `ordem_exibicao` | integer             | YES      | Ordem de exibicao                      |
| `created_by`     | uuid                | YES      | Criador                                |
| `created_at`     | timestamptz         | YES      | -                                      |
| `updated_at`     | timestamptz         | YES      | -                                      |

### 4.9 Tabela: `flashcards` (8 colunas)

| Coluna                 | Tipo              | Nullable | Descricao          |
| ---------------------- | ----------------- | -------- | ------------------ |
| `id`                   | uuid              | NO       | PK                 |
| `empresa_id`           | uuid (FK)         | NO       | Tenant             |
| `modulo_id`            | uuid (FK modulos) | YES      | Modulo             |
| `pergunta`             | text              | NO       | Pergunta           |
| `resposta`             | text              | NO       | Resposta           |
| `pergunta_imagem_path` | text              | YES      | Imagem da pergunta |
| `resposta_imagem_path` | text              | YES      | Imagem da resposta |
| `created_at`           | timestamptz       | YES      | -                  |

### 4.10 Tabela: `materiais_curso` (11 colunas)

| Coluna               | Tipo               | Nullable | Descricao                     |
| -------------------- | ------------------ | -------- | ----------------------------- |
| `id`                 | uuid               | NO       | PK                            |
| `empresa_id`         | uuid (FK)          | NO       | Tenant                        |
| `curso_id`           | uuid (FK cursos)   | YES      | Curso                         |
| `titulo`             | text               | NO       | Titulo do material            |
| `descricao_opcional` | text               | YES      | Descricao                     |
| `tipo`               | enum_tipo_material | NO       | Apostila, Lista, Resumo, etc. |
| `arquivo_url`        | text               | NO       | URL do arquivo                |
| `ordem`              | integer            | NO       | Ordem de exibicao             |
| `created_by`         | uuid               | YES      | Criador                       |
| `created_at`         | timestamptz        | NO       | -                             |
| `updated_at`         | timestamptz        | NO       | -                             |

### 4.11 Tabela: `regras_atividades` (12 colunas)

| Coluna                                                      | Tipo             | Nullable | Descricao |
| ----------------------------------------------------------- | ---------------- | -------- | --------- |
| `id`                                                        | uuid             | NO       | PK        |
| `empresa_id`                                                | uuid (FK)        | NO       | Tenant    |
| `curso_id`                                                  | uuid (FK cursos) | YES      | Curso     |
| _(+ colunas de regras de geracao automatica de atividades)_ |                  |          |           |

### 4.12 Vinculo Professor-Disciplina

**`professores_disciplinas`** (11 colunas) - Vincula professor a disciplina/frente/modulo/turma:

| Coluna          | Tipo                  | Descricao  |
| --------------- | --------------------- | ---------- |
| `professor_id`  | uuid (FK professores) | Professor  |
| `disciplina_id` | uuid (FK disciplinas) | Disciplina |
| `curso_id`      | uuid (FK cursos)      | Curso      |
| `frente_id`     | uuid (FK frentes)     | Frente     |
| `modulo_id`     | uuid (FK modulos)     | Modulo     |
| `turma_id`      | uuid (FK turmas)      | Turma      |
| `empresa_id`    | uuid (FK empresas)    | Tenant     |

**`usuarios_disciplinas`** (11 colunas) - Mesma estrutura para o modelo moderno de `usuarios`.

---

## 5. Matriculas e Turmas

### 5.1 Tabela: `alunos_cursos` (3 colunas) - Junction Aluno-Curso

| Coluna       | Tipo             | Descricao       |
| ------------ | ---------------- | --------------- |
| `aluno_id`   | uuid (FK alunos) | Aluno           |
| `curso_id`   | uuid (FK cursos) | Curso           |
| `created_at` | timestamptz      | Data de vinculo |

Esta e a **tabela principal de enrollment**. Determina quais cursos (e, consequentemente, qual empresa) o aluno pode acessar.

### 5.2 Tabela: `matriculas` (10 colunas) - Controle de Acesso Temporal

| Coluna               | Tipo             | Nullable | Descricao         |
| -------------------- | ---------------- | -------- | ----------------- |
| `id`                 | uuid             | NO       | PK                |
| `empresa_id`         | uuid (FK)        | YES      | Tenant            |
| `aluno_id`           | uuid (FK alunos) | YES      | Aluno             |
| `curso_id`           | uuid (FK cursos) | YES      | Curso             |
| `data_matricula`     | timestamptz      | NO       | Data da matricula |
| `data_inicio_acesso` | date             | NO       | Inicio do acesso  |
| `data_fim_acesso`    | date             | NO       | Fim do acesso     |
| `ativo`              | boolean          | NO       | Se esta ativa     |
| `created_at`         | timestamptz      | NO       | -                 |
| `updated_at`         | timestamptz      | NO       | -                 |

### 5.3 Tabela: `turmas` (11 colunas)

| Coluna                | Tipo             | Nullable | Descricao                        |
| --------------------- | ---------------- | -------- | -------------------------------- |
| `id`                  | uuid             | NO       | PK                               |
| `empresa_id`          | uuid (FK)        | NO       | Tenant                           |
| `curso_id`            | uuid (FK cursos) | NO       | Curso                            |
| `nome`                | text             | NO       | Nome da turma                    |
| `data_inicio`         | date             | YES      | Inicio                           |
| `data_fim`            | date             | YES      | Fim                              |
| `acesso_apos_termino` | boolean          | YES      | Acesso apos fim (default: false) |
| `dias_acesso_extra`   | integer          | YES      | Dias extras de acesso            |
| `ativo`               | boolean          | YES      | Se esta ativa                    |
| `created_at`          | timestamptz      | YES      | -                                |
| `updated_at`          | timestamptz      | YES      | -                                |

### 5.4 Tabela: `alunos_turmas` (6 colunas) - Junction Aluno-Turma

| Coluna                         | Tipo             | Descricao |
| ------------------------------ | ---------------- | --------- |
| `aluno_id`                     | uuid (FK alunos) | Aluno     |
| `turma_id`                     | uuid (FK turmas) | Turma     |
| _(+ status, datas de vinculo)_ |                  |           |

---

## 6. Progresso do Aluno

### 6.1 Tabela: `progresso_atividades` (13 colunas)

| Coluna                  | Tipo                       | Nullable | Descricao                     |
| ----------------------- | -------------------------- | -------- | ----------------------------- |
| `id`                    | uuid                       | NO       | PK                            |
| `empresa_id`            | uuid (FK)                  | YES      | Tenant                        |
| `aluno_id`              | uuid (FK alunos)           | YES      | Aluno                         |
| `atividade_id`          | uuid (FK atividades)       | YES      | Atividade                     |
| `status`                | enum_status_atividade      | YES      | Pendente, Iniciado, Concluido |
| `data_inicio`           | timestamptz                | YES      | Inicio                        |
| `data_conclusao`        | timestamptz                | YES      | Conclusao                     |
| `questoes_totais`       | integer                    | YES      | Total de questoes             |
| `questoes_acertos`      | integer                    | YES      | Acertos                       |
| `dificuldade_percebida` | enum_dificuldade_percebida | YES      | Muito Facil..Muito Dificil    |
| `anotacoes_pessoais`    | text                       | YES      | Anotacoes do aluno            |
| `created_at`            | timestamptz                | YES      | -                             |
| `updated_at`            | timestamptz                | YES      | -                             |

### 6.2 Tabela: `progresso_flashcards` (11 colunas) - Repeticao Espacada

| Coluna                 | Tipo                 | Nullable | Descricao                          |
| ---------------------- | -------------------- | -------- | ---------------------------------- |
| `id`                   | uuid                 | NO       | PK                                 |
| `empresa_id`           | uuid (FK)            | NO       | Tenant                             |
| `aluno_id`             | uuid (FK alunos)     | YES      | Aluno                              |
| `flashcard_id`         | uuid (FK flashcards) | YES      | Flashcard                          |
| `nivel_facilidade`     | float8               | YES      | Fator de facilidade (default: 2.5) |
| `dias_intervalo`       | integer              | YES      | Intervalo em dias                  |
| `data_proxima_revisao` | timestamptz          | YES      | Proxima revisao                    |
| `numero_revisoes`      | integer              | YES      | Total de revisoes                  |
| `ultimo_feedback`      | integer              | YES      | Ultimo feedback (1-5)              |
| `created_at`           | timestamptz          | YES      | -                                  |
| `updated_at`           | timestamptz          | YES      | -                                  |

### 6.3 Tabela: `aulas_concluidas` (6 colunas)

| Coluna       | Tipo               | Descricao      |
| ------------ | ------------------ | -------------- |
| `aluno_id`   | uuid (FK alunos)   | Aluno          |
| `aula_id`    | uuid (FK aulas)    | Aula concluida |
| `curso_id`   | uuid (FK cursos)   | Curso          |
| `empresa_id` | uuid (FK empresas) | Tenant         |

### 6.4 Tabela: `sessoes_estudo` (16 colunas) - Focus Mode

| Coluna                         | Tipo                  | Nullable | Descricao                  |
| ------------------------------ | --------------------- | -------- | -------------------------- |
| `id`                           | uuid                  | NO       | PK                         |
| `empresa_id`                   | uuid (FK)             | YES      | Tenant                     |
| `aluno_id`                     | uuid (FK alunos)      | YES      | Aluno                      |
| `disciplina_id`                | uuid (FK disciplinas) | YES      | Disciplina                 |
| `frente_id`                    | uuid (FK frentes)     | YES      | Frente                     |
| `atividade_relacionada_id`     | uuid (FK atividades)  | YES      | Atividade relacionada      |
| `inicio`                       | timestamptz           | YES      | Inicio da sessao           |
| `fim`                          | timestamptz           | YES      | Fim da sessao              |
| `tempo_total_bruto_segundos`   | integer               | YES      | Tempo bruto                |
| `tempo_total_liquido_segundos` | integer               | YES      | Tempo liquido (sem pausas) |
| `log_pausas`                   | jsonb                 | YES      | Log de pausas              |
| `metodo_estudo`                | text                  | YES      | Metodo utilizado           |
| `nivel_foco`                   | integer               | YES      | Nivel de foco (1-5)        |
| `status`                       | text                  | YES      | em_andamento, finalizada   |
| `created_at`                   | timestamptz           | YES      | -                          |
| `updated_at`                   | timestamptz           | YES      | -                          |

### 6.5 Tabela: `cronogramas` (19 colunas) - Plano de Estudo

| Coluna                      | Tipo             | Nullable | Descricao                |
| --------------------------- | ---------------- | -------- | ------------------------ |
| `id`                        | uuid             | NO       | PK                       |
| `empresa_id`                | uuid (FK)        | NO       | Tenant                   |
| `aluno_id`                  | uuid (FK alunos) | NO       | Aluno                    |
| `curso_alvo_id`             | uuid (FK cursos) | YES      | Curso alvo               |
| `nome`                      | text             | YES      | Nome do cronograma       |
| `data_inicio`               | date             | NO       | Inicio                   |
| `data_fim`                  | date             | NO       | Fim                      |
| `dias_estudo_semana`        | integer          | NO       | Dias por semana          |
| `horas_estudo_dia`          | numeric          | NO       | Horas por dia            |
| `periodos_ferias`           | jsonb            | YES      | Periodos de ferias       |
| `prioridade_minima`         | integer          | NO       | Prioridade minima        |
| `modalidade_estudo`         | text             | NO       | Modalidade               |
| `disciplinas_selecionadas`  | jsonb            | NO       | Disciplinas selecionadas |
| `modulos_selecionados`      | jsonb            | YES      | Modulos selecionados     |
| `excluir_aulas_concluidas`  | boolean          | NO       | Excluir aulas ja feitas  |
| `velocidade_reproducao`     | numeric          | YES      | Velocidade de video      |
| `ordem_frentes_preferencia` | jsonb            | YES      | Ordem preferida          |
| `created_at`                | timestamptz      | YES      | -                        |
| `updated_at`                | timestamptz      | YES      | -                        |

---

## 7. Agendamentos

Sistema de agendamento de plantoes e mentorias entre professor e aluno.

### 7.1 Tabela: `agendamentos` (16 colunas)

| Coluna                | Tipo        | Nullable | Descricao                             |
| --------------------- | ----------- | -------- | ------------------------------------- |
| `id`                  | uuid        | NO       | PK                                    |
| `empresa_id`          | uuid (FK)   | NO       | Tenant                                |
| `professor_id`        | uuid        | NO       | Professor                             |
| `aluno_id`            | uuid        | NO       | Aluno                                 |
| `data_inicio`         | timestamptz | NO       | Inicio                                |
| `data_fim`            | timestamptz | NO       | Fim                                   |
| `status`              | text        | NO       | pendente, confirmado, cancelado, etc. |
| `link_reuniao`        | text        | YES      | Link da reuniao                       |
| `observacoes`         | text        | YES      | Observacoes                           |
| `motivo_cancelamento` | text        | YES      | Motivo                                |
| `cancelado_por`       | uuid        | YES      | Quem cancelou                         |
| `confirmado_em`       | timestamptz | YES      | Data de confirmacao                   |
| `lembrete_enviado`    | boolean     | YES      | Se lembrete foi enviado               |
| `lembrete_enviado_em` | timestamptz | YES      | Data do lembrete                      |
| `created_at`          | timestamptz | YES      | -                                     |
| `updated_at`          | timestamptz | YES      | -                                     |

### Tabelas Auxiliares de Agendamento

| Tabela                        | Colunas | Descricao                                 |
| ----------------------------- | ------- | ----------------------------------------- |
| `agendamento_recorrencia`     | 13      | Padroes de recorrencia de disponibilidade |
| `agendamento_bloqueios`       | 10      | Bloqueios (feriados, recessos, etc.)      |
| `agendamento_configuracoes`   | 10      | Configuracoes por empresa                 |
| `agendamento_disponibilidade` | 9       | Disponibilidade base do professor         |
| `agendamento_notificacoes`    | 9       | Notificacoes de agendamento               |

---

## 8. Branding e Personalizacao

Cada tenant pode personalizar a aparencia da plataforma.

### 8.1 Tabela: `tenant_branding` (9 colunas)

| Coluna             | Tipo                     | Nullable | Descricao         |
| ------------------ | ------------------------ | -------- | ----------------- |
| `id`               | uuid                     | NO       | PK                |
| `empresa_id`       | uuid (FK)                | NO       | Tenant            |
| `color_palette_id` | uuid (FK color_palettes) | YES      | Paleta de cores   |
| `font_scheme_id`   | uuid (FK font_schemes)   | YES      | Esquema de fontes |
| `custom_css`       | text                     | YES      | CSS customizado   |
| `created_by`       | uuid                     | YES      | Criador           |
| `updated_by`       | uuid                     | YES      | Ultimo editor     |
| `created_at`       | timestamptz              | NO       | -                 |
| `updated_at`       | timestamptz              | NO       | -                 |

### Tabelas Auxiliares de Branding

| Tabela                        | Colunas | Descricao                                |
| ----------------------------- | ------- | ---------------------------------------- |
| `color_palettes`              | 26      | Paletas de cores (com variaveis de tema) |
| `font_schemes`                | 13      | Esquemas de fontes                       |
| `custom_theme_presets`        | 14      | Presets de tema combinados               |
| `tenant_logos`                | 9       | Logos (login, sidebar, favicon)          |
| `module_definitions`          | 9       | Definicoes de modulos do sistema         |
| `submodule_definitions`       | 6       | Definicoes de submodulos                 |
| `tenant_module_visibility`    | 12      | Visibilidade de modulos por tenant       |
| `tenant_submodule_visibility` | 12      | Visibilidade de submodulos por tenant    |

---

## 9. Comercial (Produtos, Pagamentos, Cupons)

### 9.1 Tabela: `products` (14 colunas)

| Coluna                | Tipo             | Nullable | Descricao                      |
| --------------------- | ---------------- | -------- | ------------------------------ |
| `id`                  | uuid             | NO       | PK                             |
| `empresa_id`          | uuid (FK)        | NO       | Tenant                         |
| `curso_id`            | uuid (FK cursos) | YES      | Curso vinculado                |
| `name`                | text             | NO       | Nome do produto                |
| `description`         | text             | YES      | Descricao                      |
| `price_cents`         | integer          | NO       | Preco em centavos              |
| `currency`            | text             | NO       | Moeda (default: 'BRL')         |
| `provider`            | text             | NO       | Provider (default: 'internal') |
| `provider_product_id` | text             | YES      | ID externo do produto          |
| `provider_offer_id`   | text             | YES      | ID externo da oferta           |
| `active`              | boolean          | NO       | Se esta ativo                  |
| `metadata`            | jsonb            | YES      | Metadados extras               |
| `created_at`          | timestamptz      | NO       | -                              |
| `updated_at`          | timestamptz      | NO       | -                              |

### 9.2 Tabela: `transactions` (22 colunas)

| Coluna                    | Tipo               | Nullable | Descricao                                                    |
| ------------------------- | ------------------ | -------- | ------------------------------------------------------------ |
| `id`                      | uuid               | NO       | PK                                                           |
| `empresa_id`              | uuid (FK)          | NO       | Tenant                                                       |
| `aluno_id`                | uuid (FK alunos)   | YES      | Aluno comprador                                              |
| `product_id`              | uuid (FK products) | YES      | Produto                                                      |
| `coupon_id`               | uuid (FK coupons)  | YES      | Cupom aplicado                                               |
| `provider`                | text               | NO       | Provider (default: 'manual')                                 |
| `provider_transaction_id` | text               | YES      | ID externo                                                   |
| `status`                  | transaction_status | NO       | pending, approved, cancelled, refunded, disputed, chargeback |
| `amount_cents`            | integer            | NO       | Valor em centavos                                            |
| `currency`                | text               | NO       | Moeda (BRL)                                                  |
| `payment_method`          | payment_method     | YES      | credit_card, pix, boleto, etc.                               |
| `installments`            | integer            | YES      | Parcelas                                                     |
| `buyer_email`             | text               | NO       | Email do comprador                                           |
| `buyer_name`              | text               | YES      | Nome                                                         |
| `buyer_document`          | text               | YES      | Documento (CPF)                                              |
| `provider_data`           | jsonb              | YES      | Dados do provider                                            |
| `sale_date`               | timestamptz        | NO       | Data da venda                                                |
| `confirmation_date`       | timestamptz        | YES      | Data de confirmacao                                          |
| `refund_date`             | timestamptz        | YES      | Data de reembolso                                            |
| `refund_amount_cents`     | integer            | YES      | Valor reembolsado                                            |
| `created_at`              | timestamptz        | NO       | -                                                            |
| `updated_at`              | timestamptz        | NO       | -                                                            |

### 9.3 Tabela: `coupons` (13 colunas)

| Coluna           | Tipo          | Nullable | Descricao           |
| ---------------- | ------------- | -------- | ------------------- |
| `id`             | uuid          | NO       | PK                  |
| `empresa_id`     | uuid (FK)     | NO       | Tenant              |
| `code`           | text          | NO       | Codigo do cupom     |
| `description`    | text          | YES      | Descricao           |
| `discount_type`  | discount_type | NO       | percentage ou fixed |
| `discount_value` | numeric       | NO       | Valor do desconto   |
| `max_uses`       | integer       | YES      | Maximo de usos      |
| `current_uses`   | integer       | NO       | Usos atuais         |
| `valid_from`     | timestamptz   | NO       | Valido a partir de  |
| `valid_until`    | timestamptz   | YES      | Valido ate          |
| `active`         | boolean       | NO       | Se esta ativo       |
| `created_at`     | timestamptz   | NO       | -                   |
| `updated_at`     | timestamptz   | NO       | -                   |

### 9.4 Tabela: `payment_providers` (11 colunas)

| Coluna                | Tipo        | Nullable | Descricao                    |
| --------------------- | ----------- | -------- | ---------------------------- |
| `id`                  | uuid        | NO       | PK                           |
| `empresa_id`          | uuid (FK)   | NO       | Tenant                       |
| `provider`            | text        | NO       | Nome do provider             |
| `name`                | text        | NO       | Nome de exibicao             |
| `credentials`         | jsonb       | YES      | Credenciais (criptografadas) |
| `webhook_secret`      | text        | YES      | Secret do webhook            |
| `webhook_url`         | text        | YES      | URL do webhook               |
| `provider_account_id` | text        | YES      | ID da conta no provider      |
| `active`              | boolean     | NO       | Se esta ativo                |
| `created_at`          | timestamptz | NO       | -                            |
| `updated_at`          | timestamptz | NO       | -                            |

---

## 10. Chat e IA

### 10.1 Tabela: `chat_conversations` (9 colunas)

| Coluna                                | Tipo      | Descricao |
| ------------------------------------- | --------- | --------- |
| `id`                                  | uuid      | PK        |
| `empresa_id`                          | uuid (FK) | Tenant    |
| _(+ user_id, titulo, contexto, etc.)_ |           |           |

### 10.2 Tabela: `chat_conversation_history` (6 colunas)

| Coluna                    | Tipo                         | Descricao |
| ------------------------- | ---------------------------- | --------- |
| `conversation_id`         | uuid (FK chat_conversations) | Conversa  |
| `empresa_id`              | uuid (FK)                    | Tenant    |
| _(+ role, content, etc.)_ |                              |           |

### 10.3 Tabela: `ai_agents` (21 colunas)

| Coluna                                                 | Tipo      | Descricao |
| ------------------------------------------------------ | --------- | --------- |
| `id`                                                   | uuid      | PK        |
| `empresa_id`                                           | uuid (FK) | Tenant    |
| _(+ nome, modelo, system_prompt, configuracoes, etc.)_ |           |           |

---

## 11. Enums do Sistema

| Enum                            | Valores                                                                                                                                        | Uso                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `enum_plano_empresa`            | basico, profissional, enterprise                                                                                                               | Plano da empresa         |
| `enum_modalidade`               | EAD, LIVE                                                                                                                                      | Modalidade do curso      |
| `enum_tipo_curso`               | Superextensivo, Extensivo, Intensivo, Superintensivo, Revisao                                                                                  | Tipo do curso            |
| `enum_tipo_atividade`           | Nivel_1, Nivel_2, Nivel_3, Nivel_4, Conceituario, Lista_Mista, Simulado_Diagnostico, Simulado_Cumulativo, Simulado_Global, Flashcards, Revisao | Tipo de atividade        |
| `enum_status_atividade`         | Pendente, Iniciado, Concluido                                                                                                                  | Status de progresso      |
| `enum_dificuldade_percebida`    | Muito Facil, Facil, Medio, Dificil, Muito Dificil                                                                                              | Percepcao de dificuldade |
| `enum_importancia_modulo`       | Alta, Media, Baixa, Base                                                                                                                       | Importancia do modulo    |
| `enum_tipo_material`            | Apostila, Lista de Exercicios, Planejamento, Resumo, Gabarito, Outros                                                                          | Tipo de material         |
| `enum_tipo_servico_agendamento` | plantao, mentoria                                                                                                                              | Tipo de agendamento      |
| `enum_tipo_bloqueio`            | feriado, recesso, imprevisto, outro                                                                                                            | Tipo de bloqueio         |
| `enum_logo_type`                | login, sidebar, favicon                                                                                                                        | Tipo de logo             |
| `enum_status_aluno_turma`       | ativo, concluido, cancelado, trancado                                                                                                          | Status do aluno na turma |
| `transaction_status`            | pending, approved, cancelled, refunded, disputed, chargeback                                                                                   | Status da transacao      |
| `payment_method`                | credit_card, debit_card, pix, boleto, bank_transfer, other                                                                                     | Metodo de pagamento      |
| `discount_type`                 | percentage, fixed                                                                                                                              | Tipo de desconto         |

---

## 12. Mapa Completo de Tabelas

### Tabelas com `empresa_id` NOT NULL (isolamento total)

| Tabela                        | Colunas | Dominio            |
| ----------------------------- | ------- | ------------------ |
| `empresas`                    | 14      | Tenant raiz        |
| `alunos`                      | 25      | Usuarios           |
| `professores`                 | 13      | Usuarios (legado)  |
| `usuarios`                    | 15      | Usuarios (moderno) |
| `papeis`                      | 9       | RBAC               |
| `cursos`                      | 18      | Academico          |
| `disciplinas`                 | 6       | Academico          |
| `segmentos`                   | 7       | Academico          |
| `frentes`                     | 7       | Academico          |
| `modulos`                     | 8       | Academico          |
| `aulas`                       | 11      | Academico          |
| `atividades`                  | 13      | Academico          |
| `flashcards`                  | 8       | Academico          |
| `materiais_curso`             | 11      | Academico          |
| `regras_atividades`           | 12      | Academico          |
| `cronogramas`                 | 19      | Progresso          |
| `progresso_flashcards`        | 11      | Progresso          |
| `agendamentos`                | 16      | Agendamento        |
| `agendamento_recorrencia`     | 13      | Agendamento        |
| `agendamento_bloqueios`       | 10      | Agendamento        |
| `agendamento_configuracoes`   | 10      | Agendamento        |
| `agendamento_disponibilidade` | 9       | Agendamento        |
| `agendamento_notificacoes`    | 9       | Agendamento        |
| `tenant_branding`             | 9       | Branding           |
| `color_palettes`              | 26      | Branding           |
| `font_schemes`                | 13      | Branding           |
| `custom_theme_presets`        | 14      | Branding           |
| `tenant_module_visibility`    | 12      | Branding           |
| `tenant_submodule_visibility` | 12      | Branding           |
| `products`                    | 14      | Comercial          |
| `transactions`                | 22      | Comercial          |
| `coupons`                     | 13      | Comercial          |
| `payment_providers`           | 11      | Comercial          |
| `chat_conversations`          | 9       | Chat/IA            |
| `chat_conversation_history`   | 6       | Chat/IA            |
| `ai_agents`                   | 21      | Chat/IA            |
| `turmas`                      | 11      | Matriculas         |

### Tabelas de Junction (sem empresa_id direto)

| Tabela                    | Colunas | Relacao                                |
| ------------------------- | ------- | -------------------------------------- |
| `alunos_cursos`           | 3       | Aluno N:N Curso                        |
| `alunos_turmas`           | 6       | Aluno N:N Turma                        |
| `cursos_disciplinas`      | 3       | Curso N:N Disciplina                   |
| `professores_disciplinas` | 11      | Professor N:N Disciplina/Frente/Modulo |
| `usuarios_disciplinas`    | 11      | Usuario N:N Disciplina/Frente/Modulo   |
| `empresa_admins`          | 5       | Empresa N:N Admin                      |

### Tabelas Auxiliares

| Tabela                     | Colunas | Descricao                           |
| -------------------------- | ------- | ----------------------------------- |
| `api_keys`                 | 9       | Chaves de API                       |
| `cronograma_itens`         | 9       | Itens do cronograma                 |
| `cronograma_semanas_dias`  | 5       | Dias da semana do cronograma        |
| `cronograma_tempo_estudos` | 9       | Tempo de estudo por disciplina      |
| `aulas_concluidas`         | 6       | Aulas marcadas como concluidas      |
| `matriculas`               | 10      | Matriculas formais                  |
| `progresso_atividades`     | 13      | Progresso em atividades             |
| `sessoes_estudo`           | 16      | Sessoes de estudo (focus mode)      |
| `module_definitions`       | 9       | Definicoes de modulos da plataforma |
| `submodule_definitions`    | 6       | Definicoes de submodulos            |
| `tenant_logos`             | 9       | Logos do tenant                     |

---

## 13. Row Level Security (RLS)

Todas as tabelas tem RLS habilitado. O modelo usa **funcoes auxiliares** no PostgreSQL para simplificar as policies.

### 13.1 Funcoes Auxiliares

| Funcao                                  | Descricao                                                                | Arquivo                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `get_user_empresa_id()`                 | Retorna `empresa_id` do usuario logado (via `professores` ou `usuarios`) | [20251217105924](supabase/migrations/20251217105924_create_empresas_table.sql)            |
| `is_empresa_admin(user_id, empresa_id)` | Verifica se usuario e admin de uma empresa                               | [20251217105926](supabase/migrations/20251217105926_create_empresa_admins.sql)            |
| `is_empresa_admin()`                    | Verifica se usuario logado e admin da propria empresa                    | [20251217105926](supabase/migrations/20251217105926_create_empresa_admins.sql)            |
| `user_belongs_to_empresa(empresa_id)`   | Verifica se usuario pertence a empresa                                   | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |
| `aluno_matriculado_empresa(empresa_id)` | Verifica se aluno esta matriculado na empresa                            | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |
| `get_aluno_empresas()`                  | Retorna empresas do aluno (via matriculas)                               | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |

### 13.2 Padrao de RLS por Operacao

| Operacao   | Quem pode                                   | Logica                                           |
| ---------- | ------------------------------------------- | ------------------------------------------------ |
| **SELECT** | Usuarios da mesma empresa                   | `empresa_id = get_user_empresa_id()`             |
| **INSERT** | Admin da empresa                            | `is_empresa_admin()`                             |
| **UPDATE** | Criador do recurso OU admin da empresa      | `created_by = auth.uid()` OU `is_empresa_admin()`|
| **DELETE** | Admin da empresa                            | `is_empresa_admin()`                             |

> **Nota**: Operacoes administrativas cross-tenant sao feitas server-side via service role key (bypass de RLS). Nao ha clausula de superadmin nas policies.

---

## 14. Autenticacao e Autorizacao

### 14.1 Metodos de Autenticacao

| Metodo                  | Header                          | Uso                               |
| ----------------------- | ------------------------------- | --------------------------------- |
| **JWT (Supabase Auth)** | `Authorization: Bearer <token>` | Interface web (usuarios e alunos) |
| **API Key**             | `X-API-Key: sk_live_...`        | Integracoes externas              |

**Codigo-fonte**: [auth.ts](app/shared/core/auth.ts), [database.ts](app/shared/core/database/database.ts)

### 14.2 Fluxo de Autenticacao

```
1. Usuario faz login (Supabase Auth)
2. getAuthenticatedUser() e chamado
3. Verifica se ha impersonacao ativa
4. Carrega role do metadata do usuario
5. Normaliza role (professor/empresa -> usuario)
6. Carrega contexto por role:
   - usuario: tabela usuarios + papel + empresa
   - aluno: tabela alunos + empresa via enrollment
7. Retorna AppUser com contexto completo
```

### 14.3 Interface AppUser

```typescript
interface AppUser {
  id: string;
  email: string;
  role: AppUserRole; // aluno | usuario
  roleType?: RoleTipo; // professor | professor_admin | staff | admin | monitor
  permissions?: RolePermissions;
  fullName?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  empresaId?: string; // Tenant ID
  empresaSlug?: string; // Tenant slug
  empresaNome?: string; // Tenant name
}
```

**Codigo-fonte**: [user.ts:18-32](app/shared/types/entities/user.ts#L18-L32)

### 14.4 Niveis de Cliente Supabase

| Nivel            | Funcao                           | RLS      | Uso                                |
| ---------------- | -------------------------------- | -------- | ---------------------------------- |
| **Service Role** | `getDatabaseClient()`            | Bypass   | Server-side, acoes administrativas |
| **User-Scoped**  | `getDatabaseClientAsUser(token)` | Respeita | Client-side, acoes do usuario      |

### 14.5 Impersonacao

Admins da empresa podem visualizar a plataforma como um aluno da propria empresa, sem perder o contexto real. O contexto de impersonacao e armazenado em cookie HTTP-only com duracao de 8 horas.

**Codigo-fonte**: [auth.ts](app/shared/core/auth.ts), [auth-impersonate.ts](app/shared/core/auth-impersonate.ts)

---

## 15. Resolucao de Tenant

O sistema resolve o tenant ativo por **3 mecanismos**, com cache em memoria (TTL 5 min):

| Prioridade | Mecanismo               | Exemplo                 | Lookup                         |
| ---------- | ----------------------- | ----------------------- | ------------------------------ |
| 1          | **Dominio customizado** | escola.com.br           | `empresas.dominio_customizado` |
| 2          | **Subdominio**          | escola.aluminify.com.br | `empresas.subdomain`           |
| 3          | **Slug (dev)**          | /escola/dashboard       | `empresas.slug`                |

**Codigo-fonte**: [tenant-resolver.service.ts](<app/[tenant]/(modules)/empresa/services/tenant-resolver.service.ts>)

O roteamento no Next.js usa o padrao `app/[tenant]/` para capturar o slug ou resolver o tenant pela URL.

---

## 16. Diagrama de Relacionamentos

```
                    ┌─────────────────────┐
                    │    auth.users        │
                    │  (Supabase Auth)     │
                    └──────────┬──────────┘
                               │ id
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌──────────────┐   ┌──────────────┐
    │   alunos      │  │ professores  │   │  usuarios    │
    │  (estudantes) │  │   (legado)   │   │   (staff)    │
    │               │  │              │   │              │
    │ empresa_id ──►│  │ empresa_id──►│   │ empresa_id──►│
    └───────┬───────┘  └──────┬───────┘   │ papel_id ───►├───► papeis
            │                 │           └──────────────┘
            │                 │
            ▼                 ▼
    ┌───────────────┐  ┌──────────────────┐
    │ alunos_cursos │  │ prof_disciplinas │
    │  (enrollment) │  │(vinculo ensino)  │
    └───────┬───────┘  └──────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│                        EMPRESAS                           │
│  (tenant raiz - 14 colunas)                               │
│  plano | slug | dominio | subdomain | configuracoes       │
└────────────────────────────┬──────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│  segmentos    │    │   cursos     │    │  agendamentos│
│               │    │              │    │              │
└───────────────┘    └──────┬───────┘    └──────────────┘
                            │
                  ┌─────────┼──────────┐
                  │         │          │
                  ▼         ▼          ▼
          ┌────────────┐ ┌───────┐ ┌──────────────┐
          │disciplinas │ │turmas │ │materiais_curso│
          └──────┬─────┘ └───────┘ └──────────────┘
                 │
                 ▼
          ┌────────────┐
          │  frentes   │
          └──────┬─────┘
                 │
                 ▼
          ┌────────────┐
          │  modulos   │
          └──────┬─────┘
                 │
         ┌───────┼───────┐
         │       │       │
         ▼       ▼       ▼
    ┌────────┐ ┌──────┐ ┌──────────┐
    │ aulas  │ │ativ. │ │flashcards│
    └────────┘ └──────┘ └──────────┘
                 │              │
                 ▼              ▼
         ┌─────────────┐ ┌───────────────┐
         │ progresso_  │ │  progresso_   │
         │ atividades  │ │  flashcards   │
         └─────────────┘ └───────────────┘

┌──────────────────────────────────────────┐
│           COMERCIAL                      │
│  products ──► transactions               │
│  coupons ──┘  payment_providers          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│           BRANDING                       │
│  tenant_branding                         │
│    ├── color_palettes                    │
│    ├── font_schemes                      │
│    └── tenant_logos                       │
│  tenant_module_visibility                │
│  tenant_submodule_visibility             │
└──────────────────────────────────────────┘
```

---

## Notas Finais

### Pontos de Atencao

1. **Coexistencia `professores` e `usuarios`**: O sistema tem duas tabelas para staff. `professores` e legada; `usuarios` e a tabela moderna com vinculo a `papeis`. A funcao `get_user_empresa_id()` consulta ambas.

2. **Planos sem enforcement**: O campo `plano` na tabela `empresas` existe, mas nao ha logica implementada de limitacao de features/cotas por plano.

3. **Tabela `alunos_cursos` como elo tenant-aluno**: O aluno determina seu tenant pela matricula em cursos. A funcao `get_aluno_empresas()` faz esse lookup via JOIN com `cursos`.

4. **Soft delete**: Tabelas `alunos` e `usuarios` possuem `deleted_at` para soft delete.

5. **Triggers de `updated_at`**: Todas as tabelas com `updated_at` possuem trigger automatico via `handle_updated_at()`.

6. **Indices de performance**: Todas as colunas `empresa_id` possuem indices B-tree para performance de queries multi-tenant.

---

---

# Changelog

## 2026-01-29: Remocao completa do role superadmin

O role `superadmin` foi removido inteiramente do sistema. Nunca foi utilizado em producao. A gestao cross-tenant sera feita futuramente por um app admin separado.

### O que foi feito

| Camada | Escopo | Detalhes |
|---|---|---|
| **Banco de dados** | ~109 RLS policies em ~35 tabelas | Removido `OR is_superadmin()` de todas as policies. Dropadas 10 policies exclusivas de superadmin. |
| **Funcoes PostgreSQL** | 3 funcoes dropadas | `is_superadmin()`, `is_current_user_superadmin()`, `check_and_set_first_professor_superadmin()` |
| **Funcoes atualizadas** | 2 funcoes | `user_belongs_to_empresa()` (removido bypass), `handle_new_user()` (removida logica de primeiro professor superadmin) |
| **Tipos TypeScript** | 2 arquivos base | `AppUserRole` e `AuthUser` sem superadmin/isSuperAdmin |
| **Core auth/middleware** | 8 arquivos | auth.ts, roles.ts, route-guards.ts, auth-actions.ts, auth-impersonate.ts, middleware.logic.ts, empresa-context.ts, brand-customization-access.ts |
| **Tenant auth** | 2 arquivos | middleware.ts, auth.service.ts |
| **UI components** | ~15 arquivos | permission-provider, sidebar, nav, breadcrumb, pages |
| **API routes** | ~58 arquivos | Removidos bypasses isSuperAdmin, allowedRoles, checks cross-tenant |
| **Services** | ~10 arquivos | user-role-identifier, auth, dashboard-analytics, copilotkit, mastra tools |
| **Arquivos deletados** | 3 | `api/auth/superadmin/login/route.ts`, `api/cache/stats/route.ts`, `api/empresa/route.ts` |
| **Env vars** | 2 removidas | `SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD` |

**Migration**: [20260129000000_remove_superadmin.sql](supabase/migrations/20260129000000_remove_superadmin.sql)

### Decisao tecnica

O service role key (Secret) do Supabase ja faz bypass de RLS automaticamente para operacoes server-side, tornando `is_superadmin()` nas policies redundante. A impersonacao permanece como funcao do **admin da empresa** (pode impersonar alunos da propria empresa).

## 2026-01-29: Fix soft-delete RLS para alunos + cache TTL

Correcoes pontuais de seguranca e consistencia na arquitetura multi-tenant.

| Fix | Detalhe |
|---|---|
| **Soft-delete RLS** | Policies SELECT e UPDATE na tabela `alunos` agora filtram `deleted_at IS NULL`. Alunos soft-deleted ficam invisiveis via RLS. |
| **Cache TTL** | TenantResolverService alinhado de 5 min para 1 min (mesmo do middleware). |
| **Descartado** | `empresa_id` nullable em `disciplinas`/`segmentos` ja e NOT NULL no banco atual. |

---

# Decisao Arquitetural: Modelo Unificado de Usuarios

> Status: APROVADO — pendente implementacao

## Contexto

O sistema atual possui **3 tabelas separadas** para pessoas (`alunos`, `professores`, `usuarios`) mais uma junction separada (`empresa_admins`). Isso causa:

- Duplicacao de colunas (nome, email, cpf, telefone em todas as 3)
- Funcoes RLS que consultam multiplas tabelas (`get_user_empresa_id()` consulta `professores` + `usuarios`)
- Impossibilidade de multi-tenant natural (um professor nao pode dar aula em 2 cursinhos)
- Logica de "normalizacao de role" no auth (professor → usuario, empresa → usuario)
- Duas tabelas identicas (`professores_disciplinas` e `usuarios_disciplinas`)

## Modelo Novo

### Tabela `usuarios` (dados pessoais — 1 registro por pessoa)

```
usuarios
  id                UUID PK (= auth.users.id)
  nome_completo     TEXT NOT NULL
  email             TEXT UNIQUE NOT NULL
  cpf               TEXT
  telefone          TEXT
  avatar_url        TEXT
  data_nascimento   DATE
  endereco          TEXT
  cep               TEXT
  numero_endereco   TEXT
  complemento       TEXT
  cidade            TEXT
  estado            TEXT
  bairro            TEXT
  pais              TEXT DEFAULT 'Brasil'
  instagram         TEXT
  twitter           TEXT
  biografia         TEXT
  especialidade     TEXT
  chave_pix         TEXT
  hotmart_id        TEXT
  origem_cadastro   TEXT DEFAULT 'manual'
  must_change_password BOOLEAN DEFAULT false
  created_at        TIMESTAMPTZ DEFAULT now()
  updated_at        TIMESTAMPTZ DEFAULT now()
```

Todos os campos de pessoa ficam aqui. Campos que antes eram exclusivos de `alunos` (endereco, social, hotmart) agora sao colunas opcionais na tabela unica. A senha pertence ao `auth.users` e e global.

### Tabela `usuarios_empresas` (vinculo N:N com papel)

```
usuarios_empresas
  id                UUID PK DEFAULT gen_random_uuid()
  usuario_id        UUID FK → usuarios NOT NULL
  empresa_id        UUID FK → empresas NOT NULL
  papel_base        ENUM('aluno', 'professor', 'usuario') NOT NULL
  papel_id          UUID FK → papeis (nullable, so para staff com permissoes customizadas)
  is_admin          BOOLEAN DEFAULT false
  is_owner          BOOLEAN DEFAULT false
  ativo             BOOLEAN DEFAULT true
  deleted_at        TIMESTAMPTZ
  created_at        TIMESTAMPTZ DEFAULT now()
  updated_at        TIMESTAMPTZ DEFAULT now()
  UNIQUE(usuario_id, empresa_id, papel_base)
```

**Regras:**
- Cada registro = "esta pessoa participa deste tenant com este papel"
- Mesma pessoa pode ser `aluno` no Tenant A e `professor` no Tenant B
- Mesma pessoa pode ser `aluno` E `professor` no mesmo tenant (monitor que tambem estuda)
- `is_admin` so para `professor` ou `usuario` (aluno nao pode ser admin)
- `is_owner` maximo 1 por empresa (enforce via trigger ou app)
- `papel_id` so necessario para `usuario` com permissoes granulares customizadas
- Multi-tenant: se tem 2 registros, login mostra workspace switcher

### Tabelas eliminadas

| Tabela atual | Destino |
|---|---|
| `alunos` (25 colunas) | Merge em `usuarios` (dados pessoais) + `usuarios_empresas` (vinculo) |
| `professores` (13 colunas) | Merge em `usuarios` + `usuarios_empresas` |
| `empresa_admins` (5 colunas) | Absorvido por `usuarios_empresas.is_admin` + `is_owner` |
| `professores_disciplinas` (11 colunas) | Merge em `usuarios_disciplinas` (ja existente, mesma estrutura) |

### Tabelas que mudam FK

| Tabela | FK atual | FK novo |
|---|---|---|
| `alunos_cursos` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `alunos_turmas` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `aulas_concluidas` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `cronogramas` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `matriculas` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `progresso_atividades` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `progresso_flashcards` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `sessoes_estudo` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `transactions` | `aluno_id → alunos.id` | `usuario_id → usuarios.id` |
| `professores_disciplinas` | `professor_id → professores.id` | Merge em `usuarios_disciplinas` |

### Funcoes RLS simplificadas

| Funcao | Antes | Depois |
|---|---|---|
| `get_user_empresa_id()` | Consulta `professores` + `usuarios` | Consulta `usuarios_empresas` |
| `is_empresa_admin()` | Consulta `empresa_admins` + `professores.is_admin` | Consulta `usuarios_empresas.is_admin` |
| `user_belongs_to_empresa()` | Consulta `professores` | Consulta `usuarios_empresas` |
| `is_professor()` | Consulta `professores` | Consulta `usuarios_empresas.papel_base = 'professor'` |
| `aluno_matriculado_empresa()` | JOIN `alunos_cursos` + `cursos` | Consulta `usuarios_empresas.papel_base = 'aluno'` |

### TypeScript: tipos simplificados

```typescript
// Antes: 4 roles com normalizacao
type AppUserRole = 'aluno' | 'usuario' | 'professor' | 'empresa';

// Depois: 3 papeis base, sem normalizacao
type PapelBase = 'aluno' | 'professor' | 'usuario';
```

### Fluxo de login com multi-tenant

```
1. Usuario faz login (Supabase Auth)
2. Busca vinculos em usuarios_empresas WHERE usuario_id = auth.uid() AND ativo = true
3. Se 1 vinculo → entra direto no tenant
4. Se N vinculos → mostra workspace switcher
5. Selecao de workspace seta empresa_id no JWT/cookie
6. Dentro do app, header da sidebar tem switcher de workspace
```

### Fluxo de adicionar usuario existente a outro tenant

```
1. Admin do tenant busca por email
2. Se email existe em usuarios → cria apenas vinculo em usuarios_empresas
3. Se nao existe → cria em auth.users + usuarios + usuarios_empresas
4. Admin NAO pode resetar senha (pertence ao auth.users, e global)
5. Admin pode desativar vinculo (ativo = false no usuarios_empresas)
```

---

# Plano de Migracao: Modelo Unificado de Usuarios

> Total estimado: ~68 arquivos de codigo + ~109 RLS policies + ~6 funcoes PostgreSQL

## Impacto Mapeado

| Recurso | Quantidade |
|---|---|
| Tabelas com FK para `alunos` | 9 |
| Tabelas com FK para `professores` | 5 |
| Tabelas com FK para `usuarios` | 1 |
| Arquivos referenciando `alunos` | 20 |
| Arquivos referenciando `professores` | 29 |
| Arquivos referenciando `usuarios` | 15 |
| Arquivos referenciando `empresa_admins` | 4 |
| Funcoes RLS consultando tabelas legadas | 6 |
| Colunas exclusivas de `alunos` | 16 (endereco, social, hotmart) |
| Colunas exclusivas de `professores` | 1 (is_admin) |

## Fases de Execucao

### FASE 1: Schema — Expandir `usuarios` e criar `usuarios_empresas`

Migration SQL que:

1. **Adiciona colunas faltantes** em `usuarios` (campos que so existem em `alunos`):
   - `data_nascimento`, `endereco`, `cep`, `numero_endereco`, `complemento`, `cidade`, `estado`, `bairro`, `pais`
   - `instagram`, `twitter`
   - `numero_matricula`, `hotmart_id`, `origem_cadastro`
   - `must_change_password`, `senha_temporaria`

2. **Cria tabela `usuarios_empresas`** com:
   - `usuario_id`, `empresa_id`, `papel_base` (enum), `papel_id`, `is_admin`, `is_owner`, `ativo`, `deleted_at`, timestamps
   - UNIQUE(usuario_id, empresa_id, papel_base)

3. **Cria enum** `enum_papel_base` com valores `'aluno'`, `'professor'`, `'usuario'`

### FASE 2: Migracao de Dados

1. **Migra `professores` → `usuarios`**:
   - INSERT INTO usuarios (id, nome_completo, email, ...) SELECT ... FROM professores WHERE id NOT IN (SELECT id FROM usuarios)
   - Para professores que JA existem em `usuarios`: merge campos faltantes (biografia, especialidade, etc.)

2. **Migra `alunos` → `usuarios`**:
   - INSERT INTO usuarios (id, nome_completo, email, ...) SELECT ... FROM alunos WHERE id NOT IN (SELECT id FROM usuarios)
   - Para alunos que JA existem em `usuarios`: merge campos faltantes (endereco, social, etc.)

3. **Popula `usuarios_empresas`**:
   - FROM `professores`: INSERT (usuario_id, empresa_id, papel_base='professor', is_admin=professores.is_admin)
   - FROM `alunos`: INSERT (usuario_id, empresa_id, papel_base='aluno')
   - FROM `usuarios` (atual): INSERT (usuario_id, empresa_id, papel_base='usuario', papel_id=usuarios.papel_id)
   - FROM `empresa_admins`: UPDATE usuarios_empresas SET is_admin=true, is_owner=empresa_admins.is_owner WHERE ...

### FASE 3: FKs — Re-apontar referencias

Para cada tabela que referencia `alunos`:
1. Adicionar coluna `usuario_id` (nullable, FK → usuarios)
2. Popular `usuario_id` FROM `aluno_id` (mesmos UUIDs, pois alunos.id = auth.users.id = usuarios.id)
3. Dropar FK antiga de `aluno_id`
4. Renomear `aluno_id` → `usuario_id` OU dropar coluna velha

Tabelas: `alunos_cursos`, `alunos_turmas`, `aulas_concluidas`, `cronogramas`, `matriculas`, `progresso_atividades`, `progresso_flashcards`, `sessoes_estudo`, `transactions`

Para `professores_disciplinas`:
1. Migrar dados para `usuarios_disciplinas` (mesma estrutura)
2. Dropar `professores_disciplinas`

### FASE 4: Funcoes RLS

Reescrever todas as funcoes para consultar `usuarios_empresas`:

- `get_user_empresa_id()` → SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid() AND ativo = true LIMIT 1
- `is_empresa_admin()` → SELECT 1 FROM usuarios_empresas WHERE usuario_id = auth.uid() AND is_admin = true
- `user_belongs_to_empresa(empresa_id)` → SELECT 1 FROM usuarios_empresas WHERE usuario_id = auth.uid() AND empresa_id = param
- `is_professor()` → SELECT 1 FROM usuarios_empresas WHERE usuario_id = auth.uid() AND papel_base = 'professor'
- `aluno_matriculado_empresa(empresa_id)` → SELECT 1 FROM usuarios_empresas WHERE usuario_id = auth.uid() AND papel_base = 'aluno' AND empresa_id = param

### FASE 5: RLS Policies

Reescrever ~109 policies usando as funcoes atualizadas. Como as funcoes mantem a mesma assinatura, a maioria das policies so precisa ser re-testada (nao reescrita).

### FASE 6: TypeScript — Tipos base

- `AppUserRole` → `PapelBase = 'aluno' | 'professor' | 'usuario'`
- Remover interfaces `Student`, `Teacher` separadas
- Criar interface `UsuarioEmpresa` para o vinculo
- Atualizar `AppUser` para incluir `papelBase`, `isAdmin`, `isOwner`

### FASE 7: Auth — Fluxo de login

- Atualizar `getAuthenticatedUser()` para consultar `usuarios_empresas`
- Implementar workspace switcher (selecao de tenant quando tem multiplos vinculos)
- Atualizar middleware para resolver empresa_id do vinculo ativo
- Atualizar `identifyUserRoleAction()` para o novo modelo

### FASE 8: API Routes (~49 arquivos)

Atualizar todas as queries Supabase:
- `.from('alunos')` → `.from('usuarios')`
- `.from('professores')` → `.from('usuarios')`
- `.from('empresa_admins')` → `.from('usuarios_empresas')`
- `.eq('aluno_id', ...)` → `.eq('usuario_id', ...)`
- `.eq('professor_id', ...)` → `.eq('usuario_id', ...)`

### FASE 9: Services e UI

- Atualizar services (dashboard-analytics, cronograma, financeiro, etc.)
- Atualizar componentes UI (nav-user, sidebar, profile, etc.)
- Implementar UI de workspace switcher

### FASE 10: Cleanup

1. Dropar tabelas legadas: `alunos`, `professores`, `empresa_admins`, `professores_disciplinas`
2. Dropar funcoes legadas nao mais necessarias
3. Regenerar `database.types.ts`
4. Atualizar documentacao

## Verificacao

1. **TypeScript**: `npx tsc --noEmit` sem erros
2. **Build**: `npm run build` sem erros
3. **Grep**: Zero referencias a tabelas dropadas no codigo
4. **DB**: Todas as policies funcionando
5. **Funcional**: Login, workspace switcher, impersonacao, CRUD de alunos/professores
6. **Data integrity**: Contagem de registros antes/depois da migracao
