'use server'

import { createClient } from '@/lib/server'

// Tipos para tabelas que não estão no schema gerado
type AgendamentoRecorrencia = {
  id?: string
  professor_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  ativo: boolean
  data_inicio: string
  data_fim: string | null
  duracao_slot_minutos?: number
}

type AgendamentoBloqueio = {
  id?: string
  empresa_id: string
  professor_id: string | null
  data_inicio: string
  data_fim: string
  motivo?: string | null
}

type VAgendamentosEmpresa = {
  id: string
  professor_id: string
  aluno_id: string
  data_inicio: string
  data_fim: string
  status: string
  empresa_id: string
  professor_nome?: string
  aluno_nome?: string
  [key: string]: unknown
}
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

export type Recorrencia = {
  id?: string
  professor_id: string
  empresa_id: string
  tipo_servico: 'plantao' | 'mentoria'
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

export type Bloqueio = {
  id?: string
  professor_id?: string | null // null = bloqueio para toda empresa
  empresa_id: string
  tipo: 'feriado' | 'recesso' | 'imprevisto' | 'outro'
  data_inicio: string | Date
  data_fim: string | Date
  motivo?: string | null
  criado_por: string
  created_at?: string
  updated_at?: string
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
  const dateOnly = dataInicio.toISOString().split('T')[0] // YYYY-MM-DD format
  const dayOfWeek = dataInicio.getUTCDay()

  // Get availability rules from agendamento_recorrencia for validation
  // Note: agendamento_recorrencia não está no schema atual, usando tipo genérico
  type RecorrenciaRule = {
    dia_semana: number
    hora_inicio: string
    hora_fim: string
    ativo: boolean
    data_inicio: string
    data_fim: string | null
    professor_id: string
  }

  const { data: rulesData } = await supabase
    .from('agendamento_recorrencia')
    .select('*')
    .eq('professor_id', data.professor_id)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)
    .lte('data_inicio', dateOnly)
    .or(`data_fim.is.null,data_fim.gte.${dateOnly}`)

  // Filter and map rules to ensure ativo is boolean
  const rules = ((rulesData || []) as RecorrenciaRule[])
    .filter((r) => r.ativo === true)
    .map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
    }))

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

  // Get bloqueios for this professor and date
  const { data: professor } = await supabase
    .from('professores')
    .select('empresa_id')
    .eq('id', data.professor_id)
    .single()

  type ProfessorRow = {
    empresa_id: string | null
  }
  const empresaId = (professor as ProfessorRow)?.empresa_id

  if (empresaId) {
    type BloqueioRow = {
      data_inicio: string
      data_fim: string
    }
    const { data: bloqueios } = await supabase
      .from('agendamento_bloqueios')
      .select('data_inicio, data_fim')
      .eq('empresa_id', empresaId)
      .or(`professor_id.is.null,professor_id.eq.${data.professor_id}`)
      .lte('data_inicio', dataFim.toISOString())
      .gte('data_fim', dataInicio.toISOString())

    // Add bloqueios to existing slots to exclude them
    const blockedSlots = ((bloqueios || []) as BloqueioRow[]).map((b) => ({
      start: new Date(b.data_inicio),
      end: new Date(b.data_fim)
    }))

    existingSlots.push(...blockedSlots)
  }

  // Validate appointment - filter and map rules to ensure ativo is boolean
  const validRules = rules
    .filter((r) => r.ativo === true)

  const validationResult = validateAppointment(
    { start: dataInicio, end: dataFim },
    {
      rules: validRules,
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

  // Garantir que as datas sejam strings ISO para o banco
  const payload = {
    ...data,
    professor_id: data.professor_id,
    aluno_id: user.id,
    data_inicio: typeof data.data_inicio === 'string' ? data.data_inicio : dataInicio.toISOString(),
    data_fim: typeof data.data_fim === 'string' ? data.data_fim : dataFim.toISOString(),
    status: initialStatus,
    confirmado_em: confirmadoEm,
    observacoes: data.observacoes || null,
    link_reuniao: data.link_reuniao || null
  }

  const { data: result, error } = await supabase
    .from('agendamentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    throw new Error(error.message || 'Falha ao criar agendamento')
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
  const dateOnly = dateStr.split('T')[0] // YYYY-MM-DD format

  // Get professor configuration for minimum advance time
  const config = await getConfiguracoesProfessor(professorId)
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60

  // Get availability rules from agendamento_recorrencia
  // Filtrar por data_inicio <= dateStr <= data_fim (ou data_fim IS NULL)
  const { data: rulesData } = await supabase
    .from('agendamento_recorrencia')
    .select('*')
    .eq('professor_id', professorId)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)
    .lte('data_inicio', dateOnly)
    .or(`data_fim.is.null,data_fim.gte.${dateOnly}`)

  // Filter and map rules to ensure ativo is boolean
  const rules = ((rulesData || []) as AgendamentoRecorrencia[])
    .filter((r) => r.ativo === true)
    .map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
      duracao_slot_minutos: r.duracao_slot_minutos || 30,
    }))

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

  // Get bloqueios for this professor and date
  const { data: professor } = await supabase
    .from('professores')
    .select('empresa_id')
    .eq('id', professorId)
    .single()

  type ProfessorRow = {
    empresa_id: string | null
  }
  const empresaId = (professor as ProfessorRow)?.empresa_id

  let bloqueios: Array<{ data_inicio: string; data_fim: string }> = []
  if (empresaId) {
    const { data: bloqueiosData } = await supabase
      .from('agendamento_bloqueios')
      .select('data_inicio, data_fim')
      .eq('empresa_id', empresaId)
      .or(`professor_id.is.null,professor_id.eq.${professorId}`)
      .lte('data_inicio', endOfDay.toISOString())
      .gte('data_fim', startOfDay.toISOString())
    
    bloqueios = (bloqueiosData as AgendamentoBloqueio[]) || []
  }

  // Add bloqueios to existing slots to exclude them
  const blockedSlots = bloqueios.map(b => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim)
  }))

  const allBlockedSlots = [...existingSlots, ...blockedSlots]

  // Use the validation library to generate available slots
  // Filter rules to ensure ativo is boolean
  const validRules = rules.filter((r) => r.ativo === true)

  // Use the first rule's slot duration (or default to 30)
  const slotDuration = validRules[0]?.duracao_slot_minutos || 30

  const slots = generateAvailableSlots(
    date,
    validRules,
    allBlockedSlots,
    slotDuration,
    minAdvanceMinutes
  )

  return slots.map(slot => slot.toISOString())
}

