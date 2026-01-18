# Design: Modelagem de Turmas e Professor-Disciplina

## Context

O sistema Aluminify atende **cursos livres** (preparatórios para ENEM, concursos, residência médica) - não escolas regulares. A hierarquia de negócio é:

```
Empresa (Tenant/Cursinho)
├── Segmentos (ex: "ENEM", "Concursos")
├── Disciplinas (ex: "Matemática", "Português") - globais da empresa
│   └── Cronograma base da disciplina
├── Cursos (ex: "Extensivo ENEM 2025") - com data_inicio e data_fim
│   ├── cursos_disciplinas (N:N)
│   └── Turmas (opcional) - ex: "Manhã", "Tarde"
│       └── alunos_turmas (N:N)
├── Professores
│   └── professores_disciplinas (flexível: geral, curso, turma, frente, módulo)
└── Alunos
    ├── Cronograma inteligente (gerado pelo aluno)
    ├── Progresso (professor vê só da disciplina dele)
    └── Chat (isolado por empresa)
```

## Goals / Non-Goals

### Goals
- Permitir múltiplas turmas por curso (manhã, tarde, noturno)
- Vincular professores a disciplinas com flexibilidade de escopo
- Permitir que empresa configure acesso contínuo de alunos
- Garantir que professor veja apenas dados de suas disciplinas
- Isolar chat por tenant (empresa_id)

### Non-Goals
- Complexidade de professor substituto (não necessário - apenas desvincular e vincular outro)
- Turmas obrigatórias (cursos podem ter turma única = curso)
- Hierarquia de permissões complexa entre professores

## Decisions

### 1. Turmas são opcionais por curso

**Decisão**: Um curso pode ter 0 ou N turmas. Se não tiver turmas, aluno é vinculado diretamente ao curso via `alunos_cursos`.

**Alternativa considerada**: Forçar sempre uma turma "default" por curso.
**Razão**: Aumentaria complexidade desnecessariamente para cursos simples.

### 2. Vínculo professor-disciplina com escopo flexível

**Decisão**: Tabela `professores_disciplinas` com campos opcionais `curso_id`, `turma_id`, `frente_id`, `modulo_id`.

```sql
-- Professor leciona Matemática em toda a empresa
INSERT INTO professores_disciplinas (professor_id, disciplina_id, empresa_id) VALUES (...);

-- Professor leciona Matemática apenas no curso "Extensivo 2025"
INSERT INTO professores_disciplinas (professor_id, disciplina_id, empresa_id, curso_id) VALUES (...);

-- Professor leciona Matemática apenas na frente "Álgebra" do curso
INSERT INTO professores_disciplinas (professor_id, disciplina_id, empresa_id, curso_id, frente_id) VALUES (...);
```

**Alternativa considerada**: Tabelas separadas para cada nível de escopo.
**Razão**: Mais flexível e simples de consultar com uma única tabela.

### 3. Configuração de acesso contínuo via JSONB

**Decisão**: Usar campo `empresas.configuracoes` (JSONB existente) para armazenar:
```json
{
  "aluno_acesso_continuo_sistema": true,
  "aluno_acesso_continuo_cursos": false,
  "dias_acesso_apos_curso": 30
}
```

**Alternativa considerada**: Nova tabela `empresa_configuracoes`.
**Razão**: Já existe campo JSONB na tabela empresas, evita join adicional.

### 4. Helper function para verificar professor da disciplina

**Decisão**: Criar função `is_professor_da_disciplina(disciplina_id)` que verifica se o usuário atual é professor vinculado à disciplina, considerando todos os escopos.

```sql
CREATE FUNCTION is_professor_da_disciplina(p_disciplina_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM professores_disciplinas pd
    WHERE pd.professor_id = auth.uid()
      AND pd.disciplina_id = p_disciplina_id
      AND pd.ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| Performance em queries com muitos escopos | Criar índices compostos em professores_disciplinas |
| Backfill de empresa_id em chat pode falhar se user não tem perfil | Usar LEFT JOIN e marcar como null, tratar depois |
| Professor sem vínculo não vê nada | Documentar que admin precisa vincular professor às disciplinas |

## Migration Plan

1. **Criar tabelas novas** (turmas, alunos_turmas, professores_disciplinas) - não afeta dados existentes
2. **Adicionar empresa_id ao chat** com backfill via user_id
3. **Criar helper functions** para RLS
4. **Atualizar RLS policies** para usar novas funções
5. **Gerar types** atualizados

**Rollback**: Todas as alterações são aditivas, rollback consiste em remover as novas tabelas e reverter policies.

## Schema Final

```sql
-- Turmas (opcional por curso)
CREATE TABLE turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  curso_id uuid NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_inicio date,
  data_fim date,
  acesso_apos_termino boolean DEFAULT false,
  dias_acesso_extra integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Alunos em turmas
CREATE TABLE alunos_turmas (
  aluno_id uuid REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id uuid REFERENCES turmas(id) ON DELETE CASCADE,
  data_entrada date DEFAULT CURRENT_DATE,
  data_saida date,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado', 'trancado')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (aluno_id, turma_id)
);

-- Professores vinculados a disciplinas (flexível)
CREATE TABLE professores_disciplinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  curso_id uuid REFERENCES cursos(id) ON DELETE CASCADE,
  turma_id uuid REFERENCES turmas(id) ON DELETE CASCADE,
  frente_id uuid REFERENCES frentes(id) ON DELETE CASCADE,
  modulo_id uuid REFERENCES modulos(id) ON DELETE CASCADE,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (professor_id, disciplina_id, curso_id, turma_id, frente_id, modulo_id)
);
```

## Open Questions

- Nenhuma questão aberta - requisitos foram clarificados com o usuário.
