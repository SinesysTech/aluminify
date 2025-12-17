# API de Agendamentos - Documentação

Esta documentação descreve as funções e endpoints disponíveis para o sistema de agendamentos avançados.

## Índice

1. [Funções de Recorrência](#funções-de-recorrência)
2. [Funções de Bloqueios](#funções-de-bloqueios)
3. [Funções de Visualização Compartilhada](#funções-de-visualização-compartilhada)
4. [Funções de Relatórios](#funções-de-relatórios)
5. [Edge Functions](#edge-functions)
6. [Funções SQL](#funções-sql)

## Funções de Recorrência

### `getAvailableSlots(professorId: string, dateStr: string)`

Gera slots disponíveis para um professor em uma data específica, considerando recorrências e bloqueios.

**Parâmetros:**
- `professorId`: ID do professor
- `dateStr`: Data no formato ISO (YYYY-MM-DD)

**Retorno:**
```typescript
string[] // Array de timestamps ISO dos slots disponíveis
```

**Exemplo:**
```typescript
const slots = await getAvailableSlots('professor-id', '2025-12-20')
// Retorna: ['2025-12-20T09:00:00Z', '2025-12-20T09:30:00Z', ...]
```

## Funções de Bloqueios

### Criar Bloqueio (via Supabase Client)

```typescript
const { data, error } = await supabase
  .from('agendamento_bloqueios')
  .insert({
    professor_id: 'professor-id' | null, // null = bloqueio da empresa
    empresa_id: 'empresa-id',
    tipo: 'feriado' | 'recesso' | 'imprevisto' | 'outro',
    data_inicio: '2025-12-25T00:00:00Z',
    data_fim: '2025-12-25T23:59:59Z',
    motivo: 'Feriado de Natal',
    criado_por: 'user-id',
  })
```

### Listar Bloqueios

```typescript
const { data, error } = await supabase
  .from('agendamento_bloqueios')
  .select('*')
  .eq('empresa_id', empresaId)
  .or(`professor_id.is.null,professor_id.eq.${professorId}`)
  .order('data_inicio', { ascending: false })
```

## Funções de Visualização Compartilhada

### `getProfessoresDisponibilidade(empresaId: string, date: Date)`

Retorna disponibilidade de todos os professores da empresa para uma data.

**Parâmetros:**
- `empresaId`: ID da empresa
- `date`: Data para verificar disponibilidade

**Retorno:**
```typescript
Array<{
  professor_id: string
  nome: string
  foto: string | null
  slots_disponiveis: string[]
}>
```

**Exemplo:**
```typescript
const disponibilidade = await getProfessoresDisponibilidade('empresa-id', new Date())
```

### `getAgendamentosEmpresa(empresaId: string, dateStart: Date, dateEnd: Date)`

Retorna agendamentos de todos os professores da empresa no período.

**Parâmetros:**
- `empresaId`: ID da empresa
- `dateStart`: Data de início do período
- `dateEnd`: Data de fim do período

**Retorno:**
```typescript
Array<{
  id: string
  professor_id: string
  professor_nome: string
  professor_foto: string | null
  aluno_nome: string
  data_inicio: string
  data_fim: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  // ... outros campos
}>
```

## Funções de Relatórios

### `gerarRelatorio(empresaId: string, dataInicio: Date, dataFim: Date, tipo: RelatorioTipo)`

Gera um novo relatório de agendamentos.

**Parâmetros:**
- `empresaId`: ID da empresa
- `dataInicio`: Data de início do período
- `dataFim`: Data de fim do período
- `tipo`: 'mensal' | 'semanal' | 'customizado'

**Retorno:**
```typescript
Relatorio // Objeto com dados do relatório gerado
```

**Exemplo:**
```typescript
const relatorio = await gerarRelatorio(
  'empresa-id',
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'mensal'
)
```

### `getRelatorios(empresaId: string, limit?: number)`

Lista relatórios gerados para uma empresa.

**Parâmetros:**
- `empresaId`: ID da empresa
- `limit`: Número máximo de relatórios (opcional)

**Retorno:**
```typescript
Relatorio[]
```

### `getRelatorioById(id: string)`

Busca um relatório específico por ID.

**Parâmetros:**
- `id`: ID do relatório

**Retorno:**
```typescript
Relatorio | null
```

## Edge Functions

### `gerar-relatorio-agendamentos`

Gera relatórios de agendamentos via Edge Function.

**Endpoint:**
```
POST /functions/v1/gerar-relatorio-agendamentos
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "empresa_id": "uuid",
  "data_inicio": "2025-01-01",
  "data_fim": "2025-01-31",
  "tipo": "mensal"
}
```

**Response:**
```json
{
  "relatorio": {
    "id": "uuid",
    "empresa_id": "uuid",
    "periodo_inicio": "2025-01-01",
    "periodo_fim": "2025-01-31",
    "tipo": "mensal",
    "dados_json": {
      "total_agendamentos": 150,
      "por_status": {
        "confirmado": 120,
        "cancelado": 20,
        "concluido": 10,
        "pendente": 0
      },
      "por_professor": [...],
      "taxa_ocupacao": 0.75,
      "horarios_pico": ["14:00-15:00", "16:00-17:00"],
      "taxa_nao_comparecimento": 0.05
    },
    "gerado_em": "2025-01-31T23:59:59Z",
    "gerado_por": "uuid"
  }
}
```

## Funções SQL

### `calcular_taxa_ocupacao(empresa_id_param uuid, data_inicio_param date, data_fim_param date)`

Calcula a taxa de ocupação de slots para uma empresa no período.

**Parâmetros:**
- `empresa_id_param`: UUID da empresa
- `data_inicio_param`: Data de início
- `data_fim_param`: Data de fim

**Retorno:**
```sql
numeric -- Valor entre 0 e 1
```

**Exemplo:**
```sql
SELECT calcular_taxa_ocupacao(
  'empresa-uuid'::uuid,
  '2025-01-01'::date,
  '2025-01-31'::date
);
-- Retorna: 0.75 (75% de ocupação)
```

### `calcular_taxa_comparecimento(professor_id_param uuid, data_inicio_param date, data_fim_param date)`

Calcula a taxa de comparecimento de um professor.

**Parâmetros:**
- `professor_id_param`: UUID do professor
- `data_inicio_param`: Data de início
- `data_fim_param`: Data de fim

**Retorno:**
```sql
numeric -- Valor entre 0 e 1
```

### `listar_horarios_vagos(empresa_id_param uuid, data_inicio_param date, data_fim_param date)`

Lista horários vagos (disponíveis mas não agendados) para uma empresa.

**Parâmetros:**
- `empresa_id_param`: UUID da empresa
- `data_inicio_param`: Data de início
- `data_fim_param`: Data de fim

**Retorno:**
```sql
TABLE(
  data date,
  hora_inicio time,
  hora_fim time,
  professor_id uuid,
  professor_nome text
)
```

## Estruturas de Dados

### Relatorio

```typescript
interface Relatorio {
  id: string
  empresa_id: string
  periodo_inicio: string // ISO date
  periodo_fim: string // ISO date
  tipo: 'mensal' | 'semanal' | 'customizado'
  dados_json: RelatorioDados
  gerado_em: string // ISO timestamp
  gerado_por: string
  created_at?: string
  updated_at?: string
}
```

### RelatorioDados

```typescript
interface RelatorioDados {
  total_agendamentos: number
  por_status: {
    confirmado: number
    cancelado: number
    concluido: number
    pendente: number
  }
  por_professor: Array<{
    professor_id: string
    nome: string
    total: number
    taxa_comparecimento: number
  }>
  taxa_ocupacao: number
  horarios_pico: string[]
  taxa_nao_comparecimento: number
}
```

## Autenticação

Todas as funções requerem autenticação via Supabase Auth. O usuário deve estar autenticado e ter permissões apropriadas (professor da empresa ou admin).

## Permissões RLS

As políticas RLS garantem que:
- Professores só acessam dados da própria empresa
- Alunos só veem seus próprios agendamentos
- Admins podem gerenciar bloqueios da empresa
- Dados são isolados por `empresa_id`

## Rate Limiting

As Edge Functions têm rate limiting configurado. Em caso de limite excedido, retorna status 429.

## Tratamento de Erros

Todas as funções retornam erros no formato:
```typescript
{
  error: string
  message?: string
  code?: string
}
```

## Exemplos Completos

### Gerar Relatório Mensal

```typescript
import { gerarRelatorio } from '@/app/actions/agendamentos'

const relatorio = await gerarRelatorio(
  empresaId,
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'mensal'
)

console.log(`Total: ${relatorio.dados_json.total_agendamentos}`)
console.log(`Taxa de ocupação: ${relatorio.dados_json.taxa_ocupacao * 100}%`)
```

### Criar Bloqueio e Verificar Agendamentos Afetados

```typescript
import { createClient } from '@/lib/server'

const supabase = await createClient()

// Criar bloqueio
const { data: bloqueio } = await supabase
  .from('agendamento_bloqueios')
  .insert({
    professor_id: null, // Bloqueio da empresa
    empresa_id: empresaId,
    tipo: 'feriado',
    data_inicio: '2025-12-25T00:00:00Z',
    data_fim: '2025-12-25T23:59:59Z',
    motivo: 'Natal',
    criado_por: userId,
  })
  .select()
  .single()

// Verificar agendamentos afetados
const { data: afetados } = await supabase
  .from('agendamentos')
  .select('id, aluno_id, data_inicio')
  .eq('empresa_id', empresaId)
  .gte('data_inicio', bloqueio.data_inicio)
  .lte('data_fim', bloqueio.data_fim)
  .in('status', ['pendente', 'confirmado'])

console.log(`${afetados.length} agendamentos serão afetados`)
```