// =============================================
// Professor Dashboard Functions
// =============================================

// Helper function to check if a value is a valid aluno/professor object
function isValidUserObject(
  obj: unknown
): obj is { id: string; nome: string; email: string; avatar_url?: string | null } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !('code' in obj) &&
    'id' in obj &&
    'nome' in obj &&
    'email' in obj
  )
}

export async function getAgendamentosProfessor(
  professorId: string,
  filters?: AgendamentoFilters
): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient()

  let query = supabase
    .from('agendamentos')
    .select(`
      *,
      aluno:alunos!agendamentos_aluno_id_fkey(
        id, 
        nome_completo,
        email
      )
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

  return (data || []).map((item) => {
    const aluno = isValidUserObject(item.aluno) ? item.aluno : undefined
    
    return {
      ...item,
      status: item.status as Agendamento['status'],
      lembrete_enviado: item.lembrete_enviado ?? undefined,
      created_at: item.created_at ?? undefined,
      updated_at: item.updated_at ?? undefined,
      aluno,
      professor: undefined,
    }
  })
}

export async function getAgendamentosAluno(alunoId: string): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient()

  // Verificar autenticação do usuário
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Authentication error in getAgendamentosAluno:', authError)
    return []
  }

  // Verificar se o usuário autenticado é o mesmo que está buscando os agendamentos
  if (user.id !== alunoId) {
    console.error('User mismatch: authenticated user is not the same as requested aluno_id')
    return []
  }

  // Primeiro, tentar uma query simples para diagnosticar
  const { data: simpleData, error: simpleError } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('aluno_id', alunoId)
    .limit(1)

  console.log('Simple query result:', {
    hasData: !!simpleData,
    count: simpleData?.length || 0,
    hasError: !!simpleError,
    errorCode: simpleError?.code,
    errorMessage: simpleError?.message
  })

  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      professor:professores!agendamentos_professor_id_fkey(
        id, 
        nome_completo,
        email, 
        foto_url
      )
    `)
    .eq('aluno_id', alunoId)
    .order('data_inicio', { ascending: false })

  if (error) {
    console.error('Error fetching student appointments:', {
      message: error.message || 'No message',
      details: error.details || 'No details',
      hint: error.hint || 'No hint',
      code: error.code || 'No code',
      alunoId,
      userId: user.id,
      errorObject: JSON.stringify(error)
    })

    // Se houver erro no join, tentar query simples como fallback
    if (simpleData && simpleData.length > 0) {
      console.log('Using simple query fallback, found', simpleData.length, 'appointments')

      // Buscar todos os agendamentos sem join
      const { data: allSimpleData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('data_inicio', { ascending: false })

      // Retornar dados sem informações do professor
      return (allSimpleData || []).map((agendamento: Record<string, unknown>) => ({
        ...agendamento,
        professor: undefined
      })) as AgendamentoComDetalhes[]
    }

    return []
  }

  return (data || []).map((item) => {
    const professor = isValidUserObject(item.professor) ? item.professor : undefined
    
    return {
      ...item,
      status: item.status as Agendamento['status'],
      lembrete_enviado: item.lembrete_enviado ?? undefined,
      created_at: item.created_at ?? undefined,
      updated_at: item.updated_at ?? undefined,
      aluno: undefined,
      professor,
    }
  })
}

