# 🎯 Plano de Implementação: Check Qualificado com Modal de Desempenho

## 📋 Contexto e Requisitos

### Problema Identificado
O sistema atual permite marcar atividades como concluídas com um simples clique no checkbox, não aproveitando os campos detalhados da tabela `progresso_atividades`:
- `questoes_totais`
- `questoes_acertos`
- `dificuldade_percebida`
- `anotacoes_pessoais`

### Nova UX: "Check Qualificado"

#### 1. **Regra de Negócio por Tipo de Atividade**

**Check Simples** (sem modal):
- ✅ `Conceituario`
- ✅ `Revisao`

**Check Qualificado** (EXIGE modal):
- 🔒 `Nivel_1`
- 🔒 `Nivel_2`
- 🔒 `Nivel_3`
- 🔒 `Nivel_4`
- 🔒 `Lista_Mista`
- 🔒 `Simulado_Diagnostico`
- 🔒 `Simulado_Cumulativo`
- 🔒 `Simulado_Global`
- 🔒 `Flashcards`

#### 2. **Fluxo de Interação**

```
Aluno clica em checkbox ou botão "Concluir"
    ↓
Verifica tipo de atividade
    ↓
┌─────────────────────────────────────┐
│ Tipo: Conceituario ou Revisao?     │
└─────────────────────────────────────┘
    │                        │
    SIM                      NÃO
    ↓                        ↓
Check Simples          Abre Modal
(Salva direto)         "Registrar Desempenho"
```

#### 3. **Modal "Registrar Desempenho"**

**Campos Obrigatórios**:
- 📊 **Questões Totais** (Input numérico, mínimo 1)
- ✅ **Questões Acertadas** (Input numérico, mínimo 0, máximo = questões totais)
- 🎚️ **Dificuldade Percebida** (Select/Radio, enum obrigatório)

**Campos Opcionais**:
- 📝 **Anotações Pessoais** (Textarea, opcional)

**Validações**:
- Questões acertadas ≤ Questões totais
- Questões totais ≥ 1
- Dificuldade obrigatória

**Botões**:
- ❌ "Cancelar" (fecha modal sem salvar)
- ✅ "Salvar e Concluir" (salva no banco e marca como concluído)

#### 4. **Visualização Pós-Conclusão**

**Atividades com Check Qualificado** devem exibir:
- ✅ Check verde
- 🏷️ Badge com resultado: `"Acertos: 8/10"` ou `"8/10"`
- 🎯 Badge com dificuldade: `"Médio"` (com cor contextual)
- 📝 Ícone de anotações (se houver)

**Atividades com Check Simples**:
- ✅ Check verde
- Sem badges extras

---

## 🏗️ Estrutura de Implementação

### 1. **Componentes a Criar/Atualizar**

#### 1.1. Novo Componente: `RegistrarDesempenhoModal`

**Arquivo**: `components/registrar-desempenho-modal.tsx`

**Props**:
```typescript
interface RegistrarDesempenhoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atividade: AtividadeComProgresso
  onSave: (data: {
    questoesTotais: number
    questoesAcertos: number
    dificuldadePercebida: DificuldadePercebida
    anotacoesPessoais?: string | null
  }) => Promise<void>
}
```

**Campos do Modal**:
```typescript
// Estado interno
const [questoesTotais, setQuestoesTotais] = useState<number | ''>('')
const [questoesAcertos, setQuestoesAcertos] = useState<number | ''>('')
const [dificuldadePercebida, setDificuldadePercebida] = useState<DificuldadePercebida | ''>('')
const [anotacoesPessoais, setAnotacoesPessoais] = useState<string>('')
const [isSaving, setIsSaving] = useState(false)
const [errors, setErrors] = useState<Record<string, string>>({})
```

**Validações**:
- Questões totais: obrigatório, mínimo 1
- Questões acertadas: obrigatório, mínimo 0, máximo = questões totais
- Dificuldade: obrigatória

**UI**:
- Dialog do Shadcn
- Form com Label + Input/Select/Textarea
- Mensagens de erro inline
- Botões de ação no footer

#### 1.2. Atualizar: `AtividadeChecklistRow`

**Mudanças**:
1. Detectar tipo de atividade e decidir check simples vs qualificado
2. Abrir modal ao invés de salvar direto (para tipos qualificados)
3. Exibir badges com métricas após conclusão
4. Manter check simples para Conceituario/Revisao

**Novo Estado**:
```typescript
const [modalOpen, setModalOpen] = useState(false)
```

