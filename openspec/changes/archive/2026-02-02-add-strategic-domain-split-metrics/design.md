## Contexto
O card `Domínio Estratégico` atualmente consome `strategicDomain` do endpoint de dashboard do aluno. O backend retorna valores mockados:
- `baseModules: 90`
- `highRecurrence: 60`

Queremos:
1) Alimentar com dados reais já existentes.
2) Separar memória (flashcards) de aplicação (questões) para orientar estudo.

## Fontes de dados (existentes)
- Conteúdo/hierarquia:
  - `modulos` (usa `importancia`: `Base`, `Alta`, etc.)
  - `frentes`, `disciplinas`
- Flashcards:
  - `flashcards` (tem `modulo_id`)
  - `progresso_flashcards` (tem `aluno_id`, `flashcard_id`, `ultimo_feedback`, `updated_at`, `data_proxima_revisao`, etc.)
- Questões (atividades):
  - `atividades` (tem `modulo_id`, `tipo`)
  - `progresso_atividades` (tem `aluno_id`, `atividade_id`, `status`, `questoes_totais`, `questoes_acertos`)

## Definições de eixos estratégicos
- **Módulos de Base**: módulos com `modulos.importancia = 'Base'`
- **Alta Recorrência**: módulos com `modulos.importancia = 'Alta'`

## Métricas
### 1) Flashcards (memória)
Objetivo: medir “qualidade de lembrança” do aluno.

Entrada:
- `ultimo_feedback` em `progresso_flashcards`:
  - 1 = Errei
  - 2 = Acertei parcial
  - 3 = Acertei com dificuldade
  - 4 = Acertei fácil

Score (0–100), por eixo:
- Selecionar flashcards cujo `flashcards.modulo_id` esteja no conjunto do eixo.
- Considerar apenas registros do aluno (`progresso_flashcards.aluno_id = alunoId`).
- Fórmula simples e explicável (v1):
  - `flashcardsScore = round( avg(ultimo_feedback) / 4 * 100 )`
- Se não houver registros: `flashcardsScore = null` (sem evidência).

Opcional (v1.1): ponderar por recência usando `updated_at` (ex.: peso maior nos últimos 30 dias).

### 2) Questões/Atividades (aplicação)
Objetivo: medir desempenho em aplicação por prática.

Entrada:
- `progresso_atividades` com:
  - `status = 'Concluido'`
  - `questoes_totais > 0`
  - `questoes_acertos` válido
- Join em `atividades(modulo_id)` para atribuir o resultado ao módulo.

Score (0–100), por eixo:
- `questionsScore = round( sum(questoes_acertos) / sum(questoes_totais) * 100 )`
- Se não houver dados: `questionsScore = null`.

Opcional (v1.1):
- Exibir breakdown por `atividades.tipo` (Nivel_1/2/3, Simulados, etc.) — sem mudar o score principal.

## Recomendações (“o que fazer agora”)
Objetivo: transformar painel em guia.

Saída: top N (ex.: 3) módulos priorizados por:
1) Eixo (Base vs Alta)
2) Pior “risco” primeiro

Heurística simples (v1):
- Para cada módulo, calcular:
  - `moduleFlashcardsScore` (média do feedback / 4 * 100, se houver)
  - `moduleQuestionsScore` (acertos/totais * 100, se houver)
- Definir `moduleRisk`:
  - Se ambos existem: `moduleRisk = min(moduleFlashcardsScore, moduleQuestionsScore)`
  - Se só um existe: `moduleRisk = esse score`
  - Se nenhum existe: `moduleRisk = null` e módulo não entra no ranking (ou entra em “sem dados”).
- Ordenar crescente por `moduleRisk` e retornar os piores.

Cada recomendação deve vir com:
- `moduloId`, `moduloNome`
- `importancia` (`Base`/`Alta`)
- `flashcardsScore?`, `questionsScore?`
- `reason`: string curta (ex.: “Flashcards baixos (muitos erros)” / “Acurácia baixa em questões”)

## Shape do payload (proposto)
Atual `StrategicDomain` é:
- `baseModules: number`
- `highRecurrence: number`

Proposto:
```ts
type StrategicDomainAxis = {
  flashcardsScore: number | null
  questionsScore: number | null
}

type StrategicDomainRecommendation = {
  moduloId: string
  moduloNome: string
  importancia: 'Base' | 'Alta' | 'Media' | 'Baixa'
  flashcardsScore: number | null
  questionsScore: number | null
  reason: string
}

type StrategicDomain = {
  baseModules: StrategicDomainAxis
  highRecurrence: StrategicDomainAxis
  recommendations: StrategicDomainRecommendation[]
}
```

Compatibilidade:
- O frontend será atualizado junto para usar o novo shape.

## Considerações de multi-tenant / escopo
- Filtrar módulos pelo(s) curso(s) do aluno via `alunos_cursos` e `modulos.curso_id` quando aplicável.
- Aceitar `modulos.curso_id is null` como conteúdo compartilhado (se esse for o padrão já usado no app).

## Performance
- Consultas agregadas por eixo (Base/Alta) e por módulo para recomendações.
- Aplicar cache curto (ex.: 30–120s) no serviço do dashboard se necessário.

