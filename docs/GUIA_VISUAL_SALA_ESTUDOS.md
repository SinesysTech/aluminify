# 📚 Guia Visual: Como Funciona a Sala de Estudos

## 🎯 Visão Geral Simplificada

A **Sala de Estudos** é como um **checklist inteligente** que mostra todas as atividades dos cursos em que o aluno está matriculado, permitindo que ele acompanhe seu progresso de forma visual e organizada.

---

## 🔄 Fluxo Completo (Passo a Passo)

### 📍 **FASE 1: Quando o Aluno Acessa a Página**

```
┌─────────────────────────────────────────────────────────┐
│  Aluno acessa: /aluno/sala-de-estudos                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  1. Sistema identifica quem é o usuário                │
│     - Busca dados do usuário autenticado                │
│     - Detecta role: "aluno" ou "professor"              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Busca cursos do aluno                               │
│     ALUNO: Via matrículas ativas                        │
│     PROFESSOR: Todos os cursos                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Para cada curso, busca:                             │
│     • Disciplinas → Frentes → Módulos → Atividades      │
│     • Progresso do aluno em cada atividade              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. Agrupa tudo em estrutura hierárquica:               │
│     Curso                                               │
│       └── Disciplina                                    │
│             └── Frente                                  │
│                   └── Módulo                            │
│                         └── Atividade (com progresso)   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. Calcula estatísticas:                               │
│     • Total de atividades                               │
│     • Pendentes, Iniciadas, Concluídas                  │
│     • Percentual de conclusão                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  6. Exibe na tela:                                      │
│     • Card de estatísticas                              │
│     • Filtros (Curso > Disciplina > Frente)             │
│     • Lista de atividades em accordions                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Detalhamento: Como Busca os Dados

### **Para ALUNOS** (Passo a Passo)

#### **Passo 1: Buscar Matrículas Ativas**

```sql
-- Função RPC (evita problemas de segurança)
get_matriculas_aluno(aluno_id)

-- Retorna apenas matrículas ATIVAS
SELECT curso_id FROM matriculas
WHERE aluno_id = 'xxx' AND ativo = true
```

**Por que RPC?**
- Evita problemas de permissão (RLS)
- Mais seguro
- Executa com privilégios elevados

**Resultado**: Lista de `curso_id` dos cursos ativos do aluno
```
curso_ids = ['curso-medicina-2024', 'curso-residencia']
```

---

#### **Passo 2: Buscar Relacionamento Curso-Disciplina**

```sql
SELECT disciplina_id, curso_id 
FROM cursos_disciplinas
WHERE curso_id IN ('curso-medicina-2024', 'curso-residencia')
```

**Resultado**: Quais disciplinas pertencem a cada curso
```
[
  { curso_id: 'curso-medicina-2024', disciplina_id: 'anatomia' },
  { curso_id: 'curso-medicina-2024', disciplina_id: 'fisiologia' },
  { curso_id: 'curso-residencia', disciplina_id: 'clinica' }
]
```

**Extrair disciplinas únicas**: `['anatomia', 'fisiologia', 'clinica']`

---

#### **Passo 3: Buscar Frentes**

```sql
SELECT id, nome, disciplina_id, curso_id
FROM frentes
WHERE disciplina_id IN ('anatomia', 'fisiologia', 'clinica')
  AND (curso_id IN ('curso-medicina-2024', ...) OR curso_id IS NULL)