**Nova Lógica**:
```typescript
// Verificar se precisa de modal
const precisaModal = !['Conceituario', 'Revisao'].includes(atividade.tipo)

const handleCheckboxChange = async (checked: boolean) => {
  if (!checked) {
    // Desmarcar: volta para Pendente (sem modal)
    await handleStatusChange('Pendente')
    return
  }

  if (precisaModal) {
    // Abrir modal para check qualificado
    setModalOpen(true)
  } else {
    // Check simples: salvar direto
    await handleStatusChange('Concluido')
  }
}

const handleSaveDesempenho = async (data: DesempenhoData) => {
  // Chamar API com dados completos
  await onStatusChangeWithDesempenho(atividade.id, 'Concluido', data)
  setModalOpen(false)
}
```

**Novos Props**:
```typescript
interface AtividadeChecklistRowProps {
  atividade: AtividadeComProgresso
  onStatusChange?: (atividadeId: string, status: StatusAtividade) => Promise<void>
  onStatusChangeWithDesempenho?: (
    atividadeId: string,
    status: StatusAtividade,
    desempenho: {
      questoesTotais: number
      questoesAcertos: number
      dificuldadePercebida: DificuldadePercebida
      anotacoesPessoais?: string | null
    }
  ) => Promise<void>
  className?: string
}
```

**Renderização de Badges** (após conclusão com dados):
```typescript
{isConcluido && atividade.questoesTotais > 0 && (
  <div className="flex items-center gap-2 mt-1">
    <Badge variant="outline" className="text-xs">
      Acertos: {atividade.questoesAcertos}/{atividade.questoesTotais}
    </Badge>
    {atividade.dificuldadePercebida && (
      <Badge 
        variant="outline" 
        className={cn('text-xs', getDificuldadeColor(atividade.dificuldadePercebida))}
      >
        {atividade.dificuldadePercebida}
      </Badge>
    )}
    {atividade.anotacoesPessoais && (
      <Tooltip>
        <TooltipTrigger>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{atividade.anotacoesPessoais}</p>
        </TooltipContent>
      </Tooltip>
    )}
  </div>
)}
```

#### 1.3. Atualizar: Tipos Frontend

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/types.ts`

**Adicionar campos de desempenho ao tipo**:
```typescript
export interface AtividadeComProgresso extends AtividadeBase {
  // ... campos existentes ...
  
  // Campos de desempenho (quando concluído com check qualificado)
  questoesTotais?: number | null
  questoesAcertos?: number | null
  dificuldadePercebida?: DificuldadePercebida | null
  anotacoesPessoais?: string | null
}
```

### 2. **Backend: Atualizar Queries e APIs**

#### 2.1. Atualizar Query de Atividades

**Arquivo**: `app/(dashboard)/aluno/sala-de-estudos/sala-estudos-client.tsx`

**Na query de progresso**, buscar campos adicionais:
```typescript
const { data: progressosData } = await supabase
  .from('progresso_atividades')
  .select(`
    atividade_id,
    status,
    data_inicio,
    data_conclusao,
    questoes_totais,
    questoes_acertos,
    dificuldade_percebida,
    anotacoes_pessoais
  `)
  .eq('aluno_id', alunoId)
  .in('atividade_id', atividadeIds)