export async function getAgendamentoById(id: string): Promise<AgendamentoComDetalhes | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      aluno:alunos!agendamentos_aluno_id_fkey(
        id, 
        nome_completo,
        email
      ),
      professor:professores!agendamentos_professor_id_fkey(
        id, 
        nome_completo,
        email, 
        foto_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching appointment:', error)
    return null
  }

  if (!data) return null

  const aluno = isValidUserObject(data.aluno) ? data.aluno : undefined
  const professor = isValidUserObject(data.professor) ? data.professor : undefined

  return {
    ...data,
    status: data.status as Agendamento['status'],
    lembrete_enviado: data.lembrete_enviado ?? undefined,
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
    aluno,
    professor,
  }
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
    const validIntegration = integration && !('code' in integration) ? (integration as unknown as { provider: string; access_token: string }) : null
    if (validIntegration && validIntegration.provider !== 'default' && validIntegration.access_token) {
      try {
        type AlunoData = {
          nome: string
          email: string
        } | null
        const alunoData = agendamento.aluno as AlunoData
        const meetingLink = await generateMeetingLink(
          validIntegration.provider as 'google' | 'zoom' | 'default',
          {
            title: `Mentoria com ${alunoData?.nome || 'Aluno'}`,
            startTime: new Date(agendamento.data_inicio),
            endTime: new Date(agendamento.data_fim),
            description: 'Sessão de mentoria agendada via Área do Aluno',
            attendees: alunoData?.email ? [alunoData.email] : []
          },
          {
            accessToken: validIntegration.access_token,
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

  // Remove fields that shouldn't be updated directly and convert dates to strings
  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...restData } = data
  void _id; void _created_at; void _updated_at;

  const updateData: Record<string, unknown> = { ...restData }
  if (updateData.data_inicio instanceof Date) {
    updateData.data_inicio = updateData.data_inicio.toISOString()
  }
  if (updateData.data_fim instanceof Date) {
    updateData.data_fim = updateData.data_fim.toISOString()
  }

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

  // Map database data to ensure non-nullable fields have defaults
  return {
    id: data.id,
    professor_id: data.professor_id,
    auto_confirmar: data.auto_confirmar ?? false,
    tempo_antecedencia_minimo: data.tempo_antecedencia_minimo ?? 60,
    tempo_lembrete_minutos: data.tempo_lembrete_minutos ?? 1440,
    link_reuniao_padrao: data.link_reuniao_padrao,
    mensagem_confirmacao: data.mensagem_confirmacao,
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined
  }
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

  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...configData } = config
  void _id; void _created_at; void _updated_at;

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

  // Map database data to ProfessorIntegracao type
  return {
    id: data.id,
    professor_id: data.professor_id,
    provider: data.provider as 'google' | 'zoom' | 'default',
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expiry: data.token_expiry,
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined
  }
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

  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...integrationData } = integration
  void _id; void _created_at; void _updated_at;

  const { data, error } = await supabase
    .from('professor_integracoes')
    .upsert({
      ...integrationData,
      professor_id: professorId,
      provider: integrationData.provider || 'default'
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
// Shared Calendar Functions
// =============================================

export async function getProfessoresDisponibilidade(empresaId: string, date: Date) {
  const supabase = await createClient()
  const dateStr = date.toISOString().split('T')[0]
  const dayOfWeek = date.getUTCDay()

  // Get all professors from the company
  const { data: professores } = await supabase
    .from('professores')
    .select('id, nome_completo, foto_url')
    .eq('empresa_id', empresaId)

  if (!professores || professores.length === 0) {
    return []
  }

  const professorIds = professores.map(p => p.id)

  // Get availability patterns for all professors
  const { data: recorrencias } = await supabase
    .from('agendamento_recorrencia')
    .select('*')
    .in('professor_id', professorIds)
    .eq('dia_semana', dayOfWeek)
    .eq('ativo', true)
    .lte('data_inicio', dateStr)
    .or(`data_fim.is.null,data_fim.gte.${dateStr}`)

  // Get bloqueios for all professors
  const startOfDay = new Date(date)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const { data: bloqueios } = await supabase
    .from('agendamento_bloqueios')
    .select('professor_id, data_inicio, data_fim')
    .eq('empresa_id', empresaId)
    .or(`professor_id.is.null,professor_id.in.(${professorIds.join(',')})`)
    .lte('data_inicio', endOfDay.toISOString())
    .gte('data_fim', startOfDay.toISOString())

  // Get existing appointments (reuse startOfDay and endOfDay from above)

  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('professor_id, data_inicio, data_fim')
    .in('professor_id', professorIds)
    .gte('data_inicio', startOfDay.toISOString())
    .lte('data_fim', endOfDay.toISOString())
    .neq('status', 'cancelado')

  // Build result for each professor
  const result = professores.map(professor => {
    const profRecorrencias = ((recorrencias || []) as AgendamentoRecorrencia[]).filter((r) => r.professor_id === professor.id)
    const profBloqueios = ((bloqueios || []) as AgendamentoBloqueio[]).filter((b) => !b.professor_id || b.professor_id === professor.id)
    type AgendamentoRow = {
      professor_id: string
      data_inicio: string
      data_fim: string
    }
    const profAgendamentos = ((agendamentos || []) as AgendamentoRow[]).filter((a) => a.professor_id === professor.id)

    // Generate available slots for this professor
    const rules = profRecorrencias.map(r => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
    }))

    const existingSlots = profAgendamentos.map(a => ({
      start: new Date(a.data_inicio),
      end: new Date(a.data_fim)
    }))

    const blockedSlots = profBloqueios.map(b => ({
      start: new Date(b.data_inicio),
      end: new Date(b.data_fim)
    }))

    const allBlockedSlots = [...existingSlots, ...blockedSlots]

    const slotDuration = profRecorrencias[0]?.duracao_slot_minutos || 30

    const slots = generateAvailableSlots(
      date,
      rules,
      allBlockedSlots,
      slotDuration,
      60 // min advance
    )

    return {
      professor_id: professor.id,
      nome: professor.nome_completo,
      foto: professor.foto_url,
      slots_disponiveis: slots.map(s => s.toISOString())
    }
  })

  return result
}

export async function getAgendamentosEmpresa(empresaId: string, dateStart: Date, dateEnd: Date) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_agendamentos_empresa')
    .select('*')
    .eq('empresa_id', empresaId)
    .gte('data_inicio', dateStart.toISOString())
    .lte('data_fim', dateEnd.toISOString())
    .order('data_inicio', { ascending: true })

  if (error) {
    console.error('Error fetching company appointments:', error)
    return []
  }

  return ((data || []) as VAgendamentosEmpresa[]).map((item) => ({
    id: item.id,
    professor_id: item.professor_id,
    professor_nome: item.professor_nome,
    professor_foto: item.professor_foto as string | undefined,
    aluno_nome: item.aluno_nome,
    aluno_email: item.aluno_email as string | undefined,
    data_inicio: item.data_inicio,
    data_fim: item.data_fim,
    status: item.status as Agendamento['status'],
    link_reuniao: item.link_reuniao,
    observacoes: item.observacoes,
    created_at: item.created_at,
    updated_at: item.updated_at
  }))
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
// Recorrência Management
// =============================================

export async function getRecorrencias(professorId: string): Promise<Recorrencia[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== professorId) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('agendamento_recorrencia')
    .select('*')
    .eq('professor_id', professorId)
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) {
    console.error('Error fetching recorrencias:', error)
    throw new Error('Failed to fetch recorrencias')
  }

  type RecorrenciaWithExtras = AgendamentoRecorrencia & {
    empresa_id?: string
    tipo_servico?: string
  }
  return ((data || []) as RecorrenciaWithExtras[]).map((item) => ({
    id: item.id,
    professor_id: item.professor_id,
    empresa_id: item.empresa_id,
    tipo_servico: item.tipo_servico as 'plantao' | 'mentoria',
    data_inicio: item.data_inicio,
    data_fim: item.data_fim,
    dia_semana: item.dia_semana,
    hora_inicio: item.hora_inicio,
    hora_fim: item.hora_fim,
    duracao_slot_minutos: item.duracao_slot_minutos,
    ativo: item.ativo,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }))
}

