'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export type NotificacaoAgendamento = {
  id: string
  agendamento_id: string
  tipo: 'criacao' | 'confirmacao' | 'cancelamento' | 'lembrete' | 'alteracao' | 'rejeicao' | 'bloqueio_criado' | 'recorrencia_alterada' | 'substituicao_solicitada'
  destinatario_id: string
  enviado: boolean
  enviado_em: string | null
  erro: string | null
  created_at: string
  agendamento?: {
    id: string
    professor_id: string
    aluno_id: string
    data_inicio: string
    data_fim: string
    status: string
    professor?: {
      nome: string
    }
    aluno?: {
      nome: string
    }
  }
}

export async function getNotificacoesUsuario(userId: string): Promise<NotificacaoAgendamento[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agendamento_notificacoes')
    .select(`
      *,
      agendamento:agendamentos(
        id,
        professor_id,
        aluno_id,
        data_inicio,
        data_fim,
        status,
        professor:professores!agendamentos_professor_id_fkey(nome),
        aluno:alunos!agendamentos_aluno_id_fkey(nome)
      )
    `)
    .eq('destinatario_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  // Mapear os dados para garantir que o tipo seja correto
  const validTipos: NotificacaoAgendamento['tipo'][] = ['criacao', 'confirmacao', 'cancelamento', 'lembrete', 'alteracao', 'rejeicao', 'bloqueio_criado', 'recorrencia_alterada', 'substituicao_solicitada']
  
  interface NotificacaoRow {
    tipo?: string;
    enviado?: boolean;
    created_at?: string;
    [key: string]: unknown;
  }

  return (data || []).map((item: NotificacaoRow) => ({
    ...item,
    tipo: validTipos.includes(item.tipo as string) ? item.tipo as NotificacaoAgendamento['tipo'] : 'criacao',
    enviado: item.enviado ?? false,
    created_at: item.created_at || '1970-01-01T00:00:00.000Z',
  })) as NotificacaoAgendamento[]
}

export async function getNotificacoesNaoLidas(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('agendamento_notificacoes')
    .select('*', { count: 'exact', head: true })
    .eq('destinatario_id', userId)
    .eq('enviado', true)

  if (error) {
    console.error('Error counting notifications:', error)
    return 0
  }

  // For in-app notifications, we use a separate "lido" concept
  // Since we don't have that column yet, we return all sent notifications
  return count || 0
}

export async function marcarComoLida(_notificacaoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // We would add a "lido" column to track read status
  // For now, this is a placeholder that could be extended

  revalidatePath('/notificacoes')
  return { success: true }
}

export async function marcarTodasComoLidas(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }

  // Placeholder for marking all as read
  // Would require adding a "lido" column to the table

  revalidatePath('/notificacoes')
  return { success: true }
}

// Helper to get notification message
export function getNotificacaoMessage(notificacao: NotificacaoAgendamento, userId: string): string {
  const isProfessor = notificacao.agendamento?.professor_id === userId
  const outraParteNome = isProfessor
    ? notificacao.agendamento?.aluno?.nome || 'Aluno'
    : notificacao.agendamento?.professor?.nome || 'Professor'

  const messages: Record<string, string> = {
    criacao: `Novo pedido de agendamento de ${outraParteNome}`,
    confirmacao: `Seu agendamento com ${outraParteNome} foi confirmado`,
    cancelamento: `Agendamento com ${outraParteNome} foi cancelado`,
    rejeicao: `Seu pedido de agendamento foi recusado`,
    lembrete: `Lembrete: Mentoria com ${outraParteNome} em breve`,
    alteracao: `Agendamento com ${outraParteNome} foi atualizado`,
    bloqueio_criado: `Seu agendamento foi afetado por um bloqueio de agenda`,
    recorrencia_alterada: `Disponibilidade do professor ${outraParteNome} foi alterada`,
    substituicao_solicitada: `Foi solicitada uma substituição para seu agendamento com ${outraParteNome}`
  }

  return messages[notificacao.tipo] || 'Nova notificacao'
}

// Helper to get notification icon
export function getNotificacaoIcon(tipo: NotificacaoAgendamento['tipo']): string {
  const icons: Record<string, string> = {
    criacao: 'calendar-plus',
    confirmacao: 'check-circle',
    cancelamento: 'x-circle',
    rejeicao: 'ban',
    lembrete: 'bell',
    alteracao: 'edit',
    bloqueio_criado: 'shield-x',
    recorrencia_alterada: 'calendar-range',
    substituicao_solicitada: 'refresh-cw'
  }

  return icons[tipo] || 'bell'
}