```

**Lógica**: 
- Frente pode pertencer a um curso específico OU ser global (null)
- Filtrar apenas frentes dos cursos do aluno ou globais

**Resultado**: Lista de frentes
```
[
  { id: 'sistema-muscular', nome: 'Sistema Muscular', disciplina_id: 'anatomia', curso_id: 'curso-medicina-2024' },
  { id: 'sistema-nervoso', nome: 'Sistema Nervoso', disciplina_id: 'anatomia', curso_id: null }  -- Global
]
```

---

#### **Passo 4: Buscar Módulos**

```sql
SELECT id, nome, numero_modulo, frente_id
FROM modulos
WHERE frente_id IN ('sistema-muscular', 'sistema-nervoso', ...)
ORDER BY numero_modulo ASC
```

**Ordenação**: Por `numero_modulo` (ordem didática: 1, 2, 3...)

**Resultado**: Módulos ordenados
```
[
  { id: 'modulo-1', nome: 'Introdução', numero_modulo: 1, frente_id: 'sistema-muscular' },
  { id: 'modulo-2', nome: 'Avançado', numero_modulo: 2, frente_id: 'sistema-muscular' }
]
```

---

#### **Passo 5: Buscar Atividades**

```sql
SELECT *
FROM atividades
WHERE modulo_id IN ('modulo-1', 'modulo-2', ...)
ORDER BY ordem_exibicao ASC
```

**Ordenação**: Por `ordem_exibicao` (ordem didática: 1, 2, 3...)

**Resultado**: Atividades ordenadas
```
[
  { id: 'atividade-1', titulo: 'Conceituário', modulo_id: 'modulo-1', ordem_exibicao: 1, arquivo_url: 'url-pdf' },
  { id: 'atividade-2', titulo: 'Lista N1', modulo_id: 'modulo-1', ordem_exibicao: 2, arquivo_url: null },
  { id: 'atividade-3', titulo: 'Simulado', modulo_id: 'modulo-1', ordem_exibicao: 3, arquivo_url: 'url-pdf' }
]
```

---

#### **Passo 6: Buscar Progresso do Aluno**

```sql
SELECT atividade_id, status, data_inicio, data_conclusao
FROM progresso_atividades
WHERE aluno_id = 'aluno-123'
  AND atividade_id IN ('atividade-1', 'atividade-2', 'atividade-3')
```

**Resultado**: Progresso de cada atividade
```
[
  { atividade_id: 'atividade-1', status: 'Concluido', data_inicio: '2025-01-20', data_conclusao: '2025-01-25' },
  { atividade_id: 'atividade-2', status: 'Iniciado', data_inicio: '2025-01-28', data_conclusao: null },
  -- atividade-3 não tem progresso ainda (será null)
]
```

**Criar Mapa para Lookup Rápido**:
```javascript
progressosMap = {
  'atividade-1': { status: 'Concluido', data_inicio: '...', data_conclusao: '...' },
  'atividade-2': { status: 'Iniciado', data_inicio: '...', data_conclusao: null }
}
```

---

#### **Passo 7: Buscar Informações Adicionais**

```sql
-- Disciplinas (para nomes completos)
SELECT id, nome FROM disciplinas WHERE id IN (...)