export async function createRecorrencia(data: Omit<Recorrencia, 'id' | 'created_at' | 'updated_at'>): Promise<Recorrencia> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== data.professor_id) {
    throw new Error('Unauthorized')
  }

  const payload = {
    professor_id: data.professor_id,
    empresa_id: data.empresa_id,
    tipo_servico: data.tipo_servico,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim || null,
    dia_semana: data.dia_semana,
    hora_inicio: data.hora_inicio,
    hora_fim: data.hora_fim,
    duracao_slot_minutos: data.duracao_slot_minutos,
    ativo: data.ativo ?? true,
  }

  const { data: result, error } = await supabase
    .from('agendamento_recorrencia')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating recorrencia:', error)
    throw new Error('Failed to create recorrencia')
  }

  revalidatePath('/professor/disponibilidade')
  revalidatePath('/agendamentos')
  
  type RecorrenciaResult = AgendamentoRecorrencia & {
    empresa_id?: string
    tipo_servico?: string
  }
  const typedResult = result as RecorrenciaResult
  return {
    id: typedResult.id,
    professor_id: typedResult.professor_id,
    empresa_id: typedResult.empresa_id,
    tipo_servico: typedResult.tipo_servico as 'plantao' | 'mentoria',
    data_inicio: typedResult.data_inicio,
    data_fim: typedResult.data_fim,
    dia_semana: typedResult.dia_semana,
    hora_inicio: typedResult.hora_inicio,
    hora_fim: typedResult.hora_fim,
    duracao_slot_minutos: typedResult.duracao_slot_minutos,
    ativo: typedResult.ativo,
    created_at: typedResult.created_at,
    updated_at: typedResult.updated_at,
  }
}