```

**Mapear para o tipo**:
```typescript
progressosMap.set(atividade.id, {
  status: p.status,
  dataInicio: p.data_inicio,
  dataConclusao: p.data_conclusao,
  questoesTotais: p.questoes_totais,
  questoesAcertos: p.questoes_acertos,
  dificuldadePercebida: p.dificuldade_percebida,
  anotacoesPessoais: p.anotacoes_pessoais,
})
```

**Adicionar aos objetos de atividade**:
```typescript
atividadesComProgresso.push({
  // ... campos existentes ...
  questoesTotais: progresso?.questoesTotais || null,
  questoesAcertos: progresso?.questoesAcertos || null,
  dificuldadePercebida: progresso?.dificuldadePercebida || null,
  anotacoesPessoais: progresso?.anotacoesPessoais || null,
})
```

#### 2.2. Atualizar API de Progresso

**Arquivo**: `app/api/progresso-atividade/atividade/[atividadeId]/route.ts`

**Adicionar suporte para dados de desempenho no PATCH**:
```typescript
async function patchHandler(request: AuthenticatedRequest, params: { atividadeId: string }) {
  // ... validações existentes ...
  
  const body = await request.json()
  const status: StatusAtividade = body.status
  
  // Se for concluir, pode vir com dados de desempenho
  if (status === 'Concluido' && body.desempenho) {
    const desempenho = body.desempenho
    
    // Validar desempenho
    if (desempenho.questoesTotais < 1) {
      return NextResponse.json({ error: 'Questões totais deve ser pelo menos 1' }, { status: 400 })
    }
    
    if (desempenho.questoesAcertos > desempenho.questoesTotais) {
      return NextResponse.json({ error: 'Questões acertadas não pode ser maior que questões totais' }, { status: 400 })
    }
    
    // Buscar ou criar progresso
    let progresso = await progressoAtividadeService.findByAlunoAndAtividade(alunoId, params.atividadeId)
    
    if (!progresso) {
      // Criar novo progresso
      progresso = await progressoAtividadeService.create({
        alunoId,
        atividadeId: params.atividadeId,
        status: 'Concluido',
        dataInicio: new Date(),
        dataConclusao: new Date(),
        questoesTotais: desempenho.questoesTotais,
        questoesAcertos: desempenho.questoesAcertos,
        dificuldadePercebida: desempenho.dificuldadePercebida,
        anotacoesPessoais: desempenho.anotacoesPessoais || null,
      })
    } else {
      // Atualizar progresso existente
      progresso = await progressoAtividadeService.update(progresso.id, {
        status: 'Concluido',
        dataConclusao: new Date(),
        questoesTotais: desempenho.questoesTotais,
        questoesAcertos: desempenho.questoesAcertos,
        dificuldadePercebida: desempenho.dificuldadePercebida,
        anotacoesPessoais: desempenho.anotacoesPessoais || null,
      })
    }
    
    return NextResponse.json({ data: serializeProgresso(progresso) })
  }
  
  // Lógica existente para Iniciado/Pendente
  // ...
}
```

**Ou criar nova rota dedicada**:

**Arquivo**: `app/api/progresso-atividade/atividade/[atividadeId]/concluir/route.ts`

```typescript
// POST /api/progresso-atividade/atividade/[atividadeId]/concluir
export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params
  return requireAuth((req) => postHandler(req, params))(request)
}

