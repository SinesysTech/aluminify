'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'
import { validateCancellation, validateAppointment, generateAvailableSlots } from '@/lib/agendamento-validations'
import { generateMeetingLink } from '@/lib/meeting-providers'

export type Disponibilidade = {
  id?: string
  professor_id?: string
  dia_semana: number // 0-6
  hora_inicio: string // HH:MM
  hora_fim: string // HH:MM
  ativo: boolean
}

export type Agendamento = {
  id?: string
  professor_id: string
  aluno_id: string
  data_inicio: string | Date
  data_fim: string | Date
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
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

export type AgendamentoComDetalhes = Agendamento & {
  aluno?: {
    id: string
    nome: string
    email: string
    avatar_url?: string | null
  }
  professor?: {
    id: string
    nome: string
    email: string
    avatar_url?: string | null
  }
}

export type ConfiguracoesProfessor = {
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

export type AgendamentoFilters = {
  status?: string | string[]
  dateStart?: Date
  dateEnd?: Date
}

export type AgendamentoNotificacao = {
  id?: string
  agendamento_id: string
  tipo: 'criacao' | 'confirmacao' | 'cancelamento' | 'lembrete' | 'alteracao' | 'rejeicao'
  destinatario_id: string
  enviado: boolean
  enviado_em?: string | null
  erro?: string | null
  created_at?: string
}

export async function getDisponibilidade(professorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', professorId)
    .eq('ativo', true)

  if (error) {
    console.error('Error fetching availability:', error)
    return []
  }

  return data
}

export async function upsertDisponibilidade(data: Disponibilidade) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const payload = {
    ...data,
    professor_id: user.id
  }

  const { error } = await supabase
    .from('agendamento_disponibilidade')
    .upsert(payload)
    .select()

  if (error) {
    console.error('Error upserting availability:', error)
    throw new Error('Failed to update availability')
  }

  revalidatePath('/agendamentos')
  return { success: true }
}

export async function getAgendamentos(professorId: string, start: Date, end: Date) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('professor_id', professorId)
    .gte('data_inicio', start.toISOString())
    .lte('data_fim', end.toISOString())
    .neq('status', 'cancelado') // Usually want to see occupied slots

  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }

  return data
}

export async function createAgendamento(data: Omit<Agendamento, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Load professor configuration
  const config = await getConfiguracoesProfessor(data.professor_id)
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60

  // Validate appointment using the validation library
  const dataInicio = new Date(data.data_inicio)
  const dataFim = new Date(data.data_fim)

  // Get availability rules for validation
  const { data: rules } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', data.professor_id)
    .eq('ativo', true)

  // Get existing bookings for conflict check
  const { data: bookings } = await supabase
    .from('agendamentos')
    .select('data_inicio, data_fim')
    .eq('professor_id', data.professor_id)
    .neq('status', 'cancelado')

  const existingSlots = (bookings || []).map(b => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim)
  }))

  // Validate appointment
  const validationResult = validateAppointment(
    { start: dataInicio, end: dataFim },
    {
      rules: rules || [],
      existingSlots,
      minAdvanceMinutes
    }
  )

  if (!validationResult.valid) {
    throw new Error(validationResult.error || 'Invalid appointment')
  }

  // Determine initial status based on auto_confirmar setting
  const initialStatus = config?.auto_confirmar ? 'confirmado' : 'pendente'
  const confirmadoEm = config?.auto_confirmar ? new Date().toISOString() : null

  const payload = {
    ...data,
    aluno_id: user.id,
    status: initialStatus,
    confirmado_em: confirmadoEm
  }

  const { data: result, error } = await supabase
    .from('agendamentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    throw new Error('Failed to create appointment')
  }

  revalidatePath('/agendamentos')
  return result
}

export async function cancelAgendamento(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling appointment:', error)
    throw new Error('Failed to cancel appointment')
  }

  revalidatePath('/agendamentos')
  return { success: true }
}