export async function updateRecorrencia(id: string, data: Partial<Omit<Recorrencia, 'id' | 'professor_id' | 'empresa_id' | 'created_at' | 'updated_at'>>): Promise<Recorrencia> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('agendamento_recorrencia')
    .select('professor_id')
    .eq('id', id)
    .single()

  if (!existing || existing.professor_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const updateData: Record<string, unknown> = {}
  if (data.tipo_servico !== undefined) updateData.tipo_servico = data.tipo_servico
  if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio
  if (data.data_fim !== undefined) updateData.data_fim = data.data_fim
  if (data.dia_semana !== undefined) updateData.dia_semana = data.dia_semana
  if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio
  if (data.hora_fim !== undefined) updateData.hora_fim = data.hora_fim
  if (data.duracao_slot_minutos !== undefined) updateData.duracao_slot_minutos = data.duracao_slot_minutos
  if (data.ativo !== undefined) updateData.ativo = data.ativo

  const { data: result, error } = await supabase
    .from('agendamento_recorrencia')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating recorrencia:', error)
    throw new Error('Failed to update recorrencia')
  }

  revalidatePath('/professor/disponibilidade')
  revalidatePath('/agendamentos')
  
  return {
    id: result.id,
    professor_id: result.professor_id,
    empresa_id: result.empresa_id,
    tipo_servico: result.tipo_servico as 'plantao' | 'mentoria',
    data_inicio: result.data_inicio,
    data_fim: result.data_fim,
    dia_semana: result.dia_semana,
    hora_inicio: result.hora_inicio,
    hora_fim: result.hora_fim,
    duracao_slot_minutos: result.duracao_slot_minutos,
    ativo: result.ativo,
    created_at: result.created_at,
    updated_at: result.updated_at,
  }
}

