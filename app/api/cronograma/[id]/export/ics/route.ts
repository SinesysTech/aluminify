import { NextResponse } from 'next/server'
import { requireUserAuth, type AuthenticatedRequest } from '@/backend/auth/middleware'
import { getDatabaseClient } from '@/backend/clients/database'
import { fetchCronogramaCompleto } from '@/lib/cronograma-export-utils'
import ical from 'ical-generator'

export const runtime = 'nodejs'

interface CronogramaExport {
  nome: string;
  data_inicio: string;
  data_fim: string;
  [key: string]: unknown;
}

interface ItemExport {
  id: string;
  data_prevista?: string | null;
  concluido: boolean;
  data_conclusao?: string | null;
  aulas?: {
    nome?: string;
    tempo_estimado_minutos?: number;
    modulos?: {
      nome?: string;
      frentes?: {
        nome?: string;
        disciplinas?: {
          nome?: string;
        };
      };
    };
  };
}

function formatTempo(minutos?: number | null): string {
  if (!minutos || minutos <= 0) return '--'
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h > 0 && m > 0) return `${h}h ${m} min`
  if (h > 0) return `${h}h`
  return `${m} min`
}

function buildIcs(cronograma: CronogramaExport, itens: ItemExport[]): string {
  const calendar = ical({
    prodId: {
      company: 'Área do Aluno',
      product: 'Cronograma de Estudos',
      language: 'PT',
    },
    name: cronograma.nome || 'Meu Cronograma',
    timezone: 'America/Sao_Paulo',
    description: `Cronograma de estudos de ${cronograma.data_inicio} a ${cronograma.data_fim}`,
  })

  // Horário padrão para início dos eventos (08:00)
  const HORA_PADRAO = 8
  const MINUTO_PADRAO = 0

  // Processar cada item do cronograma
  itens.forEach((item) => {
    // Pular itens sem data_prevista
    if (!item.data_prevista) {
      return
    }

    try {
      // Parsear data_prevista (formato YYYY-MM-DD)
      const dataPrevista = new Date(item.data_prevista)
      if (isNaN(dataPrevista.getTime())) {
        console.warn(`Data inválida para item ${item.id}: ${item.data_prevista}`)
        return
      }

      // Definir data/hora de início
      const startDate = new Date(dataPrevista)
      startDate.setHours(HORA_PADRAO, MINUTO_PADRAO, 0, 0)

      // Calcular duração (usar tempo_estimado_minutos ou padrão de 60 minutos)
      const duracaoMinutos = item.aulas?.tempo_estimado_minutos || 60
      const endDate = new Date(startDate.getTime() + duracaoMinutos * 60 * 1000)

      // Montar informações do evento
      const disciplina = item.aulas?.modulos?.frentes?.disciplinas?.nome || 'Aula'
      const frente = item.aulas?.modulos?.frentes?.nome || ''
      const modulo = item.aulas?.modulos?.nome || ''
      const aula = item.aulas?.nome || 'Sem nome'

      // Título do evento
      const summary = `${disciplina}${frente ? ` - ${frente}` : ''}${aula ? ` - ${aula}` : ''}`

      // Descrição detalhada
      const descricaoLinhas: string[] = []
      if (disciplina) descricaoLinhas.push(`Disciplina: ${disciplina}`)
      if (frente) descricaoLinhas.push(`Frente: ${frente}`)
      if (modulo) descricaoLinhas.push(`Módulo: ${modulo}`)
      if (aula) descricaoLinhas.push(`Aula: ${aula}`)
      if (duracaoMinutos) descricaoLinhas.push(`Tempo estimado: ${formatTempo(duracaoMinutos)}`)
      descricaoLinhas.push(`Status: ${item.concluido ? 'Concluída' : 'Pendente'}`)
      if (item.data_conclusao) {
        descricaoLinhas.push(`Data de conclusão: ${new Date(item.data_conclusao).toLocaleDateString('pt-BR')}`)
      }

      const description = descricaoLinhas.join('\\n')

      // Criar evento no calendário
      calendar.createEvent({
        start: startDate,
        end: endDate,
        summary: summary,
        description: description,
        categories: [{ name: 'Estudos' }],
        location: 'Área do Aluno',
      })
    } catch (error) {
      console.error(`Erro ao processar item ${item.id}:`, error)
      // Continuar processando outros itens mesmo se um falhar
    }
  })

  return calendar.toString()
}

async function getHandler(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>,
) {
  if (!request.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let cronogramaId: string | null = null
  if (context && 'params' in context) {
    const params = (context as { params?: { id?: string } }).params
    if (params && typeof params === 'object' && 'id' in params) {
      cronogramaId = String(params.id)
    }
  }
  if (!cronogramaId) {
    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    const idx = parts.indexOf('export') - 1
    if (idx >= 0 && parts[idx]) cronogramaId = parts[idx]
  }
  if (!cronogramaId) return NextResponse.json({ error: 'cronograma_id é obrigatório' }, { status: 400 })

  const client = getDatabaseClient()
  const { data: owner } = await client
    .from('cronogramas')
    .select('aluno_id')
    .eq('id', cronogramaId)
    .single()
  if (!owner || owner.aluno_id !== request.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { cronograma, itens } = await fetchCronogramaCompleto(cronogramaId)
    const icsContent = buildIcs(cronograma, itens)

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="cronograma_${cronogramaId}.ics"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar arquivo ICS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar arquivo ICS' },
      { status: 500 },
    )
  }
}

export const GET = requireUserAuth(getHandler)


