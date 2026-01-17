/**
 * Shared types for the scheduling system
 * These types are used across actions, components, and API routes
 */

// =============================================
// Status Types
// =============================================

export type AgendamentoStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
export type TipoServico = 'plantao' | 'mentoria'
export type TipoBloqueio = 'feriado' | 'recesso' | 'imprevisto' | 'outro'
export type TipoNotificacao = 'criacao' | 'confirmacao' | 'cancelamento' | 'lembrete' | 'alteracao' | 'rejeicao'
export type RelatorioTipo = 'mensal' | 'semanal' | 'customizado'
export type IntegrationProvider = 'google' | 'zoom' | 'default'

// =============================================
// Base Entity Types
// =============================================

export interface Disponibilidade {
  id?: string
  professor_id?: string
  dia_semana: number // 0-6 (Sunday-Saturday)
  hora_inicio: string // HH:MM
  hora_fim: string // HH:MM
  ativo: boolean
}

export interface Agendamento {
  id?: string
  professor_id: string
  aluno_id: string
  data_inicio: string | Date
  data_fim: string | Date
  status: AgendamentoStatus
  link_reuniao?: string | null
  observacoes?: string | null
  motivo_cancelamento?: string | null
  cancelado_por?: string | null
  confirmado_em?: string | null
  lembrete_enviado?: boolean
  lembrete_enviado_em?: string | null
  created_at?: string
  updated_at?: string
}

export interface Recorrencia {
  id?: string
  professor_id: string
  empresa_id: string
  tipo_servico: TipoServico
  data_inicio: string // YYYY-MM-DD
  data_fim?: string | null // YYYY-MM-DD, null = indefinida
  dia_semana: number // 0-6
  hora_inicio: string // HH:MM
  hora_fim: string // HH:MM
  duracao_slot_minutos: number // 15, 30, 45, or 60
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface Bloqueio {
  id?: string
  professor_id?: string | null // null = bloqueio para toda empresa
  empresa_id: string
  tipo: TipoBloqueio
  data_inicio: string | Date
  data_fim: string | Date
  motivo?: string | null
  criado_por: string
  created_at?: string
  updated_at?: string
}

export interface ConfiguracoesProfessor {
  id?: string
  professor_id?: string
  auto_confirmar: boolean
  tempo_antecedencia_minimo: number // minutes
  tempo_lembrete_minutos: number // minutes
  link_reuniao_padrao?: string | null
  mensagem_confirmacao?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProfessorIntegracao {
  id?: string
  professor_id: string
  provider: IntegrationProvider
  access_token?: string | null
  refresh_token?: string | null
  token_expiry?: string | null
  created_at?: string
  updated_at?: string
}

// =============================================
// Extended Types (with relations)
// =============================================

export interface UserInfo {
  id: string
  nome: string
  email: string
  avatar_url?: string | null
}

export interface AgendamentoComDetalhes extends Agendamento {
  aluno?: UserInfo
  professor?: UserInfo
}

export interface ProfessorDisponivel {
  id: string
  nome: string
  email: string
  foto_url: string | null
  especialidade: string | null
  bio: string | null
  tem_disponibilidade: boolean
  proximos_slots: string[] // ISO date strings of next available slots
}

// =============================================
// Filter and Query Types
// =============================================

export interface AgendamentoFilters {
  status?: AgendamentoStatus | AgendamentoStatus[]
  dateStart?: Date
  dateEnd?: Date
}

export interface SlotInfo {
  start: string // ISO string
  end: string // ISO string
  duration: number // minutes
  available: boolean
}

export interface AvailabilityInfo {
  hasSlots: boolean
  slotCount: number
}

export interface MonthAvailability {
  [date: string]: AvailabilityInfo // date format: YYYY-MM-DD
}

// =============================================
// Notification Types
// =============================================

export interface AgendamentoNotificacao {
  id?: string
  agendamento_id: string
  tipo: TipoNotificacao
  destinatario_id: string
  enviado: boolean
  enviado_em?: string | null
  erro?: string | null
  created_at?: string
}

// =============================================
// Report Types
// =============================================

export interface RelatorioDados {
  total_agendamentos: number
  por_status: {
    pendente: number
    confirmado: number
    cancelado: number
    concluido: number
  }
  por_professor: Array<{
    professor_id: string
    nome: string
    total: number
    taxa_comparecimento: number
  }>
  taxa_ocupacao: number
  taxa_nao_comparecimento: number
  horarios_pico: string[]
}

export interface Relatorio {
  id: string
  empresa_id: string
  tipo: RelatorioTipo
  periodo_inicio: string
  periodo_fim: string
  dados_json: RelatorioDados
  gerado_em: string
  gerado_por: string
}

// =============================================
// Form Data Types
// =============================================

export interface CreateAgendamentoInput {
  professor_id: string
  aluno_id: string
  data_inicio: string
  data_fim: string
  observacoes?: string | null
  link_reuniao?: string | null
}

export interface CreateRecorrenciaInput {
  professor_id: string
  empresa_id: string
  tipo_servico: TipoServico
  data_inicio: string
  data_fim?: string | null
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  duracao_slot_minutos: number
  ativo: boolean
}

export interface CreateBloqueioInput {
  professor_id?: string | null
  empresa_id: string
  tipo: TipoBloqueio
  data_inicio: string
  data_fim: string
  motivo?: string | null
  criado_por: string
}

// =============================================
// API Response Types
// =============================================

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