export async function deleteRecorrencia(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('agendamento_recorrencia')
    .select('professor_id')
    .eq('id', id)
    .single()

  if (!existing || existing.professor_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('agendamento_recorrencia')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting recorrencia:', error)
    throw new Error('Failed to delete recorrencia')
  }

  revalidatePath('/professor/disponibilidade')
  revalidatePath('/agendamentos')
  return { success: true }
}

// =============================================
// Bloqueios Management
// =============================================

export async function getBloqueios(professorId?: string, empresaId?: string): Promise<Bloqueio[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  let query = supabase
    .from('agendamento_bloqueios')
    .select('*')
    .order('data_inicio', { ascending: true })

  if (empresaId) {
    query = query.eq('empresa_id', empresaId)
  }

  if (professorId) {
    query = query.or(`professor_id.is.null,professor_id.eq.${professorId}`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bloqueios:', error)
    throw new Error('Failed to fetch bloqueios')
  }

  return (data || []).map(item => ({
    id: item.id,
    professor_id: item.professor_id,
    empresa_id: item.empresa_id,
    tipo: item.tipo as 'feriado' | 'recesso' | 'imprevisto' | 'outro',
    data_inicio: item.data_inicio,
    data_fim: item.data_fim,
    motivo: item.motivo,
    criado_por: item.criado_por,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }))
}

export async function createBloqueio(data: Omit<Bloqueio, 'id' | 'created_at' | 'updated_at'>): Promise<Bloqueio> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user has permission (professor_id must be null or match user.id)
  if (data.professor_id && data.professor_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const dataInicio = typeof data.data_inicio === 'string' ? data.data_inicio : data.data_inicio.toISOString()
  const dataFim = typeof data.data_fim === 'string' ? data.data_fim : data.data_fim.toISOString()

  const payload = {
    professor_id: data.professor_id || null,
    empresa_id: data.empresa_id,
    tipo: data.tipo,
    data_inicio: dataInicio,
    data_fim: dataFim,
    motivo: data.motivo || null,
    criado_por: user.id,
  }

  const { data: result, error } = await supabase
    .from('agendamento_bloqueios')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating bloqueio:', error)
    throw new Error('Failed to create bloqueio')
  }

  // If blocking affects existing appointments, cancel them
  if (result.professor_id) {
    const { error: cancelError } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado', motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || 'Sem motivo especificado'}` })
      .eq('professor_id', result.professor_id)
      .in('status', ['pendente', 'confirmado'])
      .gte('data_inicio', dataInicio)
      .lte('data_fim', dataFim)

    if (cancelError) {
      console.error('Error cancelling affected appointments:', cancelError)
    }
  } else {
    // Company-wide bloqueio - cancel all affected appointments
    const { data: professores } = await supabase
      .from('professores')
      .select('id')
      .eq('empresa_id', data.empresa_id)

    if (professores && professores.length > 0) {
      const professorIds = professores.map(p => p.id)
      const { error: cancelError } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado', motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || 'Sem motivo especificado'}` })
        .in('professor_id', professorIds)
        .in('status', ['pendente', 'confirmado'])
        .gte('data_inicio', dataInicio)
        .lte('data_fim', dataFim)

      if (cancelError) {
        console.error('Error cancelling affected appointments:', cancelError)
      }
    }
  }

  revalidatePath('/professor/agendamentos')
  revalidatePath('/agendamentos')
  
  return {
    id: result.id,
    professor_id: result.professor_id,
    empresa_id: result.empresa_id,
    tipo: result.tipo as 'feriado' | 'recesso' | 'imprevisto' | 'outro',
    data_inicio: result.data_inicio,
    data_fim: result.data_fim,
    motivo: result.motivo,
    criado_por: result.criado_por,
    created_at: result.created_at,
    updated_at: result.updated_at,
  }
}

