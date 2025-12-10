'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export type NotificacaoAgendamento = {
  id: string
  agendamento_id: string
  tipo: 'criacao' | 'confirmacao' | 'cancelamento' | 'lembrete' | 'alteracao' | 'rejeicao'
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

  return data || []
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

export async function marcarComoLida(notificacaoId: string) {
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
    alteracao: `Agendamento com ${outraParteNome} foi atualizado`
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
    alteracao: 'edit'
  }

  return icons[tipo] || 'bell'
}
