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

O Aluminify e uma plataforma SaaS educacional (cursinhos preparatorios) com arquitetura **multi-tenant por banco de dados compartilhado** (*shared database, shared schema*). Cada empresa (cursinho) e um **tenant** isolado por meio da coluna `empresa_id` presente em praticamente todas as tabelas.

### Principios de Isolamento

| Estrategia | Implementacao |
|---|---|
| **Isolamento de dados** | Coluna `empresa_id` (FK para `empresas`) em todas as tabelas |
| **Enforcement no DB** | Row Level Security (RLS) do PostgreSQL |
| **Enforcement no app** | Middleware de tenant + contexto de autenticacao |
| **Roteamento** | Subdominio, dominio customizado ou slug na URL |

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

| Coluna | Tipo | Nullable | Default | Descricao |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK - Identificador unico |
| `nome` | text | NO | - | Nome da instituicao |
| `slug` | text (UNIQUE) | NO | - | Identificador URL-friendly |
| `cnpj` | text (UNIQUE) | YES | - | CNPJ da empresa |
| `email_contato` | text | YES | - | Email de contato |
| `telefone` | text | YES | - | Telefone |
| `logo_url` | text | YES | - | URL do logo principal |
| `plano` | enum_plano_empresa | NO | `'basico'` | Plano de assinatura |
| `ativo` | boolean | NO | `true` | Se a empresa esta ativa |
| `configuracoes` | jsonb | YES | `'{}'` | Configuracoes customizaveis (JSON livre) |
| `dominio_customizado` | text | YES | - | Dominio proprio (ex: escola.com.br) |
| `subdomain` | text | YES | - | Subdominio (ex: escola.aluminify.com.br) |
| `created_at` | timestamptz | NO | `now()` | Data de criacao |
| `updated_at` | timestamptz | NO | `now()` | Data de atualizacao |

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
AppUserRole = 'aluno' | 'usuario' | 'superadmin' | 'professor' | 'empresa'
```

| Role | Descricao | Vinculo ao Tenant |
|---|---|---|
| `aluno` | Estudante | Via `alunos.empresa_id` + `alunos_cursos` |
| `usuario` | Staff da instituicao (professor, admin, etc.) | Via `usuarios.empresa_id` |
| `superadmin` | Administrador global do sistema | Sem vinculo (acessa todas as empresas) |
| `professor` | (legado, normalizado para `usuario`) | Via `professores.empresa_id` |
| `empresa` | (legado, normalizado para `usuario`) | Via contexto |

### 3.2 Tabela: `alunos` (25 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK (= `auth.users.id`) |
| `empresa_id` | uuid (FK empresas) | NO | Tenant do aluno |
| `nome_completo` | text | YES | Nome completo |
| `email` | text | NO | Email (unico) |
| `cpf` | text | YES | CPF |
| `telefone` | text | YES | Telefone |
| `data_nascimento` | date | YES | Data de nascimento |
| `endereco` | text | YES | Endereco |
| `cep` | text | YES | CEP |
| `cidade` | text | YES | Cidade |
| `estado` | text | YES | Estado (UF) |
| `bairro` | text | YES | Bairro |
| `pais` | text | YES | Pais (default: 'Brasil') |
| `numero_endereco` | text | YES | Numero |
| `complemento` | text | YES | Complemento |
| `numero_matricula` | text | YES | Numero de matricula |
| `instagram` | text | YES | Instagram |
| `twitter` | text | YES | Twitter/X |
| `hotmart_id` | text | YES | ID Hotmart (integracao) |
| `origem_cadastro` | text | YES | Origem (default: 'manual') |
| `must_change_password` | boolean | NO | Deve trocar senha no primeiro login |
| `senha_temporaria` | text | YES | Senha temporaria (provisioning) |
| `deleted_at` | timestamptz | YES | Soft delete |
| `created_at` | timestamptz | NO | Data de criacao |
| `updated_at` | timestamptz | NO | Data de atualizacao |

**Codigo-fonte do tipo**: [user.ts:42-69](app/shared/types/entities/user.ts#L42-L69)

### 3.3 Tabela: `professores` (13 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK (= `auth.users.id`) |
| `empresa_id` | uuid (FK empresas) | NO | Tenant |
| `nome_completo` | text | NO | Nome completo |
| `email` | text | NO | Email |
| `cpf` | text | YES | CPF |
| `telefone` | text | YES | Telefone |
| `biografia` | text | YES | Biografia |
| `foto_url` | text | YES | Foto de perfil |
| `especialidade` | text | YES | Area de especialidade |
| `chave_pix` | text | YES | Chave PIX |
| `is_admin` | boolean | NO | Se e administrador (legado) |
| `created_at` | timestamptz | NO | Data de criacao |
| `updated_at` | timestamptz | NO | Data de atualizacao |

**Codigo-fonte do tipo**: [user.ts:122-136](app/shared/types/entities/user.ts#L122-L136)

### 3.4 Tabela: `usuarios` (15 colunas) - Staff Moderno

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK (= `auth.users.id`) |
| `empresa_id` | uuid (FK empresas) | NO | Tenant |
| `papel_id` | uuid (FK papeis) | NO | Papel/role atribuido |
| `nome_completo` | text | NO | Nome completo |
| `email` | text | NO | Email |
| `cpf` | text | YES | CPF |
| `telefone` | text | YES | Telefone |
| `chave_pix` | text | YES | Chave PIX |
| `foto_url` | text | YES | Foto de perfil |
| `biografia` | text | YES | Biografia |
| `especialidade` | text | YES | Especialidade |
| `ativo` | boolean | NO | Se esta ativo (default: true) |
| `deleted_at` | timestamptz | YES | Soft delete |
| `created_at` | timestamptz | NO | Data de criacao |
| `updated_at` | timestamptz | NO | Data de atualizacao |

### 3.5 Tabela: `papeis` (9 colunas) - Roles RBAC

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK empresas) | YES | NULL = papel template do sistema |
| `nome` | text | NO | Nome do papel (ex: "Professor") |
| `tipo` | text | NO | Tipo: professor, professor_admin, staff, admin, monitor |
| `descricao` | text | YES | Descricao |
| `permissoes` | jsonb | NO | Permissoes granulares (ver abaixo) |
| `is_system` | boolean | NO | Se e papel do sistema (nao editavel) |
| `created_at` | timestamptz | NO | Data de criacao |
| `updated_at` | timestamptz | NO | Data de atualizacao |

**Codigo-fonte do tipo**: [papel.ts](app/shared/types/entities/papel.ts)

### 3.6 Permissoes Granulares (RBAC)

Cada papel tem um JSON de permissoes com a estrutura:

```typescript
interface RolePermissions {
  dashboard:      { view: boolean };
  cursos:         { view, create, edit, delete };
  disciplinas:    { view, create, edit, delete };
  alunos:         { view, create, edit, delete };
  usuarios:       { view, create, edit, delete };
  agendamentos:   { view, create, edit, delete };
  flashcards:     { view, create, edit, delete };
  materiais:      { view, create, edit, delete };
  configuracoes:  { view, edit };
  branding:       { view, edit };
  relatorios:     { view };
}
```

### 3.7 Permissoes Padrao por Tipo de Papel

| Recurso | professor | professor_admin | staff | admin | monitor |
|---|---|---|---|---|---|
| dashboard.view | Y | Y | Y | Y | Y |
| cursos.CRUD | R--- | CRUD | R--- | CRUD | R--- |
| disciplinas.CRUD | R--- | CRUD | R--- | CRUD | R--- |
| alunos.CRUD | R--- | CRUD | RCU- | CRUD | R--- |
| usuarios.CRUD | ---- | CRUD | R--- | CRUD | ---- |
| agendamentos.CRUD | CRUD | CRUD | RCU- | CRUD | RCU- |
| flashcards.CRUD | CRUD | CRUD | R--- | CRUD | R--- |
| materiais.CRUD | CRUD | CRUD | R--- | CRUD | R--- |
| configuracoes | ---- | RU | ---- | RU | ---- |
| branding | ---- | RU | ---- | RU | ---- |
| relatorios.view | ---- | Y | Y | Y | ---- |

*Legenda: R=Read, C=Create, U=Update, D=Delete, -=sem acesso*

**Codigo-fonte**: [papel.ts:79-145](app/shared/types/entities/papel.ts#L79-L145)

### 3.8 Tabela: `empresa_admins` (5 colunas) - Vinculo Admin-Empresa

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `empresa_id` | uuid (FK empresas) | NO | PK composta |
| `user_id` | uuid (FK auth.users) | NO | PK composta |
| `is_owner` | boolean | NO | Se e dono da empresa |
| `permissoes` | jsonb | YES | Permissoes adicionais |
| `created_at` | timestamptz | NO | Data de criacao |

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

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `nome` | text | NO | Nome do segmento |
| `slug` | text | YES | Slug |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 4.2 Tabela: `cursos` (18 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `segmento_id` | uuid (FK segmentos) | YES | Segmento do curso |
| `disciplina_id` | uuid (FK disciplinas) | YES | Disciplina principal (legado) |
| `nome` | text | NO | Nome do curso |
| `modalidade` | enum_modalidade | NO | EAD ou LIVE |
| `tipo` | enum_tipo_curso | NO | Extensivo, Intensivo, etc. |
| `descricao` | text | YES | Descricao |
| `ano_vigencia` | integer | NO | Ano de vigencia |
| `data_inicio` | date | YES | Data de inicio |
| `data_termino` | date | YES | Data de termino |
| `meses_acesso` | integer | YES | Meses de acesso |
| `planejamento_url` | text | YES | URL do planejamento |
| `imagem_capa_url` | text | YES | Imagem de capa |
| `usa_turmas` | boolean | NO | Se usa turmas (default: false) |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 4.3 Tabela: `cursos_disciplinas` (3 colunas) - Junction N:N

| Coluna | Tipo | Descricao |
|---|---|---|
| `curso_id` | uuid (FK cursos) | Curso |
| `disciplina_id` | uuid (FK disciplinas) | Disciplina |
| `created_at` | timestamptz | - |

### 4.4 Tabela: `disciplinas` (6 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `nome` | text | NO | Nome (ex: Biologia) |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 4.5 Tabela: `frentes` (7 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `disciplina_id` | uuid (FK disciplinas) | YES | Disciplina |
| `curso_id` | uuid (FK cursos) | YES | Curso (binding direto) |
| `nome` | text | NO | Nome (ex: Zoologia) |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | YES | - |

### 4.6 Tabela: `modulos` (8 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `frente_id` | uuid (FK frentes) | YES | Frente |
| `curso_id` | uuid (FK cursos) | YES | Curso |
| `nome` | text | NO | Nome do modulo |
| `numero_modulo` | integer | YES | Numero sequencial |
| `importancia` | enum_importancia_modulo | YES | Alta, Media, Baixa, Base |
| `created_at` | timestamptz | YES | - |

### 4.7 Tabela: `aulas` (11 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `modulo_id` | uuid (FK modulos) | YES | Modulo |
| `curso_id` | uuid (FK cursos) | YES | Curso |
| `nome` | text | NO | Nome da aula |
| `numero_aula` | integer | YES | Numero sequencial |
| `tempo_estimado_minutos` | integer | YES | Duracao estimada (minutos) |
| `tempo_estimado_interval` | interval | YES | Duracao estimada (interval) |
| `prioridade` | integer | YES | Prioridade para cronograma |
| `video_url` | text | YES | URL do video |
| `created_at` | timestamptz | YES | - |

### 4.8 Tabela: `atividades` (13 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `modulo_id` | uuid (FK modulos) | YES | Modulo |
| `tipo` | enum_tipo_atividade | NO | Nivel_1..4, Simulado, Flashcards, etc. |
| `titulo` | text | NO | Titulo |
| `arquivo_url` | text | YES | URL do arquivo (PDF, etc.) |
| `gabarito_url` | text | YES | URL do gabarito |
| `link_externo` | text | YES | Link externo |
| `obrigatorio` | boolean | YES | Se e obrigatoria (default: true) |
| `ordem_exibicao` | integer | YES | Ordem de exibicao |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### 4.9 Tabela: `flashcards` (8 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `modulo_id` | uuid (FK modulos) | YES | Modulo |
| `pergunta` | text | NO | Pergunta |
| `resposta` | text | NO | Resposta |
| `pergunta_imagem_path` | text | YES | Imagem da pergunta |
| `resposta_imagem_path` | text | YES | Imagem da resposta |
| `created_at` | timestamptz | YES | - |

### 4.10 Tabela: `materiais_curso` (11 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `curso_id` | uuid (FK cursos) | YES | Curso |
| `titulo` | text | NO | Titulo do material |
| `descricao_opcional` | text | YES | Descricao |
| `tipo` | enum_tipo_material | NO | Apostila, Lista, Resumo, etc. |
| `arquivo_url` | text | NO | URL do arquivo |
| `ordem` | integer | NO | Ordem de exibicao |
| `created_by` | uuid | YES | Criador |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 4.11 Tabela: `regras_atividades` (12 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `curso_id` | uuid (FK cursos) | YES | Curso |
| *(+ colunas de regras de geracao automatica de atividades)* | | | |

### 4.12 Vinculo Professor-Disciplina

**`professores_disciplinas`** (11 colunas) - Vincula professor a disciplina/frente/modulo/turma:

| Coluna | Tipo | Descricao |
|---|---|---|
| `professor_id` | uuid (FK professores) | Professor |
| `disciplina_id` | uuid (FK disciplinas) | Disciplina |
| `curso_id` | uuid (FK cursos) | Curso |
| `frente_id` | uuid (FK frentes) | Frente |
| `modulo_id` | uuid (FK modulos) | Modulo |
| `turma_id` | uuid (FK turmas) | Turma |
| `empresa_id` | uuid (FK empresas) | Tenant |

**`usuarios_disciplinas`** (11 colunas) - Mesma estrutura para o modelo moderno de `usuarios`.

---

## 5. Matriculas e Turmas

### 5.1 Tabela: `alunos_cursos` (3 colunas) - Junction Aluno-Curso

| Coluna | Tipo | Descricao |
|---|---|---|
| `aluno_id` | uuid (FK alunos) | Aluno |
| `curso_id` | uuid (FK cursos) | Curso |
| `created_at` | timestamptz | Data de vinculo |

Esta e a **tabela principal de enrollment**. Determina quais cursos (e, consequentemente, qual empresa) o aluno pode acessar.

### 5.2 Tabela: `matriculas` (10 colunas) - Controle de Acesso Temporal

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | YES | Tenant |
| `aluno_id` | uuid (FK alunos) | YES | Aluno |
| `curso_id` | uuid (FK cursos) | YES | Curso |
| `data_matricula` | timestamptz | NO | Data da matricula |
| `data_inicio_acesso` | date | NO | Inicio do acesso |
| `data_fim_acesso` | date | NO | Fim do acesso |
| `ativo` | boolean | NO | Se esta ativa |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 5.3 Tabela: `turmas` (11 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `curso_id` | uuid (FK cursos) | NO | Curso |
| `nome` | text | NO | Nome da turma |
| `data_inicio` | date | YES | Inicio |
| `data_fim` | date | YES | Fim |
| `acesso_apos_termino` | boolean | YES | Acesso apos fim (default: false) |
| `dias_acesso_extra` | integer | YES | Dias extras de acesso |
| `ativo` | boolean | YES | Se esta ativa |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### 5.4 Tabela: `alunos_turmas` (6 colunas) - Junction Aluno-Turma

| Coluna | Tipo | Descricao |
|---|---|---|
| `aluno_id` | uuid (FK alunos) | Aluno |
| `turma_id` | uuid (FK turmas) | Turma |
| *(+ status, datas de vinculo)* | | |

---

## 6. Progresso do Aluno

### 6.1 Tabela: `progresso_atividades` (13 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | YES | Tenant |
| `aluno_id` | uuid (FK alunos) | YES | Aluno |
| `atividade_id` | uuid (FK atividades) | YES | Atividade |
| `status` | enum_status_atividade | YES | Pendente, Iniciado, Concluido |
| `data_inicio` | timestamptz | YES | Inicio |
| `data_conclusao` | timestamptz | YES | Conclusao |
| `questoes_totais` | integer | YES | Total de questoes |
| `questoes_acertos` | integer | YES | Acertos |
| `dificuldade_percebida` | enum_dificuldade_percebida | YES | Muito Facil..Muito Dificil |
| `anotacoes_pessoais` | text | YES | Anotacoes do aluno |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### 6.2 Tabela: `progresso_flashcards` (11 colunas) - Repeticao Espacada

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `aluno_id` | uuid (FK alunos) | YES | Aluno |
| `flashcard_id` | uuid (FK flashcards) | YES | Flashcard |
| `nivel_facilidade` | float8 | YES | Fator de facilidade (default: 2.5) |
| `dias_intervalo` | integer | YES | Intervalo em dias |
| `data_proxima_revisao` | timestamptz | YES | Proxima revisao |
| `numero_revisoes` | integer | YES | Total de revisoes |
| `ultimo_feedback` | integer | YES | Ultimo feedback (1-5) |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### 6.3 Tabela: `aulas_concluidas` (6 colunas)

| Coluna | Tipo | Descricao |
|---|---|---|
| `aluno_id` | uuid (FK alunos) | Aluno |
| `aula_id` | uuid (FK aulas) | Aula concluida |
| `curso_id` | uuid (FK cursos) | Curso |
| `empresa_id` | uuid (FK empresas) | Tenant |

### 6.4 Tabela: `sessoes_estudo` (16 colunas) - Focus Mode

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | YES | Tenant |
| `aluno_id` | uuid (FK alunos) | YES | Aluno |
| `disciplina_id` | uuid (FK disciplinas) | YES | Disciplina |
| `frente_id` | uuid (FK frentes) | YES | Frente |
| `atividade_relacionada_id` | uuid (FK atividades) | YES | Atividade relacionada |
| `inicio` | timestamptz | YES | Inicio da sessao |
| `fim` | timestamptz | YES | Fim da sessao |
| `tempo_total_bruto_segundos` | integer | YES | Tempo bruto |
| `tempo_total_liquido_segundos` | integer | YES | Tempo liquido (sem pausas) |
| `log_pausas` | jsonb | YES | Log de pausas |
| `metodo_estudo` | text | YES | Metodo utilizado |
| `nivel_foco` | integer | YES | Nivel de foco (1-5) |
| `status` | text | YES | em_andamento, finalizada |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### 6.5 Tabela: `cronogramas` (19 colunas) - Plano de Estudo

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `aluno_id` | uuid (FK alunos) | NO | Aluno |
| `curso_alvo_id` | uuid (FK cursos) | YES | Curso alvo |
| `nome` | text | YES | Nome do cronograma |
| `data_inicio` | date | NO | Inicio |
| `data_fim` | date | NO | Fim |
| `dias_estudo_semana` | integer | NO | Dias por semana |
| `horas_estudo_dia` | numeric | NO | Horas por dia |
| `periodos_ferias` | jsonb | YES | Periodos de ferias |
| `prioridade_minima` | integer | NO | Prioridade minima |
| `modalidade_estudo` | text | NO | Modalidade |
| `disciplinas_selecionadas` | jsonb | NO | Disciplinas selecionadas |
| `modulos_selecionados` | jsonb | YES | Modulos selecionados |
| `excluir_aulas_concluidas` | boolean | NO | Excluir aulas ja feitas |
| `velocidade_reproducao` | numeric | YES | Velocidade de video |
| `ordem_frentes_preferencia` | jsonb | YES | Ordem preferida |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

---

## 7. Agendamentos

Sistema de agendamento de plantoes e mentorias entre professor e aluno.

### 7.1 Tabela: `agendamentos` (16 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `professor_id` | uuid | NO | Professor |
| `aluno_id` | uuid | NO | Aluno |
| `data_inicio` | timestamptz | NO | Inicio |
| `data_fim` | timestamptz | NO | Fim |
| `status` | text | NO | pendente, confirmado, cancelado, etc. |
| `link_reuniao` | text | YES | Link da reuniao |
| `observacoes` | text | YES | Observacoes |
| `motivo_cancelamento` | text | YES | Motivo |
| `cancelado_por` | uuid | YES | Quem cancelou |
| `confirmado_em` | timestamptz | YES | Data de confirmacao |
| `lembrete_enviado` | boolean | YES | Se lembrete foi enviado |
| `lembrete_enviado_em` | timestamptz | YES | Data do lembrete |
| `created_at` | timestamptz | YES | - |
| `updated_at` | timestamptz | YES | - |

### Tabelas Auxiliares de Agendamento

| Tabela | Colunas | Descricao |
|---|---|---|
| `agendamento_recorrencia` | 13 | Padroes de recorrencia de disponibilidade |
| `agendamento_bloqueios` | 10 | Bloqueios (feriados, recessos, etc.) |
| `agendamento_configuracoes` | 10 | Configuracoes por empresa |
| `agendamento_disponibilidade` | 9 | Disponibilidade base do professor |
| `agendamento_notificacoes` | 9 | Notificacoes de agendamento |

---

## 8. Branding e Personalizacao

Cada tenant pode personalizar a aparencia da plataforma.

### 8.1 Tabela: `tenant_branding` (9 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `color_palette_id` | uuid (FK color_palettes) | YES | Paleta de cores |
| `font_scheme_id` | uuid (FK font_schemes) | YES | Esquema de fontes |
| `custom_css` | text | YES | CSS customizado |
| `created_by` | uuid | YES | Criador |
| `updated_by` | uuid | YES | Ultimo editor |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### Tabelas Auxiliares de Branding

| Tabela | Colunas | Descricao |
|---|---|---|
| `color_palettes` | 26 | Paletas de cores (com variaveis de tema) |
| `font_schemes` | 13 | Esquemas de fontes |
| `custom_theme_presets` | 14 | Presets de tema combinados |
| `tenant_logos` | 9 | Logos (login, sidebar, favicon) |
| `module_definitions` | 9 | Definicoes de modulos do sistema |
| `submodule_definitions` | 6 | Definicoes de submodulos |
| `tenant_module_visibility` | 12 | Visibilidade de modulos por tenant |
| `tenant_submodule_visibility` | 12 | Visibilidade de submodulos por tenant |

---

## 9. Comercial (Produtos, Pagamentos, Cupons)

### 9.1 Tabela: `products` (14 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `curso_id` | uuid (FK cursos) | YES | Curso vinculado |
| `name` | text | NO | Nome do produto |
| `description` | text | YES | Descricao |
| `price_cents` | integer | NO | Preco em centavos |
| `currency` | text | NO | Moeda (default: 'BRL') |
| `provider` | text | NO | Provider (default: 'internal') |
| `provider_product_id` | text | YES | ID externo do produto |
| `provider_offer_id` | text | YES | ID externo da oferta |
| `active` | boolean | NO | Se esta ativo |
| `metadata` | jsonb | YES | Metadados extras |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 9.2 Tabela: `transactions` (22 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `aluno_id` | uuid (FK alunos) | YES | Aluno comprador |
| `product_id` | uuid (FK products) | YES | Produto |
| `coupon_id` | uuid (FK coupons) | YES | Cupom aplicado |
| `provider` | text | NO | Provider (default: 'manual') |
| `provider_transaction_id` | text | YES | ID externo |
| `status` | transaction_status | NO | pending, approved, cancelled, refunded, disputed, chargeback |
| `amount_cents` | integer | NO | Valor em centavos |
| `currency` | text | NO | Moeda (BRL) |
| `payment_method` | payment_method | YES | credit_card, pix, boleto, etc. |
| `installments` | integer | YES | Parcelas |
| `buyer_email` | text | NO | Email do comprador |
| `buyer_name` | text | YES | Nome |
| `buyer_document` | text | YES | Documento (CPF) |
| `provider_data` | jsonb | YES | Dados do provider |
| `sale_date` | timestamptz | NO | Data da venda |
| `confirmation_date` | timestamptz | YES | Data de confirmacao |
| `refund_date` | timestamptz | YES | Data de reembolso |
| `refund_amount_cents` | integer | YES | Valor reembolsado |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 9.3 Tabela: `coupons` (13 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `code` | text | NO | Codigo do cupom |
| `description` | text | YES | Descricao |
| `discount_type` | discount_type | NO | percentage ou fixed |
| `discount_value` | numeric | NO | Valor do desconto |
| `max_uses` | integer | YES | Maximo de usos |
| `current_uses` | integer | NO | Usos atuais |
| `valid_from` | timestamptz | NO | Valido a partir de |
| `valid_until` | timestamptz | YES | Valido ate |
| `active` | boolean | NO | Se esta ativo |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

### 9.4 Tabela: `payment_providers` (11 colunas)

| Coluna | Tipo | Nullable | Descricao |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `empresa_id` | uuid (FK) | NO | Tenant |
| `provider` | text | NO | Nome do provider |
| `name` | text | NO | Nome de exibicao |
| `credentials` | jsonb | YES | Credenciais (criptografadas) |
| `webhook_secret` | text | YES | Secret do webhook |
| `webhook_url` | text | YES | URL do webhook |
| `provider_account_id` | text | YES | ID da conta no provider |
| `active` | boolean | NO | Se esta ativo |
| `created_at` | timestamptz | NO | - |
| `updated_at` | timestamptz | NO | - |

---

## 10. Chat e IA

### 10.1 Tabela: `chat_conversations` (9 colunas)

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid | PK |
| `empresa_id` | uuid (FK) | Tenant |
| *(+ user_id, titulo, contexto, etc.)* | | |

### 10.2 Tabela: `chat_conversation_history` (6 colunas)

| Coluna | Tipo | Descricao |
|---|---|---|
| `conversation_id` | uuid (FK chat_conversations) | Conversa |
| `empresa_id` | uuid (FK) | Tenant |
| *(+ role, content, etc.)* | | |

### 10.3 Tabela: `ai_agents` (21 colunas)

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | uuid | PK |
| `empresa_id` | uuid (FK) | Tenant |
| *(+ nome, modelo, system_prompt, configuracoes, etc.)* | | |

---

## 11. Enums do Sistema

| Enum | Valores | Uso |
|---|---|---|
| `enum_plano_empresa` | basico, profissional, enterprise | Plano da empresa |
| `enum_modalidade` | EAD, LIVE | Modalidade do curso |
| `enum_tipo_curso` | Superextensivo, Extensivo, Intensivo, Superintensivo, Revisao | Tipo do curso |
| `enum_tipo_atividade` | Nivel_1, Nivel_2, Nivel_3, Nivel_4, Conceituario, Lista_Mista, Simulado_Diagnostico, Simulado_Cumulativo, Simulado_Global, Flashcards, Revisao | Tipo de atividade |
| `enum_status_atividade` | Pendente, Iniciado, Concluido | Status de progresso |
| `enum_dificuldade_percebida` | Muito Facil, Facil, Medio, Dificil, Muito Dificil | Percepcao de dificuldade |
| `enum_importancia_modulo` | Alta, Media, Baixa, Base | Importancia do modulo |
| `enum_tipo_material` | Apostila, Lista de Exercicios, Planejamento, Resumo, Gabarito, Outros | Tipo de material |
| `enum_tipo_servico_agendamento` | plantao, mentoria | Tipo de agendamento |
| `enum_tipo_bloqueio` | feriado, recesso, imprevisto, outro | Tipo de bloqueio |
| `enum_logo_type` | login, sidebar, favicon | Tipo de logo |
| `enum_status_aluno_turma` | ativo, concluido, cancelado, trancado | Status do aluno na turma |
| `transaction_status` | pending, approved, cancelled, refunded, disputed, chargeback | Status da transacao |
| `payment_method` | credit_card, debit_card, pix, boleto, bank_transfer, other | Metodo de pagamento |
| `discount_type` | percentage, fixed | Tipo de desconto |

---

## 12. Mapa Completo de Tabelas

### Tabelas com `empresa_id` NOT NULL (isolamento total)

| Tabela | Colunas | Dominio |
|---|---|---|
| `empresas` | 14 | Tenant raiz |
| `alunos` | 25 | Usuarios |
| `professores` | 13 | Usuarios (legado) |
| `usuarios` | 15 | Usuarios (moderno) |
| `papeis` | 9 | RBAC |
| `cursos` | 18 | Academico |
| `disciplinas` | 6 | Academico |
| `segmentos` | 7 | Academico |
| `frentes` | 7 | Academico |
| `modulos` | 8 | Academico |
| `aulas` | 11 | Academico |
| `atividades` | 13 | Academico |
| `flashcards` | 8 | Academico |
| `materiais_curso` | 11 | Academico |
| `regras_atividades` | 12 | Academico |
| `cronogramas` | 19 | Progresso |
| `progresso_flashcards` | 11 | Progresso |
| `agendamentos` | 16 | Agendamento |
| `agendamento_recorrencia` | 13 | Agendamento |
| `agendamento_bloqueios` | 10 | Agendamento |
| `agendamento_configuracoes` | 10 | Agendamento |
| `agendamento_disponibilidade` | 9 | Agendamento |
| `agendamento_notificacoes` | 9 | Agendamento |
| `tenant_branding` | 9 | Branding |
| `color_palettes` | 26 | Branding |
| `font_schemes` | 13 | Branding |
| `custom_theme_presets` | 14 | Branding |
| `tenant_module_visibility` | 12 | Branding |
| `tenant_submodule_visibility` | 12 | Branding |
| `products` | 14 | Comercial |
| `transactions` | 22 | Comercial |
| `coupons` | 13 | Comercial |
| `payment_providers` | 11 | Comercial |
| `chat_conversations` | 9 | Chat/IA |
| `chat_conversation_history` | 6 | Chat/IA |
| `ai_agents` | 21 | Chat/IA |
| `turmas` | 11 | Matriculas |

### Tabelas de Junction (sem empresa_id direto)

| Tabela | Colunas | Relacao |
|---|---|---|
| `alunos_cursos` | 3 | Aluno N:N Curso |
| `alunos_turmas` | 6 | Aluno N:N Turma |
| `cursos_disciplinas` | 3 | Curso N:N Disciplina |
| `professores_disciplinas` | 11 | Professor N:N Disciplina/Frente/Modulo |
| `usuarios_disciplinas` | 11 | Usuario N:N Disciplina/Frente/Modulo |
| `empresa_admins` | 5 | Empresa N:N Admin |

### Tabelas Auxiliares

| Tabela | Colunas | Descricao |
|---|---|---|
| `api_keys` | 9 | Chaves de API |
| `cronograma_itens` | 9 | Itens do cronograma |
| `cronograma_semanas_dias` | 5 | Dias da semana do cronograma |
| `cronograma_tempo_estudos` | 9 | Tempo de estudo por disciplina |
| `aulas_concluidas` | 6 | Aulas marcadas como concluidas |
| `matriculas` | 10 | Matriculas formais |
| `progresso_atividades` | 13 | Progresso em atividades |
| `sessoes_estudo` | 16 | Sessoes de estudo (focus mode) |
| `module_definitions` | 9 | Definicoes de modulos da plataforma |
| `submodule_definitions` | 6 | Definicoes de submodulos |
| `tenant_logos` | 9 | Logos do tenant |

---

## 13. Row Level Security (RLS)

Todas as tabelas tem RLS habilitado. O modelo usa **funcoes auxiliares** no PostgreSQL para simplificar as policies.

### 13.1 Funcoes Auxiliares

| Funcao | Descricao | Arquivo |
|---|---|---|
| `get_user_empresa_id()` | Retorna `empresa_id` do usuario logado (via `professores` ou `usuarios`) | [20251217105924](supabase/migrations/20251217105924_create_empresas_table.sql) |
| `is_empresa_admin(user_id, empresa_id)` | Verifica se usuario e admin de uma empresa | [20251217105926](supabase/migrations/20251217105926_create_empresa_admins.sql) |
| `is_empresa_admin()` | Verifica se usuario logado e admin da propria empresa | [20251217105926](supabase/migrations/20251217105926_create_empresa_admins.sql) |
| `user_belongs_to_empresa(empresa_id)` | Verifica se usuario pertence a empresa | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |
| `aluno_matriculado_empresa(empresa_id)` | Verifica se aluno esta matriculado na empresa | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |
| `get_aluno_empresas()` | Retorna empresas do aluno (via matriculas) | [20251217105927](supabase/migrations/20251217105927_create_empresa_context_functions.sql) |

### 13.2 Padrao de RLS por Operacao

| Operacao | Quem pode | Logica |
|---|---|---|
| **SELECT** | Usuarios da mesma empresa + Superadmin | `empresa_id = get_user_empresa_id()` OU superadmin |
| **INSERT** | Admin da empresa + Superadmin | `is_empresa_admin()` OU superadmin |
| **UPDATE** | Criador do recurso OU admin da empresa + Superadmin | `created_by = auth.uid()` OU admin OU superadmin |
| **DELETE** | Admin da empresa + Superadmin | `is_empresa_admin()` OU superadmin |

### 13.3 Verificacao de Superadmin

Em todas as policies:
```sql
exists (
  select 1 from auth.users
  where id = auth.uid()
  and raw_user_meta_data->>'role' = 'superadmin'
)
```

---

## 14. Autenticacao e Autorizacao

### 14.1 Metodos de Autenticacao

| Metodo | Header | Uso |
|---|---|---|
| **JWT (Supabase Auth)** | `Authorization: Bearer <token>` | Interface web (usuarios e alunos) |
| **API Key** | `X-API-Key: sk_live_...` | Integracoes externas |

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
   - superadmin: sem lookup adicional
7. Retorna AppUser com contexto completo
```