export async function updateBloqueio(id: string, data: Partial<Omit<Bloqueio, 'id' | 'empresa_id' | 'criado_por' | 'created_at' | 'updated_at'>>): Promise<Bloqueio> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('agendamento_bloqueios')
    .select('professor_id, empresa_id')
    .eq('id', id)
    .single()

  if (!existing) {
    throw new Error('Bloqueio not found')
  }

  // User must own the bloqueio (professor_id matches) or be admin updating company bloqueio
  if (existing.professor_id && existing.professor_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const updateData: Record<string, unknown> = {}
  if (data.professor_id !== undefined) updateData.professor_id = data.professor_id || null
  if (data.tipo !== undefined) updateData.tipo = data.tipo
  if (data.data_inicio !== undefined) {
    updateData.data_inicio = typeof data.data_inicio === 'string' ? data.data_inicio : data.data_inicio.toISOString()
  }
  if (data.data_fim !== undefined) {
    updateData.data_fim = typeof data.data_fim === 'string' ? data.data_fim : data.data_fim.toISOString()
  }
  if (data.motivo !== undefined) updateData.motivo = data.motivo || null

  const { data: result, error } = await supabase
    .from('agendamento_bloqueios')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating bloqueio:', error)
    throw new Error('Failed to update bloqueio')
  }

  revalidatePath('/professor/agendamentos')
  revalidatePath('/agendamentos')
  
  return {
    id: result.id,
    professor_id: result.professor_id,
    empresa_id: result.empresa_id,
    tipo: result.tipo as 'feriado' | 'recesso' | 'imprevisto' | 'outro',
    data_inicio: result.data_inicio,
    data_fim: result.data_fim,
    motivo: result.motivo,
    criado_por: result.criado_por,
    created_at: result.created_at,
    updated_at: result.updated_at,
  }
}

export async function deleteBloqueio(id: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('agendamento_bloqueios')
    .select('professor_id')
    .eq('id', id)
    .single()

  if (!existing) {
    throw new Error('Bloqueio not found')
  }

  if (existing.professor_id && existing.professor_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('agendamento_bloqueios')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting bloqueio:', error)
    throw new Error('Failed to delete bloqueio')
  }

  revalidatePath('/professor/agendamentos')
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

// Note: Notifications are now handled by database trigger notify_agendamento_change()
// The manual _createNotificacao function was removed to avoid duplicates

// =============================================
// Reports Functions
// =============================================

export type RelatorioTipo = 'mensal' | 'semanal' | 'customizado'

export type RelatorioDados = {
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

export type Relatorio = {
  id: string
  empresa_id: string
  periodo_inicio: string
  periodo_fim: string
  tipo: RelatorioTipo
  dados_json: RelatorioDados
  gerado_em: string
  gerado_por: string
  created_at?: string
  updated_at?: string
}

export async function gerarRelatorio(
  empresaId: string,
  dataInicio: Date,
  dataFim: Date,
  tipo: RelatorioTipo
): Promise<Relatorio> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Call Edge Function to generate report
  const { data, error } = await supabase.functions.invoke('gerar-relatorio-agendamentos', {
    body: {
      empresa_id: empresaId,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      tipo,
    },
  })

  if (error) {
    console.error('Error generating report:', error)
    throw new Error('Failed to generate report')
  }

  return data.relatorio
}

export async function getRelatorios(empresaId: string, limit?: number): Promise<Relatorio[]> {
  const supabase = await createClient()

  let query = supabase
    .from('agendamento_relatorios')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('gerado_em', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return (data || []).map(item => ({
    id: item.id,
    empresa_id: item.empresa_id,
    periodo_inicio: item.periodo_inicio,
    periodo_fim: item.periodo_fim,
    tipo: item.tipo as RelatorioTipo,
    dados_json: item.dados_json as RelatorioDados,
    gerado_em: item.gerado_em,
    gerado_por: item.gerado_por,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }))
}

export async function getRelatorioById(id: string): Promise<Relatorio | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamento_relatorios')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    empresa_id: data.empresa_id,
    periodo_inicio: data.periodo_inicio,
    periodo_fim: data.periodo_fim,
    tipo: data.tipo as RelatorioTipo,
    dados_json: data.dados_json as RelatorioDados,
    gerado_em: data.gerado_em,
    gerado_por: data.gerado_por,
    created_at: data.created_at,
    updated_at: data.updated_at,
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