async function postHandler(request: AuthenticatedRequest, params: { atividadeId: string }) {
  // ... validações ...
  
  const body = await request.json()
  
  // Buscar tipo de atividade para validar se precisa de desempenho
  const atividade = await atividadeService.getById(params.atividadeId)
  const precisaDesempenho = !['Conceituario', 'Revisao'].includes(atividade.tipo)
  
  if (precisaDesempenho && !body.desempenho) {
    return NextResponse.json(
      { error: 'Este tipo de atividade requer registro de desempenho' },
      { status: 400 }
    )
  }
  
  // Criar/atualizar progresso com desempenho
  // ...
}
```

### 3. **Helper: Função de Cor por Dificuldade**

**Arquivo**: `components/registrar-desempenho-modal.tsx` ou helper compartilhado

```typescript
export function getDificuldadeColor(dificuldade: DificuldadePercebida): string {
  switch (dificuldade) {
    case 'Muito Facil':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'Facil':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Medio':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'Dificil':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'Muito Dificil':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}
```

---

## 📝 Checklist de Implementação

### Fase 1: Componentes e UI

- [ ] Criar componente `RegistrarDesempenhoModal`
  - [ ] Campos do formulário
  - [ ] Validações
  - [ ] Estados de loading/erro
  - [ ] Integração com Dialog do Shadcn

- [ ] Atualizar `AtividadeChecklistRow`
  - [ ] Lógica para detectar tipo de atividade
  - [ ] Abrir modal para tipos qualificados
  - [ ] Check simples para Conceituario/Revisao
  - [ ] Renderizar badges com métricas
  - [ ] Mostrar ícone de anotações

- [ ] Atualizar tipos TypeScript
  - [ ] Adicionar campos de desempenho ao `AtividadeComProgresso`
  - [ ] Criar tipos para dados do modal

### Fase 2: Backend e APIs

- [ ] Atualizar query de atividades
  - [ ] Buscar campos de desempenho do progresso
  - [ ] Mapear para tipos frontend

- [ ] Atualizar API de progresso
  - [ ] Suportar dados de desempenho no PATCH
  - [ ] Validações de desempenho
  - [ ] Atualizar service layer se necessário

- [ ] Atualizar service layer (se necessário)
  - [ ] Método para concluir com desempenho

### Fase 3: Integração

- [ ] Integrar modal no fluxo de conclusão
  - [ ] Passar callback de salvar
  - [ ] Atualizar estado após salvar

- [ ] Testes
  - [ ] Check simples (Conceituario/Revisao)
  - [ ] Check qualificado (outros tipos)
  - [ ] Validações do modal
  - [ ] Exibição de badges
  - [ ] Anotações opcionais

### Fase 4: Documentação

- [ ] Atualizar documentação de lógica
- [ ] Atualizar guia visual
- [ ] Documentar regras de negócio

---

## 🎨 Exemplos de UI

### Modal "Registrar Desempenho"

```
┌─────────────────────────────────────────────────────┐
│  Registrar Desempenho                    [X]        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Atividade: Lista N1 - Módulo 1                     │
│                                                      │
│  Questões Totais *                                   │
│  [____10____]                                        │
│                                                      │
│  Questões Acertadas *                                │
│  [_____8____]                                        │
│                                                      │
│  Dificuldade Percebida *                             │
│  [▼ Muito Fácil  ]                                  │
│    • Muito Fácil                                     │
│    • Fácil                                           │
│    • Médio                                           │
│    • Difícil                                         │
│    • Muito Difícil                                   │
│                                                      │
│  Anotações Pessoais (opcional)                       │
│  ┌────────────────────────────────────────────┐     │
│  │ Preciso revisar a teoria sobre...         │     │
│  │                                            │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
├─────────────────────────────────────────────────────┤
│                    [Cancelar]  [Salvar e Concluir]  │
└─────────────────────────────────────────────────────┘
```

### Card de Atividade Concluída (Com Desempenho)

```
┌─────────────────────────────────────────────────────┐
│  ☑ Lista N1                                         │
│  [Concluído]                                        │
│                                                      │
│  Acertos: 8/10  [Médio]  📝                        │
│                                                      │
│  Concluído em: 31/01/2025                           │
│                                                      │
│                              [👁 Visualizar PDF]     │
└─────────────────────────────────────────────────────┘
```

### Card de Atividade Concluída (Check Simples)

```
┌─────────────────────────────────────────────────────┐
│  ☑ Conceituário                                     │
│  [Concluído]                                        │
│                                                      │
│  Concluído em: 31/01/2025                           │
│                                                      │
│                              [👁 Visualizar PDF]     │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Regras de Validação

### No Modal

1. **Questões Totais**:
   - Obrigatório
   - Tipo: número inteiro
   - Mínimo: 1
   - Máximo: não definido (mas sugerir limites razoáveis)

2. **Questões Acertadas**:
   - Obrigatório
   - Tipo: número inteiro
   - Mínimo: 0
   - Máximo: deve ser ≤ Questões Totais
   - Validação dinâmica: se questões totais = 10, máximo = 10

3. **Dificuldade Percebida**:
   - Obrigatório
   - Deve ser um valor do enum

4. **Anotações Pessoais**:
   - Opcional
   - Tipo: texto
   - Máximo: 1000 caracteres (sugestão)

### Validação de Tipo

- Se tipo = `Conceituario` ou `Revisao`: Não abre modal, salva direto
- Se tipo = outros: **EXIGE** modal com dados completos

---

## 📊 Estrutura de Dados Final

### Tipo `AtividadeComProgresso` (Atualizado)

```typescript
interface AtividadeComProgresso extends AtividadeBase {
  // ... campos existentes ...
  
  // Progresso básico
  progressoStatus: StatusAtividade | null
  progressoDataInicio: string | null
  progressoDataConclusao: string | null
  
  // Desempenho (apenas quando concluído com check qualificado)
  questoesTotais?: number | null
  questoesAcertos?: number | null
  dificuldadePercebida?: DificuldadePercebida | null
  anotacoesPessoais?: string | null
}
```

---

## ✅ Resumo Executivo

### O Que Será Implementado

1. **Modal de Desempenho**: Novo componente para registrar métricas detalhadas
2. **Lógica Condicional**: Check simples vs qualificado baseado no tipo
3. **Visualização Rica**: Badges com resultados e dificuldade
4. **Validações**: Garantir dados corretos e completos
5. **Integração Completa**: Frontend + Backend + API

### Regras de Negócio

- **Check Simples**: Conceituario, Revisao
- **Check Qualificado**: Todos os outros tipos
- **Dados Obrigatórios no Modal**: Questões totais, acertos, dificuldade
- **Dados Opcionais**: Anotações pessoais

---

**Status**: 📝 Plano Criado - Pronto para implementação  
**Prioridade**: 🔴 Alta  
**Complexidade**: Média-Alta  
**Tempo Estimado**: 4-6 horas