-- Cursos (para nomes completos)
SELECT id, nome FROM cursos WHERE id IN (...)
```

---

#### **Passo 8: Montar Estrutura Completa**

Para cada atividade, juntar todas as informações:

```javascript
atividadeCompleta = {
  // Dados da atividade
  id: 'atividade-1',
  titulo: 'Conceituário',
  arquivoUrl: 'url-pdf',
  
  // Hierarquia (nomes completos)
  cursoNome: 'Medicina 2024',
  disciplinaNome: 'Anatomia',
  frenteNome: 'Sistema Muscular',
  moduloNome: 'Introdução',
  moduloNumero: 1,
  
  // Progresso
  progressoStatus: 'Concluido',
  progressoDataInicio: '2025-01-20',
  progressoDataConclusao: '2025-01-25'
}
```

---

#### **Passo 9: Ordenar**

Ordenar por:
1. **Curso** (A-Z)
2. **Disciplina** (A-Z)
3. **Frente** (A-Z)
4. **Módulo** (número: 1, 2, 3...)
5. **Atividade** (ordem_exibicao: 1, 2, 3...)

**Garantir ordem didática correta!**

---

#### **Passo 10: Agrupar Hierarquicamente**

Organizar em estrutura de árvore:

```javascript
[
  {
    id: 'curso-medicina',
    nome: 'Medicina 2024',
    disciplinas: [
      {
        id: 'anatomia',
        nome: 'Anatomia',
        frentes: [
          {
            id: 'sistema-muscular',
            nome: 'Sistema Muscular',
            modulos: [
              {
                id: 'modulo-1',
                nome: 'Introdução',
                numeroModulo: 1,
                atividades: [
                  {
                    id: 'atividade-1',
                    titulo: 'Conceituário',
                    progressoStatus: 'Concluido'
                  },
                  {
                    id: 'atividade-2',
                    titulo: 'Lista N1',
                    progressoStatus: 'Iniciado'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

---

## 📊 Contabilização de Progresso

### **Como Calcula as Estatísticas**

#### **1. Contagem Simples**

```javascript
// Para todas as atividades
totalAtividades = atividades.length  // Ex: 45

// Filtrar por status
pendentes = atividades.filter(a => !a.progressoStatus || a.progressoStatus === 'Pendente').length  // Ex: 30
iniciadas = atividades.filter(a => a.progressoStatus === 'Iniciado').length  // Ex: 10
concluidas = atividades.filter(a => a.progressoStatus === 'Concluido').length  // Ex: 5
```

#### **2. Cálculo de Percentual**

```javascript
percentual = (concluidas / totalAtividades) * 100
// Ex: (5 / 45) * 100 = 11.11%
```

#### **3. Contadores por Módulo**

Para cada módulo, conta atividades concluídas:

```javascript
modulo = {
  atividades: [
    { progressoStatus: 'Concluido' },
    { progressoStatus: 'Concluido' },
    { progressoStatus: 'Iniciado' },
    { progressoStatus: 'Pendente' },
    { progressoStatus: 'Pendente' }
  ]
}

atividadesConcluidas = modulo.atividades.filter(a => a.progressoStatus === 'Concluido').length  // 2
totalAtividades = modulo.atividades.length  // 5
percentual = (2 / 5) * 100  // 40%
```

**Exibe**: "2/5 atividades concluídas (40%)"

---

### **Com Filtros Ativos**

Quando o aluno filtra por curso/disciplina/frente:

**Lógica**:
1. Aplica filtros nas atividades
2. Recalcula estatísticas apenas com atividades filtradas
3. Mostra contadores filtrados + total geral

```javascript
// Atividades filtradas (ex: apenas "Anatomia")
atividadesFiltradas = atividades.filter(/* filtros */)  // Ex: 10 atividades

// Estatísticas filtradas
concluidasFiltradas = atividadesFiltradas.filter(a => a.progressoStatus === 'Concluido').length  // Ex: 3

// Exibe: "3/10 atividades concluídas (de 45 totais)"
```

---

## ✅ Atualização de Progresso

### **Fluxo Quando Aluno Marca como Concluído**

```
┌─────────────────────────────────────────────────────────┐
│  Aluno clica no checkbox da atividade                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  1. Determinar novo status:                             │
│     Checkbox marcado → 'Concluido'                      │
│     Checkbox desmarcado → 'Pendente' ou 'Iniciado'      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Preparar dados de atualização:                      │
│     {                                                    │
│       status: 'Concluido',                              │
│       data_conclusao: '2025-01-31T10:30:00Z',          │
│       data_inicio: '2025-01-30T09:00:00Z' (se houver)  │
│     }                                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Verificar se já existe progresso:                   │
│     SELECT id FROM progresso_atividades                 │
│     WHERE aluno_id = 'xxx' AND atividade_id = 'yyy'     │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  Existe?         │          │  Não existe?     │
│  → ATUALIZAR     │          │  → CRIAR NOVO    │
└──────────────────┘          └──────────────────┘
        ↓                               ↓
┌─────────────────────────────────────────────────────────┐
│  4. Atualizar/Criar no banco:                           │
│     UPDATE/INSERT progresso_atividades                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. Atualizar UI otimisticamente:                       │
│     • Marcar checkbox                                    │
│     • Mudar badge para "Concluído"                       │
│     • Mostrar data de conclusão                          │
│     • Atualizar estatísticas (5 → 6 concluídas)         │
│     • Recalcular percentuais                             │
└─────────────────────────────────────────────────────────┘
```

---

### **Dados Salvos no Banco**

**Tabela**: `progresso_atividades`

```sql
INSERT INTO progresso_atividades (
  aluno_id,
  atividade_id,
  status,
  data_inicio,
  data_conclusao
) VALUES (
  'aluno-123',
  'atividade-1',
  'Concluido',
  '2025-01-30 09:00:00',
  '2025-01-31 10:30:00'
)
```

**Campos importantes**:
- `status`: 'Pendente' | 'Iniciado' | 'Concluido'
- `data_inicio`: Quando aluno começou
- `data_conclusao`: Quando aluno terminou

---

## 🎨 Como Exibe na Tela

### **Estrutura Visual**

```
┌─────────────────────────────────────────────────────────────┐
│  Sala de Estudos                                            │
│  Checklist e acompanhamento do seu progresso nas atividades │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Filtros]                                                  │
│  [Curso ▼]  [Disciplina ▼]  [Frente ▼]                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 Progresso Geral                                         │
│                                                              │
│  5/45 atividades concluídas (11%)                           │
│  ████████░░░░░░░░░░░░░░░░░░░                                │
│                                                              │
│  Concluídas: 5  |  Iniciadas: 10  |  Pendentes: 30          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Medicina 2024                                              │
│  └── Anatomia                                               │
│       └── Sistema Muscular                                  │
│            └── ▼ Módulo 1: Introdução (2/5 - 40%)          │
│                 ├── ☑ Conceituário (Concluído)              │
│                 ├── ⏸ Lista N1 (Iniciado)                  │
│                 ├── ☐ Lista N2 (Pendente)                   │
│                 └── ☐ Simulado (Pendente)                   │
└─────────────────────────────────────────────────────────────┘
```

---

### **Estados Visuais**

#### **1. Atividade Pendente** (Estado inicial)
```
┌────────────────────────────────────────┐
│  ☐ Lista N1 (Pendente)                │
│  [👁 Visualizar PDF] [▶ Iniciar]      │
└────────────────────────────────────────┘
```

#### **2. Atividade Iniciada**
```
┌────────────────────────────────────────┐
│  ⏸ Lista N1 (Iniciado)                │
│  Início: 30/01/2025                    │
│  [👁 Visualizar PDF] [☑ Marcar Concluído] │
└────────────────────────────────────────┘
```

#### **3. Atividade Concluída**
```
┌────────────────────────────────────────┐
│  ☑ Lista N1 (Concluído)               │
│  Concluído em: 31/01/2025              │
│  [👁 Visualizar PDF]                   │
└────────────────────────────────────────┘
```

#### **4. Atividade Sem Arquivo**
```
┌────────────────────────────────────────┐
│  ☐ Lista N2 (Pendente)                │
│  📄 Arquivo ainda não disponível      │
│  [🚫 Visualizar PDF] (desabilitado)   │
└────────────────────────────────────────┘
```

---

## 🔐 Segurança (RLS)

### **Quem Pode Ver O Quê**

#### **Tabela `atividades`**
- ✅ **Todos podem ler** (alunos, professores, superadmins)
- ✅ **Apenas professores podem criar/editar**

#### **Tabela `progresso_atividades`**
- ✅ **Aluno vê apenas seu próprio progresso**
  ```sql
  -- Política RLS
  SELECT * FROM progresso_atividades
  WHERE aluno_id = auth.uid()  -- Apenas do próprio aluno
  ```
- ✅ **Aluno pode criar/editar apenas seu próprio progresso**
- ✅ **Professor pode ver progresso de qualquer aluno**

---

## 🚀 Performance

### **Otimizações Implementadas**

1. **Múltiplas Queries Pequenas**
   - Mais fácil de depurar
   - Melhor uso de índices
   - Evita queries gigantes

2. **Maps para Lookup O(1)**
   ```javascript
   // Ao invés de buscar toda vez, criar mapa
   progressosMap = new Map(...)  // Lookup instantâneo
   modulosMap = new Map(...)
   ```

3. **Memoização**
   ```javascript
   // Recalcula apenas quando necessário
   const atividadesFiltradas = useMemo(() => ..., [dependencias])
   ```

4. **Atualização Otimística**
   - UI atualiza imediatamente
   - Não espera resposta do servidor
   - Melhor experiência

---

## 📝 Resumo Executivo

### **Como Funciona (Em 3 Etapas)**

1. **BUSCA DADOS**
   - Identifica cursos do aluno (via matrículas ativas)
   - Busca atividades hierarquicamente (curso → disciplina → frente → módulo → atividade)
   - Busca progresso do aluno em cada atividade

2. **ORGANIZA E CALCULA**
   - Agrupa em estrutura hierárquica
   - Ordena por ordem didática
   - Calcula estatísticas (pendentes, iniciadas, concluídas, percentual)

3. **EXIBE E PERMITE INTERAÇÃO**
   - Mostra card de estatísticas
   - Lista atividades em accordions
   - Permite marcar progresso (checkbox/botões)
   - Atualiza estatísticas em tempo real

---

## 🎯 Fluxo Completo em Imagens Mentais

```
┌─────────────┐
│   ALUNO     │
└──────┬──────┘
       │ Acessa página
       ↓
┌──────────────────────┐
│  Sistema busca:      │
│  • Cursos ativos     │
│  • Atividades        │
│  • Progresso         │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Calcula:            │
│  • Estatísticas      │
│  • Percentuais       │
│  • Contadores        │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Exibe na tela:      │
│  • Card stats        │
│  • Filtros           │
│  • Lista atividades  │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Aluno interage:     │
│  • Marca concluído   │
│  • Filtra            │
│  • Visualiza PDF     │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Sistema atualiza:   │
│  • Banco de dados    │
│  • UI                │
│  • Estatísticas      │
└──────────────────────┘
```

---

**Documento Criado**: 2025-01-31  
**Versão**: 1.0  
**Autor**: Sistema de Documentação