export async function getAvailableSlots(professorId: string, dateStr: string) {
  const supabase = await createClient()

  const date = new Date(dateStr)
  const dayOfWeek = date.getUTCDay() // 0-6

  // Get professor configuration for minimum advance time
  const config = await getConfiguracoesProfessor(professorId)
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60

  // Get availability rules
  const { data: rules } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', professorId)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)

  if (!rules || rules.length === 0) {
    return []
  }

  // Get existing bookings
  const startOfDay = new Date(dateStr)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(dateStr)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const { data: bookings } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('professor_id', professorId)
    .gte('data_inicio', startOfDay.toISOString())
    .lte('data_fim', endOfDay.toISOString())
    .neq('status', 'cancelado')

  const existingSlots = (bookings || []).map(b => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim)
  }))

  // Use the validation library to generate available slots
  const slots = generateAvailableSlots(
    date,
    rules,
    existingSlots,
    30, // slot duration in minutes
    minAdvanceMinutes
  )

  return slots.map(slot => slot.toISOString())
}

// =============================================
// Professor Dashboard Functions
// =============================================

export async function getAgendamentosProfessor(
  professorId: string,
  filters?: AgendamentoFilters
): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient()

  let query = supabase
    .from('agendamentos')
    .select(`
      *,
      aluno:alunos!agendamentos_aluno_id_fkey(id, nome, email, avatar_url)
    `)
    .eq('professor_id', professorId)
    .order('data_inicio', { ascending: true })

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.dateStart) {
    query = query.gte('data_inicio', filters.dateStart.toISOString())
  }

  if (filters?.dateEnd) {
    query = query.lte('data_inicio', filters.dateEnd.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching professor appointments:', error)
    return []
  }

  return data || []
}

