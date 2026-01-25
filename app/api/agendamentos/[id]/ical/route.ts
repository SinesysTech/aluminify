import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/app/[tenant]/auth/middleware'
import { getDatabaseClient } from '@/app/shared/core/database/database'
import ical from 'ical-generator'
import type { Database } from '@/app/shared/core/database.types'

export const runtime = 'nodejs'

async function getHandler(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  if (!request.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extract agendamento ID from context or URL
  let agendamentoId: string | null = null
  if (context && 'params' in context) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCtx: any = context
    const params = anyCtx.params
    if (params && typeof params === 'object' && 'id' in params) {
      agendamentoId = String(params.id)
    }
  }
  if (!agendamentoId) {
    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const idx = parts.indexOf('ical') - 1
    if (idx >= 0 && parts[idx]) agendamentoId = parts[idx]
  }
  if (!agendamentoId) {
    return NextResponse.json({ error: 'agendamento_id é obrigatório' }, { status: 400 })
  }

  const client = getDatabaseClient()

  // Fetch agendamento with professor and aluno details
  const { data: agendamento, error } = await client
    .from('agendamentos')
    .select(`
      *,
      professor:professores!agendamentos_professor_id_fkey(nome, email),
      aluno:alunos!agendamentos_aluno_id_fkey(nome, email)
    `)
    .eq('id', agendamentoId)
    .single()

  // Type assertion for joined query result
  type AgendamentoWithDetails = Database['public']['Tables']['agendamentos']['Row'] & {
    professor: { nome: string; email: string } | null;
    aluno: { nome: string; email: string } | null;
  };
  const typedAgendamento = agendamento as AgendamentoWithDetails | null;

  if (error || !typedAgendamento) {
    console.error('Error fetching agendamento:', error)
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  // Verify user has access to this agendamento
  if (typedAgendamento.professor_id !== request.user.id && typedAgendamento.aluno_id !== request.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Create calendar
    const calendar = ical({
      prodId: {
        company: 'Aluminify',
        product: 'Agendamentos',
        language: 'PT',
      },
      name: 'Agendamento de Mentoria',
      timezone: 'America/Sao_Paulo',
    })

    // Determine the other party's name
    const isAluno = request.user.id === typedAgendamento.aluno_id
    const outraParte = isAluno
      ? typedAgendamento.professor?.nome || 'Professor'
      : typedAgendamento.aluno?.nome || 'Aluno'

    // Build event summary
    const summary = isAluno
      ? `Mentoria com ${outraParte}`
      : `Mentoria - ${outraParte}`

    // Build event description
    const descriptionParts: string[] = []
    if (isAluno) {
      descriptionParts.push(`Professor: ${outraParte}`)
    } else {
      descriptionParts.push(`Aluno: ${outraParte}`)
    }
    descriptionParts.push(`Status: ${typedAgendamento.status}`)
    if (typedAgendamento.observacoes) {
      descriptionParts.push(`Observações: ${typedAgendamento.observacoes}`)
    }
    if (typedAgendamento.link_reuniao) {
      descriptionParts.push(`Link da reunião: ${typedAgendamento.link_reuniao}`)
    }

    const description = descriptionParts.join('\\n')

    // Create event
    calendar.createEvent({
      start: new Date(typedAgendamento.data_inicio),
      end: new Date(typedAgendamento.data_fim),
      summary: summary,
      description: description,
      location: typedAgendamento.link_reuniao || 'Aluminify',
      url: typedAgendamento.link_reuniao || undefined,
      categories: [{ name: 'Mentoria' }],
    })

    const icsContent = calendar.toString()

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="agendamento_${agendamentoId}.ics"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar arquivo ICS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar arquivo ICS' },
      { status: 500 }
    )
  }
}

export const GET = requireUserAuth(getHandler)