### 14.3 Interface AppUser

```typescript
interface AppUser {
  id: string;
  email: string;
  role: AppUserRole;        // aluno | usuario | superadmin
  roleType?: RoleTipo;      // professor | professor_admin | staff | admin | monitor
  permissions?: RolePermissions;
  fullName?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
  empresaId?: string;       // Tenant ID
  empresaSlug?: string;     // Tenant slug
  empresaNome?: string;     // Tenant name
}
```

**Codigo-fonte**: [user.ts:18-32](app/shared/types/entities/user.ts#L18-L32)

### 14.4 Niveis de Cliente Supabase

| Nivel | Funcao | RLS | Uso |
|---|---|---|---|
| **Service Role** | `getDatabaseClient()` | Bypass | Server-side, acoes administrativas |
| **User-Scoped** | `getDatabaseClientAsUser(token)` | Respeita | Client-side, acoes do usuario |

### 14.5 Impersonacao

Superadmins podem visualizar a plataforma como outro usuario (aluno ou professor) sem perder o contexto real.

**Codigo-fonte**: [auth.ts:40-135](app/shared/core/auth.ts#L40-L135), [auth-impersonate.ts](app/shared/core/auth-impersonate.ts)

---

## 15. Resolucao de Tenant

O sistema resolve o tenant ativo por **3 mecanismos**, com cache em memoria (TTL 5 min):

| Prioridade | Mecanismo | Exemplo | Lookup |
|---|---|---|---|
| 1 | **Dominio customizado** | escola.com.br | `empresas.dominio_customizado` |
| 2 | **Subdominio** | escola.aluminify.com.br | `empresas.subdomain` |
| 3 | **Slug (dev)** | /escola/dashboard | `empresas.slug` |

**Codigo-fonte**: [tenant-resolver.service.ts](app/[tenant]/(modules)/empresa/services/tenant-resolver.service.ts)

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