export async function getAgendamentosAluno(alunoId: string): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      professor:professores!agendamentos_professor_id_fkey(id, nome, email, avatar_url)
    `)
    .eq('aluno_id', alunoId)
    .order('data_inicio', { ascending: false })

  if (error) {
    console.error('Error fetching student appointments:', error)
    return []
  }

  return data || []
}

export async function getAgendamentoById(id: string): Promise<AgendamentoComDetalhes | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      aluno:alunos!agendamentos_aluno_id_fkey(id, nome, email, avatar_url),
      professor:professores!agendamentos_professor_id_fkey(id, nome, email, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching appointment:', error)
    return null
  }

  return data
}

// =============================================
// Appointment Status Management
// =============================================

export async function confirmarAgendamento(id: string, linkReuniao?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get agendamento details for meeting link generation
  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select(`
      id,
      data_inicio,
      data_fim,
      professor_id,
      aluno_id,
      aluno:alunos!agendamentos_aluno_id_fkey(nome, email)
    `)
    .eq('id', id)
    .single()

  if (!agendamento) {
    throw new Error('Appointment not found')
  }

  let linkToUse = linkReuniao

  // If no explicit link provided, try to generate one or use default
  if (!linkToUse) {
    // Load professor configuration for default link
    const config = await getConfiguracoesProfessor(user.id)

    // Load professor integration settings
    const { data: integration } = await supabase
      .from('professor_integracoes')
      .select('*')
      .eq('professor_id', user.id)
      .single()

    // Try to generate meeting link if provider is configured
    if (integration && integration.provider !== 'default' && integration.access_token) {
      try {
        const meetingLink = await generateMeetingLink(
          integration.provider as 'google' | 'zoom' | 'default',
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            title: `Mentoria com ${(agendamento.aluno as any)?.[0]?.nome || 'Aluno'}`,
            startTime: new Date(agendamento.data_inicio),
            endTime: new Date(agendamento.data_fim),
            description: 'Sessão de mentoria agendada via Área do Aluno',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            attendees: (agendamento.aluno as any)?.[0]?.email ? [(agendamento.aluno as any)[0].email] : []
          },
          {
            accessToken: integration.access_token,
            defaultLink: config?.link_reuniao_padrao || undefined
          }
        )

        if (meetingLink) {
          linkToUse = meetingLink.url
        }
      } catch (error) {
        console.error('Error generating meeting link:', error)
        // Fall back to default link if generation fails
      }
    }

    // Use default link if no link was generated
    if (!linkToUse && config?.link_reuniao_padrao) {
      linkToUse = config.link_reuniao_padrao
    }
  }

  const updateData: Record<string, unknown> = {
    status: 'confirmado',
    confirmado_em: new Date().toISOString()
  }

  if (linkToUse) {
    updateData.link_reuniao = linkToUse
  }

  const { data, error } = await supabase
    .from('agendamentos')
    .update(updateData)
    .eq('id', id)
    .eq('professor_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error confirming appointment:', error)
    throw new Error('Failed to confirm appointment')
  }

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath('/professor/agendamentos')
  revalidatePath('/meus-agendamentos')
  return data
}

export async function rejeitarAgendamento(id: string, motivo: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('agendamentos')
    .update({
      status: 'cancelado',
      motivo_cancelamento: motivo,
      cancelado_por: user.id
    })
    .eq('id', id)
    .eq('professor_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting appointment:', error)
    throw new Error('Failed to reject appointment')
  }

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath('/professor/agendamentos')
  revalidatePath('/meus-agendamentos')
  return data
}

export async function cancelAgendamentoWithReason(id: string, motivo?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // First get the agendamento to validate cancellation
  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('professor_id, aluno_id, data_inicio, status')
    .eq('id', id)
    .single()

  if (!agendamento) {
    throw new Error('Appointment not found')
  }

  // Validate cancellation timing (2 hours minimum)
  const validationResult = validateCancellation(new Date(agendamento.data_inicio), 2)
  if (!validationResult.valid) {
    throw new Error(validationResult.error || 'Cannot cancel appointment')
  }

  const { error } = await supabase
    .from('agendamentos')
    .update({
      status: 'cancelado',
      motivo_cancelamento: motivo || null,
      cancelado_por: user.id
    })
    .eq('id', id)

  if (error) {
    console.error('Error cancelling appointment:', error)
    throw new Error('Failed to cancel appointment')
  }

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath('/professor/agendamentos')
  revalidatePath('/meus-agendamentos')
  revalidatePath('/agendamentos')
  return { success: true }
}

export async function updateAgendamento(id: string, data: Partial<Agendamento>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Remove fields that shouldn't be updated directly
  const { id: _id, created_at, updated_at, ...updateData } = data

  const { data: result, error } = await supabase
    .from('agendamentos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating appointment:', error)
    throw new Error('Failed to update appointment')
  }

  revalidatePath('/professor/agendamentos')
  revalidatePath('/meus-agendamentos')
  return result
}

// =============================================
// Professor Configuration Functions
// =============================================

export type ProfessorIntegracao = {
  id?: string
  professor_id?: string
  provider: 'google' | 'zoom' | 'default'
  access_token?: string | null
  refresh_token?: string | null
  token_expiry?: string | null
  created_at?: string
  updated_at?: string
}

export async function getConfiguracoesProfessor(professorId: string): Promise<ConfiguracoesProfessor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamento_configuracoes')
    .select('*')
    .eq('professor_id', professorId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching professor config:', error)
    return null
  }

  // Return defaults if no config exists
  if (!data) {
    return {
      professor_id: professorId,
      auto_confirmar: false,
      tempo_antecedencia_minimo: 60,
      tempo_lembrete_minutos: 1440,
      link_reuniao_padrao: null,
      mensagem_confirmacao: null
    }
  }

  return data
}

export async function updateConfiguracoesProfessor(
  professorId: string,
  config: Partial<ConfiguracoesProfessor>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== professorId) {
    throw new Error('Unauthorized')
  }

  const { id, created_at, updated_at, ...configData } = config

  const { data, error } = await supabase
    .from('agendamento_configuracoes')
    .upsert({
      ...configData,
      professor_id: professorId
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating professor config:', error)
    throw new Error('Failed to update configuration')
  }

  revalidatePath('/professor/configuracoes')
  return data
}

export async function getIntegracaoProfessor(professorId: string): Promise<ProfessorIntegracao | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('professor_integracoes')
    .select('*')
    .eq('professor_id', professorId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching professor integration:', error)
    return null
  }

  // Return defaults if no integration exists
  if (!data) {
    return {
      professor_id: professorId,
      provider: 'default',
      access_token: null,
      refresh_token: null,
      token_expiry: null
    }
  }

  return data
}

export async function updateIntegracaoProfessor(
  professorId: string,
  integration: Partial<ProfessorIntegracao>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== professorId) {
    throw new Error('Unauthorized')
  }

  const { id, created_at, updated_at, ...integrationData } = integration

  const { data, error } = await supabase
    .from('professor_integracoes')
    .upsert({
      ...integrationData,
      professor_id: professorId
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating professor integration:', error)
    throw new Error('Failed to update integration')
  }

  revalidatePath('/professor/configuracoes')
  return data
}

// =============================================
// Availability Management
// =============================================

export async function deleteDisponibilidade(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('agendamento_disponibilidade')
    .delete()
    .eq('id', id)
    .eq('professor_id', user.id)

  if (error) {
    console.error('Error deleting availability:', error)
    throw new Error('Failed to delete availability')
  }

  revalidatePath('/professor/disponibilidade')
  revalidatePath('/agendamentos')
  return { success: true }
}

export async function bulkUpsertDisponibilidade(items: Disponibilidade[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const payload = items.map(item => ({
    ...item,
    professor_id: user.id
  }))

  const { error } = await supabase
    .from('agendamento_disponibilidade')
    .upsert(payload)

  if (error) {
    console.error('Error bulk upserting availability:', error)
    throw new Error('Failed to update availability')
  }

  revalidatePath('/professor/disponibilidade')
  revalidatePath('/agendamentos')
  return { success: true }
}

// =============================================
// Conflict Detection & Validation
// =============================================

export async function checkConflitos(
  professorId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('professor_id', professorId)
    .neq('status', 'cancelado')
    .or(`and(data_inicio.lt.${dataFim.toISOString()},data_fim.gt.${dataInicio.toISOString()})`)
    .limit(1)

  if (error) {
    console.error('Error checking conflicts:', error)
    return false
  }

  return (data?.length || 0) > 0
}

export async function validateAgendamento(
  professorId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createClient()

  // Check minimum advance time
  const config = await getConfiguracoesProfessor(professorId)
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60
  const now = new Date()
  const minAllowedTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000)

  if (dataInicio < minAllowedTime) {
    return {
      valid: false,
      error: `O agendamento deve ser feito com pelo menos ${minAdvanceMinutes} minutos de antecedência.`
    }
  }

  // Check for conflicts
  const hasConflict = await checkConflitos(professorId, dataInicio, dataFim)
  if (hasConflict) {
    return {
      valid: false,
      error: 'Já existe um agendamento neste horário.'
    }
  }

  // Check if within availability
  const dayOfWeek = dataInicio.getUTCDay()
  const { data: rules } = await supabase
    .from('agendamento_disponibilidade')
    .select('*')
    .eq('professor_id', professorId)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)

  if (!rules || rules.length === 0) {
    return {
      valid: false,
      error: 'O professor não tem disponibilidade neste dia.'
    }
  }

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const startMinutes = dataInicio.getUTCHours() * 60 + dataInicio.getUTCMinutes()
  const endMinutes = dataFim.getUTCHours() * 60 + dataFim.getUTCMinutes()

  const isWithinAvailability = rules.some(rule => {
    const ruleStart = timeToMinutes(rule.hora_inicio)
    const ruleEnd = timeToMinutes(rule.hora_fim)
    return startMinutes >= ruleStart && endMinutes <= ruleEnd
  })

  if (!isWithinAvailability) {
    return {
      valid: false,
      error: 'O horário selecionado está fora da disponibilidade do professor.'
    }
  }

  return { valid: true }
}

// =============================================
// Notification Helper
// =============================================

async function createNotificacao(
  agendamentoId: string,
  tipo: AgendamentoNotificacao['tipo'],
  destinatarioId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('agendamento_notificacoes')
    .insert({
      agendamento_id: agendamentoId,
      tipo,
      destinatario_id: destinatarioId
    })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

// =============================================
// Statistics
// =============================================

export async function getAgendamentoStats(professorId: string) {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data, error } = await supabase
    .from('agendamentos')
    .select('status, data_inicio')
    .eq('professor_id', professorId)
    .gte('data_inicio', startOfMonth.toISOString())
    .lte('data_inicio', endOfMonth.toISOString())

  if (error) {
    console.error('Error fetching stats:', error)
    return {
      total: 0,
      pendentes: 0,
      confirmados: 0,
      cancelados: 0,
      concluidos: 0
    }
  }

  const stats = {
    total: data?.length || 0,
    pendentes: data?.filter(a => a.status === 'pendente').length || 0,
    confirmados: data?.filter(a => a.status === 'confirmado').length || 0,
    cancelados: data?.filter(a => a.status === 'cancelado').length || 0,
    concluidos: data?.filter(a => a.status === 'concluido').length || 0
  }

  return stats
}
